import { Instruction, Node, Operand, Program } from "./generated/yarn_spinner";

enum ExecutionState {
    Stopped,
    WaitingOnOptionSelection,
    WaitingForContinue,
    Running,
}
interface VariableStorage {
    [key: string]: YarnValue;
}
export interface OptionItem {
    label: string;
    line: string;
    jump: number;
    lineCondition: boolean;
    optionID: number;
}

type CallSite = {
    nodeName: string;
    instruction: number;
};

type YarnValue = number | string | boolean;

export type MetadataEntry = {
    id: string;
    node: string;
    lineNumber: string;
    tags: string[];
    [key: string]: unknown;
};

const TrackingVariableNameHeader: string = "$Yarn.Internal.TrackingVariable";

export class YarnVM {
    private currentNode: Node | null = null;
    public program?: Program;

    private stack: (string | boolean | number)[] = [];
    private state: ExecutionState = ExecutionState.Stopped;
    private callStack: CallSite[] = [];
    private programCounter = 0;

    public variableStorage: VariableStorage = {};
    private stringTable: { [key: string]: string } = {};
    private metadataTable: Record<string, MetadataEntry> = {};

    private optionSet: OptionItem[] = [];

    public verboseLogging: boolean = false;

    public lineCallback: ((line: string) => Promise<void>) | null = null;
    public commandCallback: ((command: string) => Promise<void>) | null = null;
    public optionCallback: ((options: OptionItem[]) => Promise<number>) | null =
        null;
    public dialogueCompleteCallback: (() => Promise<void>) | null = null;
    public nodeCompleteCallback: ((nodeName: string) => void) | null = null;

    public onVariableSet:
        | ((variable: string, value: YarnValue) => void)
        | null = null;

    // maps functions to their stub values
    // intended to be used for testing
    private library?: Map<string, string | boolean | number>;

    constructor(
        newProgram?: Program,
        strings?: { [key: string]: string },
        stubLibrary?: Map<string, string | boolean | number>,
        metadataTable?: Record<string, MetadataEntry>,
    ) {
        if (newProgram && strings) {
            this.loadProgram(newProgram, strings, stubLibrary, metadataTable);
        }
    }

    public loadProgram(
        newProgram: Program,
        strings: { [key: string]: string },
        stubsLibrary?: Map<string, string | boolean | number>,
        metadataTable?: Record<string, MetadataEntry> | undefined,
    ) {
        this.program = newProgram;
        this.stringTable = strings;
        this.library = stubsLibrary;
        this.metadataTable = metadataTable ?? {};

        for (const key in this.program.initialValues) {
            const value = this.unwrap(this.program.initialValues[key]);
            // this.log(`initialising ${key} to be ${value}`);
            if (value != undefined) {
                this.variableStorage[key] = value;
            }
        }
    }

    public resetState(): void {
        this.log("resetting state");
        this.stack = [];
        this.programCounter = 0;
        this.optionSet = [];
        this.currentNode = null;
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
    public stop(): void {
        this.log("stopping all execution");
        this.state = ExecutionState.Stopped;
        this.resetState();
    }
    public selectOption(optionIndex: number): void {
        this.log("selecting option number: " + optionIndex);

        if (this.state != ExecutionState.WaitingOnOptionSelection) {
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
        this.state = ExecutionState.WaitingForContinue;
    }
    public async start(): Promise<void> {
        if (this.currentNode == null) {
            this.logError("unable to start dialogue, have no node");
            return;
        }

        this.log("starting the dialogue");
        this.state = ExecutionState.Running;

        if (this.currentNode == null) {
            this.log("unable to start dialogue, node is null");
            return;
        }

        while (this.state == ExecutionState.Running) {
            if (
                this.currentNode == null ||
                this.programCounter >= this.currentNode.instructions.length
            ) {
                this.state = ExecutionState.Stopped;
                if (this.dialogueCompleteCallback) {
                    await this.dialogueCompleteCallback();
                }
                return;
            }

            const currentNode: Node | undefined = this.currentNode;
            await this.runInstruction(
                this.currentNode.instructions[this.programCounter],
            );

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

                const line = this.buildLine(label, parameters);

                // in the c# one we set state to delivered
                // then to waiting
                // for this I think we can skip that and go straight to waiting to continue
                this.state = ExecutionState.WaitingForContinue;

                if (this.lineCallback != null) {
                    await this.lineCallback(line);
                    this.state = ExecutionState.Running;
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
                this.state = ExecutionState.WaitingForContinue;

                if (this.commandCallback != null) {
                    await this.commandCallback(command);
                    this.state = ExecutionState.Running;
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

                const option: OptionItem = {
                    label: label,
                    line: lineCondition
                        ? this.buildLine(label, parameters)
                        : `${this.buildLine(label, parameters)}`, // when an option is disabled it gets given a [disabled] flag at the end of the line, probably should remove this later...
                    jump: jump == undefined ? 0 : jump,
                    lineCondition: lineCondition,
                    optionID: this.optionSet.length,
                };
                this.optionSet.push(option);

                break;
            }
            case "showOptions": {
                if (this.optionSet.length == 0) {
                    this.logError("asked to show options but have none");
                    this.state == ExecutionState.Stopped;
                    break;
                }

                this.log(`presenting ${this.optionSet.length} options`);

                this.state = ExecutionState.WaitingOnOptionSelection;

                if (this.optionCallback != null) {
                    const index = await this.optionCallback(this.optionSet);
                    this.selectOption(index);
                    this.state = ExecutionState.Running;
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
                this.state = ExecutionState.Stopped;
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
            default: {
                this.logError(`Unknown opcode: ${i.instructionType.oneofKind}`);
                this.state = ExecutionState.Stopped;
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

        this.setNode(nodeName, !isDetour);

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
        }
    }

    // haven't really done this in a hugely efficient manner
    // but this was nicer to write in this form than one big switch
    private runFunc(
        funcName: string,
        parameters: (string | boolean | number)[],
    ): string | boolean | number | undefined {
        // number functions
        if (funcName.startsWith("Number.")) {
            funcName = funcName.substring(7);

            const first = parameters.pop();
            if (typeof first != "number") {
                this.logError(
                    "asked to perform a number function but the first param is not a number!",
                );
                return undefined;
            }

            // special casing unary minus now
            // because it doesn't need a second parameter so just gets in the way
            if (funcName == "UnaryMinus") {
                return -1 * first;
            }

            const second = parameters.pop();
            if (typeof second != "number") {
                this.logError(
                    `asked to perform a number function: ${funcName} but the second param is not a number, its a ${typeof second} (${second})`,
                );
                return undefined;
            }

            switch (funcName) {
                // basic maths operators
                case "Add":
                    return first + second;
                case "Minus":
                    return first - second;
                case "Multiply":
                    return first * second;
                case "Divide":
                    return first / second;
                case "Modulo":
                    return first % second;

                // logical operators
                case "EqualTo":
                    return first == second;
                case "GreaterThan":
                    return first > second;
                case "GreaterThanOrEqualTo":
                    return first >= second;
                case "LessThan":
                    return first < second;
                case "LessThanOrEqualTo":
                    return first <= second;
                case "NotEqualTo":
                    return first != second;
            }
        }
        // all the boolean functions
        if (funcName.startsWith("Bool.")) {
            funcName = funcName.substring(5);

            const first = parameters.pop();
            if (typeof first != "boolean") {
                this.logError(
                    "asked to perform a boolean operation but don't have a bool",
                );
                return undefined;
            }

            // dealing with the unary not function straight up because all others require binary operands
            if (funcName == "Not") {
                return !first;
            }

            const second = parameters.pop();
            if (typeof second != "boolean") {
                this.logError("parameter 2 is not a boolean!");
                return undefined;
            }
            // let second = parameters[1];

            switch (funcName) {
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
        if (funcName.startsWith("String.")) {
            funcName = funcName.substring(7);

            const first = parameters.pop();
            const second = parameters.pop();
            if (typeof first != "string" || typeof second != "string") {
                this.logError(
                    "asked to perform a string function but parameters are not strings!",
                );
                return undefined;
            }

            switch (funcName) {
                case "EqualTo":
                    return first == second;
                case "NotEqualTo":
                    return first != second;
                case "Add":
                    return first + second;
            }
        }
        // enum function
        if (funcName.startsWith("Enum.")) {
            funcName = funcName.substring("Enum.".length);

            const first = parameters.pop();
            const second = parameters.pop();

            switch (funcName) {
                case "EqualTo":
                    return first == second;
                case "NotEqualTo":
                    return first != second;
            }
        }

        // conversion functions
        if (funcName == "number") {
            if (parameters[0] != undefined) {
                switch (typeof parameters[0]) {
                    case "string":
                        return parseFloat(parameters[0]);
                    case "boolean":
                        return parameters[0] ? 1 : 0;
                    case "number":
                        return parameters[0];
                }
            }
        }
        if (funcName == "string") {
            if (parameters[0] != undefined) {
                return `${parameters[0]}`;
            }
        }
        if (funcName == "bool") {
            if (parameters[0] != undefined) {
                switch (typeof parameters[0]) {
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
        if (funcName == "visited" || funcName == "visited_count") {
            if (typeof parameters[0] == "string") {
                const name = `$Yarn.Internal.Visiting.${parameters[0]}`;
                let count = this.variableStorage[name];

                this.log(`visiting ${name}: ${count}`);

                if (typeof count != "number") {
                    count = 0;
                }

                if (funcName == "visited_count") {
                    return count;
                } else {
                    return count > 0;
                }
            }
        }

        // maths functions
        switch (funcName) {
            case "random":
                return Math.random();
            case "random_range": {
                if (
                    typeof parameters[0] == "number" &&
                    typeof parameters[1] == "number"
                ) {
                    let min: number;
                    let max: number;

                    if (parameters[0] > parameters[1]) {
                        min = parameters[1];
                        max = parameters[0];
                    } else {
                        min = parameters[0];
                        max = parameters[1];
                    }
                    return this.randomRange(min, max);
                }
                break;
            }
            case "dice":
                if (typeof parameters[0] == "number" && parameters[0] > 1) {
                    return this.randomRange(1, parameters[0]);
                }
                break;
            case "round":
                if (typeof parameters[0] == "number") {
                    return Math.round(parameters[0]);
                }
                break;
            case "round_places":
                if (
                    typeof parameters[0] == "number" &&
                    typeof parameters[1] == "number"
                ) {
                    return +parameters[0].toFixed(parameters[1]);
                }
                break;
            case "floor":
                if (typeof parameters[0] == "number") {
                    return Math.floor(parameters[0]);
                }
                break;
            case "ceil":
                if (typeof parameters[0] == "number") {
                    return Math.ceil(parameters[0]);
                }
                break;
            case "inc": {
                if (typeof parameters[0] == "number") {
                    return Math.round(parameters[0]) + 1;
                }
                break;
            }
            case "dec": {
                if (typeof parameters[0] == "number") {
                    return Math.round(parameters[0]) - 1;
                }
                break;
            }
            case "decimal": {
                if (typeof parameters[0] == "number") {
                    return parameters[0] % 1;
                }
                break;
            }
            case "int": {
                if (typeof parameters[0] == "number") {
                    return Math.trunc(parameters[0]);
                }
                break;
            }
        }

        // HERE IS WHERE YOU WOULD ADD IN ANY CUSTOM FUNCTIONS YOU MIGHT NEED FOR YOUR OWN PROGRAMS

        // finally we check the library of stubs
        if (this.library != undefined) {
            const stub = this.library.get(funcName);
            if (stub != undefined) {
                this.log(`running stub function ${funcName}`);
                return stub;
            }
        }

        // at this point we've either returned the result of the function or had an invalid function
        // either it doesn't exist or the parameters are incorrect
        this.logError(
            `Encountered invalid function: ${funcName} with parameters: (${JSON.stringify(parameters)})`,
        );
        return undefined;
    }

    private randomRange(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private buildLine(
        lineID: string,
        parameters: (string | boolean | number)[],
    ): string {
        let line = this.stringTable[lineID];
        if (line === undefined || line === "") {
            // The line was not present in the string table. It may be in the shadow table.
            const metaEntry = this.metadataTable[lineID];
            if (!metaEntry) {
                // It wasn't found. Return just the line ID.
                return lineID;
            }
            const SourceTagPrefix = "shadow:";
            const sourceTag = metaEntry.tags.find((t) =>
                t.startsWith(SourceTagPrefix),
            );
            if (!sourceTag) {
                // We have a metadata entry for this line, but it doesn't have a source tag.
                return lineID;
            }
            const sourceLineID =
                "line:" + sourceTag.substring(SourceTagPrefix.length);
            line = this.stringTable[sourceLineID];

            if (line === undefined) {
                // We failed to find the source line for this shadowed line.
                return lineID;
            }
        }

        // parameters is built like a stack but will we access it like an array
        // as such its backwards, so we need to reverse it before use
        parameters = parameters.slice().reverse();

        for (let i = 0; i < parameters.length; i += 1) {
            let substitution = parameters[i];
            if (typeof substitution == "boolean") {
                line = line.replace(
                    "{" + i + "}",
                    `${substitution == true ? "True" : "False"}`,
                );
            } else {
                if (typeof substitution == "number") {
                    if (!Number.isInteger(substitution)) {
                        substitution = substitution.toFixed(1); // not sure how I feel about this but it smoothes out some weirdness
                    }
                }
                line = line.replace("{" + i + "}", `${substitution}`);
            }
        }

        return line;
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
    private unwrap(op: Operand): string | number | boolean | undefined {
        switch (op.value.oneofKind) {
            case "boolValue":
                return op.value.boolValue;
            case "floatValue":
                return op.value.floatValue;
            case "stringValue":
                return op.value.stringValue;
        }
        return undefined;
    }
    private unwrapString(op: Operand): string | undefined {
        if (op.value.oneofKind === "stringValue") {
            return op.value.stringValue;
        }
        return undefined;
    }
    private unwrapBool(op: Operand): boolean | undefined {
        if (op.value.oneofKind === "boolValue") {
            return op.value.boolValue;
        }
        return undefined;
    }
    private unwrapNumber(op: Operand): number | undefined {
        if (op.value.oneofKind === "floatValue") {
            return op.value.floatValue;
        }
        return undefined;
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
