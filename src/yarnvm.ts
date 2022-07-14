import { Instruction, Instruction_OpCode, Program, Node, Operand } from "./yarn_spinner";

enum ExecutionState
{
    Stopped,
    WaitingOnOptionSelection,
    WatingForContinue,
    Running,
}
interface VariableStorage
{
    [key: string]: number | string | boolean;
}
export interface OptionItem
{
    label: string,
    line: string,
    jump: string,
    lineCondition: boolean
}

export class YarnVM
{
    private currentNode: Node | null = null;
    private program: Program;

    private stack: (string | boolean | number)[] = [];
    private state: ExecutionState = ExecutionState.Stopped;
    private programCounter = 0;

    public variableStorage: VariableStorage = {};
    private stringTable: { [key: string]: string };

    private optionSet: OptionItem[] = [];

    public verboseLogging: boolean = false;
    
    public lineCallback: ((line: string) => Promise<void>) | null = null;
    public commandCallback: ((command: string) => Promise<void>) | null = null;
    public optionCallback: ((options: OptionItem[]) => Promise<number>) | null = null;

    public onVariableSet: ((variable: string, value: any) => void) | null = null;

    // public library: { string: Function } | null = null;

    constructor(newProgram: Program, strings: { [key: string]: string })
    {
        this.program = newProgram;
        this.stringTable = strings;

        for (let key in this.program.initialValues)
        {
            let value = this.unwrap(this.program.initialValues[key]);
            // this.log(`initialising ${key} to be ${value}`);
            if (value != undefined)
            {
                this.variableStorage[key] = value;
            }
        }
    }

    private resetState(): void
    {
        this.log("resetting state");
        this.stack = [];
        this.programCounter = 0;
        this.optionSet = [];
    }
    
    public setNode(nodeName: string): boolean
    {
        var node = this.program.nodes[nodeName];
        if (node == null)
        {
            return false;
        }
        this.resetState();
        this.currentNode = node;

        return true;
    }
    public stop(): void
    {
        this.log("stopping all execution");
        this.state = ExecutionState.Stopped;
        this.resetState();
    }
    public selectOption(optionIndex: number): void
    {
        this.log("selecting option number: " + optionIndex);

        if (this.state != ExecutionState.WaitingOnOptionSelection)
        {
            this.logError("asked to select option when options are not awaited");
            return;
        }

        if (optionIndex < 0 || optionIndex >= this.optionSet.length)
        {
            this.logError("asked to select an option beyond our comprehension");
            return;
        }

        let destination = this.optionSet[optionIndex].jump;
        this.stack.push(destination);
        this.optionSet = [];
        this.state = ExecutionState.WatingForContinue;
    }
    public start(): void
    {
        if (this.currentNode == null)
        {
            this.logError("unable to start dialogue, have no node");
            return;
        }

        this.log("starting the dialogue");
        this.state = ExecutionState.Running;

        this.continue();
    }
    private continue(): void
    {
        this.log("continuing");

        if (this.currentNode == null)
        {
            this.log("unable to continue, node is null");
            return;
        }

        while (this.state == ExecutionState.Running)
        {
            this.runInstruction(this.currentNode.instructions[this.programCounter]);
            this.programCounter += 1;

            if (this.programCounter >= this.currentNode.instructions.length)
            {
                this.state = ExecutionState.Stopped;
                this.log("node complete");
            }
        }
    }

    private findInstructionPointForLabel(label: string): number|null
    {
        this.log(`looking for ${label}`);
        if (this.currentNode == null)
        {
            this.log(`unable to find jump point for ${label}, node is null`);
            return null;    
        }

        let jump = this.currentNode.labels[label]
        if (jump == undefined)
        {
            this.log(`unable to find jump point for ${label}, key does not exist`);
            return null;
        }

        return jump;
    }

    private runInstruction(i: Instruction)
    {
        switch (i.opcode)
        {
            case Instruction_OpCode.RUN_LINE:
            {
                let label = this.unwrapString(i.operands[0]);
                if (label != undefined)
                {
                    this.log("running line " + label);
                    var parameters: (string | number | boolean)[] = [];
                    // now to get any replacement values
                    if (i.operands.length > 1)
                    {
                        // next operand is then number of replacements
                        let count = this.unwrapNumber(i.operands[1]);
                        if (count != undefined && count > 0)
                        {
                            for (var j = count - 1; j >= 0; j--)
                            {
                                let top = this.stack.pop();
                                if (top == undefined)
                                {
                                    this.logError("asked to pop values from stack for inserting into lines, but stack has none!");
                                    break;
                                }
                                parameters.push(top);
                            }
                        }
                    }

                    let line = this.buildLine(label, parameters);

                    // in the c# one we set state to delivered
                    // then to waiting
                    // for this I think we can skip that and go straight to waiting to continue
                    this.state = ExecutionState.WatingForContinue;

                    if (this.lineCallback != null)
                    {
                        this.lineCallback(line).then(value => {
                            this.state = ExecutionState.Running;
                            this.continue();
                        });
                    }
                }
                else
                {
                    this.logError("unable to run line, label is not a string");
                }

                break;
            }
            case Instruction_OpCode.RUN_COMMAND:
            {   
                var command = this.unwrapString(i.operands[0]);
                if (command == undefined)
                {
                    command = "UNDEFINED";
                }
                this.log("running command: <<" + command + ">>");

                var parameters: (string | number | boolean)[] = [];
                // now to get any replacement values
                if (i.operands.length > 1)
                {
                    // next operand is then number of replacements
                    let count = this.unwrapNumber(i.operands[1]);
                    if (count != undefined)
                    {
                        for (var j = count - 1; j >= 0; j--)
                        {
                            let top = this.stack.pop();
                            if (top == undefined)
                            {
                                this.logError("asked to pop values from stack for inserting into commands, but stack has none!");
                                break;
                            }
                            parameters.push(top);
                        }
                    }
                }
                command = this.buildCommand(command, parameters);

                // in the c# one we set state to delivered
                // then to waiting
                // for this I think we can skip that and go straight to waiting to continue
                this.state = ExecutionState.WatingForContinue;
                    
                if (this.commandCallback != null)
                {
                    this.commandCallback(command).then(value => {
                        this.state = ExecutionState.Running;
                        this.continue();
                    });
                }

                break;
            }
            case Instruction_OpCode.RUN_NODE:
            {
                this.log(`finished with ${this.currentNode?.name}`);

                let top = this.stack.pop();
                if (typeof top == "string")
                {
                    if (!this.setNode(top))
                    {
                        this.logError(`unable to find ${top}`);
                        break;
                    }
                    else
                    {
                        this.log(`found ${top}`);
                    }
                }

                this.programCounter -= 1;
                this.state = ExecutionState.Running;

                break;
            }
            case Instruction_OpCode.ADD_OPTION:
            {
                this.log("adding option");

                let label = this.unwrapString(i.operands[0]);
                if (label == undefined)
                {
                    this.logError("unable to run line, label is not a string");
                    break;
                }

                var parameters: (string|number|boolean)[] = []
                // now to get any replacement values
                if (i.operands.length > 2)
                {
                    // next operand is then number of replacements
                    let count = this.unwrapNumber(i.operands[2]);
                    if (count != undefined)
                    {
                        for (var j = count - 1; j >= 0; j--)
                        {
                            let top = this.stack.pop();
                            if (top != undefined)
                            {
                                parameters.push(top);
                            }
                        }
                    }
                }
                
                // the jump point of of our option
                var jump = this.unwrapString(i.operands[1]);

                // now do we have line condition?
                var lineCondition = true;
                if (i.operands.length > 3)
                {
                    var valid = this.unwrapBool(i.operands[3]);
                    if (valid != undefined && valid == true)
                    {
                        var top = this.stack.pop();
                        if (typeof top == "boolean")
                        {
                            lineCondition = top;
                        }
                    }
                }

                // we then need to configure the option here
                this.log(`adding option ${label}:${lineCondition}`);

                let option: OptionItem = {
                    label: label,
                    line: lineCondition ? this.buildLine(label, parameters) : `${this.buildLine(label, parameters)} [disabled]`, // when an option is disabled it gets given a [disabled] flag at the end of the line, probably should remove this later...
                    jump: jump == undefined ? "" : jump,
                    lineCondition: lineCondition
                };
                this.optionSet.push(option);

                break;
            }
            case Instruction_OpCode.SHOW_OPTIONS:
            {
                if (this.optionSet.length == 0)
                {
                    this.logError("asked to show options but have none");
                    this.state == ExecutionState.Stopped;
                    break;
                }
                    
                this.log(`presenting ${this.optionSet.length} options`);

                this.state = ExecutionState.WaitingOnOptionSelection;
                    
                if (this.optionCallback != null)
                {
                    this.optionCallback(this.optionSet).then(index => {
                        this.selectOption(index);
                        this.state = ExecutionState.Running;
                        this.continue();
                    });
                }

                break;
            }
                

            case Instruction_OpCode.POP:
            {
                this.stack.pop();
                break;
            }
            case Instruction_OpCode.PUSH_STRING:
            {
                let value = this.unwrapString(i.operands[0]);
                if (value != undefined)
                {
                    this.stack.push(value);
                }
                break;
            }
            case Instruction_OpCode.PUSH_BOOL:
            {
                let value = this.unwrapBool(i.operands[0]);
                if (value != undefined)
                {
                    this.stack.push(value);
                }
                break;
            }
            case Instruction_OpCode.PUSH_FLOAT:
            {
                let value = this.unwrapNumber(i.operands[0]);
                if (value != undefined)
                {
                    this.stack.push(value);
                }
                else
                {
                    this.logError(`unable to unwrap operand ${i.operands[0]} into a number!`);
                }
                break;
            }
            case Instruction_OpCode.PUSH_NULL:
            {
                this.logError("pushing null is no longer supported!");
                break;
            }
            case Instruction_OpCode.PUSH_VARIABLE:
            {
                let variableName = this.unwrapString(i.operands[0]);
                if (variableName != undefined)
                {
                    let value = this.variableStorage[variableName];
                    if (value != undefined)
                    {
                        this.stack.push(value);
                    }
                }
                break;
            }
            case Instruction_OpCode.STORE_VARIABLE:
            {
                let variableName = this.unwrapString(i.operands[0]);
                let value = this.top;
                if (variableName != undefined)
                {
                    this.variableStorage[variableName] = value;
                    if (this.onVariableSet) {
                        this.onVariableSet(variableName, value);
                    }
                }
                break;
            }
            
            
            case Instruction_OpCode.JUMP_TO:
            {
                let label = this.unwrapString(i.operands[0]);
                if (label != undefined)
                {
                    let jump = this.findInstructionPointForLabel(label);
                    if (jump == null)
                    {
                        this.logError(`error jumping to ${label}, jump point not found`);
                    }
                    else
                    {
                        this.programCounter = jump - 1;
                    }
                }

                break;
            }
            case Instruction_OpCode.JUMP_IF_FALSE:
            {
                let top = this.top;
                
                if (typeof top == "boolean" && !top)
                {
                    // ok so we need to grab the jump point
                    let label = this.unwrapString(i.operands[0])
                    if (label != undefined)
                    {
                        let jump = this.findInstructionPointForLabel(label);
                        if (jump != null)
                        {
                            this.programCounter = jump - 1;
                        }
                    }
                }
                
                break;
            }
            case Instruction_OpCode.JUMP:
            {
                let label = this.top;
                if (typeof label == "string")
                {
                    let jump = this.findInstructionPointForLabel(label);
                    if (jump != null)
                    {
                        this.programCounter = jump - 1;
                    }
                }
                break;
            }
            
            case Instruction_OpCode.CALL_FUNC:
            {
                let parameterCount = this.stack.pop();
                if (parameterCount != undefined && typeof parameterCount == "number")
                {
                    var parameters: (string | number | boolean)[] = [];
                    for (var j = 0; j < parameterCount; j++)
                    {
                        var top = this.stack.pop();
                        if (top != undefined)
                        {
                            parameters.push(top);
                        }
                    }

                    // ok now we have the name of the function and the the parameters
                    // time to actually perform the function and push its value onto the stack
                    let functionName = this.unwrapString(i.operands[0]);
                    if (functionName != undefined)
                    {
                        let result = this.runFunc(functionName, parameters);
                        if (result != undefined)
                        {
                            this.stack.push(result);
                        }
                        else
                        {
                            this.logError(`${functionName} did not return a valid result`);
                        }
                    }
                }
                else
                {
                    this.logError("top of stack is not a number!");
                }

                break;
            }
            case Instruction_OpCode.STOP:
            {
                this.state = ExecutionState.Stopped;
                break;
            }
            
            default:
            {
                this.logError(`Unknown opcode: ${i.opcode}`);
                this.state = ExecutionState.Stopped;
            }
        }
    }

    // haven't really done this in a hugely efficient manner
    // but this was nicer to write in this form than one big switch
    private runFunc(funcName: string, parameters: (string | boolean | number)[]): string|boolean|number|undefined
    {
        // number functions
        if (funcName.startsWith("Number."))
        {
            funcName = funcName.substring(7);
            if (typeof parameters[0] != "number")
            {
                this.logError("asked to perform a number function but the first param is not a number!");
                return undefined;
            }
            let first = parameters[0];

            // special casing unary minus now
            // because it doesn't need a second parameter so just gets in the way
            if (funcName == "UnaryMinus")
            {
                return -1 * first;
            }

            if (typeof parameters[1] != "number")
            {
                this.logError(`asked to perform a number function: ${funcName} but the second param is not a number, its a ${typeof parameters[1]} (${parameters[1]})`);
                return undefined;
            }
            let second = parameters[1];

            switch (funcName)
            {
                // basic maths operators
                case "Add":
                    return first + second;
                case "Minus":
                    return second - first;
                case "Multiply":
                    return first * second;
                case "Divide":
                    return second / first;
                case "Modulo":
                    return second % first;
                
                // logical operators
                case "EqualTo":
                    return first == second;
                case "GreaterThan":
                    return second > first;
                case "GreaterThanOrEqualTo":
                    return second >= first;
                case "LessThan":
                    return second < first;
                case "LessThanOrEqualTo":
                    return second <= first;
                case "NotEqualTo":
                    return first != second;
            }
        }
        // all the boolean functions
        if (funcName.startsWith("Bool."))
        {
            funcName = funcName.substring(5);
            if (typeof parameters[0] != "boolean")
            {
                this.logError("asked to perform a boolean operation but don't have a bool");
                return undefined;
            }
            let first = parameters[0];

            if (funcName == "Not")
            {
                return !first;
            }
            if (typeof parameters[1] != "boolean")
            {
                this.logError("parameter 2 is not a boolean!");
                return undefined;
            }
            let second = parameters[1];

            switch (funcName)
            {
                case "EqualTo":
                    return first == second;
                case "NotEqualTo":
                    return first != second;
                case "Or":
                    return first || second;
                case "And":
                    return first && second;
                case "Xor":
                    return first != second;
            }
        }
        // string functions
        if (funcName.startsWith("String."))
        {
            funcName = funcName.substring(7);
            if (typeof parameters[0] != "string" || typeof parameters[1] != "string")
            {
                this.logError("asked to perform a string function but parameters are not strings!");
                return undefined;
            }
            let first = parameters[0];
            let second = parameters[1];

            switch (funcName)
            {
                case "EqualTo":
                    return first == second;
                case "NotEqualTo":
                    return first != second;
                case "Add":
                    return second + first;
            }
        }

        // conversion functions
        if (funcName == "number")
        {
            if (parameters[0] != undefined)
            {
                switch (typeof parameters[0])
                {
                    case "string":
                        return parseFloat(parameters[0]);
                    case "boolean":
                        return parameters[0] ? 1 : 0;
                    case "number":
                        return parameters[0];
                }
            }
        }
        if (funcName == "string")
        {
            if (parameters[0] != undefined)
            {
                return `${parameters[0]}`;
            }
        }
        if (funcName == "bool")
        {
            if (parameters[0] != undefined)
            {
                switch (typeof parameters[0])
                {
                    case "boolean":
                        return parameters[0];
                    case "number":
                        return parameters[0] >= 1;
                    case "string":
                        return parameters[0] == "true";
                }
            }
        }

        // visitation functions
        if (funcName == "visited" || funcName == "visited_count")
        {
            if (typeof parameters[0] == "string")
            {
                let name = `$Yarn.Internal.Visiting.${parameters[0]}`;
                var count = this.variableStorage[name];

                this.log(`visiting ${name}: ${count}`);
                
                if (typeof count != "number")
                {
                    count = 0;
                }

                if (funcName == "visited_count")
                {
                    return count;
                }
                else
                {
                    return count > 0;
                }
            }
        }

        // maths functions
        switch (funcName)
        {
            case "random":
                return Math.random();
            case "random_range":
                {
                    if (typeof parameters[0] == "number" && typeof parameters[1] == "number")
                    {
                        let min: number;
                        let max: number;

                        if (parameters[0] > parameters[1])
                        {
                            min = parameters[1];
                            max = parameters[0];
                        }
                        else
                        {
                            min = parameters[0];
                            max = parameters[1];
                        }
                        return this.randomRange(min, max);
                    }
                    break;
                }
            case "dice":
                if (typeof parameters[0] == "number" && parameters[0] > 1)
                {
                    return this.randomRange(1, parameters[0]);
                }
                break;
            case "round":
                if (typeof parameters[0] == "number")
                {
                    return Math.round(parameters[0]);
                }
                break;
            case "round_places":
                if (typeof parameters[0] == "number" && typeof parameters[1] == "number")
                {
                    return +parameters[0].toFixed(parameters[1]);
                }
                break;
            case "floor":
                if (typeof parameters[0] == "number")
                {
                    return Math.floor(parameters[0]);
                }
                break;
            case "ceil":
                if (typeof parameters[0] == "number")
                {
                    return Math.ceil(parameters[0]);
                }
                break;
            case "inc":
                {
                    if (typeof parameters[0] == "number")
                    {
                        return Math.round(parameters[0]) + 1;
                    }
                    break;
                }
            case "dec":
                {
                    if (typeof parameters[0] == "number")
                    {
                        return Math.round(parameters[0]) - 1;
                    }
                    break;
                }
            case "decimal":
                {
                    if (typeof parameters[0] == "number")
                    {
                        return parameters[0] % 1;
                    }
                    break;
                }
            case "int":
                {
                    if (typeof parameters[0] == "number")
                    {
                        return Math.trunc(parameters[0]);
                    }
                    break;
                }
        }

        // HERE IS WHERE YOU WOULD ADD IN ANY CUSTOM FUNCTIONS YOU MIGHT NEED FOR YOUR OWN PROGRAMS

        // The following functions are needed for the Inference-FunctionsAndVarsInheritType test
        // TODO: REMOVE THIS LATER!
        switch (funcName)
        {
            case "dummy_number":
                return 1;
            case "dummy_bool":
                return true;
            case "dummy_string":
                return "string";
        }

        // at this point we've either returned the result of the function or had an invalid function
        // either it doesn't exist or the parameters are incorrect
        this.logError(`Encountered invalid function: ${funcName} with parameters: (${parameters})`);
        return undefined;
    }

    private randomRange(min: number, max: number): number
    {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private buildLine(lineID: string, parameters: (string | boolean | number)[]): string
    {
        var line = this.stringTable[lineID];
        if (line == undefined)
        {
            return lineID;
        }

        for (var i in parameters)
        {
            let substitution = parameters[i];
            if (typeof substitution == "boolean")
            {
                line = line.replace("{" + i + "}", `${substitution == true ? "True" : "False"}`);
            }
            else
            {
                if (typeof substitution == "number")
                {
                    if (!Number.isInteger(substitution))
                    {
                        substitution = substitution.toFixed(1); // not sure how I feel about this but it smoothes out some weirdness
                    }
                }
                line = line.replace("{" + i + "}", `${substitution}`);
            }
        }

        return line;
    }
    private buildCommand(cmd: string, parameters: (string | boolean | number)[]): string
    {
        var command = cmd;
        for (var i in parameters)
        {
            let substitution = parameters[i];
            if (typeof substitution == "boolean")
            {
                command = command.replace("{" + i + "}", `${substitution == true ? "True" : "False"}`);
            }
            else
            {
                command = command.replace("{" + i + "}", `${substitution}`);
            }
        }
        return command;
    }

    // a generic unwrapper that takes an operand and converts it to a concrete type (or undefined)
    // only really useful in a few places compared to the more specific ones
    private unwrap(op: Operand): string | number | boolean | undefined
    {
        switch (op.value.oneofKind)
        {
            case "boolValue":
                return op.value.boolValue;
            case "floatValue":
                return op.value.floatValue;
            case "stringValue":
                return op.value.stringValue;
        }
        return undefined;
    }
    private unwrapString(op: Operand): string | undefined
    {
        if (op.value.oneofKind === "stringValue")
        {
            return op.value.stringValue;
        }
        return undefined;
    }
    private unwrapBool(op: Operand): boolean | undefined
    {
        if (op.value.oneofKind === "boolValue")
        {
            return op.value.boolValue;
        }
        return undefined;
    }
    private unwrapNumber(op: Operand): number | undefined
    {
        if (op.value.oneofKind === "floatValue")
        {
            return op.value.floatValue;
        }
        return undefined;
    }

    private log(message: string): void
    {
        if (this.verboseLogging)
        {
            console.log(message);
        }
    }
    private logError(message: string): void
    {
        console.error(message);
    }
    // push and pop work as expected but at the end of the array
    // this is just to avoid retyping this every time
    private get top(): (string | number | boolean)
    {
        return this.stack[this.stack.length - 1];
    }
    private printInstruction(i: Instruction): string
    {
        var message = `${Instruction_OpCode[i.opcode]}: `;
        if (i.operands == undefined || i.operands == null || i.operands.length == 0)
        {
            message += "no parameters";
        }
        else
        {
            i.operands.forEach(v => {
                message += `${this.unwrap(v)}, `;
            });
        }
        return message;
    }
    public printAllInstructions(): void
    {
        console.log("Printing all instructions");
        for (var node in this.program.nodes)
        {
            console.log(`${node}:`);
            for (var i of this.program.nodes[node].instructions)
            {
                console.log(this.printInstruction(i));
            }
        }
    }
}