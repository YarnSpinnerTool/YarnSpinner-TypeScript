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

import {
    englishCardinalPluralMarker,
    englishOrdinalPluralMarker,
} from "./test-common";

import { Program } from "../src/generated/yarn_spinner";
import {
    BestLeastRecentlyViewedSalienceStrategy,
    BestSaliencyStrategy,
    ContentSaliencyStrategy,
    FirstSaliencyStrategy,
    MetadataEntry,
    OptionItem,
    YarnFunction,
    YarnLibrary,
    YarnValue,
    YarnVM,
} from "../src/yarnvm";
import { parseMarkup, selectMarker } from "../src/markup";
import { parse as parseCSV } from "csv-parse/sync";
import { existsSync, readFileSync, readdirSync } from "fs";
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

// The following tests are on the skip list. TODO: Make these tests pass!
const skippedTests: string[] = [
    // "LineGroups.testplan", // saliency not supported
    // "NodeGroups.testplan", // saliency not supported
    // "NodeGroupsWithImplicitDeclarations.testplan", // saliency not supported
    // "Once.testplan", // saliency not supported
];

describe("all testplans run as expected", () => {
    // List, and skip, all testplans in the skipped test list
    test.skip.each(allTestPlans.filter((p) => skippedTests.includes(p)))(
        "testplan: %p",
        async (_testplan: string) => {},
    );

    // Test all other testplans
    test.each(allTestPlans.filter((p) => !skippedTests.includes(p)))(
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

            const vm = new YarnVM(program, stringTable, library, metadataTable);
            vm.verboseLogging = false;

            const dontExpectLines =
                (expectation: string) =>
                (line: string): Promise<never> => {
                    throw Error(
                        `Received line "${line}" when we were expecting ${expectation}`,
                    );
                };

            const dontExpectOptions =
                (expectation: string) =>
                (_options: OptionItem[]): Promise<never> => {
                    throw Error(
                        `Received options ${_options.map((o) => o.line).join(", ")} when we were expecting ${expectation}`,
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
                                vm.lineCallback = (line) => {
                                    const parsedText = parseMarkup(line, {
                                        replacementMarkers: {
                                            select: selectMarker,
                                            plural: englishCardinalPluralMarker,
                                            ordinal: englishOrdinalPluralMarker,
                                        },
                                    });

                                    expect(parsedText.text).toEqual(
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
                                vm.optionCallback = (options) => {
                                    expect(options).toHaveLength(
                                        expectedOptions.length,
                                    );
                                    for (let i = 0; i < options.length; i++) {
                                        const option = options[i];
                                        const expectedOption =
                                            expectedOptions[i];

                                        const parsedText = parseMarkup(
                                            option.line,
                                            {
                                                replacementMarkers: {
                                                    select: selectMarker,
                                                    plural: englishCardinalPluralMarker,
                                                    ordinal:
                                                        englishOrdinalPluralMarker,
                                                },
                                            },
                                        );

                                        expect(parsedText.text).toEqual(
                                            expectedOption.line,
                                        );
                                        expect(option.lineCondition).toEqual(
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

                continueTestPlan();
                vm.setNode(run.startNode);
                await vm.start();
            }
        },
        5,
    );
});
