import { createPluralReplacers } from "../src/markup";

// Define a US English replacement function for cardinal and ordinal
// pluralisation, for use in all tests.
export const {
    cardinal: englishCardinalPluralMarker,
    ordinal: englishOrdinalPluralMarker,
} = createPluralReplacers("en-US");
