import { YarnVM, OptionItem, MetadataEntry } from "./yarnvm";
import { Program } from "./yarn_spinner";

import "./yarnspinner.scss";
import 'bootstrap';

import { Settings, LineDeliveryMode } from "./settings";

let currentSettings: Settings = {
    lineDelivery: LineDeliveryMode.OneAtATime,
    showVariables: false,
    showUnavailableOptions: false,
    startNodeName: "Start",
};

let settingLinesOneAtATimeButton : HTMLElement
let settingLinesAllAtOnceButton : HTMLElement
let settingShowVariablesButton : HTMLElement
let settingShowUnavailableOptionsButton : HTMLElement
let variableView : HTMLElement
let variableTableBody: HTMLElement
let startNodeCurrentLabel: HTMLElement
let startNodeDropdown: HTMLElement

const VM = new YarnVM();
VM.onVariableSet = (name, value) => updateVariableDisplay(VM);

const yarnLoadedEvent = new Event("yarnLoaded");

VM.lineCallback = function (line: string) {
    return new Promise<void>(function (resolve) {
        addDialogueText(line).scrollIntoView();

        if (currentSettings.lineDelivery == LineDeliveryMode.OneAtATime) {
            let nextLineButton = addDialogueElement("div", "list-group-item", "list-group-item-action");
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
}
VM.commandCallback = function (command: string) {
    return new Promise(function (resolve) {
        addDialogueText("<<" + command + ">>", "list-group-item-primary").scrollIntoView();
        resolve();
    });
}

VM.optionCallback = function (options: OptionItem[]) {
    return new Promise<number>((resolve, reject) => {

        // Create a button that resolves this promise with the specified
        // option index on click. (In other words, onOptions will finish
        // running when the button is clicked.)

        // Start by creating a container for the options
        var optionsContainer = addDialogueElement("div", "list-group-item");

        var optionsList = document.createElement("div");
        optionsList.classList.add("list-group");
        optionsContainer.appendChild(optionsList);

        options.forEach((option) => {
            // Create a button in the options container
            let button = document.createElement("a");
            button.classList.add("list-group-item", "list-group-item-action");

            if (option.lineCondition == false) {
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
            let text = option.line;
            button.innerHTML = "<b>&#8594;</b> " + text; // '→'

            // If the option is available, allow the user to select it
            if (option.lineCondition) {
                // When the button is clicked, display the selected option and
                // resolve with its ID.
                button.addEventListener("click", () => {
                    // Add the text of the button that was selected, and get rid
                    // of the buttons.
                    addDialogueText(text, "selected-option", "list-group-item-secondary");
                    optionsContainer.remove();

                    // Resolve with the option ID that was selected. 
                    resolve(option.optionID);
                });
            }
        });

        optionsList.scrollIntoView();
    });
}

function updateLineDeliveryUI(): void {
    
    let mode = currentSettings.lineDelivery;
    
    switch (mode) {
        case LineDeliveryMode.AllAtOnce:
            settingLinesAllAtOnceButton.classList.add("dropdown-item-checked");
            settingLinesOneAtATimeButton.classList.remove("dropdown-item-checked");
            break;
        case LineDeliveryMode.OneAtATime:
            settingLinesOneAtATimeButton.classList.add("dropdown-item-checked");
            settingLinesAllAtOnceButton.classList.remove("dropdown-item-checked");
            break;
    }
}

function updateShowVariablesUI() {
    let showSettings = currentSettings.showVariables;

    switch (showSettings) {
        case true:
            settingShowVariablesButton.classList.add("dropdown-item-checked");
            variableView.classList.remove("d-none");
            break;
        case false:
            settingShowVariablesButton.classList.remove("dropdown-item-checked");
            variableView.classList.add("d-none");
            break;
    }
}

function updateShowUnavailableOptionsUI() {
    let showUnavailableOptions = currentSettings.showUnavailableOptions;
    
    switch (showUnavailableOptions) {
        case true:
            settingShowUnavailableOptionsButton.classList.add("dropdown-item-checked");
            break;
        case false:
            settingShowUnavailableOptionsButton.classList.remove("dropdown-item-checked");
            break;
    }
}

function initialiseStartNodeUI(nodeNames: string[]) {

    // Clear the list of yarn nodes
    while (startNodeDropdown.firstChild) {
        startNodeDropdown.removeChild(startNodeDropdown.firstChild);
    }

    // Add a new entry to the list for each node
    for (let nodeName of nodeNames) {

        let item = document.createElement("li");
        let link = document.createElement("a");
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

    for (let item of startNodeDropdown.children) {

        let htmlItem = item as HTMLElement;
        if (htmlItem.dataset["nodeName"] == currentSettings.startNodeName) {
            htmlItem.querySelector("a")?.classList.add("dropdown-item-checked");
        } else {
            htmlItem.querySelector("a")?.classList.remove("dropdown-item-checked");
        }
    }

    startNodeCurrentLabel.innerText = currentSettings.startNodeName ?? "(start node)";

}

type StringTable = {
    [key: string]: string;
};

type MetadataTable = Record<string, MetadataEntry>;

declare global {

    interface Window {
        loadProgram: (programData: Uint8Array, stringTable: StringTable, metadataTable: MetadataTable) => void;
        startDialogue: () => void;
        setup: () => void;
        addButton: (text: string, classes: string[], handler: () => void) => void;
    }
}

window.loadProgram = loadProgram;
window.startDialogue = startDialogue;

window.setup = () => {
    console.log("window loaded!");
    
    document.getElementById("start")?.addEventListener("click", () => {
        startDialogue();
    });

    settingLinesOneAtATimeButton = document.getElementById("setting-lines-one-at-a-time")!;
    settingLinesAllAtOnceButton = document.getElementById("setting-lines-all-at-once")!;
    settingShowVariablesButton = document.getElementById("setting-show-variables")!;
    settingShowUnavailableOptionsButton = document.getElementById("setting-show-unavailable-options")!;

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
        updateSettings({ showUnavailableOptions: !currentSettings.showUnavailableOptions });
    });

    

    updateSettings(currentSettings);

    window.dispatchEvent(yarnLoadedEvent);
};

window.addButton = (text: string, classes: string[], handler: () => void) => {
    var saveButton = document.getElementById("start");

    // <button class="btn btn-outline-success" id="start" type="submit">Restart</button>
    var newButton = document.createElement("button");
    newButton.classList.add("btn", ...classes);
    newButton.innerText = text;
    newButton.addEventListener("click", handler);

    saveButton?.parentElement?.insertBefore(newButton, saveButton);
};

function loadProgram(programData: Uint8Array, stringTable: StringTable, metadataTable: MetadataTable): void {

    let program = Program.fromBinary(programData);

    if (Object.keys(program.nodes).length == 0) {
        console.error("Loaded program contains no nodes.");
        return;
    }

    if (program) {
        VM.loadProgram(program, stringTable);

        var nodeNames = Object.keys(program.nodes);

        // If 'Start' is present in the list, move it to the front
        if (nodeNames.indexOf("Start") != -1) {
            
            // Remove 'Start' from the list 
            nodeNames = nodeNames.filter(n => n != "Start");

            // Put 'Start' at the beginning of the list
            nodeNames = ["Start"].concat(nodeNames);
        }

        initialiseStartNodeUI(nodeNames);

        let startNodeName: string;

        // If this program contains a node named Start, then set the start node
        // to that. Otherwise, pick the first node in the list.
        if (nodeNames.indexOf("Start") == -1) {
            startNodeName = nodeNames[0];  
        } else {
            startNodeName = "Start";
        }

        updateSettings({startNodeName: startNodeName})
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
    let log = document.getElementById(dialogueContentsID)!;
    while (log.firstChild) {
        log.removeChild(log.firstChild);
    }
}

function addDialogueText(text: string, ...classes : string[]) {
    var logElement = addDialogueElement("div", "list-group-item", ...classes);
    logElement.innerText = text;
    return logElement;
}

function addDialogueElement(elementType : string, ...classes : string[]) : HTMLElement {
    let log = document.getElementById(dialogueContentsID)!;
    var logElement = document.createElement(elementType);
    log.appendChild(logElement);

    for (let logClass of classes) {
        logElement.classList.add(logClass);
    }
    
    return logElement;
}

function updateVariableDisplay(vm : YarnVM) {
    while (variableTableBody.firstChild) {
        variableTableBody.removeChild(variableTableBody.firstChild);
    }

    for (let variableName in vm.variableStorage) {
        let value = vm.variableStorage[variableName];

        // Name, type, value
        let row = variableTableBody.appendChild(document.createElement("tr"));

        row.appendChild(document.createElement("td")).innerText = variableName;

        let typeLabel : string

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
        row.appendChild(document.createElement("td")).innerText = value.toString();
    }
}

export function startDialogue() {

    clearDialogue();

    updateVariableDisplay(VM);

    const startNodeName = currentSettings.startNodeName || "Start";

    if (!VM.setNode(startNodeName)) {
        console.error(`Failed to load node \"${startNodeName}\"`);
        return;
    }

    VM.start();
}
