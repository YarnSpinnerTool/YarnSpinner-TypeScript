import { parse as parseCSV } from "csv-parse/sync";
import { existsSync, readFileSync, readdirSync } from "fs";
import { resolve } from "node:path";

import { Program } from "../src/generated/yarn_spinner";
import { MetadataEntry, OptionItem, YarnVM } from "../src/yarnvm";
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
import { selectMarker } from "../src/markup";
import { parseMarkup } from "../src/markup";

console.error = (message, ...params) => {
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
const skippedTests = [
    "LineGroups.testplan", // saliency not supported
    "NodeGroups.testplan", // saliency not supported
    "NodeGroupsWithImplicitDeclarations.testplan", // saliency not supported
    "Once.testplan", // saliency not supported
];

describe("all testplans run as expected", () => {
    // List, and skip, all testplans in the skipped test list
    test.skip.each(allTestPlans.filter((p) => skippedTests.includes(p)))(
        "testplan: %p",
        async (testplan: string) => {},
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

            let program = Program.fromBinary(
                readFileSync(compiledYarnFilePath),
            );
            expect(program).toBeDefined();

            let records = parseCSV(readFileSync(linesFilePath), {
                columns: true,
                skipEmptyLines: true,
                delimiter: ",",
            });

            // oh poor typescript, look how mean I am to you, forgive me
            let stringTable: { [key: string]: string } = {};
            for (let record of records) {
                stringTable[record.id] = record.text;
            }
            expect(Object.keys(stringTable).length).toBeGreaterThanOrEqual(0);
            expect(Object.keys(stringTable).length).toEqual(records.length);

            let metadataRecords = parseCSV(readFileSync(metadataFilePath), {
                columns: true,
                skipEmptyLines: true,
                delimiter: ",",
            }) as Record<string, string>[];

            // oh poor typescript, look how mean I am to you, forgive me
            let metadataTable: { [key: string]: MetadataEntry } = {};
            for (let record of metadataRecords) {
                let newEntry: MetadataEntry = {
                    id: record.id,
                    node: record.node,
                    lineNumber: record.lineNumber,
                    tags: record.tags.split(" "),
                };
                metadataTable[record.id] = newEntry;
            }
            expect(Object.keys(stringTable).length).toBeGreaterThanOrEqual(0);
            expect(Object.keys(stringTable).length).toEqual(records.length);

            // The following functions are needed for the
            // Inference-FunctionsAndVarsInheritType test
            var library: Map<string, string | boolean | number> = new Map();
            library.set("dummy_number", 1);
            library.set("dummy_bool", true);
            library.set("dummy_string", "string");

            var vm = new YarnVM(program, stringTable, library, metadataTable);
            vm.verboseLogging = false;

            const dontExpectLines = async (line: string): Promise<never> => {
                throw Error(
                    `Received line "${line}" when we weren't expecting it`,
                );
            };
            const dontExpectOptions = async (
                options: OptionItem[],
            ): Promise<never> => {
                throw Error("Received options when we weren't expecting any");
            };
            const dontExpectCommand = async (
                command: string,
            ): Promise<never> => {
                throw Error(
                    `Received command "${command}" when we weren't expecting it`,
                );
            };
            const dontExpectStop = async (): Promise<never> => {
                throw Error(
                    "Received dialogue completion when we weren't expecting it",
                );
            };

            let expectedOptions: {
                line: string;
                available: boolean;
                hashtags: string[];
            }[] = [];

            for (const run of testPlan.runs) {
                let currentStepIndex = 0;

                const continueTestPlan = () => {
                    while (currentStepIndex < run.steps.length) {
                        const currentStep = run.steps[currentStepIndex];

                        try {
                            if (currentStep instanceof ExpectStop) {
                                vm.optionCallback = dontExpectOptions;
                                vm.commandCallback = dontExpectCommand;
                                vm.dialogueCompleteCallback = async () => {};
                                vm.lineCallback = dontExpectLines;
                            }
                            if (currentStep instanceof ActionJumpToNodeStep) {
                                vm.setNode(currentStep.nodeName);
                            }
                            if (currentStep instanceof ActionSetSaliencyStep) {
                                throw new Error("not implemented");
                            }
                            if (currentStep instanceof ExpectLineStep) {
                                vm.optionCallback = dontExpectOptions;
                                vm.commandCallback = dontExpectCommand;
                                vm.dialogueCompleteCallback = dontExpectStop;
                                vm.lineCallback = async (line) => {
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
                                };
                                return;
                            }
                            if (currentStep instanceof ExpectCommandStep) {
                                vm.optionCallback = dontExpectOptions;
                                vm.lineCallback = dontExpectCommand;
                                vm.dialogueCompleteCallback = dontExpectStop;
                                vm.commandCallback = async (command) => {
                                    expect(command).toEqual(
                                        currentStep.expectedText,
                                    );
                                    continueTestPlan();
                                };
                                return;
                            }
                            if (currentStep instanceof ActionSelectStep) {
                                vm.lineCallback = dontExpectLines;
                                vm.commandCallback = dontExpectCommand;
                                vm.dialogueCompleteCallback = dontExpectStop;
                                vm.optionCallback = async (options) => {
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

                                    // test plans select one greater than the
                                    // options
                                    return currentStep.selectedIndex;
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

                    // We've reached the end of the testplan. Expect a stop and
                    // no other content.
                    vm.optionCallback = dontExpectOptions;
                    vm.commandCallback = dontExpectCommand;
                    vm.lineCallback = dontExpectLines;
                    vm.dialogueCompleteCallback = async () => {};
                };

                continueTestPlan();
                vm.setNode(run.startNode);
                await vm.start();
            }
        },
        5,
    );
});
