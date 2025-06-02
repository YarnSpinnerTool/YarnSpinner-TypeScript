import { Program } from "../generated/yarn_spinner";
import { YarnVM } from "../yarnvm";

export function hotReload(
    vm: YarnVM,
    replacementProgram: Program,
    replacementProgramCounter: number,
) {
    console.log("Hot reload began");
    if (!vm.program) {
        throw new Error("Can't hot reload: VM is not running");
    }

    if (!vm.currentNodeName) {
        throw new Error("Can't hot reload: VM has no current node");
    }

    if (vm.state !== "waiting-for-continue") {
        throw new Error("Can't hot reload: VM is not waiting for continuation");
    }

    const incomingNode = replacementProgram.nodes[vm.currentNodeName];

    if (!incomingNode) {
        throw new Error(
            `Can't hot reload: no node ${vm.currentNodeName} in incoming program`,
        );
    }

    if (
        replacementProgramCounter < 0 ||
        replacementProgramCounter >= incomingNode.instructions.length
    ) {
        throw new Error(
            `Can't hot reload: invalid new program counter ${replacementProgramCounter} (must be 0 <= x < ${incomingNode.instructions.length})`,
        );
    }

    vm["program"] = replacementProgram;
    vm["currentNode"] = incomingNode;

    // Set the new program counter to the indicated position, minus one - we
    // want to run the new instruction, and after aborting the line, the VM will
    // increment the position. So, we offset that by 1.
    vm["programCounter"] = replacementProgramCounter - 1;

    vm["currentContentAbortController"]?.abort();
}
