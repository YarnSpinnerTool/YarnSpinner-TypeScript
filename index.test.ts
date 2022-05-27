import { Program } from "./src/yarn_spinner";
import { YarnVM, OptionItem } from "./src/yarnvm";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";

class TestPlanThing
{
    private file: string;
    public split: string[];
    constructor(path: string)
    {
        this.file = path;
        let fileData = readFileSync(path, "utf8");
        this.split = fileData.split("\n");
        this.split = this.split.filter(i => i); // removing empty lines
        this.split = this.split.filter(i => !i.startsWith('#')); // removing comments
    }

    public nextChunk(): string[]
    {
        let instructions = this.split.shift();
        if (instructions == undefined)
        {
            return ["error", `${this.file} is out of instructions`];
        }

        let index = instructions.indexOf(":");
        let control = instructions.slice(0, index);
        let remainder = instructions.slice(index + 2);
        return [control, remainder];
    }

    public remainingInstructions(): number
    {
        // we aren't out of instructions but the next one is stop, so also done
        if (this.split.shift() == "stop")
        {
            return 0;
        }
        return this.split.length;
    }
}

describe('YarnVM running Testplans', () => {
    it.each(
        [
            ["Commands"],
            ["DecimalNumbers"],
            // ["Expressions"], // HAS NO OUTPUT
            // ["Escaping"], // CONTAINS MARKUP
            // ["Functions"], // HAS NO OUTPUT
            // ["FormatFunctions"], // CONTAINS MARKUP
            // ["Identifiers"], // HAS NO OUTPUT
            ["IfStatements"],
            ["Inference-FunctionsAndVarsInheritType"], // uses custom functions which I added
            ["InlineExpressions"],
            ["Jumps"],
            ["Lines"],
            // ["NodeHeaders"], // HAS NO OUTPUT
            ["ShortcutOptions"],
            ["Smileys"],
            // ["Types"], // HAS NO OUTPUT
            // ["VariableStorage"], // HAS NO OUTPUT
            ["VisitCount"],
            ["VisitTracking"],
            ["Visited"],
            
            // ok I need a test that checks every single maths operator work without needing a custom assert function
            // because why do we have two different test methods?
        ]
    )('testplan: %p', (testplan: string) => {
        // expect(1).not.toEqual(1); // this exists just so I can make sure the tests fail when needed

        let thing = new TestPlanThing(`./testdata/${testplan}.testplan`);

        let data = readFileSync(`./testdata/${testplan}.yarnc`);
        let program = Program.fromBinary(data);
        expect(program).not.toBeUndefined();

        let csv = readFileSync(`./testdata/${testplan}.csv`);
        let records = parse(csv, {
            columns: true,
            skipEmptyLines: true,
            delimiter: ",",
        })
        // oh poor typescript, look how mean I am to you
        // forgive me
        var stringTable: { [key: string]: string } = {};
        for (let record of records)
        {
            stringTable[record.id] = record.text;
        }
        expect(Object.keys(stringTable).length).toBeGreaterThanOrEqual(0);
        expect(Object.keys(stringTable).length).toEqual(records.length);

        var vm = new YarnVM(program, stringTable);
        vm.verboseLogging = false;
    
        vm.lineCallback = function (line: string)
        {
            return new Promise(function (resolve) {
                
                let compare = thing.nextChunk();
                expect(compare[0]).toEqual("line");
                expect(line).toEqual(compare[1]);
                resolve();
            });
        }

        vm.optionCallback = function (options: OptionItem[])
        {
            return new Promise<number>(function (resolve) {
                for (var option of options)
                {
                    let compare = thing.nextChunk();
                    expect(compare[0]).toEqual("option");
                    expect(option.line).toEqual(compare[1]);
                }
                let choice = thing.nextChunk();
                expect(choice[0]).toEqual("select");
                let selection = parseInt(choice[1]) - 1; // test plans select one greater than the options
                expect(selection).not.toBeNaN();
                resolve(selection);
            });
        }

        vm.commandCallback = function (command)
        {
            return new Promise(function (resolve) {
                let compare = thing.nextChunk();
                expect(compare[0]).toEqual("command");
                expect(command).toEqual(compare[1]);
                resolve();
            });
        }
    
        expect(vm.setNode("Start")).toBeTruthy();
    
        vm.start();
        // expect(thing.remainingInstructions()).toEqual(0); // this won't work any more because of timing
    });
});
