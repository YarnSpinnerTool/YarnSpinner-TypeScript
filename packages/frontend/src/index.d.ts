import { MetadataEntry } from '@yarnspinner/core';
import "./yarnspinner.scss";
import 'bootstrap';
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
export declare function startDialogue(): void;
export {};
