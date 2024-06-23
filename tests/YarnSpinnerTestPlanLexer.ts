// Generated from /Users/desplesda/Work/YarnSpinner/YarnSpinner.Tests/TestPlan/YarnSpinnerTestPlan.g4 by ANTLR 4.13.1

import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";


export class YarnSpinnerTestPlanLexer extends antlr.Lexer {
    public static readonly T__0 = 1;
    public static readonly T__1 = 2;
    public static readonly T__2 = 3;
    public static readonly T__3 = 4;
    public static readonly T__4 = 5;
    public static readonly T__5 = 6;
    public static readonly T__6 = 7;
    public static readonly T__7 = 8;
    public static readonly T__8 = 9;
    public static readonly T__9 = 10;
    public static readonly T__10 = 11;
    public static readonly T__11 = 12;
    public static readonly T__12 = 13;
    public static readonly COMMENT = 14;
    public static readonly WS = 15;
    public static readonly BOOL = 16;
    public static readonly IDENTIFIER = 17;
    public static readonly VARIABLE = 18;
    public static readonly NUMBER = 19;
    public static readonly TEXT = 20;

    public static readonly channelNames = [
        "DEFAULT_TOKEN_CHANNEL", "HIDDEN"
    ];

    public static readonly literalNames = [
        null, "'---'", "'#'", "'line:'", "'*'", "'option:'", "'[disabled]'", 
        "'command:'", "'stop'", "'select:'", "'set:'", "'='", "'saliency:'", 
        "'node:'"
    ];

    public static readonly symbolicNames = [
        null, null, null, null, null, null, null, null, null, null, null, 
        null, null, null, "COMMENT", "WS", "BOOL", "IDENTIFIER", "VARIABLE", 
        "NUMBER", "TEXT"
    ];

    public static readonly modeNames = [
        "DEFAULT_MODE",
    ];

    public static readonly ruleNames = [
        "T__0", "T__1", "T__2", "T__3", "T__4", "T__5", "T__6", "T__7", 
        "T__8", "T__9", "T__10", "T__11", "T__12", "COMMENT", "WS", "BOOL", 
        "IDENTIFIER", "VARIABLE", "NUMBER", "TEXT",
    ];


    public constructor(input: antlr.CharStream) {
        super(input);
        this.interpreter = new antlr.LexerATNSimulator(this, YarnSpinnerTestPlanLexer._ATN, YarnSpinnerTestPlanLexer.decisionsToDFA, new antlr.PredictionContextCache());
    }

    public get grammarFileName(): string { return "YarnSpinnerTestPlan.g4"; }

    public get literalNames(): (string | null)[] { return YarnSpinnerTestPlanLexer.literalNames; }
    public get symbolicNames(): (string | null)[] { return YarnSpinnerTestPlanLexer.symbolicNames; }
    public get ruleNames(): string[] { return YarnSpinnerTestPlanLexer.ruleNames; }

    public get serializedATN(): number[] { return YarnSpinnerTestPlanLexer._serializedATN; }

    public get channelNames(): string[] { return YarnSpinnerTestPlanLexer.channelNames; }

    public get modeNames(): string[] { return YarnSpinnerTestPlanLexer.modeNames; }

    public static readonly _serializedATN: number[] = [
        4,0,20,170,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,
        2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,
        13,7,13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,
        19,1,0,1,0,1,0,1,0,1,1,1,1,1,2,1,2,1,2,1,2,1,2,1,2,1,3,1,3,1,4,1,
        4,1,4,1,4,1,4,1,4,1,4,1,4,1,5,1,5,1,5,1,5,1,5,1,5,1,5,1,5,1,5,1,
        5,1,5,1,6,1,6,1,6,1,6,1,6,1,6,1,6,1,6,1,6,1,7,1,7,1,7,1,7,1,7,1,
        8,1,8,1,8,1,8,1,8,1,8,1,8,1,8,1,9,1,9,1,9,1,9,1,9,1,10,1,10,1,11,
        1,11,1,11,1,11,1,11,1,11,1,11,1,11,1,11,1,11,1,12,1,12,1,12,1,12,
        1,12,1,12,1,13,1,13,5,13,122,8,13,10,13,12,13,125,9,13,1,13,1,13,
        1,14,4,14,130,8,14,11,14,12,14,131,1,14,1,14,1,15,1,15,1,15,1,15,
        1,15,1,15,1,15,1,15,1,15,3,15,145,8,15,1,16,1,16,5,16,149,8,16,10,
        16,12,16,152,9,16,1,17,1,17,1,17,1,18,4,18,158,8,18,11,18,12,18,
        159,1,19,1,19,5,19,164,8,19,10,19,12,19,167,9,19,1,19,1,19,1,165,
        0,20,1,1,3,2,5,3,7,4,9,5,11,6,13,7,15,8,17,9,19,10,21,11,23,12,25,
        13,27,14,29,15,31,16,33,17,35,18,37,19,39,20,1,0,5,2,0,10,10,13,
        13,3,0,9,10,13,13,32,32,3,0,65,90,95,95,97,122,4,0,48,57,65,90,95,
        95,97,122,1,0,48,57,175,0,1,1,0,0,0,0,3,1,0,0,0,0,5,1,0,0,0,0,7,
        1,0,0,0,0,9,1,0,0,0,0,11,1,0,0,0,0,13,1,0,0,0,0,15,1,0,0,0,0,17,
        1,0,0,0,0,19,1,0,0,0,0,21,1,0,0,0,0,23,1,0,0,0,0,25,1,0,0,0,0,27,
        1,0,0,0,0,29,1,0,0,0,0,31,1,0,0,0,0,33,1,0,0,0,0,35,1,0,0,0,0,37,
        1,0,0,0,0,39,1,0,0,0,1,41,1,0,0,0,3,45,1,0,0,0,5,47,1,0,0,0,7,53,
        1,0,0,0,9,55,1,0,0,0,11,63,1,0,0,0,13,74,1,0,0,0,15,83,1,0,0,0,17,
        88,1,0,0,0,19,96,1,0,0,0,21,101,1,0,0,0,23,103,1,0,0,0,25,113,1,
        0,0,0,27,119,1,0,0,0,29,129,1,0,0,0,31,144,1,0,0,0,33,146,1,0,0,
        0,35,153,1,0,0,0,37,157,1,0,0,0,39,161,1,0,0,0,41,42,5,45,0,0,42,
        43,5,45,0,0,43,44,5,45,0,0,44,2,1,0,0,0,45,46,5,35,0,0,46,4,1,0,
        0,0,47,48,5,108,0,0,48,49,5,105,0,0,49,50,5,110,0,0,50,51,5,101,
        0,0,51,52,5,58,0,0,52,6,1,0,0,0,53,54,5,42,0,0,54,8,1,0,0,0,55,56,
        5,111,0,0,56,57,5,112,0,0,57,58,5,116,0,0,58,59,5,105,0,0,59,60,
        5,111,0,0,60,61,5,110,0,0,61,62,5,58,0,0,62,10,1,0,0,0,63,64,5,91,
        0,0,64,65,5,100,0,0,65,66,5,105,0,0,66,67,5,115,0,0,67,68,5,97,0,
        0,68,69,5,98,0,0,69,70,5,108,0,0,70,71,5,101,0,0,71,72,5,100,0,0,
        72,73,5,93,0,0,73,12,1,0,0,0,74,75,5,99,0,0,75,76,5,111,0,0,76,77,
        5,109,0,0,77,78,5,109,0,0,78,79,5,97,0,0,79,80,5,110,0,0,80,81,5,
        100,0,0,81,82,5,58,0,0,82,14,1,0,0,0,83,84,5,115,0,0,84,85,5,116,
        0,0,85,86,5,111,0,0,86,87,5,112,0,0,87,16,1,0,0,0,88,89,5,115,0,
        0,89,90,5,101,0,0,90,91,5,108,0,0,91,92,5,101,0,0,92,93,5,99,0,0,
        93,94,5,116,0,0,94,95,5,58,0,0,95,18,1,0,0,0,96,97,5,115,0,0,97,
        98,5,101,0,0,98,99,5,116,0,0,99,100,5,58,0,0,100,20,1,0,0,0,101,
        102,5,61,0,0,102,22,1,0,0,0,103,104,5,115,0,0,104,105,5,97,0,0,105,
        106,5,108,0,0,106,107,5,105,0,0,107,108,5,101,0,0,108,109,5,110,
        0,0,109,110,5,99,0,0,110,111,5,121,0,0,111,112,5,58,0,0,112,24,1,
        0,0,0,113,114,5,110,0,0,114,115,5,111,0,0,115,116,5,100,0,0,116,
        117,5,101,0,0,117,118,5,58,0,0,118,26,1,0,0,0,119,123,5,35,0,0,120,
        122,8,0,0,0,121,120,1,0,0,0,122,125,1,0,0,0,123,121,1,0,0,0,123,
        124,1,0,0,0,124,126,1,0,0,0,125,123,1,0,0,0,126,127,6,13,0,0,127,
        28,1,0,0,0,128,130,7,1,0,0,129,128,1,0,0,0,130,131,1,0,0,0,131,129,
        1,0,0,0,131,132,1,0,0,0,132,133,1,0,0,0,133,134,6,14,0,0,134,30,
        1,0,0,0,135,136,5,116,0,0,136,137,5,114,0,0,137,138,5,117,0,0,138,
        145,5,101,0,0,139,140,5,102,0,0,140,141,5,97,0,0,141,142,5,108,0,
        0,142,143,5,115,0,0,143,145,5,101,0,0,144,135,1,0,0,0,144,139,1,
        0,0,0,145,32,1,0,0,0,146,150,7,2,0,0,147,149,7,3,0,0,148,147,1,0,
        0,0,149,152,1,0,0,0,150,148,1,0,0,0,150,151,1,0,0,0,151,34,1,0,0,
        0,152,150,1,0,0,0,153,154,5,36,0,0,154,155,3,33,16,0,155,36,1,0,
        0,0,156,158,7,4,0,0,157,156,1,0,0,0,158,159,1,0,0,0,159,157,1,0,
        0,0,159,160,1,0,0,0,160,38,1,0,0,0,161,165,5,96,0,0,162,164,9,0,
        0,0,163,162,1,0,0,0,164,167,1,0,0,0,165,166,1,0,0,0,165,163,1,0,
        0,0,166,168,1,0,0,0,167,165,1,0,0,0,168,169,5,96,0,0,169,40,1,0,
        0,0,7,0,123,131,144,150,159,165,1,6,0,0
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!YarnSpinnerTestPlanLexer.__ATN) {
            YarnSpinnerTestPlanLexer.__ATN = new antlr.ATNDeserializer().deserialize(YarnSpinnerTestPlanLexer._serializedATN);
        }

        return YarnSpinnerTestPlanLexer.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(YarnSpinnerTestPlanLexer.literalNames, YarnSpinnerTestPlanLexer.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return YarnSpinnerTestPlanLexer.vocabulary;
    }

    private static readonly decisionsToDFA = YarnSpinnerTestPlanLexer._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}