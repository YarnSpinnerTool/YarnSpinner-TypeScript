import { YarnSpinnerTestPlanLexer } from "./generated/YarnSpinnerTestPlanLexer";
import {
    ActionSetBoolContext,
    ActionSetNumberContext,
    LineWithAnyTextExpectedContext,
    LineWithSpecificTextExpectedContext,
    YarnSpinnerTestPlanParser,
} from "./generated/YarnSpinnerTestPlanParser";
import * as antlr from "antlr4ng";
import { CharStream, CommonTokenStream } from "antlr4ng";
import * as fs from "node:fs";

export abstract class TestPlanStep {
    public abstract toString(): string;
}

export abstract class ExpectContentStep extends TestPlanStep {
    public expectedText: string | null = null;
}

export class TestPlanRun implements Iterable<TestPlanStep> {
    [Symbol.iterator](): Iterator<TestPlanStep, unknown, undefined> {
        return this.steps.values();
    }

    public startNode: string = "Start";
    public steps: TestPlanStep[] = [];
}

export class ExpectLineStep extends ExpectContentStep {
    public expectedHashTags: string[] = [];

    constructor(expectedText: string | null, expectedHashtags: string[]) {
        super();
        this.expectedText = expectedText;
        this.expectedHashTags = expectedHashtags;
    }

    override toString(): string {
        return `"line: "${this.expectedText} ${this.expectedHashTags.join(" ")}`.trim();
    }
}

export class ExpectOptionStep extends ExpectContentStep {
    public expectedHashtags: string[] = [];
    public expectedAvailability: boolean = true;

    constructor(
        text: string | null,
        hashtags: string[],
        expectedAvailability: boolean,
    ) {
        super();
        this.expectedText = text;
        this.expectedHashtags.push(...hashtags);
        this.expectedAvailability = expectedAvailability;
    }

    override toString(): string {
        return `option: ${this.expectedText} ${this.expectedHashtags.join(" ")} ${this.expectedAvailability ? "" : "(unavailable)"}`.trim();
    }
}

export class ExpectCommandStep extends ExpectContentStep {
    constructor(text: string) {
        super();
        this.expectedText = text;
    }

    override toString(): string {
        return `command: ${this.expectedText}`;
    }
}

export class ExpectStop extends TestPlanStep {
    override toString(): string {
        return "stop";
    }
}

export class ActionSelectStep extends TestPlanStep {
    public selectedIndex: number = 0;

    constructor(selectedIndex: number) {
        super();
        this.selectedIndex = selectedIndex;
    }

    override toString(): string {
        return `select: ${this.selectedIndex}`;
    }
}

type SaliencyMode = string;
type YarnValue = string | number | boolean;

export class ActionSetSaliencyStep extends TestPlanStep {
    public saliencyMode: SaliencyMode = "unset";

    constructor(saliencyMode: SaliencyMode) {
        super();
        this.saliencyMode = saliencyMode;
    }

    override toString(): string {
        return `set_saliency_mode: ${this.saliencyMode}`;
    }
}

export class ActionSetVariableStep extends TestPlanStep {
    public variableName: string;
    public value: YarnValue;

    public constructor(variableName: string, value: YarnValue) {
        super();
        this.variableName = variableName;
        this.value = value;
    }

    override toString(): string {
        return `set: ${this.variableName} = ${this.value.toString()}`;
    }
}

export class ActionJumpToNodeStep extends TestPlanStep {
    public nodeName: string;

    constructor(nodeName: string) {
        super();
        this.nodeName = nodeName;
    }

    override toString(): string {
        return `jump: ${this.nodeName}`;
    }
}

class ErrorListener extends antlr.BaseErrorListener {
    source: string;

    constructor(source: string) {
        super();
        this.source = source;
    }
    override syntaxError<S extends antlr.Token, T extends antlr.ATNSimulator>(
        _recognizer: antlr.Recognizer<T>,
        _offendingSymbol: S | null,
        _line: number,
        _column: number,
        _msg: string,
        _e: antlr.RecognitionException | null,
    ): void {
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

/**
 * Represents a test plan that can be iterated over to access individual test runs.
 */
export class TestPlan implements Iterable<TestPlanRun> {
    /**
     * An array of test run objects associated with this test plan.
     */
    public runs: TestPlanRun[] = [];

    /**
     * Constructs a new instance of the TestPlan class.
     */
    constructor() {}

    /**
     * Returns an iterator object that allows iteration over the test runs in
     * this test plan.
     * @returns An iterator object that iterates over all runs in the test plan.
     */
    [Symbol.iterator](): Iterator<TestPlanRun, TestPlanRun, undefined> {
        return this.runs.values();
    }

    /**
     * Creates a new instance of TestPlan from the content of a file at the
     * specified path.
     * @param path - The file system path where the test plan is stored.
     * @returns A new instance of TestPlan populated with data parsed from the
     * file.
     */
    public static fromFile(path: string): TestPlan {
        const text = fs.readFileSync(path).toString();
        return TestPlan.fromString(text);
    }

    /**
     * Creates a new instance of TestPlan from the provided string containing
     * the test plan data.
     * @param text - The string that contains the test plan source code.
     * @returns A new instance of TestPlan populated with data parsed from the
     * string.
     */
    public static fromString(text: string): TestPlan {
        // Initialize a new TestPlan instance
        const plan = new TestPlan();

        // Create a CharStream from the input text for parsing
        const charStream = CharStream.fromString(text);

        // Create a lexer to convert the character stream into tokens
        const lexer = new YarnSpinnerTestPlanLexer(charStream);

        // Create a parser to build an abstract syntax tree (AST) from the
        // tokens
        const tokenStream = new CommonTokenStream(lexer);
        const parser = new YarnSpinnerTestPlanParser(tokenStream);

        // Remove default error listeners for cleaner error handling
        lexer.removeErrorListeners();
        parser.removeErrorListeners();

        // Add custom error listeners specific to the test plan parsing
        const lexerErrorListener = new ErrorListener("testplan");
        const parserErrorListener = new ErrorListener("testplan");
        lexer.addErrorListener(lexerErrorListener);
        parser.addErrorListener(parserErrorListener);

        // Parse the input text to obtain the root of the AST
        const testPlanTree = parser.testplan();

        // Iterate over each run context in the parsed test plan tree
        for (const runContext of testPlanTree.run()) {
            // Create a new TestPlanRun instance for this run
            const run = new TestPlanRun();

            // Iterate over each step within the current run context
            for (const stepContext of runContext.step()) {
                let step: TestPlanStep;

                // Determine the type of step based on the presence of specific
                // tokens or conditions
                if (stepContext.actionJumpToNode() != null) {
                    // Create an ActionJumpToNodeStep instance
                    step = new ActionJumpToNodeStep(
                        stepContext.actionJumpToNode()?._nodeName?.text ?? "",
                    );
                } else if (stepContext.actionSelect() != null) {
                    // Create an ActionSelectStep instance
                    step = new ActionSelectStep(
                        parseInt(
                            stepContext.actionSelect()?.NUMBER().getText() ??
                                "error",
                        ) - 1,
                    );
                } else if (stepContext.actionSet() != null) {
                    // Handle different types of set actions
                    const set = stepContext.actionSet();

                    if (set instanceof ActionSetBoolContext) {
                        step = new ActionSetVariableStep(
                            set._variable?.text ?? "<error>",
                            {
                                true: true,
                                false: false,
                            }[(set._value?.text ?? "<error>").toLowerCase()] ??
                                false,
                        );
                    } else if (set instanceof ActionSetNumberContext) {
                        step = new ActionSetVariableStep(
                            set._variable?.text ?? "<error>",
                            parseInt(set._value?.text ?? "<error>"),
                        );
                    } else {
                        throw new Error(
                            "Unhandled 'set' type: " + stepContext.getText(),
                        );
                    }
                } else if (stepContext.lineExpected()) {
                    // Create an ExpectLineStep instance for line expectations
                    const expectation = stepContext.lineExpected()!;
                    if (expectation instanceof LineWithAnyTextExpectedContext) {
                        step = new ExpectLineStep(
                            null,
                            expectation.hashtag().map((h) => h.getText()),
                        );
                    } else if (
                        expectation instanceof
                        LineWithSpecificTextExpectedContext
                    ) {
                        step = new ExpectLineStep(
                            trimCharacters(
                                expectation.TEXT().getText() ?? "<error>",
                                "`",
                            ),
                            expectation.hashtag().map((h) => h.getText()),
                        );
                    } else {
                        throw new Error("Invalid line expectation");
                    }
                } else if (stepContext.optionExpected()) {
                    // Create an ExpectOptionStep instance for option
                    // expectations
                    step = new ExpectOptionStep(
                        trimCharacters(
                            stepContext.optionExpected()?.TEXT().getText() ??
                                "<error>",
                            "`",
                        ),
                        stepContext
                            .optionExpected()
                            ?.hashtag()
                            .map((h) => h.getText()) ?? [],
                        !stepContext.optionExpected()?._isDisabled,
                    );
                } else if (stepContext.commandExpected()) {
                    // Create an ExpectCommandStep instance for command
                    // expectations
                    step = new ExpectCommandStep(
                        trimCharacters(
                            stepContext.commandExpected()?.TEXT().getText() ??
                                "<error>",
                            "`",
                        ),
                    );
                } else if (stepContext.stopExpected()) {
                    // Create an ExpectStop instance for stop conditions
                    step = new ExpectStop();
                } else if (stepContext.actionSetSaliencyMode()) {
                    // Create an ActionSetSaliencyStep instance for saliency
                    // mode setting
                    step = new ActionSetSaliencyStep(
                        stepContext.actionSetSaliencyMode()?._saliencyMode
                            ?.text ?? "<error>",
                    );
                } else {
                    throw new Error(
                        "Unhandled step type: " + stepContext.getText(),
                    );
                }

                // Add the parsed step to the current run's steps list
                run.steps.push(step);
            }

            // Add the populated run to the test plan
            plan.runs.push(run);
        }

        // Return the fully populated TestPlan instance
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
    Run,
}

export class TestPlanBuilder {
    private _testPlan: TestPlan;

    private currentRun: TestPlanRun;

    constructor() {
        this._testPlan = new TestPlan();
        this.currentRun = new TestPlanRun();
        this.testPlan.runs.push(this.currentRun);
    }

    public get testPlan(): TestPlan {
        return this.testPlan;
    }
    private set testPlan(value) {
        this._testPlan = value;
    }

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
