import { data, stringTable } from "./data";
import { YarnVM, OptionItem } from "./yarnvm";
import { Program } from "./yarn_spinner";

import "./yarnspinner.scss";
import 'bootstrap';

window.addEventListener('load', async function () {
    console.log("window loaded!");

    this.document.getElementById("testbutton")?.addEventListener("click", () => {
        let container = this.document.getElementById("container")
        if (container != null)
        {
            container.innerHTML = "";
        }
        load(stringTable, data);
    });
});

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
        if (VM.setNode("Start"))
        {
            VM.lineCallback = function (line: string)
            {
                return new Promise<void>(function (resolve)
                {
                    var lineElement = document.createElement("div");
                    lineElement.innerHTML = `<p>${line}</p>`;
                    document.getElementById("container")?.appendChild(lineElement);
                    resolve();
                });
            }
            VM.commandCallback = function (command: string)
            {
                return new Promise(function (resolve) {
                    var commandElement = document.createElement("div");
                    commandElement.innerHTML = `<p><i>${command}</i></p>`;
                    document.getElementById("container")?.appendChild(commandElement);
                    resolve();
                });
            }
            VM.optionCallback = function (options: OptionItem[])
            {
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
            }

            VM.start();
        }
        else
        {
            console.error("shit");
        }
    }
}
