import { YarnVM, OptionItem } from "./yarnvm";
import { Program } from "./yarn_spinner";

import "./yarnspinner.scss";
import 'bootstrap';

import { Settings, LineDeliveryMode } from "./settings";

let currentSettings: Settings = {
    lineDelivery: LineDeliveryMode.OneAtATime,
    showVariables: false,
    showUnavailableOptions: false,
};

let settingLinesOneAtATimeButton : HTMLElement
let settingLinesAllAtOnceButton : HTMLElement
let settingShowVariablesButton : HTMLElement
let settingShowUnavailableOptionsButton : HTMLElement
let variableView : HTMLElement
let variableTableBody: HTMLElement

const VM = new YarnVM();
VM.onVariableSet = (name, value) => updateVariableDisplay(VM);

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

type StringTable = {
    [key: string]: string;
};

declare global {

    interface Window {
        loadProgram: (programData: Uint8Array, stringTable: StringTable) => void;
        startDialogue: () => void;
        setup: () => void;
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
};

function loadProgram(programData: Uint8Array, stringTable: StringTable): void {
    
    let program = Program.fromBinary(programData);

    if (program) {
        VM.loadProgram(program, stringTable);
    } else {
        window.alert("Failed to load program!");
    }
}


function updateSettings(newSettings: Settings) {
    currentSettings = { ...currentSettings, ...newSettings };
    updateLineDeliveryUI();
    updateShowVariablesUI();
    updateShowUnavailableOptionsUI();
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

    if (!VM.setNode("Start")) {
        window.alert("Failed to load node \"Start\"");
        return;
    }

    VM.start();
}
