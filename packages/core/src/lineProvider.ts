import {
    createPluralReplacers,
    parseMarkup,
    ReplacementMarkerFunction,
    selectMarker,
    type MarkupParseResult,
} from "./markup";
import type { Line, MetadataEntry } from "./yarnvm";

export type LocalizedLine = MarkupParseResult & {
    id: string;
    metadata: string[];
};

export interface LineProvider {
    getLocalizedLine(line: Line): Promise<LocalizedLine>;
}

export class BasicLineProvider implements LineProvider {
    stringTable: Record<string, string>;
    metadataTable: Record<string, MetadataEntry>;

    markers: Record<string, ReplacementMarkerFunction>;

    constructor(
        localeCode: string,
        stringTable: Record<string, string>,
        metadataTable: Record<string, MetadataEntry>,
    ) {
        const { cardinal, ordinal } = createPluralReplacers(localeCode);
        this.markers = {
            select: selectMarker,
            ordinal,
            plural: cardinal,
        };
        this.stringTable = stringTable;
        this.metadataTable = metadataTable;
    }

    async getLocalizedLine(line: Line): Promise<LocalizedLine> {
        let text: string = this.stringTable[line.id];
        let metadata: MetadataEntry = this.metadataTable[line.id];

        if (!text && metadata) {
            // No text was present, but a metadata entry was found. This is
            // possibly a shadow line.
            const SourceTagPrefix = "shadow:";
            const sourceTag = metadata.tags.find((t) =>
                t.startsWith(SourceTagPrefix),
            );
            if (sourceTag) {
                const sourceLineID =
                    "line:" + sourceTag.substring(SourceTagPrefix.length);
                text = this.stringTable[sourceLineID];
            }
        }

        if (text === undefined) {
            return {
                id: line.id,
                metadata: [],
                text: `Unknown line ${line.id}`,
                attributes: [],
            };
        }

        const parameters = line.substitutions;

        for (let i = 0; i < parameters.length; i += 1) {
            let substitution = parameters[i];
            if (typeof substitution == "boolean") {
                text = text.replace(
                    "{" + i + "}",
                    `${substitution == true ? "True" : "False"}`,
                );
            } else {
                if (typeof substitution == "number") {
                    if (!Number.isInteger(substitution)) {
                        substitution = substitution.toFixed(1); // not sure how I feel about this but it smoothes out some weirdness
                    }
                }
                text = text.replace("{" + i + "}", `${substitution}`);
            }
        }

        const markupParseResult = parseMarkup(text, {
            replacementMarkers: this.markers,
        });

        return {
            id: line.id,
            metadata: metadata?.tags ?? [],
            attributes: markupParseResult.attributes,
            text: markupParseResult.text,
        };
    }
}
