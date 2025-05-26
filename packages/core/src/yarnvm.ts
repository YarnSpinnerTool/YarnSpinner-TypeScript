import { Instruction, Node, Operand, Program } from "./generated/yarn_spinner";

export type ExecutionState =
    | "stopped"
    | "waiting-on-option-selection"
    | "waiting-for-continue"
    | "running";

export interface VariableStorage {
    [key: string]: YarnValue;
}

export interface OptionItem {
    label: string;
    line: Line;
    jump: number;
    isAvailable: boolean;
    optionID: number;
}

type CallSite = {
    nodeName: string;
    instruction: number;
};

export type YarnValue = number | string | boolean;

export type YarnFunction = (
    ...parameters: YarnValue[]
) => YarnValue | undefined;

export type YarnLibrary = Map<string, YarnFunction>;

export type MetadataEntry = {
    id: string;
    node: string;
    lineNumber: string;
    tags: string[];
    [key: string]: unknown;
};

export type MetadataTable = Record<string, MetadataEntry>;

export type StringTable = Record<string, string>;

/**
 * Contains methods for choosing a piece of content from a collection of
 * options.
 */
export interface ContentSaliencyStrategy {
    /**
     * Chooses an item from content that is the most appropriate (or salient)
     * for the user's current context.
     * @remarks Implementations of this method should not modify any state -
     * that is, they should be 'read-only' operations. If a strategy needs to
     * record information about when a piece of content has been selected, it
     * should do it in the {@link contentWasSelected} method.
     * @param content A collection of content items. This collection may be
     * empty.
     * @returns An item from {@link content} that is the most appropriate
     * for display, or null if no content should be displayed.
     */
    queryBestContent(
        content: ContentSaliencyOption[],
    ): ContentSaliencyOption | null;

    /**
     * Called by Yarn Spinner to indicate that a piece of salient content has
     * been selected, and this system should update any state related to how it
     * selects content.
     * @remarks If a content saliency strategy does not need to keep track of
     * any state, then this method can be empty.
     * @param content The content that has been selected.
     */
    contentWasSelected(content: ContentSaliencyOption): void;
}

/**
 * Indicates what type of content a <see cref="ContentSaliencyOption"/>
 * represents.
 * @see ContentSaliencyOption.contentType
 */
export const enum ContentSaliencyContentType {
    /** The content represents a node in a node group. */
    Node = "node",

    /** The content represents a line in a line group. */
    Line = "line",
}

/**
 * Represents a piece of content that may be selected by a content saliency strategy.
 */
export class ContentSaliencyOption {
    /**
     * Initializes a new instance of the ContentSaliencyOption class with the
     * specified content ID.
     * @param id A string representing the unique identifier for the content.
     * @throws {Error} Thrown when the provided ID is null.
     */
    constructor(id: string) {
        if (id === null) {
            throw new Error("The content ID cannot be null.");
        }
        this.contentID = id;
    }

    /**
     * Gets the number of conditions that passed for this piece of content.
     */
    public passingConditionValueCount: number = 0;

    /**
     * Get the number of conditions that failed for this piece of content.
     */
    public failingConditionValueCount: number = 0;

    /**
     * Gets a string that uniquely identifies this content.
     */
    public contentID: string;

    /**
     * Gets the complexity score of this option.
     */
    public complexityScore: number = 0;

    /**
     * Gets the type of content that this option represents.
     * @remarks This information may be used by custom
     * {@link ContentSaliencyStrategy} classes to allow them to have different
     * behaviour depending on the type of the content.
     */
    public contentType: ContentSaliencyContentType =
        ContentSaliencyContentType.Line;

    /**
     * Gets a unique variable name that can be used for tracking the view count
     * of a specific piece of content.
     */
    public get viewCountKey(): string {
        if (this.contentID === null || this.contentID === "") {
            throw new Error(
                "Internal error: content has a null or empty ContentID",
            );
        }
        return `$Yarn.Internal.Content.ViewCount.${this.contentID}`;
    }

    /**
     * The destination instruction that the virtual machine will jump to if this
     * option is selected.
     * @remarks This property is internal to Yarn Spinner, and is used by the
     * {@link YarnVM} class.
     */
    destination: number = 0;
}

export class FirstSaliencyStrategy implements ContentSaliencyStrategy {
    queryBestContent(
        content: ContentSaliencyOption[],
    ): ContentSaliencyOption | null {
        // Filter out any options who have a failing condition and return the
        // first one, if any
        content = content.filter((c) => c.failingConditionValueCount == 0);

        if (content.length == 0) {
            return null;
        }
        return content[0];
    }

    contentWasSelected(_content: ContentSaliencyOption): void {
        // No-op.
    }
}

export class BestSaliencyStrategy implements ContentSaliencyStrategy {
    queryBestContent(
        content: ContentSaliencyOption[],
    ): ContentSaliencyOption | null {
        // Filter out any options who have a failing condition and return the
        // one with the highest complexity, if any
        content = content.filter((c) => c.failingConditionValueCount == 0);
        content.sort((a, b) => b.complexityScore - a.complexityScore);

        if (content.length == 0) {
            return null;
        }
        return content[0];
    }

    contentWasSelected(_content: ContentSaliencyOption): void {
        // No-op.
    }
}

function orderBy<T>(
    collection: T[],
    predicate: (element: T) => number,
    options: { ascending?: boolean } = {},
): T[] {
    const { ascending = true } = options;

    return collection.slice().sort((a, b) => {
        const valueA = predicate(a);
        const valueB = predicate(b);

        if (valueA < valueB) return ascending ? -1 : 1;
        if (valueA > valueB) return ascending ? 1 : -1;
        return 0;
    });
}

function groupBy<Value, GroupKey>(
    collection: Value[],
    predicate: (item: Value) => GroupKey,
): Map<GroupKey, Value[]> {
    const result = new Map<GroupKey, Value[]>();

    for (const item of collection) {
        const key = predicate(item);
        if (result.has(key) == false) {
            result.set(key, []);
        }

        result.get(key)!.push(item);
    }

    return result;
}

export class BestLeastRecentlyViewedSalienceStrategy
    implements ContentSaliencyStrategy
{
    private storage: VariableStorage;

    public chooseRandomly: boolean;

    constructor(storage: VariableStorage, chooseRandomly: boolean = false) {
        this.storage = storage;
        this.chooseRandomly = chooseRandomly;
    }

    queryBestContent(
        content: ContentSaliencyOption[],
    ): ContentSaliencyOption | null {
        // First, filter out any content that has a failing condition.
        content = content.filter((c) => c.failingConditionValueCount == 0);

        if (content.length == 0) {
            // No content available.
            return null;
        }

        // Next, find the view count for every option.
        const optionsAndViewCounts: {
            opt: ContentSaliencyOption;
            viewCount: number;
        }[] = content.map((c) => {
            if (
                c.viewCountKey in this.storage &&
                typeof this.storage[c.viewCountKey] === "number"
            ) {
                return {
                    opt: c,
                    viewCount: this.storage[c.viewCountKey] as number,
                };
            } else {
                return { opt: c, viewCount: 0 };
            }
        });

        const groups = groupBy(optionsAndViewCounts, (c) => c.viewCount);
        let lowest: { opts: ContentSaliencyOption[]; viewCount: number } = {
            opts: [],
            viewCount: Infinity,
        };

        // Get the group of items with the least number of views
        for (const [key, group] of groups.entries()) {
            if (key < lowest.viewCount) {
                lowest = { opts: group.map((i) => i.opt), viewCount: key };
            }
        }

        // Get the subgroup with the most complexity
        const best = groupBy(lowest.opts, (c) => c.complexityScore);
        let bestSubgroup: {
            opts: ContentSaliencyOption[];
            complexity: number;
        } = {
            opts: [],
            complexity: -Infinity,
        };
        for (const [score, group] of best.entries()) {
            if (score > bestSubgroup.complexity) {
                bestSubgroup = { opts: group, complexity: score };
            }
        }

        if (bestSubgroup.opts.length == 0) {
            // No content was found.
            return null;
        } else if (bestSubgroup.opts.length == 1) {
            // Return the single option available.
            return bestSubgroup.opts[0];
        } else if (this.chooseRandomly) {
            // Randomly choose from these equally-best items.
            return bestSubgroup.opts[
                randomRange(0, bestSubgroup.opts.length - 1)
            ];
        } else {
            // Choose the first from these equally-best items.
            return bestSubgroup.opts[0];
        }
    }

    contentWasSelected(c: ContentSaliencyOption): void {
        // A piece of content was selected. Update its view count.

        let previousViewCount: number = 0;

        if (
            c.viewCountKey in this.storage &&
            typeof this.storage[c.viewCountKey] === "number"
        ) {
            previousViewCount = this.storage[c.viewCountKey] as number;
        }

        this.storage[c.viewCountKey] = previousViewCount + 1;
    }
}

const TrackingVariableNameHeader: string = "$Yarn.Internal.TrackingVariable";
const ContentSaliencyConditionVariablesHeader =
    "$Yarn.Internal.ContentSaliencyVariables";
const ContentSaliencyConditionComplexityScoreHeader =
    "$Yarn.Internal.ContentSaliencyComplexity";

function randomRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export type Line = {
    id: string;
    substitutions: YarnValue[];
};

export class YarnVM {
    private currentNode: Node | null = null;
    public program?: Program;

    private stack: (string | boolean | number)[] = [];
    private _state: ExecutionState = "stopped";

    public get state() {
        return this._state;
    }

    public get currentNodeName(): string | null {
        return this.currentNode?.name ?? null;
    }

    private callStack: CallSite[] = [];
    private programCounter = 0;

    public variableStorage: VariableStorage = {};

    private optionSet: OptionItem[] = [];

    public verboseLogging: boolean = false;

    public lineCallback: ((line: Line) => Promise<void>) | null = null;
    public commandCallback: ((command: string) => Promise<void>) | null = null;
    public optionCallback: ((options: OptionItem[]) => Promise<number>) | null =
        null;
    public dialogueCompleteCallback: (() => Promise<void>) | null = null;
    public nodeCompleteCallback: ((nodeName: string) => void) | null = null;

    public onVariableSet:
        | ((variable: string, value: YarnValue) => void)
        | null = null;

    public saliencyStrategy: ContentSaliencyStrategy =
        new FirstSaliencyStrategy();

    private contentSaliencyCandidates: ContentSaliencyOption[] = [];

    // maps functions to their stub values
    // intended to be used for testing
    private library?: YarnLibrary;

    private interrupted = false;

    public loadProgram(newProgram: Program, library?: YarnLibrary) {
        this.program = newProgram;

        this.library = new Map([
            // Take the user-provided library of functions
            ...(library?.entries() ?? []),
            // Add it to our own library
            ...this.getLibrary().entries(),
        ]);

        this.loadInitialValues(this.program);
    }

    public loadInitialValues(program: Program) {
        for (const key in program.initialValues) {
            const value = this.unwrap(program.initialValues[key]);

            if (value !== undefined) {
                this.variableStorage[key] = value;
            }
        }
    }

    public getExecutionPosition(): {
        node: string;
        position: number;
    } | null {
        if (this.state == "stopped" || this.currentNodeName == null) {
            return null;
        } else {
            return {
                node: this.currentNodeName,
                position: this.programCounter,
            };
        }
    }

    public resetState(): void {
        this.log("resetting state");
        this.stack = [];
        this.callStack = [];
        this.programCounter = 0;
        this.optionSet = [];
        this.currentNode = null;
        this.interrupted = false;
    }

    public setNode(nodeName: string, clearState: boolean = true): boolean {
        const node = this.program?.nodes[nodeName];
        if (node == null) {
            return false;
        }
        if (clearState) {
            this.resetState();
        }
        this.currentNode = node;
        this.programCounter = 0;

        return true;
    }
    public interrupt(): void {
        this.interrupted = true;
    }
    public stop(): void {
        this.log("stopping all execution");
        this._state = "stopped";
        this.resetState();
    }
    public selectOption(optionIndex: number): void {
        this.log("selecting option number: " + optionIndex);

        if (this._state != "waiting-on-option-selection") {
            this.logError(
                "asked to select option when options are not awaited",
            );
            return;
        }

        if (optionIndex < 0 || optionIndex >= this.optionSet.length) {
            this.logError("asked to select an option beyond our comprehension");
            return;
        }

        const destination = this.optionSet[optionIndex].jump;
        this.stack.push(destination);
        this.optionSet = [];
        this._state = "waiting-for-continue";
    }
    public async start(): Promise<void> {
        if (this.currentNode == null) {
            this.logError("unable to start dialogue, have no node");
            return;
        }

        this.log("starting the dialogue");
        this._state = "running";

        if (this.currentNode == null) {
            this.log("unable to start dialogue, node is null");
            return;
        }

        while (this._state == "running") {
            if (
                this.currentNode == null ||
                this.programCounter >= this.currentNode.instructions.length
            ) {
                this._state = "stopped";
                if (this.dialogueCompleteCallback) {
                    await this.dialogueCompleteCallback();
                }
                return;
            }

            const currentNode: Node | undefined = this.currentNode;

            try {
                await this.runInstruction(
                    this.currentNode.instructions[this.programCounter],
                );
                if (this.interrupted) {
                    // We were interrupted while running this instruction. Exit
                    // immediately.
                    this.stop();
                    if (this.dialogueCompleteCallback) {
                        await this.dialogueCompleteCallback();
                    }
                    return;
                }
            } catch (err) {
                if (err) {
                    this.logError(
                        `Error thrown in ${this.currentNode.name}:${this.programCounter}: ${err.toString()}`,
                    );
                }
            }

            if (this.currentNode == currentNode) {
                // We're still in the same node. Advance to the next instruction.
                this.programCounter += 1;
            }
        }
    }

    private async runInstruction(i: Instruction): Promise<void> {
        switch (i.instructionType.oneofKind) {
            case "jumpTo":
                this.programCounter = i.instructionType.jumpTo.destination - 1;
                break;
            case "peekAndJump": {
                const top = this.stack[this.stack.length - 1];
                if (typeof top !== "number") {
                    this.logError(
                        `Error running instruction: top of stack is not a number`,
                    );
                } else {
                    // Update our program counter.

                    // We're staying in the same node, so programCounter will be
                    // incremented when we return from this function. Because we
                    // want the next instruction to be the instruction we just
                    // popped, subtract one from it to compensate.
                    this.programCounter = top - 1;
                }
                break;
            }
            case "runLine": {
                const label = i.instructionType.runLine.lineID;
                const count = i.instructionType.runLine.substitutionCount;

                this.log("running line " + label);
                const parameters: YarnValue[] = [];
                // now to get any replacement values

                if (count != undefined && count > 0) {
                    for (let j = count - 1; j >= 0; j--) {
                        const top = this.stack.pop();
                        if (top == undefined) {
                            this.logError(
                                "asked to pop values from stack for inserting into lines, but stack has none!",
                            );
                            break;
                        }
                        parameters.push(top);
                    }
                }

                let line = this.buildLine(label, parameters);

                // in the c# one we set state to delivered
                // then to waiting
                // for this I think we can skip that and go straight to waiting to continue
                this._state = "waiting-for-continue";

                if (this.lineCallback != null) {
                    await this.lineCallback(line);
                    this._state = "running";
                }

                break;
            }
            case "runCommand": {
                let command = i.instructionType.runCommand.commandText;
                const count = i.instructionType.runCommand.substitutionCount;

                this.log("running command: <<" + command + ">>");

                const parameters: YarnValue[] = [];
                // now to get any replacement values
                if (count != undefined) {
                    for (let j = count - 1; j >= 0; j--) {
                        const top = this.stack.pop();
                        if (top == undefined) {
                            this.logError(
                                "asked to pop values from stack for inserting into commands, but stack has none!",
                            );
                            break;
                        }
                        parameters.push(top);
                    }
                    parameters.reverse();
                }

                command = this.buildCommand(command, parameters);

                // in the c# one we set state to delivered
                // then to waiting
                // for this I think we can skip that and go straight to waiting to continue
                this._state = "waiting-for-continue";

                if (this.commandCallback != null) {
                    await this.commandCallback(command);
                    this._state = "running";
                }

                break;
            }
            case "addOption": {
                this.log("adding option");

                const label = i.instructionType.addOption.lineID;
                if (label == undefined) {
                    this.logError("unable to run line, label is not a string");
                    break;
                }

                const parameters: YarnValue[] = [];
                // now to get any replacement values
                const count = i.instructionType.addOption.substitutionCount;
                if (count != undefined) {
                    for (let j = count - 1; j >= 0; j--) {
                        const top = this.stack.pop();
                        if (top != undefined) {
                            parameters.push(top);
                        }
                    }
                }

                // the jump point of of our option
                const jump = i.instructionType.addOption.destination;

                // now do we have line condition?
                let lineCondition = true;

                const valid = i.instructionType.addOption.hasCondition;
                if (valid != undefined && valid == true) {
                    const top = this.stack.pop();
                    if (typeof top == "boolean") {
                        lineCondition = top;
                    }
                }

                // we then need to configure the option here
                this.log(`adding option ${label}:${lineCondition}`);

                let line = this.buildLine(label, parameters);

                const option: OptionItem = {
                    label: label,
                    line: line,
                    jump: jump == undefined ? 0 : jump,
                    isAvailable: lineCondition,
                    optionID: this.optionSet.length,
                };

                this.optionSet.push(option);

                break;
            }
            case "showOptions": {
                if (this.optionSet.length == 0) {
                    this.logError("asked to show options but have none");
                    this._state == "stopped";
                    break;
                }

                this.log(`presenting ${this.optionSet.length} options`);

                this._state = "waiting-on-option-selection";

                if (this.optionCallback != null) {
                    const index = await this.optionCallback(this.optionSet);
                    this.selectOption(index);
                    this._state = "running";
                }

                break;
            }

            case "pushString": {
                const value = i.instructionType.pushString.value;
                if (value != undefined) {
                    this.stack.push(value);
                }
                break;
            }
            case "pushFloat": {
                const value = i.instructionType.pushFloat.value;
                if (value != undefined) {
                    this.stack.push(value);
                }
                break;
            }
            case "pushBool": {
                const value = i.instructionType.pushBool.value;
                if (value != undefined) {
                    this.stack.push(value);
                } else {
                    this.logError(
                        `unable to unwrap instruction ${JSON.stringify(i)} into a number!`,
                    );
                }
                break;
            }
            case "jumpIfFalse": {
                const top = this.top;

                if (typeof top == "boolean" && !top) {
                    // The top of the stack is false, so jump to the
                    // destination
                    this.programCounter =
                        i.instructionType.jumpIfFalse.destination - 1;
                }

                break;
            }
            case "pop": {
                this.stack.pop();
                break;
            }

            case "callFunc": {
                const parameterCount = this.stack.pop();
                if (
                    parameterCount != undefined &&
                    typeof parameterCount == "number"
                ) {
                    const parameters: YarnValue[] = [];
                    for (let j = 0; j < parameterCount; j++) {
                        const top = this.stack.pop();
                        if (top === undefined) {
                            this.logError(
                                `Internal error: stack was empty when popping parameter`,
                            );
                            return;
                        }
                        parameters.unshift(top);
                    }

                    // ok now we have the name of the function and the the parameters
                    // time to actually perform the function and push its value onto the stack
                    const functionName =
                        i.instructionType.callFunc.functionName;
                    if (functionName !== undefined) {
                        const result = this.runFunc(functionName, parameters);
                        if (result !== undefined) {
                            this.stack.push(result);
                        } else {
                            this.logError(
                                `${functionName} did not return a valid result`,
                            );
                        }
                    }
                } else {
                    this.logError("top of stack is not a number!");
                }

                break;
            }
            case "pushVariable": {
                const variableName =
                    i.instructionType.pushVariable.variableName;
                if (variableName != undefined) {
                    const value = this.variableStorage[variableName];
                    if (value != undefined) {
                        this.stack.push(value);
                    }
                }
                break;
            }
            case "storeVariable": {
                const variableName =
                    i.instructionType.storeVariable.variableName;
                const value = this.top;
                if (variableName != undefined) {
                    this.variableStorage[variableName] = value;
                    if (this.onVariableSet) {
                        this.onVariableSet(variableName, value);
                    }
                }
                break;
            }

            case "stop": {
                this._state = "stopped";
                this.currentNode = null;
                break;
            }
            case "runNode": {
                const currentNode = this.currentNode;
                this.executeJumpToNode(
                    i.instructionType.runNode.nodeName,
                    false,
                );
                if (currentNode == this.currentNode) {
                    // We haven't changed which node we're on, we just
                    // jumped to instruction 0 of this node.
                    //
                    // We will advance to the next instruction when
                    // returning, but we want to run the first instruction.
                    // Compensate by decrementing our program counter.
                    this.programCounter -= 1;
                }
                break;
            }
            case "peekAndRunNode": {
                this.executeJumpToNode(null, false);
                break;
            }
            case "detourToNode": {
                this.executeJumpToNode(
                    i.instructionType.detourToNode.nodeName,
                    true,
                );
                break;
            }
            case "peekAndDetourToNode": {
                this.executeJumpToNode(null, true);
                break;
            }
            case "return": {
                if (!this.currentNode) {
                    throw new Error(
                        "Internal error: attempted to return, but no node was runnning",
                    );
                }

                this.returnFromNode(this.currentNode);
                const returnSite = this.callStack.pop();

                if (!returnSite) {
                    // We've reached the top of the call stack, so
                    // there's nowhere to return to. Stop the program.
                    this.currentNode = null;
                    this.stack = [];
                    break;
                }

                this.setNode(returnSite.nodeName, false);

                // The stored call site will be the instruction that caused
                // us to jump into here, so advance to the next instruction
                // after that
                this.programCounter = returnSite.instruction + 1;

                break;
            }
            case "addSaliencyCandidate": {
                const info = i.instructionType.addSaliencyCandidate;

                // The top of the stack contains a bool indicating whether the condition passed or not
                const passed = this.stack.pop();
                if (typeof passed !== "boolean") {
                    throw new Error("Expected top of stack to be boolean");
                }

                const newCandidate = new ContentSaliencyOption(info.contentID);

                newCandidate.contentType = ContentSaliencyContentType.Line;
                newCandidate.complexityScore = info.complexityScore;

                newCandidate.destination = info.destination;
                newCandidate.passingConditionValueCount = passed ? 1 : 0;
                newCandidate.failingConditionValueCount = passed ? 0 : 1;

                this.contentSaliencyCandidates.push(newCandidate);
                break;
            }
            case "addSaliencyCandidateFromNode": {
                const info = i.instructionType.addSaliencyCandidateFromNode;

                const node = this.program!.nodes[info.nodeName];

                if (!node) {
                    throw new Error(`Unknown node ${info.nodeName}`);
                }

                const { pass, fail } =
                    this.evaluateSaliencyWhenClausesForNode(node);
                const complexity = this.getSaliencyComplexityForNode(node);

                const newCandidate = new ContentSaliencyOption(node.name);
                newCandidate.passingConditionValueCount = pass;
                newCandidate.failingConditionValueCount = fail;
                newCandidate.complexityScore = complexity;
                newCandidate.destination = info.destination;

                this.contentSaliencyCandidates.push(newCandidate);
                break;
            }
            case "selectSaliencyCandidate": {
                const selectedOption = this.saliencyStrategy.queryBestContent(
                    this.contentSaliencyCandidates,
                );

                if (selectedOption === null) {
                    // Push false to indicate that we didn't select any content
                    this.stack.push(false);
                    break;
                }

                // We selected content! Push the destination to jump to,
                // followed by a 'true' value to indicate that we selected
                // something.
                this.stack.push(selectedOption.destination);
                this.stack.push(true);

                // Tell the saliency strategy that we are running this content
                this.saliencyStrategy.contentWasSelected(selectedOption);

                // Clear the accumulated list of options
                this.contentSaliencyCandidates = [];

                break;
            }
            default: {
                this.logError(`Unknown opcode: ${i.instructionType.oneofKind}`);
                this._state = "stopped";
            }
        }
    }

    private executeJumpToNode(nodeName: string | null, isDetour: boolean) {
        if (!this.currentNode) {
            throw new Error(
                "Internal error: can't execute a node jump when we aren't currently running a node",
            );
        }

        if (isDetour) {
            // Preserve our current state.
            this.callStack.push({
                nodeName: this.currentNode.name,
                instruction: this.programCounter,
            });
        } else {
            // We are jumping straight to another node. Unwind the current call
            // stack and issue a 'node complete' event for every node.
            this.returnFromNode(this.currentNode);

            while (this.callStack.length > 0) {
                const currentStackFrame = this.callStack.pop()!;

                if (currentStackFrame.nodeName) {
                    const node =
                        this.program?.nodes[currentStackFrame.nodeName];
                    if (!node) {
                        throw new Error(
                            `Internal error: attempted to return to node ${currentStackFrame.nodeName}, but this node is not in the program`,
                        );
                    }
                    this.returnFromNode(node);
                }
            }
        }

        if (nodeName == null) {
            // The node name wasn't supplied - get it from the top of the stack.
            const stackTop = this.stack[this.stack.length - 1];
            if (typeof stackTop === "string") {
                nodeName = stackTop;
            } else {
                throw new Error(
                    "Internal error: top of stack is not a node name",
                );
            }
        }

        const success = this.setNode(nodeName, !isDetour);
        if (!success) {
            throw new Error(
                `Can't jump to node ${nodeName}: no node with this name was found`,
            );
        }

        this.programCounter = 0;
    }

    private getTrackingVariableName(node: Node): string | undefined {
        for (const header of node.headers) {
            if (header.key == TrackingVariableNameHeader) {
                return header.value;
            }
        }
        return undefined;
    }

    private returnFromNode(node: Node) {
        if (node == null) {
            // Nothing to do.
            return;
        }

        if (this.nodeCompleteCallback) {
            this.nodeCompleteCallback(node.name);
        }

        const nodeTrackingVariable = this.getTrackingVariableName(node);

        if (nodeTrackingVariable) {
            let result = this.variableStorage[nodeTrackingVariable];
            if (result === undefined) {
                const initialValue =
                    this.program?.initialValues[nodeTrackingVariable].value;
                if (initialValue?.oneofKind !== "floatValue") {
                    throw new Error(
                        `Internal error: tracking variable for node ${node.name} was not declared as a float`,
                    );
                }
                result = initialValue.floatValue;
            }
            if (typeof result === "number") {
                result += 1;
            } else {
                this.logError(
                    `Failed to get the tracking variable for node ${node.name}`,
                );
            }
            this.variableStorage[nodeTrackingVariable] = result;
        }
    }

    private getLibrary(): YarnLibrary {
        function checkNumber(value: YarnValue): asserts value is number {
            typeCheck(value, "number");
        }
        function checkString(value: YarnValue): asserts value is string {
            typeCheck(value, "string");
        }
        function checkBoolean(value: YarnValue): asserts value is boolean {
            typeCheck(value, "boolean");
        }

        const typeCheck = (
            value: YarnValue,
            type: "number" | "string" | "boolean",
        ): void => {
            if (typeof value !== type) {
                throw new Error("Expected parameter of type " + type);
            }
        };

        const numberFunctions: Record<string, YarnFunction> = {
            // Arithmetic operators
            "Number.UnaryMinus": (a) => {
                checkNumber(a);
                return -a;
            },
            "Number.Add": (a, b) => {
                checkNumber(a);
                checkNumber(b);
                return a + b;
            },
            "Number.Minus": (a, b) => {
                checkNumber(a);
                checkNumber(b);
                return a - b;
            },
            "Number.Multiply": (a, b) => {
                checkNumber(a);
                checkNumber(b);
                return a * b;
            },
            "Number.Divide": (a, b) => {
                checkNumber(a);
                checkNumber(b);
                return a / b;
            },
            "Number.Modulo": (a, b) => {
                checkNumber(a);
                checkNumber(b);
                return a % b;
            },
            // Comparison operators
            "Number.EqualTo": (a, b) => {
                checkNumber(a);
                checkNumber(b);
                return a === b;
            },
            "Number.GreaterThan": (a, b) => {
                checkNumber(a);
                checkNumber(b);
                return a > b;
            },
            "Number.GreaterThanOrEqualTo": (a, b) => {
                checkNumber(a);
                checkNumber(b);
                return a >= b;
            },
            "Number.LessThan": (a, b) => {
                checkNumber(a);
                checkNumber(b);
                return a < b;
            },
            "Number.LessThanOrEqualTo": (a, b) => {
                checkNumber(a);
                checkNumber(b);
                return a <= b;
            },
            "Number.NotEqualTo": (a, b) => {
                checkNumber(a);
                checkNumber(b);
                return a !== b;
            },
        };

        const booleanFunctions: Record<string, YarnFunction> = {
            "Bool.Not": (a) => {
                checkBoolean(a);
                return !a;
            },
            "Bool.EqualTo": (a, b) => {
                checkBoolean(a);
                checkBoolean(b);
                return a === b;
            },
            "Bool.NotEqualTo": (a, b) => {
                checkBoolean(a);
                checkBoolean(b);
                return a !== b;
            },
            "Bool.Or": (a, b) => {
                checkBoolean(a);
                checkBoolean(b);
                return a || b;
            },
            "Bool.And": (a, b) => {
                checkBoolean(a);
                checkBoolean(b);
                return a && b;
            },
            "Bool.Xor": (a, b) => {
                checkBoolean(a);
                checkBoolean(b);
                // JS has no boolean xor, but xor is equivalent to not-equal-to
                return a !== b;
            },
        };

        const stringFunctions: Record<string, YarnFunction> = {
            "String.EqualTo": (a, b) => {
                checkString(a);
                checkString(b);
                return a === b;
            },
            "String.NotEqualTo": (a, b) => {
                checkString(a);
                checkString(b);
                return a !== b;
            },
            "String.Add": (a, b) => {
                checkString(a);
                checkString(b);
                return a + b;
            },
        };

        const enumFunctions: Record<string, YarnFunction> = {
            "Enum.EqualTo": (a, b) => {
                if (typeof a !== typeof b) {
                    throw new Error(
                        `Can't compare ${a} and ${b}, because they are of different underlying types`,
                    );
                }
                return a === b;
            },
            "Enum.NotEqualTo": (a, b) => {
                if (typeof a !== typeof b) {
                    throw new Error(
                        `Can't compare ${a} and ${b}, because they are of different underlying types`,
                    );
                }
                return a !== b;
            },
        };

        const conversionFunctions: Record<string, YarnFunction> = {
            number: (value) => {
                if (value === undefined) {
                    throw new Error(
                        "Can't convert to number: undefined value provided",
                    );
                }
                switch (typeof value) {
                    case "string":
                        return parseFloat(value);
                    case "boolean":
                        return value ? 1 : 0;
                    case "number":
                        return value;
                }
            },
            string: (value) => {
                if (value === undefined) {
                    throw new Error(
                        "Can't convert to string: undefined value provided",
                    );
                }
                return `${value}`;
            },
            bool: (value) => {
                if (value === undefined) {
                    throw new Error(
                        "Can't convert to bool: undefined value provided",
                    );
                }
                switch (typeof value) {
                    case "boolean":
                        return value;
                    case "number":
                        return value >= 1;
                    case "string":
                        return value === "true";
                }
            },
        };

        const visitationFunctions: Record<string, YarnFunction> = {
            visited: (nodeName) => {
                checkString(nodeName);
                const name = `$Yarn.Internal.Visiting.${nodeName}`;

                let count = this.variableStorage[name];

                if (typeof count != "number") {
                    count = 0;
                }
                return count > 0;
            },
            visited_count: (nodeName) => {
                checkString(nodeName);
                const name = `$Yarn.Internal.Visiting.${nodeName}`;

                let count = this.variableStorage[name];

                if (typeof count != "number") {
                    count = 0;
                }
                return count;
            },
        };

        const mathsFunctions: Record<string, YarnFunction> = {
            random: () => Math.random(),
            random_range: (from, to) => {
                checkNumber(from);
                checkNumber(to);

                const min: number = Math.min(from, to);
                const max: number = Math.max(from, to);

                return randomRange(min, max);
            },

            dice: (sides) => {
                checkNumber(sides);
                if (sides < 1) {
                    throw new Error(
                        "dice() must be called with a number greater than zero",
                    );
                }
                return randomRange(1, sides);
            },
            round: (value) => {
                checkNumber(value);
                return Math.round(value);
            },
            round_places: (value, places) => {
                checkNumber(value);
                checkNumber(places);
                return +value.toFixed(places);
            },
            floor: (value) => {
                checkNumber(value);
                return Math.floor(value);
            },
            ceil: (value) => {
                checkNumber(value);
                return Math.ceil(value);
            },
            inc: (value) => {
                checkNumber(value);
                return Math.round(value) + 1;
            },
            dec: (value) => {
                checkNumber(value);
                return Math.round(value) - 1;
            },
            decimal: (value) => {
                checkNumber(value);
                return value % 1;
            },
            int: (value) => {
                checkNumber(value);
                return Math.trunc(value);
            },
        };

        const library: YarnLibrary = new Map(
            Object.entries({
                ...numberFunctions,
                ...stringFunctions,
                ...booleanFunctions,
                ...conversionFunctions,
                ...mathsFunctions,
                ...enumFunctions,
                ...visitationFunctions,
            }),
        );

        return library;
    }

    // haven't really done this in a hugely efficient manner
    // but this was nicer to write in this form than one big switch
    private runFunc(
        funcName: string,
        parameters: (string | boolean | number)[],
    ): string | boolean | number | undefined {
        // Check our library, and run the function from that.
        const func = this.library?.get(funcName);

        if (func != undefined) {
            return func(...parameters);
        } else {
            // We failed to find a function to run.
            this.logError(
                `Encountered invalid function: ${funcName} with parameters: (${JSON.stringify(parameters)})`,
            );

            return undefined;
        }
    }

    private buildLine(lineID: string, parameters: YarnValue[]): Line {
        // parameters is built like a stack but will we access it like an array
        // as such its backwards, so we need to reverse it before use
        parameters = parameters.slice().reverse();
        return {
            id: lineID,
            substitutions: parameters,
        };
    }
    private buildCommand(
        cmd: string,
        parameters: (string | boolean | number)[],
    ): string {
        let command = cmd;
        for (let i = 0; i < parameters.length; i += 1) {
            const substitution = parameters[i];
            if (typeof substitution == "boolean") {
                command = command.replace(
                    "{" + i + "}",
                    `${substitution == true ? "True" : "False"}`,
                );
            } else {
                command = command.replace("{" + i + "}", `${substitution}`);
            }
        }
        return command;
    }

    // a generic unwrapper that takes an operand and converts it to a concrete type (or undefined)
    // only really useful in a few places compared to the more specific ones
    private unwrap(op: Operand): string | number | boolean {
        switch (op.value.oneofKind) {
            case "boolValue":
                return op.value.boolValue;
            case "floatValue":
                return op.value.floatValue;
            case "stringValue":
                return op.value.stringValue;
            default:
                throw new Error(
                    `Can't unwrap ${JSON.stringify(op)}: unknown type`,
                );
        }
    }

    public evaluateSmartVariable(name: string): YarnValue | undefined {
        if (!this.program) {
            throw new Error(
                `Can't evaluate smart variable ${name}: no program is loaded`,
            );
        }
        const node = this.program.nodes[name];
        if (!node) {
            // No node with this name. Return undefined.
            return undefined;
        }

        // Run a miniature version of the virtual machine that supports just
        // enough instructions to be able to evaluate an expression

        const stack: YarnValue[] = [];
        let programCounter = 0;

        const evaluateSmartVariableInstruction = (i: Instruction): boolean => {
            switch (i.instructionType.oneofKind) {
                case "pushString": {
                    stack.push(i.instructionType.pushString.value);
                    programCounter += 1;
                    return true;
                }
                case "pushFloat": {
                    stack.push(i.instructionType.pushFloat.value);
                    programCounter += 1;
                    return true;
                }
                case "pushBool": {
                    stack.push(i.instructionType.pushBool.value);
                    programCounter += 1;
                    return true;
                }
                case "pop": {
                    stack.pop();
                    programCounter += 1;
                    return true;
                }
                case "callFunc": {
                    const paramCount = stack.pop();
                    if (typeof paramCount !== "number") {
                        throw new Error("Expected top of stack to be number");
                    }
                    if (stack.length < paramCount) {
                        throw new Error("Not enough parameters on stack");
                    }
                    const parameters: YarnValue[] = [];
                    for (let i = 0; i < paramCount; i++) {
                        parameters.unshift(stack.pop()!);
                    }
                    const result = this.runFunc(
                        i.instructionType.callFunc.functionName,
                        parameters,
                    );
                    if (result === undefined) {
                        throw new Error("Failed to run function");
                    }
                    stack.push(result);
                    programCounter += 1;
                    return true;
                }
                case "pushVariable": {
                    const variableName =
                        i.instructionType.pushVariable.variableName;
                    if (variableName in this.variableStorage) {
                        stack.push(this.variableStorage[variableName]);
                    } else {
                        const initialValue =
                            this.program!.initialValues[variableName];
                        if (initialValue === undefined) {
                            throw new Error(
                                "Undefined variable " + variableName,
                            );
                        }

                        stack.push(this.unwrap(initialValue));
                    }
                    programCounter += 1;
                    return true;
                }
                case "jumpIfFalse": {
                    if (stack.length == 0) {
                        throw new Error("Can't jump - stack is empty");
                    }
                    const top = stack[stack.length - 1];
                    if (typeof top !== "boolean") {
                        throw new Error(
                            "Can't jump - top of stack is not boolean",
                        );
                    }
                    if (top === false) {
                        programCounter =
                            i.instructionType.jumpIfFalse.destination;
                    } else {
                        programCounter += 1;
                    }
                    return true;
                }
                case "stop": {
                    return false;
                }
                default: {
                    throw new Error(
                        `Can't use instruction type ${i.instructionType.oneofKind} in smart variables`,
                    );
                }
            }
        };

        while (programCounter < node.instructions.length) {
            const previousProgramCounter = programCounter;
            const instruction = node.instructions[programCounter];
            const shouldContinue =
                evaluateSmartVariableInstruction(instruction);

            // The instruction pointer must always move forwards in a smart
            // variable
            if (programCounter <= previousProgramCounter) {
                throw new Error("Jump backwards in smart variable detected");
            }

            if (!shouldContinue) {
                break;
            }
        }

        if (stack.length !== 1) {
            throw new Error("Expected precisely one value remaining on stack");
        }

        return stack[0];
    }

    private getHeaderValueForNode(
        node: Node,
        header: string,
    ): string | undefined {
        return node.headers.find((h) => h.key === header)?.value;
    }

    private getHeaderValuesForNode(node: Node, header: string): string[] {
        return node.headers.filter((h) => h.key === header).map((h) => h.value);
    }

    private getSaliencyComplexityForNode(node: Node): number {
        const complexity = this.getHeaderValueForNode(
            node,
            ContentSaliencyConditionComplexityScoreHeader,
        );
        if (complexity === undefined) {
            throw new Error(
                "Can't get saliency complexity for node " +
                    node.name +
                    ": missing complexity score header",
            );
        }
        return parseInt(complexity);
    }

    private evaluateSaliencyWhenClausesForNode(node: Node): {
        pass: number;
        fail: number;
    } {
        const variableNameHeader = this.getHeaderValueForNode(
            node,
            ContentSaliencyConditionVariablesHeader,
        );
        if (variableNameHeader === undefined) {
            throw new Error(
                `Can't get saliency variables for node ${node.name}: missing complexity score header`,
            );
        }
        const result = {
            pass: 0,
            fail: 0,
        };
        const variableNames = variableNameHeader.split(";");
        for (const variable of variableNames) {
            const value = this.evaluateSmartVariable(variable);
            if (typeof value !== "boolean") {
                throw new Error(
                    `Can't get saliency variables for node ${node.name}: when clause header ${variable} did not evaluate to a bool`,
                );
            }
            result.pass += value ? 1 : 0;
            result.fail += value ? 0 : 1;
        }
        return result;
    }

    private log(message: string): void {
        if (this.verboseLogging) {
            console.log(message);
        }
    }
    private logError(message: string): void {
        console.error(message);
    }
    // push and pop work as expected but at the end of the array
    // this is just to avoid retyping this every time
    private get top(): string | number | boolean {
        return this.stack[this.stack.length - 1];
    }
    private printInstruction(i: Instruction): string {
        return JSON.stringify(i);
    }
    public printAllInstructions(): void {
        console.log("Printing all instructions");
        for (const node in this.program?.nodes) {
            console.log(`${node}:`);
            for (const i of this.program!.nodes[node].instructions) {
                console.log(this.printInstruction(i));
            }
        }
    }
}
