//@ts-check

// This script generates test data files used by the library's unit tests.
//
// It identifies all `.yarn` files in a specified directory, correlating each
// with its corresponding `.testplan` file. For each identified pair, it
// attempts to compile the Yarn Spinner script into an output location using the
// `ysc compile` command. If the compilation is successful, the associated
// `.testplan` file is copied to this output location. The script logs progress
// for each processed case and concludes with a summary upon completion.

const { resolve, basename, join } = require("node:path");
const {
    readdirSync,
    existsSync,
    copyFileSync,
    writeFileSync,
    unlinkSync,
} = require("node:fs");
const { copyFile } = require("node:fs/promises");
const { v4: uuidv4 } = require("uuid");

const { workspaceRootSync } = require("workspace-root");

const util = require("util");
const { exit } = require("node:process");
const exec = util.promisify(require("child_process").exec);

const workspaceRoot = workspaceRootSync();

if (!workspaceRoot) {
    console.error("Failed to find workspace root!");
    exit(1);
}

// TODO: Allow specifying this path as parameter
const yarnSpinnerTestScriptsLocation = resolve(
    workspaceRoot,
    "..",
    "YarnSpinner",
    "Tests",
    "TestCases",
);
const outputLocation = resolve(__filename, "..", "..", "testdata");

console.log(yarnSpinnerTestScriptsLocation);

const files = readdirSync(yarnSpinnerTestScriptsLocation)
    .filter((path) => path.endsWith(".yarn"))
    .map((path) => resolve(yarnSpinnerTestScriptsLocation, path));

console.log(yarnSpinnerTestScriptsLocation);
console.log(outputLocation);

/** @type{[string,string][]} */
const testCases = files.map((file) => [
    file,
    file.replace(/\.yarn/, ".testplan"),
]);

/** @type{Promise<void>[]} */
const operations = [];

// Create a template .yarnproject that we'll create copies of for each test
const yarnProjectTemplate = {
    baseLanguage: "en",
    /** @type string[] */
    sourceFiles: [],
    localisation: {},
    projectFileVersion: 3,
    compilerOptions: {},
    definitions: join(__dirname, "Tests.ysls.json"),
};

/** Given a source file and a testplan file, attempts to compile the script. If
 * it succeeds, the output and the testplan file are copied into the output
 * directory.
 * @param {string} sourceFile The source .yarn file.
 * @param {string} testCase The .testplan file for the Yarn file.
 * @returns {Promise<void>}
 */
async function processCase(sourceFile, testCase) {
    if (existsSync(testCase) == false) {
        // This file has no testplan, so we won't include it.
        return;
    }

    if (existsSync(sourceFile) == false) {
        throw new Error(`Path ${testCase[0]} does not exist`);
    }

    // Generate a unique .yarnproject filename using a UUID
    const uniqueFilename = `${uuidv4()}.yarnproject`;

    // Make this file be in the current directory
    const tempProjectFile = join(__dirname, uniqueFilename);

    const project = structuredClone(yarnProjectTemplate);
    project.sourceFiles = [sourceFile];
    writeFileSync(tempProjectFile, JSON.stringify(project));

    const compileCommand = `ysc compile -p -o '${outputLocation}' -n '${basename(sourceFile).replace(".yarn", "")}' '${tempProjectFile}'`;
    const dumpCodeCommand = `ysc dump-code -p '${tempProjectFile}'`;

    try {
        const result = await exec(compileCommand);

        const dumpedCode = await exec(dumpCodeCommand);

        const dumpedCodeDestination = resolve(
            outputLocation,
            basename(testCase).replace(".testplan", ".code.txt"),
        );
        writeFileSync(dumpedCodeDestination, dumpedCode.stdout);
    } catch (err) {
        // This case fails to compile on the console. It may depend on some
        // context that only exists in the Yarn Spinner unit tests. Skip it for
        // now.
        console.error(err);
        console.info("❓ " + sourceFile);
        return;
    } finally {
        // Clean up the yarn project file we wrote
        unlinkSync(tempProjectFile);
    }

    // Copy the testplan file into place
    const copyFrom = testCase;
    const copyTo = resolve(outputLocation, basename(testCase));

    await copyFile(copyFrom, copyTo);

    await copyFile(sourceFile, resolve(outputLocation, basename(sourceFile)));

    console.info("✅ " + sourceFile);
}

for (const [sourceFile, testCase] of testCases) {
    operations.push(processCase(sourceFile, testCase));
}

Promise.all(operations).then(() => console.log("Done!"));
