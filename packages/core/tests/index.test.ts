import {
    ActionJumpToNodeStep,
    ActionSelectStep,
    ActionSetSaliencyStep,
    ActionSetVariableStep,
    ExpectCommandStep,
    ExpectLineStep,
    ExpectOptionStep,
    ExpectStop,
    TestPlan,
} from "./TestPlan";

import { Instruction, Program } from "../src/generated/yarn_spinner";
import { BasicLineProvider, LineProvider } from "../src/lineProvider";
import {
    BestLeastRecentlyViewedSalienceStrategy,
    BestSaliencyStrategy,
    ContentSaliencyOption,
    ContentSaliencyStrategy,
    FirstSaliencyStrategy,
    Line,
    MetadataEntry,
    OptionItem,
    VariableStorage,
    YarnFunction,
    YarnLibrary,
    YarnValue,
    YarnVM,
} from "../src/yarnvm";

import { PartialMessage } from "@protobuf-ts/runtime";
import { parse as parseCSV } from "csv-parse/sync";
import { existsSync, readdirSync, readFileSync } from "fs";
import { resolve } from "node:path";

console.error = (message, ..._params) => {
    throw new Error(
        `Failing due to console.error while running test!\n\n${message}`,
    );
};

const testDataPath = resolve(__filename, "..", "..", "testdata");
const allTestPlans = readdirSync(testDataPath).filter((path) =>
    path.endsWith(".testplan"),
);

describe("can parse all testplans", () => {
    it.each(allTestPlans)("testplan: %p", (testplan: string) => {
        const testPlanPath = resolve(testDataPath, testplan);
        expect(existsSync(testPlanPath)).toBeTruthy();
        expect(() => {
            TestPlan.fromFile(testPlanPath);
        }).not.toThrow();
    });
});

describe("all testplans have associated files", () => {
    it.each(allTestPlans)("testplan: %p", (testplan: string) => {
        const testPlanPath = resolve(testDataPath, testplan);

        const compiledYarnFile = testPlanPath.replace(/.testplan/, ".yarnc");
        expect(existsSync(compiledYarnFile)).toBeTruthy();

        const linesFile = testPlanPath.replace(/.testplan/, "-Lines.csv");
        expect(existsSync(linesFile)).toBeTruthy();

        const metadataFile = testPlanPath.replace(/.testplan/, "-Metadata.csv");
        expect(existsSync(metadataFile)).toBeTruthy();
    });
});

describe("all testplans run as expected", () => {
    test.each(allTestPlans)(
        "testplan: %p",
        async (testplan: string) => {
            const testPlanPath = resolve(testDataPath, testplan);
            const testPlan = TestPlan.fromFile(testPlanPath);

            const compiledYarnFilePath = testPlanPath.replace(
                /.testplan/,
                ".yarnc",
            );
            const linesFilePath = testPlanPath.replace(
                /.testplan/,
                "-Lines.csv",
            );
            const metadataFilePath = testPlanPath.replace(
                /.testplan/,
                "-Metadata.csv",
            );

            const program = Program.fromBinary(
                readFileSync(compiledYarnFilePath),
            );
            expect(program).toBeDefined();

            const records = parseCSV(readFileSync(linesFilePath), {
                columns: true,
                skipEmptyLines: true,
                delimiter: ",",
            }) as Record<string, string>[];

            // oh poor typescript, look how mean I am to you, forgive me
            const stringTable: { [key: string]: string } = {};
            for (const record of records) {
                stringTable[record.id] = record.text;
            }
            expect(Object.keys(stringTable).length).toBeGreaterThanOrEqual(0);
            expect(Object.keys(stringTable).length).toEqual(records.length);

            const metadataRecords = parseCSV(readFileSync(metadataFilePath), {
                columns: true,
                skipEmptyLines: true,
                delimiter: ",",
            }) as Record<string, string>[];

            // oh poor typescript, look how mean I am to you, forgive me
            const metadataTable: { [key: string]: MetadataEntry } = {};
            for (const record of metadataRecords) {
                const newEntry: MetadataEntry = {
                    id: record.id,
                    node: record.node,
                    lineNumber: record.lineNumber,
                    tags: record.tags.split(" "),
                };
                metadataTable[record.id] = newEntry;
            }
            expect(Object.keys(stringTable).length).toBeGreaterThanOrEqual(0);
            expect(Object.keys(stringTable).length).toEqual(records.length);

            const library: YarnLibrary = new Map(
                Object.entries({
                    // The following functions are needed for the
                    // Inference-FunctionsAndVarsInheritType test
                    dummy_number: () => 1,
                    dummy_bool: () => true,
                    dummy_string: () => "string",

                    // assert(x)
                    assert: (value: YarnValue) => {
                        if (typeof value === "boolean" && value) {
                            return true;
                        } else {
                            throw new Error("Assertion error");
                        }
                    },
                } satisfies Record<string, YarnFunction>),
            );

            const vm = new YarnVM();
            vm.loadProgram(program, library);
            vm.verboseLogging = false;

            const lineProvider: LineProvider = new BasicLineProvider(
                "en-US",
                stringTable,
                metadataTable,
            );

            const dontExpectLines =
                (expectation: string) =>
                (line: Line): Promise<never> => {
                    throw Error(
                        `Received line "${line.id}" when we were expecting ${expectation}`,
                    );
                };

            const dontExpectOptions =
                (expectation: string) =>
                (_options: OptionItem[]): Promise<never> => {
                    throw Error(
                        `Received options ${_options.map((o) => o.line.id).join(", ")} when we were expecting ${expectation}`,
                    );
                };
            const dontExpectCommand =
                (expectation: string) =>
                (command: string): Promise<never> => {
                    throw Error(
                        `Received command "${command}" when we were expecting ${expectation}`,
                    );
                };

            const dontExpectStop =
                (expectation: string) => (): Promise<never> => {
                    throw Error(
                        `Received dialogue completion when we were expecting ${expectation}`,
                    );
                };

            let expectedOptions: {
                line: string;
                available: boolean;
                hashtags: string[];
            }[] = [];

            const saliencyStrategies: Record<string, ContentSaliencyStrategy> =
                {
                    first: new FirstSaliencyStrategy(),
                    best: new BestSaliencyStrategy(),
                    best_least_recently_seen:
                        new BestLeastRecentlyViewedSalienceStrategy(
                            vm.variableStorage,
                        ),
                };

            for (const run of testPlan.runs) {
                let currentStepIndex = 0;

                const continueTestPlan = () => {
                    while (currentStepIndex < run.steps.length) {
                        const currentStep = run.steps[currentStepIndex];

                        try {
                            if (currentStep instanceof ExpectStop) {
                                const expectation = "stop";
                                vm.optionCallback =
                                    dontExpectOptions(expectation);
                                vm.commandCallback =
                                    dontExpectCommand(expectation);
                                vm.lineCallback = dontExpectLines(expectation);

                                vm.dialogueCompleteCallback = async () => {};
                            }

                            if (currentStep instanceof ActionJumpToNodeStep) {
                                vm.setNode(currentStep.nodeName);
                            }

                            if (currentStep instanceof ActionSetSaliencyStep) {
                                if (
                                    !(
                                        currentStep.saliencyMode in
                                        saliencyStrategies
                                    )
                                ) {
                                    throw new Error(
                                        "Unknown saliency strategy " +
                                            currentStep.saliencyMode,
                                    );
                                }
                                vm.saliencyStrategy =
                                    saliencyStrategies[
                                        currentStep.saliencyMode
                                    ];
                            }

                            if (currentStep instanceof ExpectLineStep) {
                                const expectation = `line "${currentStep.expectedText}"`;

                                vm.optionCallback =
                                    dontExpectOptions(expectation);
                                vm.commandCallback =
                                    dontExpectCommand(expectation);
                                vm.dialogueCompleteCallback =
                                    dontExpectStop(expectation);
                                vm.lineCallback = async (line) => {
                                    expect(vm.state).toBe(
                                        "waiting-for-continue",
                                    );

                                    const localizedLine =
                                        await lineProvider.getLocalizedLine(
                                            line,
                                        );

                                    expect(localizedLine.text).toEqual(
                                        currentStep.expectedText,
                                    );
                                    if (
                                        currentStep.expectedHashTags.length > 0
                                    ) {
                                        console.warn(
                                            "Not testing hashtags at the moment",
                                        );
                                    }
                                    continueTestPlan();

                                    return Promise.resolve();
                                };
                                return;
                            }

                            if (currentStep instanceof ExpectCommandStep) {
                                const expectation = `command ${currentStep.expectedText}`;
                                vm.optionCallback =
                                    dontExpectOptions(expectation);
                                vm.lineCallback = dontExpectLines(expectation);
                                vm.dialogueCompleteCallback =
                                    dontExpectStop(expectation);

                                vm.commandCallback = (command) => {
                                    expect(vm.state).toBe(
                                        "waiting-for-continue",
                                    );

                                    expect(command).toEqual(
                                        currentStep.expectedText,
                                    );
                                    continueTestPlan();
                                    return Promise.resolve();
                                };
                                return;
                            }

                            if (currentStep instanceof ActionSelectStep) {
                                const expectation = `options ${expectedOptions.map((o) => o.line).join(", ")}`;
                                vm.lineCallback = dontExpectLines(expectation);
                                vm.commandCallback =
                                    dontExpectCommand(expectation);
                                vm.dialogueCompleteCallback =
                                    dontExpectStop(expectation);
                                vm.optionCallback = async (options) => {
                                    expect(vm.state).toBe(
                                        "waiting-on-option-selection",
                                    );

                                    expect(options).toHaveLength(
                                        expectedOptions.length,
                                    );
                                    for (let i = 0; i < options.length; i++) {
                                        const option = options[i];
                                        const expectedOption =
                                            expectedOptions[i];

                                        const localizedOption =
                                            await lineProvider.getLocalizedLine(
                                                option.line,
                                            );

                                        expect(localizedOption.text).toEqual(
                                            expectedOption.line,
                                        );
                                        expect(option.isAvailable).toEqual(
                                            expectedOption.available,
                                        );
                                        if (
                                            expectedOption.hashtags.length > 0
                                        ) {
                                            console.warn(
                                                "hashtag checking not implemented",
                                            );
                                        }
                                    }
                                    expectedOptions = [];
                                    continueTestPlan();

                                    return Promise.resolve(
                                        currentStep.selectedIndex,
                                    );
                                };
                                return;
                            }

                            if (currentStep instanceof ActionSetVariableStep) {
                                vm.variableStorage[currentStep.variableName] =
                                    currentStep.value;
                            }

                            if (currentStep instanceof ExpectOptionStep) {
                                expectedOptions.push({
                                    line: currentStep.expectedText ?? "<error>",
                                    available: currentStep.expectedAvailability,
                                    hashtags: currentStep.expectedHashtags,
                                });
                            }
                        } finally {
                            currentStepIndex += 1;
                        }
                    }

                    // We've reached the end of the testplan. Allow anything
                    // else to run.
                    vm.optionCallback = () => Promise.resolve(0);
                    vm.commandCallback = () => Promise.resolve();
                    vm.lineCallback = () => Promise.resolve();
                    vm.dialogueCompleteCallback = () => Promise.resolve();
                };

                vm.setNode(run.startNode);
                continueTestPlan();
                await vm.start();
            }
        },
        5,
    );
});

it("can evaluate smart variables", () => {
    const path = resolve(testDataPath, "SmartVariables.yarnc");
    const program = Program.fromBinary(readFileSync(path));
    expect(program).toBeDefined();

    let storage: VariableStorage = {};

    const vm = new YarnVM();
    vm.loadProgram(program);
    vm.variableStorage = storage;

    expect(vm.evaluateSmartVariable("$player_can_afford_pie")).toBe(false);
});

it("can select best content", () => {
    const storage: VariableStorage = {};
    const strategy = new BestLeastRecentlyViewedSalienceStrategy(
        storage,
        false,
    );

    const opt1 = new ContentSaliencyOption("1");
    opt1.complexityScore = 2;
    const opt2 = new ContentSaliencyOption("2");
    opt2.complexityScore = 1;
    const opt3 = new ContentSaliencyOption("3");
    opt3.complexityScore = 1;

    const opts = [opt2, opt3, opt1];

    const firstSelected = strategy.queryBestContent(opts);
    expect(firstSelected).toBe(opt1);
    strategy.contentWasSelected(opt1);
    const secondSelected = strategy.queryBestContent(opts);
    expect(secondSelected).toBe(opt2);
    strategy.contentWasSelected(opt2);
    const thirdSelected = strategy.queryBestContent(opts);
    expect(thirdSelected).toBe(opt3);
    strategy.contentWasSelected(opt3);
});

it("can interrupt in the middle of execution", async () => {
    // Arrange:

    // Create a simple 'program' that just runs three lines.
    const makeLine = (id: string): PartialMessage<Instruction> => ({
        instructionType: {
            oneofKind: "runLine",
            runLine: { lineID: id, substitutionCount: 0 },
        },
    });

    const program = Program.create({
        nodes: {
            Start: {
                instructions: ["a", "b", "c"].map((id) => makeLine(id)),
            },
        },
    });

    // We'll stop after we see the line with this ID.
    const stopAfterLineID = "b";

    // Create a VM to use.
    const vm = new YarnVM();
    vm.loadProgram(program);
    vm.setNode("Start");

    // When the VM sees a line, add its ID to the list.
    const linesSeen: string[] = [];

    vm.lineCallback = async (line) => {
        linesSeen.push(line.id);
        if (line.id == stopAfterLineID) {
            vm.interrupt();
        }
    };

    await vm.start();

    expect(linesSeen).toContain("a");
    expect(linesSeen).toContain("b");

    // We interrupted after 'b', so we should not see the third line
    expect(linesSeen).not.toContain("c");
});
