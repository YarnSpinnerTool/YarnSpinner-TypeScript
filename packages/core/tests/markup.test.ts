import { englishOrdinalPluralMarker } from "./test-common";
import { parseMarkup, MarkupParseError, MarkupValue } from "../src/markup";
import { selectMarker } from "../src/markup";

it("parses markup", () => {
    const test = "before [a]during1[/a] [b]during2[/b] after";
    const result = parseMarkup(test);

    expect(result.text).toBe("before during1 during2 after");
    expect(result.attributes).toHaveLength(2);

    expect(result.attributes[0].position).toBe("before ".length);
    expect(result.attributes[0].length).toBe("during1".length);
    expect(Object.entries(result.attributes[0].properties)).toHaveLength(0);
    expect(result.attributes[0].sourcePosition).toBe("before ".length);

    expect(result.attributes[1].position).toBe("before during1 ".length);
    expect(result.attributes[1].length).toBe("during2".length);
    expect(Object.entries(result.attributes[1].properties)).toHaveLength(0);
    expect(result.attributes[1].sourcePosition).toBe(
        "before [a]during1[/a] ".length,
    );
});

it("parses self-closing markup", () => {
    const test = "before [a/] after";

    const result = parseMarkup(test);

    expect(result.text).toBe("before after");
    expect(result.attributes).toHaveLength(1);
    expect(result.attributes[0].position).toBe("before ".length);
    expect(result.attributes[0].length).toBe(0);
    expect(Object.entries(result.attributes[0].properties)).toHaveLength(0);
});

it("parses self-closing markup with properties", () => {
    const test = "before [a=5/] after";

    const result = parseMarkup(test);

    expect(result.text).toBe("before after");
    expect(result.attributes).toHaveLength(1);
    expect(result.attributes[0].position).toBe("before ".length);
    expect(result.attributes[0].length).toBe(0);
    expect(Object.entries(result.attributes[0].properties)).toHaveLength(1);
    expect(typeof result.attributes[0].properties["a"]).toBe("number");
    expect(result.attributes[0].properties["a"]).toBe(5);
});

it("parses attributes missing their closing tag", () => {
    const test = "before [a]during";

    const result = parseMarkup(test);

    expect(result.text).toBe("before during");
    expect(result.attributes).toHaveLength(1);
    expect(result.attributes[0].position).toBe("before ".length);
    expect(result.attributes[0].length).toBe("during".length);
});

it("parses markup with properties", () => {
    const test =
        'before [marker number=500 string1="hel\\"lo" string2=goodbye boolean1=true boolean2=false]during[/marker] after';
    const result = parseMarkup(test);

    expect(result.text).toBe("before during after");
    expect(result.attributes).toHaveLength(1);
    expect(result.attributes[0].position).toBe("before ".length);
    expect(result.attributes[0].length).toBe("during".length);
    expect(Object.entries(result.attributes[0].properties)).toHaveLength(5);

    Object.entries({
        number: ["number", 500],
        string1: ["string", 'hell"o'],
        string2: ["string", "goodbye"],
        boolean1: ["boolean", true],
        boolean2: ["boolean", false],
    } satisfies Record<string, [string, MarkupValue]>).forEach(
        ([name, [type, value]]) => {
            expect(result.attributes[0].properties[name]).toBeDefined();
            expect(typeof result.attributes[0].properties[name] === type);
            expect(result.attributes[0].properties[name] === value);
        },
    );
});

it("parses markup with shorthand properties", () => {
    const test =
        'before [stringmarker="hel\\"lo"/] [boolmarker=true/] [numbermarker=500/] after';

    const result = parseMarkup(test);

    expect(result.text).toBe("before after");

    expect(result.attributes).toHaveLength(3);

    // Define the expected markers, which have a single property (with the same
    // name as the marker), and an expected type and value.
    Object.entries({
        stringmarker: ["string", 'hel"lo'],
        numbermarker: ["number", 500],
        boolmarker: ["boolean", true],
    } satisfies Record<string, [string, MarkupValue]>).forEach(
        ([name, [type, value]]) => {
            const attr = result.attributes.find((a) => a.name == name);

            expect(attr).toBeDefined();
            expect(Object.entries(attr!.properties)).toHaveLength(1);
            expect(attr!.properties[name]).toBeDefined();
            expect(typeof attr!.properties[name]).toBe(type);
            expect(attr!.properties[name]).toBe(value);
        },
    );
});

it("handles overlapping markers", () => {
    const test = "before [a] a [b] ab [c] abc [/b] ac [/a] c [/c]";

    const result = parseMarkup(test);

    expect(result.text).toBe("before  a  ab  abc  ac  c ");
});

it("handles the close-all marker", () => {
    const test = "before [a] during1 [b] during2 [/] after";
    const result = parseMarkup(test);

    expect(result.text).toBe("before  during1  during2  after");
    expect(result.attributes).toHaveLength(2);

    expect(result.attributes[0].position).toBe("before ".length);
    expect(result.attributes[0].length).toBe(" during1  during2 ".length);
    expect(Object.entries(result.attributes[0].properties)).toHaveLength(0);
    expect(result.attributes[0].sourcePosition).toBe("before ".length);

    expect(result.attributes[1].position).toBe("before  during1 ".length);
    expect(result.attributes[1].length).toBe(" during2 ".length);
    expect(Object.entries(result.attributes[1].properties)).toHaveLength(0);
    expect(result.attributes[1].sourcePosition).toBe(
        "before [a] during1 ".length,
    );
});

it("handles [nomarkup] tags", () => {
    const test = "before [nomarkup] lots [ of ] markers [a=hello] [/nomarkup]";

    const result = parseMarkup(test);

    expect(result.text).toBe("before  lots [ of ] markers [a=hello] ");
    expect(result.attributes).toHaveLength(0);
});

it("adds a default character marker", () => {
    const test = "   CharacterA: Hello!";
    const result = parseMarkup(test);

    expect(result.text).toBe("   CharacterA: Hello!");
    expect(result.attributes).toHaveLength(1);
    expect(result.attributes[0].name).toBe("character");
    expect(result.attributes[0].length).toBe("CharacterA: ".length);
    expect(result.attributes[0].properties["name"]).toBe("CharacterA");
    expect(result.attributes[0].position).toBe("   ".length);
});

it("supports replacement markers", () => {
    const tests = {
        m: "I think he will be there!",
        f: "I think she will be there!",
        nb: "I think they will be there!",
    };

    for (const [value, expectation] of Object.entries(tests)) {
        const test = `I think [select value="${value}" m="he" f="she" nb="they"/] will be there!`;
        const result = parseMarkup(test, {
            replacementMarkers: {
                select: selectMarker,
            },
        });

        expect(result.text).toBe(expectation);
    }
});

it("supports the plural marker", () => {
    const tests = {
        0: `I just baked 0 pies!`,
        1: `I just baked a pie!`,
        5: `I just baked 5 pies!`,
    };

    for (const [value, expectation] of Object.entries(tests)) {
        const test = `I just baked [plural value=${value} one="a pie" other="% pies" /]!`;
        const result = parseMarkup(test, {
            replacementMarkers: {
                plural: englishOrdinalPluralMarker,
            },
        });

        expect(result.text).toBe(expectation);
    }
});

it("supports the ordinal marker", () => {
    const tests = {
        0: `The race is over! I came in 0th place!`,
        1: `The race is over! I came in 1st place!`,
        2: `The race is over! I came in 2nd place!`,
        3: `The race is over! I came in 3rd place!`,
        4: `The race is over! I came in 4th place!`,
        93: `The race is over! I came in 93rd place!`,
        100: `The race is over! I came in 100th place!`,
    };

    for (const [value, expectation] of Object.entries(tests)) {
        const test = `The race is over! I came in [ordinal value=${value} one="%st" two="%nd" few="%rd" other="%th" /] place!`;
        const result = parseMarkup(test, {
            replacementMarkers: {
                ordinal: englishOrdinalPluralMarker,
            },
        });

        expect(result.text).toBe(expectation);
    }
});

it("supports escaped brackets", () => {
    const test = "Here's some square brackets, just for you: \\[ \\]";
    const result = parseMarkup(test);

    expect(result.text).toBe("Here's some square brackets, just for you: [ ]");
});

it("ignores invalid escapes", () => {
    const test = "Here's a backslash: \\ also here's some invalid escapes: \\m";
    const result = parseMarkup(test);

    expect(result.text).toBe(
        "Here's a backslash: \\ also here's some invalid escapes: \\m",
    );
});

it("throws parse errors on invalid input", () => {
    const tests = [
        "This markup has an invalid property: [property two/]",
        'This property has an invalid string: [property="two/]',
        "This tag is unterminated: [property",
    ];

    for (const test of tests) {
        expect(() => {
            parseMarkup(test);
        }).toThrow(MarkupParseError);
    }
});
