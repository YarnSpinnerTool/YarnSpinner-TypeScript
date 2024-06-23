// Generated from /Users/desplesda/Work/YarnSpinner/YarnSpinner.Tests/TestPlan/YarnSpinnerTestPlan.g4 by ANTLR 4.13.1

import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { YarnSpinnerTestPlanListener } from "./YarnSpinnerTestPlanListener.js";
// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class YarnSpinnerTestPlanParser extends antlr.Parser {
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
    public static readonly RULE_testplan = 0;
    public static readonly RULE_run = 1;
    public static readonly RULE_step = 2;
    public static readonly RULE_hashtag = 3;
    public static readonly RULE_lineExpected = 4;
    public static readonly RULE_optionExpected = 5;
    public static readonly RULE_commandExpected = 6;
    public static readonly RULE_stopExpected = 7;
    public static readonly RULE_actionSelect = 8;
    public static readonly RULE_actionSet = 9;
    public static readonly RULE_actionSetSaliencyMode = 10;
    public static readonly RULE_actionJumpToNode = 11;

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
    public static readonly ruleNames = [
        "testplan", "run", "step", "hashtag", "lineExpected", "optionExpected", 
        "commandExpected", "stopExpected", "actionSelect", "actionSet", 
        "actionSetSaliencyMode", "actionJumpToNode",
    ];

    public get grammarFileName(): string { return "YarnSpinnerTestPlan.g4"; }
    public get literalNames(): (string | null)[] { return YarnSpinnerTestPlanParser.literalNames; }
    public get symbolicNames(): (string | null)[] { return YarnSpinnerTestPlanParser.symbolicNames; }
    public get ruleNames(): string[] { return YarnSpinnerTestPlanParser.ruleNames; }
    public get serializedATN(): number[] { return YarnSpinnerTestPlanParser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, YarnSpinnerTestPlanParser._ATN, YarnSpinnerTestPlanParser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public testplan(): TestplanContext {
        let localContext = new TestplanContext(this.context, this.state);
        this.enterRule(localContext, 0, YarnSpinnerTestPlanParser.RULE_testplan);
        let _la: number;
        try {
            this.state = 33;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case YarnSpinnerTestPlanParser.T__2:
            case YarnSpinnerTestPlanParser.T__4:
            case YarnSpinnerTestPlanParser.T__6:
            case YarnSpinnerTestPlanParser.T__7:
            case YarnSpinnerTestPlanParser.T__8:
            case YarnSpinnerTestPlanParser.T__9:
            case YarnSpinnerTestPlanParser.T__11:
            case YarnSpinnerTestPlanParser.T__12:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 24;
                this.run();
                this.state = 29;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 1) {
                    {
                    {
                    this.state = 25;
                    this.match(YarnSpinnerTestPlanParser.T__0);
                    this.state = 26;
                    this.run();
                    }
                    }
                    this.state = 31;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
                break;
            case YarnSpinnerTestPlanParser.EOF:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 32;
                this.match(YarnSpinnerTestPlanParser.EOF);
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public run(): RunContext {
        let localContext = new RunContext(this.context, this.state);
        this.enterRule(localContext, 2, YarnSpinnerTestPlanParser.RULE_run);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 36;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                {
                this.state = 35;
                this.step();
                }
                }
                this.state = 38;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 14248) !== 0));
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public step(): StepContext {
        let localContext = new StepContext(this.context, this.state);
        this.enterRule(localContext, 4, YarnSpinnerTestPlanParser.RULE_step);
        try {
            this.state = 48;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case YarnSpinnerTestPlanParser.T__2:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 40;
                this.lineExpected();
                }
                break;
            case YarnSpinnerTestPlanParser.T__4:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 41;
                this.optionExpected();
                }
                break;
            case YarnSpinnerTestPlanParser.T__6:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 42;
                this.commandExpected();
                }
                break;
            case YarnSpinnerTestPlanParser.T__7:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 43;
                this.stopExpected();
                }
                break;
            case YarnSpinnerTestPlanParser.T__8:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 44;
                this.actionSelect();
                }
                break;
            case YarnSpinnerTestPlanParser.T__9:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 45;
                this.actionSet();
                }
                break;
            case YarnSpinnerTestPlanParser.T__12:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 46;
                this.actionJumpToNode();
                }
                break;
            case YarnSpinnerTestPlanParser.T__11:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 47;
                this.actionSetSaliencyMode();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public hashtag(): HashtagContext {
        let localContext = new HashtagContext(this.context, this.state);
        this.enterRule(localContext, 6, YarnSpinnerTestPlanParser.RULE_hashtag);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 50;
            this.match(YarnSpinnerTestPlanParser.T__1);
            this.state = 52;
            this.errorHandler.sync(this);
            alternative = 1 + 1;
            do {
                switch (alternative) {
                case 1 + 1:
                    {
                    {
                    this.state = 51;
                    this.matchWildcard();
                    }
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                this.state = 54;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 4, this.context);
            } while (alternative !== 1 && alternative !== antlr.ATN.INVALID_ALT_NUMBER);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public lineExpected(): LineExpectedContext {
        let localContext = new LineExpectedContext(this.context, this.state);
        this.enterRule(localContext, 8, YarnSpinnerTestPlanParser.RULE_lineExpected);
        let _la: number;
        try {
            this.state = 72;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 7, this.context) ) {
            case 1:
                localContext = new LineWithSpecificTextExpectedContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 56;
                this.match(YarnSpinnerTestPlanParser.T__2);
                this.state = 57;
                this.match(YarnSpinnerTestPlanParser.TEXT);
                this.state = 61;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 2) {
                    {
                    {
                    this.state = 58;
                    this.hashtag();
                    }
                    }
                    this.state = 63;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
                break;
            case 2:
                localContext = new LineWithAnyTextExpectedContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 64;
                this.match(YarnSpinnerTestPlanParser.T__2);
                this.state = 65;
                this.match(YarnSpinnerTestPlanParser.T__3);
                this.state = 69;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 2) {
                    {
                    {
                    this.state = 66;
                    this.hashtag();
                    }
                    }
                    this.state = 71;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public optionExpected(): OptionExpectedContext {
        let localContext = new OptionExpectedContext(this.context, this.state);
        this.enterRule(localContext, 10, YarnSpinnerTestPlanParser.RULE_optionExpected);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 74;
            this.match(YarnSpinnerTestPlanParser.T__4);
            this.state = 75;
            this.match(YarnSpinnerTestPlanParser.TEXT);
            this.state = 79;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 2) {
                {
                {
                this.state = 76;
                this.hashtag();
                }
                }
                this.state = 81;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 83;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 6) {
                {
                this.state = 82;
                localContext._isDisabled = this.match(YarnSpinnerTestPlanParser.T__5);
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public commandExpected(): CommandExpectedContext {
        let localContext = new CommandExpectedContext(this.context, this.state);
        this.enterRule(localContext, 12, YarnSpinnerTestPlanParser.RULE_commandExpected);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 85;
            this.match(YarnSpinnerTestPlanParser.T__6);
            this.state = 86;
            this.match(YarnSpinnerTestPlanParser.TEXT);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public stopExpected(): StopExpectedContext {
        let localContext = new StopExpectedContext(this.context, this.state);
        this.enterRule(localContext, 14, YarnSpinnerTestPlanParser.RULE_stopExpected);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 88;
            this.match(YarnSpinnerTestPlanParser.T__7);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public actionSelect(): ActionSelectContext {
        let localContext = new ActionSelectContext(this.context, this.state);
        this.enterRule(localContext, 16, YarnSpinnerTestPlanParser.RULE_actionSelect);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 90;
            this.match(YarnSpinnerTestPlanParser.T__8);
            this.state = 91;
            localContext._option = this.match(YarnSpinnerTestPlanParser.NUMBER);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public actionSet(): ActionSetContext {
        let localContext = new ActionSetContext(this.context, this.state);
        this.enterRule(localContext, 18, YarnSpinnerTestPlanParser.RULE_actionSet);
        try {
            this.state = 101;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 10, this.context) ) {
            case 1:
                localContext = new ActionSetBoolContext(localContext);
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 93;
                this.match(YarnSpinnerTestPlanParser.T__9);
                this.state = 94;
                (localContext as ActionSetBoolContext)._variable = this.match(YarnSpinnerTestPlanParser.VARIABLE);
                this.state = 95;
                this.match(YarnSpinnerTestPlanParser.T__10);
                this.state = 96;
                (localContext as ActionSetBoolContext)._value = this.match(YarnSpinnerTestPlanParser.BOOL);
                }
                break;
            case 2:
                localContext = new ActionSetNumberContext(localContext);
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 97;
                this.match(YarnSpinnerTestPlanParser.T__9);
                this.state = 98;
                (localContext as ActionSetNumberContext)._variable = this.match(YarnSpinnerTestPlanParser.VARIABLE);
                this.state = 99;
                this.match(YarnSpinnerTestPlanParser.T__10);
                this.state = 100;
                (localContext as ActionSetNumberContext)._value = this.match(YarnSpinnerTestPlanParser.NUMBER);
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public actionSetSaliencyMode(): ActionSetSaliencyModeContext {
        let localContext = new ActionSetSaliencyModeContext(this.context, this.state);
        this.enterRule(localContext, 20, YarnSpinnerTestPlanParser.RULE_actionSetSaliencyMode);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 103;
            this.match(YarnSpinnerTestPlanParser.T__11);
            this.state = 104;
            localContext._saliencyMode = this.match(YarnSpinnerTestPlanParser.IDENTIFIER);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public actionJumpToNode(): ActionJumpToNodeContext {
        let localContext = new ActionJumpToNodeContext(this.context, this.state);
        this.enterRule(localContext, 22, YarnSpinnerTestPlanParser.RULE_actionJumpToNode);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 106;
            this.match(YarnSpinnerTestPlanParser.T__12);
            this.state = 107;
            localContext._nodeName = this.match(YarnSpinnerTestPlanParser.IDENTIFIER);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }

    public static readonly _serializedATN: number[] = [
        4,1,20,110,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,1,0,1,0,1,0,5,0,28,
        8,0,10,0,12,0,31,9,0,1,0,3,0,34,8,0,1,1,4,1,37,8,1,11,1,12,1,38,
        1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,3,2,49,8,2,1,3,1,3,4,3,53,8,3,11,
        3,12,3,54,1,4,1,4,1,4,5,4,60,8,4,10,4,12,4,63,9,4,1,4,1,4,1,4,5,
        4,68,8,4,10,4,12,4,71,9,4,3,4,73,8,4,1,5,1,5,1,5,5,5,78,8,5,10,5,
        12,5,81,9,5,1,5,3,5,84,8,5,1,6,1,6,1,6,1,7,1,7,1,8,1,8,1,8,1,9,1,
        9,1,9,1,9,1,9,1,9,1,9,1,9,3,9,102,8,9,1,10,1,10,1,10,1,11,1,11,1,
        11,1,11,1,54,0,12,0,2,4,6,8,10,12,14,16,18,20,22,0,0,114,0,33,1,
        0,0,0,2,36,1,0,0,0,4,48,1,0,0,0,6,50,1,0,0,0,8,72,1,0,0,0,10,74,
        1,0,0,0,12,85,1,0,0,0,14,88,1,0,0,0,16,90,1,0,0,0,18,101,1,0,0,0,
        20,103,1,0,0,0,22,106,1,0,0,0,24,29,3,2,1,0,25,26,5,1,0,0,26,28,
        3,2,1,0,27,25,1,0,0,0,28,31,1,0,0,0,29,27,1,0,0,0,29,30,1,0,0,0,
        30,34,1,0,0,0,31,29,1,0,0,0,32,34,5,0,0,1,33,24,1,0,0,0,33,32,1,
        0,0,0,34,1,1,0,0,0,35,37,3,4,2,0,36,35,1,0,0,0,37,38,1,0,0,0,38,
        36,1,0,0,0,38,39,1,0,0,0,39,3,1,0,0,0,40,49,3,8,4,0,41,49,3,10,5,
        0,42,49,3,12,6,0,43,49,3,14,7,0,44,49,3,16,8,0,45,49,3,18,9,0,46,
        49,3,22,11,0,47,49,3,20,10,0,48,40,1,0,0,0,48,41,1,0,0,0,48,42,1,
        0,0,0,48,43,1,0,0,0,48,44,1,0,0,0,48,45,1,0,0,0,48,46,1,0,0,0,48,
        47,1,0,0,0,49,5,1,0,0,0,50,52,5,2,0,0,51,53,9,0,0,0,52,51,1,0,0,
        0,53,54,1,0,0,0,54,55,1,0,0,0,54,52,1,0,0,0,55,7,1,0,0,0,56,57,5,
        3,0,0,57,61,5,20,0,0,58,60,3,6,3,0,59,58,1,0,0,0,60,63,1,0,0,0,61,
        59,1,0,0,0,61,62,1,0,0,0,62,73,1,0,0,0,63,61,1,0,0,0,64,65,5,3,0,
        0,65,69,5,4,0,0,66,68,3,6,3,0,67,66,1,0,0,0,68,71,1,0,0,0,69,67,
        1,0,0,0,69,70,1,0,0,0,70,73,1,0,0,0,71,69,1,0,0,0,72,56,1,0,0,0,
        72,64,1,0,0,0,73,9,1,0,0,0,74,75,5,5,0,0,75,79,5,20,0,0,76,78,3,
        6,3,0,77,76,1,0,0,0,78,81,1,0,0,0,79,77,1,0,0,0,79,80,1,0,0,0,80,
        83,1,0,0,0,81,79,1,0,0,0,82,84,5,6,0,0,83,82,1,0,0,0,83,84,1,0,0,
        0,84,11,1,0,0,0,85,86,5,7,0,0,86,87,5,20,0,0,87,13,1,0,0,0,88,89,
        5,8,0,0,89,15,1,0,0,0,90,91,5,9,0,0,91,92,5,19,0,0,92,17,1,0,0,0,
        93,94,5,10,0,0,94,95,5,18,0,0,95,96,5,11,0,0,96,102,5,16,0,0,97,
        98,5,10,0,0,98,99,5,18,0,0,99,100,5,11,0,0,100,102,5,19,0,0,101,
        93,1,0,0,0,101,97,1,0,0,0,102,19,1,0,0,0,103,104,5,12,0,0,104,105,
        5,17,0,0,105,21,1,0,0,0,106,107,5,13,0,0,107,108,5,17,0,0,108,23,
        1,0,0,0,11,29,33,38,48,54,61,69,72,79,83,101
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!YarnSpinnerTestPlanParser.__ATN) {
            YarnSpinnerTestPlanParser.__ATN = new antlr.ATNDeserializer().deserialize(YarnSpinnerTestPlanParser._serializedATN);
        }

        return YarnSpinnerTestPlanParser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(YarnSpinnerTestPlanParser.literalNames, YarnSpinnerTestPlanParser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return YarnSpinnerTestPlanParser.vocabulary;
    }

    private static readonly decisionsToDFA = YarnSpinnerTestPlanParser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class TestplanContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public run(): RunContext[];
    public run(i: number): RunContext | null;
    public run(i?: number): RunContext[] | RunContext | null {
        if (i === undefined) {
            return this.getRuleContexts(RunContext);
        }

        return this.getRuleContext(i, RunContext);
    }
    public EOF(): antlr.TerminalNode | null {
        return this.getToken(YarnSpinnerTestPlanParser.EOF, 0);
    }
    public override get ruleIndex(): number {
        return YarnSpinnerTestPlanParser.RULE_testplan;
    }
    public override enterRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.enterTestplan) {
             listener.enterTestplan(this);
        }
    }
    public override exitRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.exitTestplan) {
             listener.exitTestplan(this);
        }
    }
}


export class RunContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public step(): StepContext[];
    public step(i: number): StepContext | null;
    public step(i?: number): StepContext[] | StepContext | null {
        if (i === undefined) {
            return this.getRuleContexts(StepContext);
        }

        return this.getRuleContext(i, StepContext);
    }
    public override get ruleIndex(): number {
        return YarnSpinnerTestPlanParser.RULE_run;
    }
    public override enterRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.enterRun) {
             listener.enterRun(this);
        }
    }
    public override exitRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.exitRun) {
             listener.exitRun(this);
        }
    }
}


export class StepContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public lineExpected(): LineExpectedContext | null {
        return this.getRuleContext(0, LineExpectedContext);
    }
    public optionExpected(): OptionExpectedContext | null {
        return this.getRuleContext(0, OptionExpectedContext);
    }
    public commandExpected(): CommandExpectedContext | null {
        return this.getRuleContext(0, CommandExpectedContext);
    }
    public stopExpected(): StopExpectedContext | null {
        return this.getRuleContext(0, StopExpectedContext);
    }
    public actionSelect(): ActionSelectContext | null {
        return this.getRuleContext(0, ActionSelectContext);
    }
    public actionSet(): ActionSetContext | null {
        return this.getRuleContext(0, ActionSetContext);
    }
    public actionJumpToNode(): ActionJumpToNodeContext | null {
        return this.getRuleContext(0, ActionJumpToNodeContext);
    }
    public actionSetSaliencyMode(): ActionSetSaliencyModeContext | null {
        return this.getRuleContext(0, ActionSetSaliencyModeContext);
    }
    public override get ruleIndex(): number {
        return YarnSpinnerTestPlanParser.RULE_step;
    }
    public override enterRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.enterStep) {
             listener.enterStep(this);
        }
    }
    public override exitRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.exitStep) {
             listener.exitStep(this);
        }
    }
}


export class HashtagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return YarnSpinnerTestPlanParser.RULE_hashtag;
    }
    public override enterRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.enterHashtag) {
             listener.enterHashtag(this);
        }
    }
    public override exitRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.exitHashtag) {
             listener.exitHashtag(this);
        }
    }
}


export class LineExpectedContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return YarnSpinnerTestPlanParser.RULE_lineExpected;
    }
    public override copyFrom(ctx: LineExpectedContext): void {
        super.copyFrom(ctx);
    }
}
export class LineWithAnyTextExpectedContext extends LineExpectedContext {
    public constructor(ctx: LineExpectedContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public hashtag(): HashtagContext[];
    public hashtag(i: number): HashtagContext | null;
    public hashtag(i?: number): HashtagContext[] | HashtagContext | null {
        if (i === undefined) {
            return this.getRuleContexts(HashtagContext);
        }

        return this.getRuleContext(i, HashtagContext);
    }
    public override enterRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.enterLineWithAnyTextExpected) {
             listener.enterLineWithAnyTextExpected(this);
        }
    }
    public override exitRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.exitLineWithAnyTextExpected) {
             listener.exitLineWithAnyTextExpected(this);
        }
    }
}
export class LineWithSpecificTextExpectedContext extends LineExpectedContext {
    public constructor(ctx: LineExpectedContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public TEXT(): antlr.TerminalNode {
        return this.getToken(YarnSpinnerTestPlanParser.TEXT, 0)!;
    }
    public hashtag(): HashtagContext[];
    public hashtag(i: number): HashtagContext | null;
    public hashtag(i?: number): HashtagContext[] | HashtagContext | null {
        if (i === undefined) {
            return this.getRuleContexts(HashtagContext);
        }

        return this.getRuleContext(i, HashtagContext);
    }
    public override enterRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.enterLineWithSpecificTextExpected) {
             listener.enterLineWithSpecificTextExpected(this);
        }
    }
    public override exitRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.exitLineWithSpecificTextExpected) {
             listener.exitLineWithSpecificTextExpected(this);
        }
    }
}


export class OptionExpectedContext extends antlr.ParserRuleContext {
    public _isDisabled?: Token | null;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public TEXT(): antlr.TerminalNode {
        return this.getToken(YarnSpinnerTestPlanParser.TEXT, 0)!;
    }
    public hashtag(): HashtagContext[];
    public hashtag(i: number): HashtagContext | null;
    public hashtag(i?: number): HashtagContext[] | HashtagContext | null {
        if (i === undefined) {
            return this.getRuleContexts(HashtagContext);
        }

        return this.getRuleContext(i, HashtagContext);
    }
    public override get ruleIndex(): number {
        return YarnSpinnerTestPlanParser.RULE_optionExpected;
    }
    public override enterRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.enterOptionExpected) {
             listener.enterOptionExpected(this);
        }
    }
    public override exitRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.exitOptionExpected) {
             listener.exitOptionExpected(this);
        }
    }
}


export class CommandExpectedContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public TEXT(): antlr.TerminalNode {
        return this.getToken(YarnSpinnerTestPlanParser.TEXT, 0)!;
    }
    public override get ruleIndex(): number {
        return YarnSpinnerTestPlanParser.RULE_commandExpected;
    }
    public override enterRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.enterCommandExpected) {
             listener.enterCommandExpected(this);
        }
    }
    public override exitRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.exitCommandExpected) {
             listener.exitCommandExpected(this);
        }
    }
}


export class StopExpectedContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return YarnSpinnerTestPlanParser.RULE_stopExpected;
    }
    public override enterRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.enterStopExpected) {
             listener.enterStopExpected(this);
        }
    }
    public override exitRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.exitStopExpected) {
             listener.exitStopExpected(this);
        }
    }
}


export class ActionSelectContext extends antlr.ParserRuleContext {
    public _option?: Token | null;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public NUMBER(): antlr.TerminalNode {
        return this.getToken(YarnSpinnerTestPlanParser.NUMBER, 0)!;
    }
    public override get ruleIndex(): number {
        return YarnSpinnerTestPlanParser.RULE_actionSelect;
    }
    public override enterRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.enterActionSelect) {
             listener.enterActionSelect(this);
        }
    }
    public override exitRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.exitActionSelect) {
             listener.exitActionSelect(this);
        }
    }
}


export class ActionSetContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public override get ruleIndex(): number {
        return YarnSpinnerTestPlanParser.RULE_actionSet;
    }
    public override copyFrom(ctx: ActionSetContext): void {
        super.copyFrom(ctx);
    }
}
export class ActionSetBoolContext extends ActionSetContext {
    public _variable?: Token | null;
    public _value?: Token | null;
    public constructor(ctx: ActionSetContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public VARIABLE(): antlr.TerminalNode {
        return this.getToken(YarnSpinnerTestPlanParser.VARIABLE, 0)!;
    }
    public BOOL(): antlr.TerminalNode {
        return this.getToken(YarnSpinnerTestPlanParser.BOOL, 0)!;
    }
    public override enterRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.enterActionSetBool) {
             listener.enterActionSetBool(this);
        }
    }
    public override exitRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.exitActionSetBool) {
             listener.exitActionSetBool(this);
        }
    }
}
export class ActionSetNumberContext extends ActionSetContext {
    public _variable?: Token | null;
    public _value?: Token | null;
    public constructor(ctx: ActionSetContext) {
        super(ctx.parent, ctx.invokingState);
        super.copyFrom(ctx);
    }
    public VARIABLE(): antlr.TerminalNode {
        return this.getToken(YarnSpinnerTestPlanParser.VARIABLE, 0)!;
    }
    public NUMBER(): antlr.TerminalNode {
        return this.getToken(YarnSpinnerTestPlanParser.NUMBER, 0)!;
    }
    public override enterRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.enterActionSetNumber) {
             listener.enterActionSetNumber(this);
        }
    }
    public override exitRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.exitActionSetNumber) {
             listener.exitActionSetNumber(this);
        }
    }
}


export class ActionSetSaliencyModeContext extends antlr.ParserRuleContext {
    public _saliencyMode?: Token | null;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(YarnSpinnerTestPlanParser.IDENTIFIER, 0)!;
    }
    public override get ruleIndex(): number {
        return YarnSpinnerTestPlanParser.RULE_actionSetSaliencyMode;
    }
    public override enterRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.enterActionSetSaliencyMode) {
             listener.enterActionSetSaliencyMode(this);
        }
    }
    public override exitRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.exitActionSetSaliencyMode) {
             listener.exitActionSetSaliencyMode(this);
        }
    }
}


export class ActionJumpToNodeContext extends antlr.ParserRuleContext {
    public _nodeName?: Token | null;
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(YarnSpinnerTestPlanParser.IDENTIFIER, 0)!;
    }
    public override get ruleIndex(): number {
        return YarnSpinnerTestPlanParser.RULE_actionJumpToNode;
    }
    public override enterRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.enterActionJumpToNode) {
             listener.enterActionJumpToNode(this);
        }
    }
    public override exitRule(listener: YarnSpinnerTestPlanListener): void {
        if(listener.exitActionJumpToNode) {
             listener.exitActionJumpToNode(this);
        }
    }
}
