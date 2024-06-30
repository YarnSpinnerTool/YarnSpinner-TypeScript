/** Represents a value that can be stored in a {@linkcode MarkupAttribute} property. */
export type MarkupValue = string | number | boolean;

/**
 * Represents a markup attribute.
 */
export interface MarkupAttribute {
    /**
     * Gets the position in the plain text where this attribute begins.
     */
    position: number;

    /**
     * Gets the number of text elements in the plain text that this attribute
     * covers.
     */
    length: number;

    /**
     * Gets the name of the attribute.
     */
    name: string;

    /**
     * Gets the properties associated with this attribute. (MarkupValue is a
     * string, a bool, or a float.)
     */
    properties: Record<string, MarkupValue>;

    /**
     * Gets the position in the original source text where this attribute
     * begins.
     */
    sourcePosition: number;
}

/** The result of parsing a line of marked-up text. */
export interface MarkupParseResult {
    text: string;

    attributes: MarkupAttribute[];
}

const replaceValueMarker = (text: string, value: MarkupValue): string => {
    const escapedStringMarker = "___YS_MARKER___";

    text = text.replace(/%%/g, escapedStringMarker);
    text = text.replace(/%/g, value.toString());
    text = text.replace(new RegExp(escapedStringMarker, "g"), "%");
    return text;
};

/** Creates cardinal and ordinal pluralisation markers, given a locale.
 *
 * The 'cardinal' marker is usually referred to as simply `plural`.
 */
export const createPluralReplacers = (
    locale: string,
): {
    cardinal: ReplacementMarkerFunction;
    ordinal: ReplacementMarkerFunction;
} => {
    const createReplacer = (type: Intl.PluralRuleType) => {
        const PluralRules = new Intl.PluralRules(locale, { type: type });
        return (m: { properties: Record<string, MarkupValue> }): string => {
            const value = m.properties["value"];
            if (typeof value !== "number") {
                throw new Error("Value must be a number");
            }
            const pluralCase = PluralRules.select(value);

            let resultingText =
                m.properties[pluralCase].toString() ??
                `(error: no plural case for ${pluralCase})`;

            resultingText = replaceValueMarker(resultingText, value);

            return resultingText;
        };
    };

    return {
        cardinal: createReplacer("cardinal"),
        ordinal: createReplacer("ordinal"),
    };
};

/** Parses a 'select' marker, and returns its replacement text.
 *
 * The `select` marker takes the value of the `value` property, and uses that to
 * choose a replacement.
 */
export const selectMarker: ReplacementMarkerFunction = (m: {
    properties: Record<string, MarkupValue>;
}) => {
    const value = m.properties["value"];
    if (typeof value !== "string") {
        throw new Error("Value must be a string");
    }
    const resultingText = m.properties[value].toString();
    return replaceValueMarker(resultingText, value);
};

/** An error thrown while parsing markup. */
export class MarkupParseError extends Error {
    position: number;
    constructor(message: string, position: number) {
        super(message);
        this.message = message;
        this.position = position;
    }
}

/** A function that takes a collection of properties, and uses it to return new
 * text to use in place of that marker. */
export type ReplacementMarkerFunction = (marker: {
    properties: Record<string, MarkupValue>;
}) => string;

/** Parses text containing markup into a {@linkcode MarkupParseResult}.
 * @param text The text to parse.
 * @param options Options to use while parsing.
 */
export function parseMarkup(
    text: string,
    options?: {
        replacementMarkers?: Record<string, ReplacementMarkerFunction>;
    },
): MarkupParseResult {
    /** Parse functions read the input string, and return the result extracted
     * from the start of the string as well as the remainder of the input
     * string. */
    type ParseFunction<T> = (input: string) => {
        result: T;
        remainder: string;
    };

    /** The type of a marker. */
    type MarkerType = "open" | "close" | "self-closing" | "close-all";

    type Marker = (
        | {
              // The close-all marker has no name or properties
              type: "close-all";
          }
        | {
              // All other types of markers have a name and properties
              name: string;
              properties: Record<string, MarkupValue>;
              type: MarkerType;
          }
    ) & {
        // All markers have a position
        sourcePosition: number;
        position?: number;
    };

    type Property = [string, MarkupValue];

    /** The position in the {@linkcode input} that we have reached so far. */
    let position = 0;

    /** Checks to see if {@linkcode input} begins with {@linkcode expected}. If
     * it does, that string is consumed from input, and the remainder is
     * returned. If it doesn't, an exception is thrown. */
    const expect = (input: string, expected: string): string => {
        if (input.startsWith(expected)) {
            input = input.substring(expected.length);
            position += expected.length;
            return input;
        } else {
            throw new MarkupParseError(`Expected ${expected}`, position);
        }
    };

    /** Checks to see if the input string starts with {@linkcode peek}. */
    const lookAhead = (input: string, peek: string): boolean => {
        return input.startsWith(peek);
    };

    /** Parses a length of text, up to but not including a marker or the end of
     * the string. */
    const parseText: ParseFunction<string> = (input) => {
        let result = "";
        let idx = 0;

        const advance = (i: number) => {
            idx += i;
            position += i;
        };

        let noMarkupMode = false;

        while (idx < input.length) {
            const c = input[idx];
            if (c == "\\") {
                // This may be an escaped character, but only if the next
                // character is [ or ].
                if (input[idx + 1] == "[" || input[idx + 1] == "]") {
                    // It's an escaped bracket.

                    advance(1); // Skip over the backslash

                    result += input[idx]; // Add the escaped character
                    advance(1);
                } else {
                    // It's not a valid escape. Emit it as-is.
                    result += c;
                    advance(1);
                }
            } else if (c == "[") {
                // Peek ahead - is this nomarkup?
                if (input.substring(idx).startsWith("[nomarkup]")) {
                    noMarkupMode = true;
                    // Skip over the tag
                    advance("[nomarkup]".length);
                    continue;
                } else if (
                    noMarkupMode &&
                    input.substring(idx).startsWith("[/nomarkup]")
                ) {
                    noMarkupMode = false;
                    // Skip over the tag
                    advance("[/nomarkup]".length);
                } else if (!noMarkupMode) {
                    // This is the start of a marker. Stop parsing text, and
                    // return what we've got.
                    return {
                        result,
                        remainder: input.substring(idx),
                    };
                } else if (noMarkupMode) {
                    // We've hit a [, but we're not parsing markup. Add it
                    // directly to the output text and continue.
                    result += c;
                    advance(1);
                }
            } else {
                result += c;
                advance(1);
            }
        }

        // We reached the end of the text. Return what we've parsed, and no
        // remainder.
        return { result, remainder: "" };
    };

    /** Parses an identifier. */
    const parseID: ParseFunction<string> = (input) => {
        const match = input.match(/^\s*[a-zA-Z][a-zA-Z0-9_]*\s*/);
        if (match === null) {
            throw new MarkupParseError("Failed to parse an identifier", 0);
        }
        position += match[0].length;
        return {
            result: match[0].trim(),
            remainder: input.substring(match[0].length),
        };
    };

    /** Parses a value: either a boolean, a number, or a string (either a quoted
     * phrase or an unquoted single word.) */
    const parseValue: ParseFunction<number | string | boolean> = (input) => {
        let match: RegExpMatchArray | null;

        // Match booleans
        if ((match = input.toLowerCase().match(/^\s*(true|false)\s*/))) {
            position += match[0].length;

            switch (match[0].trim()) {
                case "true":
                    return {
                        result: true,
                        remainder: input.substring(match[0].length),
                    };
                case "false":
                    return {
                        result: true,
                        remainder: input.substring(match[0].length),
                    };
                default:
                    throw new MarkupParseError(
                        "Internal error when parsing a bool",
                        0,
                    );
            }
        }

        // Match numbers
        if ((match = input.match(/^\s*[0-9]+(\.[0-9]+)?\s*/))) {
            position += match[0].length;

            const num = parseFloat(match[0].trim());

            return {
                result: num,
                remainder: input.substring(match[0].length),
            };
        }

        // Match quoted strings
        if ((match = input.match(/^\s*"(?:[^"\\]|\\.)*"\s*/))) {
            position += match[0].length;

            const quotedString = match[0].trim();

            // Strip the quotes from the start and end
            let str = match[0].substring(1, quotedString.length - 1);

            // Replace escaped characters
            str = str.replace(/\\(.)/g, (_, group1) => group1 as string);

            return {
                result: str,
                remainder: input.substring(match[0].length),
            };
        }

        // Match bare strings
        if ((match = input.match(/^\s*[a-zA-Z0-9_\\.-]+\s*/))) {
            position += match[0].length;

            const str = match[0].trim();
            return {
                result: str,
                remainder: input.substring(match[0].length),
            };
        }

        throw new MarkupParseError("Failed to parse a value", 0);
    };

    /** Parses a single marker, as well as all of its properties. */
    const parseMarker: ParseFunction<Marker> = (input) => {
        const startPosition = position;

        input = expect(input, "[");

        if (lookAhead(input, "/")) {
            input = expect(input, "/");

            // This is a closing marker.
            if (lookAhead(input, "]")) {
                input = expect(input, "]");
                // This is a close-all marker.
                return {
                    remainder: input,
                    result: {
                        type: "close-all",
                        sourcePosition: startPosition,
                    } satisfies Marker,
                };
            } else {
                // This is a named closing marker.
                // Parse the name of the marker
                let name: string;
                ({ result: name, remainder: input } = parseID(input));

                // We should now be at the end of the marker (the ']')
                input = expect(input, "]");

                return {
                    remainder: input,
                    result: {
                        name,
                        properties: {},
                        type: "close",
                        sourcePosition: startPosition,
                    } satisfies Marker,
                };
            }
        }

        // Parse name
        let name: string;
        ({ result: name, remainder: input } = parseID(input));

        const properties: Property[] = [];

        // Parse either the single shortcut property, or the collection of
        // properties.

        if (lookAhead(input, "=")) {
            // This is a shortcut option.

            // Parse a single value.
            input = expect(input, "=");

            let value: MarkupValue;

            ({ remainder: input, result: value } = parseValue(input));
            properties.push([name, value]);
        } else {
            // Parse properties until we reach the end of the marker
            while (
                input[0] != "]" &&
                input[0] != "/" &&
                input[0] !== undefined
            ) {
                let property: Property;
                ({ remainder: input, result: property } = parseProperty(input));
                properties.push(property);
            }
        }

        if (lookAhead(input, "/")) {
            // This is a self-closing tag.

            // Parse the end of the tag
            input = expect(input, "/]");

            return {
                remainder: input,
                result: {
                    name,
                    properties: Object.fromEntries(properties),
                    type: "self-closing",
                    sourcePosition: startPosition,
                } satisfies Marker,
            };
        } else {
            // This is an open tag.

            // Parse the end of the tag
            input = expect(input, "]");

            return {
                remainder: input,
                result: {
                    name,
                    properties: Object.fromEntries(properties),
                    type: "open",
                    sourcePosition: startPosition,
                } satisfies Marker,
            };
        }
    };

    /** Parses a single property of a marker. */
    const parseProperty: ParseFunction<Property> = (input) => {
        let propertyName: string;
        let propertyValue: MarkupValue;
        ({ remainder: input, result: propertyName } = parseID(input));
        input = expect(input, "=");

        ({ remainder: input, result: propertyValue } = parseValue(input));

        return {
            result: [propertyName, propertyValue],
            remainder: input,
        };
    };

    let workingString = text;
    let output = "";
    const markers: Marker[] = [];

    while (workingString.length > 0) {
        // Attempt to parse some text, stopping at the next marker
        let result: string;
        ({ remainder: workingString, result } = parseText(workingString));
        output += result;

        if (workingString[0] == "[") {
            // Parse a marker
            let marker: Marker;

            ({ remainder: workingString, result: marker } =
                parseMarker(workingString));

            // If this is a replacement marker, then we need to emit text
            // into the output.
            if (marker.type === "self-closing") {
                const registrations = Object.entries(
                    options?.replacementMarkers ?? {},
                );
                const thisMarkerRegistration = registrations.find(
                    ([name]) =>
                        marker.type !== "close-all" && name == marker.name,
                );

                if (thisMarkerRegistration) {
                    const def = thisMarkerRegistration[1];
                    const resultingText = def(marker);
                    output += resultingText;
                    continue;
                }
            }

            marker.position = output.length;
            markers.push(marker);

            // If this is a self-closing marker, and it was preceded by
            // whitespace, and it is followed by whitespace, eat one character
            // of whitespace.
            if (
                marker.type == "self-closing" &&
                output.slice(-1) == " " &&
                workingString.slice(0, 1) == " "
            ) {
                workingString = expect(workingString, " ");
            }
        }
    }

    // We now have our output text, and a collection of markers. First, we'll
    // create attributes from self-closing markers.
    const attributes: MarkupAttribute[] = [];

    attributes.push(
        ...(markers
            .map((m) => {
                if (m.type != "self-closing") {
                    return;
                }
                return {
                    position: m.position ?? 0,
                    name: m.name,
                    properties: m.properties,
                    length: 0,
                    sourcePosition: m.sourcePosition,
                } satisfies MarkupAttribute;
                // const attribute
            })
            .filter((m) => m !== undefined) as MarkupAttribute[]),
    );

    // Next, we'll take every opening marker, and find its endpoint. The
    // endpoint is either:
    // - The next closing marker whose name is equal to the opening marker
    // - The next close-all marker
    // - The end of the string.
    attributes.push(
        ...(markers
            .map((m) => {
                if (m.type !== "open") {
                    return;
                }
                const laterMarkers = markers.filter(
                    (other) => other.sourcePosition > m.sourcePosition,
                );

                const closeMarker = laterMarkers.find(
                    (other) =>
                        other.type === "close" || other.type === "close-all",
                );

                let length: number;

                if (closeMarker === undefined) {
                    // We didn't find a closing marker of any kind (i.e. the
                    // open marker was left open.) Implicitly close this at the
                    // end of the string.
                    length = output.length - (m.position ?? 0);
                } else {
                    // We found a closing marker.
                    length = (closeMarker.position ?? 0) - (m.position ?? 0);
                }
                return {
                    name: m.name,
                    properties: m.properties,
                    position: m.position ?? 0,
                    sourcePosition: m.sourcePosition,
                    length: length,
                } satisfies MarkupAttribute;
            })
            .filter((m) => m !== undefined) as MarkupAttribute[]),
    );

    // If we don't have a [character] attribute, identify a possible place where
    // we could have one (the start of the line, up to the first colon), and add
    // one there.
    const hasCharacterAttribute =
        attributes.find((a) => a.name == "character") !== undefined;

    if (!hasCharacterAttribute) {
        // Match and extract parts of a string that represents a character name,
        // including optional whitespace prefixes and suffixes.
        // - prefix: Optional leading space
        // - name: The character name
        // - suffix: Colon, and optional trailing space
        const characterNameRegex =
            /^(?<prefix>\s*)(?<name>\w+)(?<suffix>:\s*)/g;

        const match = characterNameRegex.exec(text);

        if (match) {
            const { prefix, name, suffix } = match.groups!;

            // Construct a character name attribute
            const characterNaemAttribute: MarkupAttribute = {
                name: "character",
                length: name.length + suffix.length,
                position: (match.index ?? 0) + prefix.length,
                sourcePosition: (match.index ?? 0) + prefix.length,
                properties: {
                    name: name,
                },
            };

            // Put the character name at the start of the list
            attributes.unshift(characterNaemAttribute);
        }
    }

    return {
        text: output,
        attributes,
    };
}
