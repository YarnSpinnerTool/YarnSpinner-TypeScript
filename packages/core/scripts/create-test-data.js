//@ts-check

// This script generates test data files used by the library's unit tests.
//
// It identifies all `.yarn` files in a specified directory, correlating each
// with its corresponding `.testplan` file. For each identified pair, it
// attempts to compile the Yarn Spinner script into an output location using the
// `ysc compile` command. If the compilation is successful, the associated
// `.testplan` file is copied to this output location. The script logs progress
// for each processed case and concludes with a summary upon completion.

const { resolve, basename } = require('node:path');
const { readdirSync, existsSync, copyFileSync } = require('node:fs');
const { copyFile } = require('node:fs/promises');

const { workspaceRootSync } = require('workspace-root');

const util = require('util');
const { exit } = require('node:process');
const exec = util.promisify(require('child_process').exec)

const workspaceRoot = workspaceRootSync()

if (!workspaceRoot) {
    console.error("Failed to find workspace root!");
    exit(1);
}

// TODO: Allow specifying this path as parameter
const yarnSpinnerTestScriptsLocation = resolve(workspaceRoot, '..', 'YarnSpinner', 'Tests', 'TestCases')
const outputLocation = resolve(__filename, '..', '..', 'testdata')

console.log(yarnSpinnerTestScriptsLocation);


const files = readdirSync(yarnSpinnerTestScriptsLocation).filter(path => path.endsWith(".yarn")).map(path => resolve(yarnSpinnerTestScriptsLocation, path))

console.log(yarnSpinnerTestScriptsLocation);
console.log(outputLocation);

/** @type{[string,string][]} */
const testCases = files.map(file => [file, file.replace(/\.yarn/, '.testplan')])

/** @type{Promise<void>[]} */
const operations = []

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
        throw new Error(`Path ${testCase[0]} does not exist`)
    }

    const compileCommand = `ysc compile -p -o '${outputLocation}' '${sourceFile}'`

    try {
        const result = await exec(compileCommand)

    } catch (err) {
        // This case fails to compile on the console. It may depend on some
        // context that only exists in the Yarn Spinner unit tests. Skip it for
        // now.
        console.info("❓ " + sourceFile);
        return;
    }

    // Copy the testplan file into place
    const copyFrom = testCase;
    const copyTo = resolve(outputLocation, basename(testCase))

    await copyFile(copyFrom, copyTo)

    console.info("✅ " + sourceFile);

}

for (const [sourceFile, testCase] of testCases) {
    operations.push(processCase(sourceFile, testCase))
}

Promise.all(operations).then(() => console.log("Done!"));

