import { Node, Program } from "./generated/yarn_spinner";
import { ContentSaliencyOption } from "./yarnvm";

const NodeIsHubNodeHeader = "$Yarn.Internal.NodeGroupHub";
const NodeGroupHeader = "$Yarn.Internal.NodeGroup";

/**
 * Gets the value of a header in a given node.
 * @param node The node to get the value in.
 * @param headerName The name of the header to get the value for.
 * @returns The value of the header, or null if not found.
 */
export function getHeaderValue(node: Node, headerName: string): string | null {
    for (const header of node.headers) {
        if (header.key === headerName) {
            return header.value;
        }
    }
    return null;
}

/**
 * Checks to see if node is the 'hub' node for a node group.
 * @param node The node to check.
 * @returns true if the node is a node group hub; false otherwise.
 */
export function isNodeGroupHub(node: Node): boolean {
    return getHeaderValue(node, NodeIsHubNodeHeader) !== null;
}

/**
 * Gets the name of the node group that this node is a member of.
 * @param node The node to get the node group name for.
 * @returns The name of the node group that this node is a member of, or null if
 * this node is not a member of a node group.
 */
export function getNodeGroupName(node: Node): string | null {
    return getHeaderValue(node, NodeGroupHeader);
}
