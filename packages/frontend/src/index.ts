import { LineDeliveryMode, Settings } from "./settings";

import {
    Line,
    OptionItem,
    Program,
    YarnVM,
    StringTable,
    MetadataTable,
    Node,
    BasicLineProvider,
} from "@yarnspinnertool/core";

import "bootstrap";
import "./yarnspinner.scss";

let currentSettings: Settings = {
    lineDelivery: LineDeliveryMode.OneAtATime,
    showVariables: false,
    showUnavailableOptions: false,
    startNodeName: "Start",
};

let settingLinesOneAtATimeButton: HTMLElement;
let settingLinesAllAtOnceButton: HTMLElement;
let settingShowVariablesButton: HTMLElement;
let settingShowUnavailableOptionsButton: HTMLElement;
let variableView: HTMLElement;
let variableTableBody: HTMLElement;
let startNodeCurrentLabel: HTMLElement;
let startNodeDropdown: HTMLElement;

const VM = new YarnVM();
VM.onVariableSet = () => updateVariableDisplay(VM);

const yarnLoadedEvent = new Event("yarnLoaded");

// TODO: support specifying locale in input data, don't hardcode
const lineProvider = new BasicLineProvider("en-US", {}, {});

VM.lineCallback = async function (line: Line) {
    const parsedText = await lineProvider.getLocalizedLine(line);

    await new Promise<void>((resolve) => {
        addDialogueText(parsedText.text).scrollIntoView();

        if (currentSettings.lineDelivery == LineDeliveryMode.OneAtATime) {
            const nextLineButton = addDialogueElement(
                "div",
                "list-group-item",
                "list-group-item-action",
            );
            nextLineButton.innerText = "Continue...";

            nextLineButton.scrollIntoView();

            nextLineButton.addEventListener("click", () => {
                nextLineButton.remove();
                resolve();
            });
        } else {
            resolve();
        }
    });
};
VM.commandCallback = function (command: string) {
    return new Promise(function (resolve) {
        addDialogueText(
            "<<" + command + ">>",
            "list-group-item-primary",
        ).scrollIntoView();
        resolve();
    });
};

VM.optionCallback = function (options: OptionItem[]) {
    return new Promise<number>((resolve) => {
        // Create a button that resolves this promise with the specified
        // option index on click. (In other words, onOptions will finish
        // running when the button is clicked.)

        // Start by creating a container for the options
        const optionsContainer = addDialogueElement("div", "list-group-item");

        const optionsList = document.createElement("div");
        optionsList.classList.add("list-group");
        optionsContainer.appendChild(optionsList);

        options.forEach((option) => {
            lineProvider.getLocalizedLine(option.line).then((optionLine) => {
                // Create a button in the options container
                const button = document.createElement("a");
                button.classList.add(
                    "list-group-item",
                    "list-group-item-action",
                );

                if (option.isAvailable == false) {
                    if (currentSettings.showUnavailableOptions == false) {
                        // Do not show this option at all
                        return;
                    } else {
                        // Show this option like the rest, but mark it
                        // as unavailable
                        button.classList.add("list-group-item-unavailable");
                    }
                }

                optionsList.appendChild(button);

                // Set the text of the button to the button itself
                button.innerHTML = "<b>&#8594;</b> " + optionLine.text; // '→'

                // If the option is available, allow the user to select it
                if (option.isAvailable) {
                    // When the button is clicked, display the selected option and
                    // resolve with its ID.
                    button.addEventListener("click", () => {
                        // Add the text of the button that was selected, and get rid
                        // of the buttons.
                        addDialogueText(
                            optionLine.text,
                            "selected-option",
                            "list-group-item-secondary",
                        );
                        optionsContainer.remove();

                        // Resolve with the option ID that was selected.
                        resolve(option.optionID);
                    });
                }
            });
        });

        optionsList.scrollIntoView();
    });
};

function updateLineDeliveryUI(): void {
    const mode = currentSettings.lineDelivery;

    switch (mode) {
        case LineDeliveryMode.AllAtOnce:
            settingLinesAllAtOnceButton.classList.add("dropdown-item-checked");
            settingLinesOneAtATimeButton.classList.remove(
                "dropdown-item-checked",
            );
            break;
        case LineDeliveryMode.OneAtATime:
            settingLinesOneAtATimeButton.classList.add("dropdown-item-checked");
            settingLinesAllAtOnceButton.classList.remove(
                "dropdown-item-checked",
            );
            break;
    }
}

function updateShowVariablesUI() {
    const showSettings = currentSettings.showVariables;

    switch (showSettings) {
        case true:
            settingShowVariablesButton.classList.add("dropdown-item-checked");
            variableView.classList.remove("d-none");
            break;
        case false:
            settingShowVariablesButton.classList.remove(
                "dropdown-item-checked",
            );
            variableView.classList.add("d-none");
            break;
    }
}

function updateShowUnavailableOptionsUI() {
    const showUnavailableOptions = currentSettings.showUnavailableOptions;

    switch (showUnavailableOptions) {
        case true:
            settingShowUnavailableOptionsButton.classList.add(
                "dropdown-item-checked",
            );
            break;
        case false:
            settingShowUnavailableOptionsButton.classList.remove(
                "dropdown-item-checked",
            );
            break;
    }
}

function initialiseStartNodeUI(nodeNames: string[]) {
    // Clear the list of yarn nodes
    while (startNodeDropdown.firstChild) {
        startNodeDropdown.removeChild(startNodeDropdown.firstChild);
    }

    // Add a new entry to the list for each node
    for (const nodeName of nodeNames) {
        const item = document.createElement("li");
        const link = document.createElement("a");
        item.appendChild(link);
        link.classList.add("dropdown-item");
        link.href = "#";

        link.innerText = nodeName;

        item.dataset["nodeName"] = nodeName;

        link.addEventListener("click", () => {
            updateSettings({ startNodeName: nodeName });
            startDialogue();
        });

        startNodeDropdown.appendChild(item);
    }
}

function updateStartNodeUI() {
    for (const item of startNodeDropdown.children) {
        const htmlItem = item as HTMLElement;
        if (htmlItem.dataset["nodeName"] == currentSettings.startNodeName) {
            htmlItem.querySelector("a")?.classList.add("dropdown-item-checked");
        } else {
            htmlItem
                .querySelector("a")
                ?.classList.remove("dropdown-item-checked");
        }
    }

    startNodeCurrentLabel.innerText =
        currentSettings.startNodeName ?? "(start node)";
}

declare global {
    interface Window {
        loadProgram: (
            data: string,
            stringTable: StringTable,
            metadataTable: MetadataTable,
        ) => void;
        startDialogue: () => void;
        setup: () => void;
        addButton: (
            text: string,
            classes: string[],
            handler: () => void,
        ) => void;
    }
}

window.loadProgram = loadProgram;
window.startDialogue = startDialogue;

window.setup = () => {
    console.log("window loaded!");

    document.getElementById("start")?.addEventListener("click", () => {
        startDialogue();
    });

    settingLinesOneAtATimeButton = document.getElementById(
        "setting-lines-one-at-a-time",
    )!;
    settingLinesAllAtOnceButton = document.getElementById(
        "setting-lines-all-at-once",
    )!;
    settingShowVariablesButton = document.getElementById(
        "setting-show-variables",
    )!;
    settingShowUnavailableOptionsButton = document.getElementById(
        "setting-show-unavailable-options",
    )!;

    startNodeCurrentLabel = document.getElementById("start-node-current")!;
    startNodeDropdown = document.getElementById("start-node-dropdown")!;

    variableTableBody = document.getElementById("variables-body")!;
    variableView = document.getElementById("variable-view")!;

    settingLinesOneAtATimeButton.addEventListener("click", () => {
        updateSettings({ lineDelivery: LineDeliveryMode.OneAtATime });
    });

    settingLinesAllAtOnceButton.addEventListener("click", () => {
        updateSettings({ lineDelivery: LineDeliveryMode.AllAtOnce });
    });

    settingShowVariablesButton.addEventListener("click", () => {
        updateSettings({ showVariables: !currentSettings.showVariables });
    });

    settingShowUnavailableOptionsButton.addEventListener("click", () => {
        updateSettings({
            showUnavailableOptions: !currentSettings.showUnavailableOptions,
        });
    });

    updateSettings(currentSettings);

    window.dispatchEvent(yarnLoadedEvent);
};

window.addButton = (text: string, classes: string[], handler: () => void) => {
    const saveButton = document.getElementById("start");

    // <button class="btn btn-outline-success" id="start" type="submit">Restart</button>
    const newButton = document.createElement("button");
    newButton.classList.add("btn", ...classes);
    newButton.innerText = text;
    newButton.addEventListener("click", handler);

    saveButton?.parentElement?.insertBefore(newButton, saveButton);
};

function base64ToBytes(base64: string) {
    const binString = atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0) as number);
}

function loadProgram(
    programData: string,
    stringTable: StringTable,
    metadataTable: MetadataTable,
): void {
    const program = Program.fromBinary(base64ToBytes(programData));

    if (Object.keys(program.nodes).length == 0) {
        console.error("Loaded program contains no nodes.");
        return;
    }

    lineProvider.stringTable = stringTable;
    lineProvider.metadataTable = metadataTable;

    if (program) {
        VM.loadProgram(program, undefined);

        let allStartNodes = Object.values(program.nodes).filter((node) => {
            return (
                node.name.startsWith("$Yarn.Internal") == false &&
                node.headers.find(
                    (h) => h.key === "$Yarn.Internal.NodeGroup",
                ) === undefined
            );
        });

        let startNode: Node | undefined =
            allStartNodes.find((n) => n.name === "Start") ??
            Object.values(allStartNodes)[0];

        // If we found a start node, move it to the top of the list
        if (startNode && allStartNodes.indexOf(startNode) != -1) {
            allStartNodes = allStartNodes.filter((n) => n !== startNode);
            allStartNodes = [startNode, ...allStartNodes];
        }

        initialiseStartNodeUI(allStartNodes.map((n) => n.name));

        updateSettings({ startNodeName: startNode.name });
    } else {
        console.error("Failed to load program!");
    }
}

function updateSettings(newSettings: Settings) {
    currentSettings = { ...currentSettings, ...newSettings };
    updateLineDeliveryUI();
    updateShowVariablesUI();
    updateShowUnavailableOptionsUI();
    updateStartNodeUI();
}

const dialogueContentsID = "dialogue-contents";

function clearDialogue() {
    const log = document.getElementById(dialogueContentsID)!;
    while (log.firstChild) {
        log.removeChild(log.firstChild);
    }
}

function addDialogueText(text: string, ...classes: string[]) {
    const logElement = addDialogueElement("div", "list-group-item", ...classes);
    logElement.innerText = text;
    return logElement;
}

function addDialogueElement(
    elementType: string,
    ...classes: string[]
): HTMLElement {
    const log = document.getElementById(dialogueContentsID)!;
    const logElement = document.createElement(elementType);
    log.appendChild(logElement);

    for (const logClass of classes) {
        logElement.classList.add(logClass);
    }

    return logElement;
}

function updateVariableDisplay(vm: YarnVM) {
    while (variableTableBody.firstChild) {
        variableTableBody.removeChild(variableTableBody.firstChild);
    }

    for (const variableName in vm.variableStorage) {
        const value = vm.variableStorage[variableName];

        // Name, type, value
        const row = variableTableBody.appendChild(document.createElement("tr"));

        row.appendChild(document.createElement("td")).innerText = variableName;

        let typeLabel: string;

        if (typeof value === "string") {
            typeLabel = "string";
        } else if (typeof value === "number") {
            typeLabel = "number";
        } else if (typeof value === "boolean") {
            typeLabel = "boolean";
        } else {
            typeLabel = "<unknown!>";
        }

        row.appendChild(document.createElement("td")).innerText = typeLabel; // TODO: add value
        row.appendChild(document.createElement("td")).innerText =
            value.toString();
    }
}

export function startDialogue() {
    clearDialogue();

    updateVariableDisplay(VM);

    const startNodeName = currentSettings.startNodeName || "Start";

    if (!VM.setNode(startNodeName)) {
        console.error(`Failed to load node "${startNodeName}"`);
        return;
    }

    void VM.start();
}
