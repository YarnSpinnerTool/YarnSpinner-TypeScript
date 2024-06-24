import * as antlr from 'antlr4ng';
import { CharStream, CommonTokenStream } from "antlr4ng";
import * as fs from "node:fs";

import { YarnSpinnerTestPlanLexer } from "./YarnSpinnerTestPlanLexer";
import { ActionSetBoolContext, ActionSetNumberContext, LineWithAnyTextExpectedContext, LineWithSpecificTextExpectedContext, YarnSpinnerTestPlanParser } from "./YarnSpinnerTestPlanParser";

export abstract class TestPlanStep {
}

export abstract class ExpectContentStep extends TestPlanStep {
    public expectedText: string | null = null;
}

export class TestPlanRun implements Iterable<TestPlanStep> {
    [Symbol.iterator](): Iterator<TestPlanStep, any, undefined> {
        return this.steps.values();
    }

    public startNode: string = "Start";
    public steps: TestPlanStep[] = []
}

export class ExpectLineStep extends ExpectContentStep {
    public expectedHashTags: string[] = []

    constructor(expectedText: string | null, expectedHashtags: string[]) {
        super()
        this.expectedText = expectedText;
        this.expectedHashTags = expectedHashtags;
    }

    override toString(): string {
        if (this.expectedHashTags.length > 0) {
            return `"Line \"${this.expectedText}\" with hashtags ${this.expectedHashTags.join(' ')}`
        }
        else {
            return `"Line \"${this.expectedText}\"`
        }
    }
}

export class ExpectOptionStep extends ExpectContentStep {
    public expectedHashtags: string[] = [];
    public expectedAvailability: boolean = true;

    constructor(text: string | null, hashtags: string[], expectedAvailability: boolean) {
        super();
        this.expectedText = text;
        this.expectedHashtags.push(...hashtags);
        this.expectedAvailability = expectedAvailability;
    }
}

export class ExpectCommandStep extends ExpectContentStep {
    constructor(text: string) {
        super()
        this.expectedText = text;
    }

}

export class ExpectStop extends TestPlanStep { }

export class ActionSelectStep extends TestPlanStep {
    public selectedIndex: number = 0;

    constructor(selectedIndex: number) {
        super();
        this.selectedIndex = selectedIndex;
    }
}

type SaliencyMode = string;
type YarnValue = string | number | boolean;

export class ActionSetSaliencyStep extends TestPlanStep {
    public saliencyMode: SaliencyMode = "unset";

    constructor(saliencyMode: SaliencyMode) {
        super()
        this.saliencyMode = saliencyMode;
    }
}

export class ActionSetVariableStep extends TestPlanStep {
    public variableName: string;
    public value: YarnValue;

    public constructor(variableName: string, value: YarnValue) {
        super()
        this.variableName = variableName;
        this.value = value;
    }
}

export class ActionJumpToNodeStep extends TestPlanStep {
    public nodeName: string;

    constructor(nodeName: string) {
        super();
        this.nodeName = nodeName;
    }
}

class ErrorListener extends antlr.BaseErrorListener {
    constructor(source: string) {
        super()
    }
    override syntaxError<S extends antlr.Token, T extends antlr.ATNSimulator>(recognizer: antlr.Recognizer<T>, offendingSymbol: S | null, line: number, column: number, msg: string, e: antlr.RecognitionException | null): void {
        throw new Error("syntax error");
    }
}

function trimCharacters(input: string, characters: string): string {
    if (characters.length === 0) {
        // If no characters are specified to trim, return the original input
        return input;
    }

    let start = 0;
    let end = input.length - 1;

    // Find the first character that is not in 'characters' from the start
    while (start <= end && characters.includes(input[start])) {
        start++;
    }

    // Find the last character that is not in 'characters' from the end
    while (end >= start && characters.includes(input[end])) {
        end--;
    }

    // Extract the trimmed portion of the string
    return input.substring(start, end + 1);
}

export class TestPlan implements Iterable<TestPlanRun> {

    public runs: TestPlanRun[] = [];


    constructor() { }

    [Symbol.iterator](): Iterator<TestPlanRun, any, undefined> {
        return this.runs.values()
    }

    public static fromFile(path: string): TestPlan {
        const text = fs.readFileSync(path).toString();
        return TestPlan.fromString(text);
    }

    public static fromString(text: string): TestPlan {
        var plan = new TestPlan();
        var charStream = CharStream.fromString(text);
        var lexer = new YarnSpinnerTestPlanLexer(charStream);

        var tokenStream = new CommonTokenStream(lexer);
        var parser = new YarnSpinnerTestPlanParser(tokenStream);
        lexer.removeErrorListeners();
        parser.removeErrorListeners();
        var lexerErrorListener = new ErrorListener("testplan");
        var parserErrorListener = new ErrorListener("testplan");
        lexer.addErrorListener(lexerErrorListener);
        parser.addErrorListener(parserErrorListener);

        var testPlanTree = parser.testplan();

        // var allDiagnostics = lexerErrorListener.Diagnostics.Concat(parserErrorListener.Diagnostics);
        // if (allDiagnostics.Any(d => d.Severity == Diagnostic.DiagnosticSeverity.Error)) {
        //     throw new Error("Syntax errors in test plan: " + allDiagnostics.join("\n",));
        // }

        for (const runContext of testPlanTree.run()) {
            let run = new TestPlanRun();
            for (var stepContext of runContext.step()) {
                let step: TestPlanStep;
                if (stepContext.actionJumpToNode() != null) {
                    step = new ActionJumpToNodeStep(stepContext.actionJumpToNode()?._nodeName?.text ?? "")
                }
                else if (stepContext.actionSelect() != null) {
                    step = new ActionSelectStep(
                        parseInt(stepContext.actionSelect()?.NUMBER().getText() ?? "error") - 1
                    );
                }
                else if (stepContext.actionSet() != null) {
                    const set = stepContext.actionSet();

                    if (set instanceof ActionSetBoolContext) {
                        step = new ActionSetVariableStep(
                            set._variable?.text ?? "<error>",
                            {
                                "true": true,
                                "false": false,
                            }[(set._value?.text ?? "<error>").toLowerCase()] ?? false
                        );
                    }
                    else if (set instanceof ActionSetNumberContext) {
                        step = new ActionSetVariableStep(
                            set._variable?.text ?? "<error>",
                            parseInt(set._value?.text ?? "<error>")
                        )
                    }
                    else {
                        throw new Error("Unhandled 'set' type: " + stepContext.getText())
                    }
                } else if (stepContext.lineExpected()) {
                    const expectation = stepContext.lineExpected()!;
                    if (expectation instanceof LineWithAnyTextExpectedContext) {
                        step = new ExpectLineStep(
                            null,
                            expectation.hashtag().map(h => h.getText())
                        )
                    } else if (expectation instanceof LineWithSpecificTextExpectedContext) {
                        step = new ExpectLineStep(
                            trimCharacters(expectation.TEXT().getText() ?? "<error>", "`"),
                            expectation.hashtag().map(h => h.getText())
                        )
                    } else {
                        throw new Error("Invalid line expectation")
                    }
                } else if (stepContext.optionExpected()) {

                    step = new ExpectOptionStep(
                        trimCharacters(stepContext.optionExpected()?.TEXT().getText() ?? "<error>", '`'),
                        stepContext.optionExpected()?.hashtag().map(h => h.getText()) ?? [],
                        !stepContext.optionExpected()?._isDisabled
                    );
                } else if (stepContext.commandExpected()) {
                    step = new ExpectCommandStep(
                        trimCharacters(stepContext.commandExpected()?.TEXT().getText() ?? "<error>", '`')
                    )
                } else if (stepContext.stopExpected()) {
                    step = new ExpectStop();
                } else if (stepContext.actionSetSaliencyMode()) {

                    step = new ActionSetSaliencyStep(
                        stepContext.actionSetSaliencyMode()?._saliencyMode?.text ?? "<error>"
                    );
                } else {
                    throw new Error("Unhandled step type: " + stepContext.getText());
                }
                run.steps.push(step);
            }
            plan.runs.push(run);
        }
        return plan;
    }
}
/**
 * Represents different types of steps in a test plan.
 */
export enum StepType {
    /**
     * Expects to see this specific line in the test output.
     */
    Line,

    /**
     * Expects an option to be presented; if '*' is given, it means "expect an option, don't care about text".
     */
    Option,

    /**
     * Expects options to have been presented; value should be the index of the selected option.
     */
    Select,

    /**
     * Expects to see this specific command in the test output.
     */
    Command,

    /**
     * Expects to stop the test here (this is optional - a 'stop' at the end of a test plan is assumed).
     */
    Stop,

    /**
     * Sets a variable to a specified value.
     */
    Set,

    /**
     * Runs a new node or sub-test within the current context.
     */
    Run
}

export class TestPlanBuilder {
    private _testPlan: TestPlan;

    private currentRun: TestPlanRun;

    constructor() {
        this._testPlan = new TestPlan();
        this.currentRun = new TestPlanRun();
        this.testPlan.runs.push(this.currentRun);
    }

    public get testPlan(): TestPlan { return this.testPlan };
    private set testPlan(value) { this._testPlan = value };


    public addLine(line: string) {
        this.currentRun.steps.push(new ExpectLineStep(line, []));
        return this;
    }

    public addOption(text: string | null) {
        this.currentRun.steps.push(new ExpectOptionStep(text, [], true));
        return this;
    }

    public addSelect(value: number) {
        this.currentRun.steps.push(new ActionSelectStep(value));
        return this;
    }

    public addCommand(command: string) {
        this.currentRun.steps.push(new ExpectCommandStep(command));
        return this;
    }

    public AddStop() {
        this.currentRun.steps.push(new ExpectStop());
        return this;
    }
}
