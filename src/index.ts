import { data, stringTable } from "./data";
import { YarnVM, OptionItem } from "./yarnvm";
import { Program } from "./yarn_spinner";

import "./yarnspinner.scss";
import 'bootstrap';

enum LineDeliveryMode {
    OneAtATime,
    AllAtOnce
}

let settings = {
    lineDelivery: LineDeliveryMode.OneAtATime
};

let settingLinesOneAtATimeButton : HTMLElement
let settingLinesAllAtOnceButton : HTMLElement
let variableTableBody : HTMLElement

function setLineDeliveryMode(mode: LineDeliveryMode) : void {
    settings.lineDelivery = mode;

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

window.addEventListener('load', async function () {
    console.log("window loaded!");

    this.document.getElementById("start")?.addEventListener("click", () => {
        clearDialogue();
        load(stringTable, data);
    });

    settingLinesOneAtATimeButton = this.document.getElementById("setting-lines-one-at-a-time")!;
    settingLinesAllAtOnceButton = this.document.getElementById("setting-lines-all-at-once")!;
    variableTableBody = this.document.getElementById("variables-body")!;

    settingLinesOneAtATimeButton?.addEventListener("click", () => {
        setLineDeliveryMode(LineDeliveryMode.OneAtATime);
    });
    
    settingLinesAllAtOnceButton?.addEventListener("click", () => {
        setLineDeliveryMode(LineDeliveryMode.AllAtOnce);
    });

    setLineDeliveryMode(LineDeliveryMode.OneAtATime);
    
    // Immediately start the dialogue when the page loads
    load(stringTable, data);
});

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

export function load(stringTable: {[key: string]: string}, data: Uint8Array)
{
    let program = Program.fromBinary(data);

    if (program == undefined)
    {
        console.log("well poop");
    }
    else
    {
        var VM = new YarnVM(program, stringTable);

        VM.onVariableSet = (name, value) => updateVariableDisplay(VM);
        updateVariableDisplay(VM);

        if (VM.setNode("Start"))
        {
            VM.lineCallback = function (line: string)
            {
                return new Promise<void>(function (resolve)
                {
                    addDialogueText(line).scrollIntoView();

                    if (settings.lineDelivery == LineDeliveryMode.OneAtATime) {
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
            VM.commandCallback = function (command: string)
            {
                return new Promise(function (resolve) {
                    addDialogueText("<<" + command + ">>", "list-group-item-primary").scrollIntoView();
                    resolve();
                });
            }
            VM.optionCallback = function (options: OptionItem[])
            {
                /*
                return new Promise<number>(function (resolve)
                {
                    var optionContainer = document.createElement("div");
                    options.forEach((option, index) =>
                    {
                        var p = document.createElement("p");
                        p.innerHTML = `<b>-></b> ${option.line}`;
                        optionContainer.appendChild(p);

                        var button = document.createElement("button");
                        button.innerHTML = "Select";
                        button.classList.add("optionButton");
                        
                        optionContainer.appendChild(button);

                        button.addEventListener("click", () =>
                        {
                            let buttons = document.querySelectorAll('.optionButton');
                            buttons.forEach(b =>
                            {
                                b.remove();
                            });
                            resolve(index);
                        });
                    });
                    document.getElementById("container")?.appendChild(optionContainer);
                });
                */
            
                return new Promise<number>((resolve, reject) => {
            
                    // Create a button that resolves this promise with the specified
                    // option index on click. (In other words, onOptions will finish
                    // running when the button is clicked.)
        
                    // Start by creating a container for the options
                    var optionsContainer = addDialogueElement("div", "list-group-item");
        
                    var optionsList = document.createElement("div");
                    optionsList.classList.add("list-group");
                    optionsContainer.appendChild(optionsList);
        
                    options.forEach((option, index) => {
                        // Create a button in the options container
                        let button = document.createElement("a");
                        button.classList.add("list-group-item", "list-group-item-action");
        
                        if (option.lineCondition == false) {
                            button.classList.add("list-group-item-unavailable");
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
                                resolve(index);
                            });
                        }
                    });
        
                    optionsList.scrollIntoView();
                });
            }

            VM.start();
        }
        else
        {
            console.error("shit");
        }
    }
}
