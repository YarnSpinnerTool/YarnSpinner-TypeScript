// Generated from /Users/desplesda/Work/YarnSpinner/YarnSpinner.Tests/TestPlan/YarnSpinnerTestPlan.g4 by ANTLR 4.13.1

import { ErrorNode, ParseTreeListener, ParserRuleContext, TerminalNode } from "antlr4ng";


import { TestplanContext } from "./YarnSpinnerTestPlanParser.js";
import { RunContext } from "./YarnSpinnerTestPlanParser.js";
import { StepContext } from "./YarnSpinnerTestPlanParser.js";
import { HashtagContext } from "./YarnSpinnerTestPlanParser.js";
import { LineWithSpecificTextExpectedContext } from "./YarnSpinnerTestPlanParser.js";
import { LineWithAnyTextExpectedContext } from "./YarnSpinnerTestPlanParser.js";
import { OptionExpectedContext } from "./YarnSpinnerTestPlanParser.js";
import { CommandExpectedContext } from "./YarnSpinnerTestPlanParser.js";
import { StopExpectedContext } from "./YarnSpinnerTestPlanParser.js";
import { ActionSelectContext } from "./YarnSpinnerTestPlanParser.js";
import { ActionSetBoolContext } from "./YarnSpinnerTestPlanParser.js";
import { ActionSetNumberContext } from "./YarnSpinnerTestPlanParser.js";
import { ActionSetSaliencyModeContext } from "./YarnSpinnerTestPlanParser.js";
import { ActionJumpToNodeContext } from "./YarnSpinnerTestPlanParser.js";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `YarnSpinnerTestPlanParser`.
 */
export class YarnSpinnerTestPlanListener implements ParseTreeListener {
    /**
     * Enter a parse tree produced by `YarnSpinnerTestPlanParser.testplan`.
     * @param ctx the parse tree
     */
    enterTestplan?: (ctx: TestplanContext) => void;
    /**
     * Exit a parse tree produced by `YarnSpinnerTestPlanParser.testplan`.
     * @param ctx the parse tree
     */
    exitTestplan?: (ctx: TestplanContext) => void;
    /**
     * Enter a parse tree produced by `YarnSpinnerTestPlanParser.run`.
     * @param ctx the parse tree
     */
    enterRun?: (ctx: RunContext) => void;
    /**
     * Exit a parse tree produced by `YarnSpinnerTestPlanParser.run`.
     * @param ctx the parse tree
     */
    exitRun?: (ctx: RunContext) => void;
    /**
     * Enter a parse tree produced by `YarnSpinnerTestPlanParser.step`.
     * @param ctx the parse tree
     */
    enterStep?: (ctx: StepContext) => void;
    /**
     * Exit a parse tree produced by `YarnSpinnerTestPlanParser.step`.
     * @param ctx the parse tree
     */
    exitStep?: (ctx: StepContext) => void;
    /**
     * Enter a parse tree produced by `YarnSpinnerTestPlanParser.hashtag`.
     * @param ctx the parse tree
     */
    enterHashtag?: (ctx: HashtagContext) => void;
    /**
     * Exit a parse tree produced by `YarnSpinnerTestPlanParser.hashtag`.
     * @param ctx the parse tree
     */
    exitHashtag?: (ctx: HashtagContext) => void;
    /**
     * Enter a parse tree produced by the `lineWithSpecificTextExpected`
     * labeled alternative in `YarnSpinnerTestPlanParser.lineExpected`.
     * @param ctx the parse tree
     */
    enterLineWithSpecificTextExpected?: (ctx: LineWithSpecificTextExpectedContext) => void;
    /**
     * Exit a parse tree produced by the `lineWithSpecificTextExpected`
     * labeled alternative in `YarnSpinnerTestPlanParser.lineExpected`.
     * @param ctx the parse tree
     */
    exitLineWithSpecificTextExpected?: (ctx: LineWithSpecificTextExpectedContext) => void;
    /**
     * Enter a parse tree produced by the `lineWithAnyTextExpected`
     * labeled alternative in `YarnSpinnerTestPlanParser.lineExpected`.
     * @param ctx the parse tree
     */
    enterLineWithAnyTextExpected?: (ctx: LineWithAnyTextExpectedContext) => void;
    /**
     * Exit a parse tree produced by the `lineWithAnyTextExpected`
     * labeled alternative in `YarnSpinnerTestPlanParser.lineExpected`.
     * @param ctx the parse tree
     */
    exitLineWithAnyTextExpected?: (ctx: LineWithAnyTextExpectedContext) => void;
    /**
     * Enter a parse tree produced by `YarnSpinnerTestPlanParser.optionExpected`.
     * @param ctx the parse tree
     */
    enterOptionExpected?: (ctx: OptionExpectedContext) => void;
    /**
     * Exit a parse tree produced by `YarnSpinnerTestPlanParser.optionExpected`.
     * @param ctx the parse tree
     */
    exitOptionExpected?: (ctx: OptionExpectedContext) => void;
    /**
     * Enter a parse tree produced by `YarnSpinnerTestPlanParser.commandExpected`.
     * @param ctx the parse tree
     */
    enterCommandExpected?: (ctx: CommandExpectedContext) => void;
    /**
     * Exit a parse tree produced by `YarnSpinnerTestPlanParser.commandExpected`.
     * @param ctx the parse tree
     */
    exitCommandExpected?: (ctx: CommandExpectedContext) => void;
    /**
     * Enter a parse tree produced by `YarnSpinnerTestPlanParser.stopExpected`.
     * @param ctx the parse tree
     */
    enterStopExpected?: (ctx: StopExpectedContext) => void;
    /**
     * Exit a parse tree produced by `YarnSpinnerTestPlanParser.stopExpected`.
     * @param ctx the parse tree
     */
    exitStopExpected?: (ctx: StopExpectedContext) => void;
    /**
     * Enter a parse tree produced by `YarnSpinnerTestPlanParser.actionSelect`.
     * @param ctx the parse tree
     */
    enterActionSelect?: (ctx: ActionSelectContext) => void;
    /**
     * Exit a parse tree produced by `YarnSpinnerTestPlanParser.actionSelect`.
     * @param ctx the parse tree
     */
    exitActionSelect?: (ctx: ActionSelectContext) => void;
    /**
     * Enter a parse tree produced by the `actionSetBool`
     * labeled alternative in `YarnSpinnerTestPlanParser.actionSet`.
     * @param ctx the parse tree
     */
    enterActionSetBool?: (ctx: ActionSetBoolContext) => void;
    /**
     * Exit a parse tree produced by the `actionSetBool`
     * labeled alternative in `YarnSpinnerTestPlanParser.actionSet`.
     * @param ctx the parse tree
     */
    exitActionSetBool?: (ctx: ActionSetBoolContext) => void;
    /**
     * Enter a parse tree produced by the `actionSetNumber`
     * labeled alternative in `YarnSpinnerTestPlanParser.actionSet`.
     * @param ctx the parse tree
     */
    enterActionSetNumber?: (ctx: ActionSetNumberContext) => void;
    /**
     * Exit a parse tree produced by the `actionSetNumber`
     * labeled alternative in `YarnSpinnerTestPlanParser.actionSet`.
     * @param ctx the parse tree
     */
    exitActionSetNumber?: (ctx: ActionSetNumberContext) => void;
    /**
     * Enter a parse tree produced by `YarnSpinnerTestPlanParser.actionSetSaliencyMode`.
     * @param ctx the parse tree
     */
    enterActionSetSaliencyMode?: (ctx: ActionSetSaliencyModeContext) => void;
    /**
     * Exit a parse tree produced by `YarnSpinnerTestPlanParser.actionSetSaliencyMode`.
     * @param ctx the parse tree
     */
    exitActionSetSaliencyMode?: (ctx: ActionSetSaliencyModeContext) => void;
    /**
     * Enter a parse tree produced by `YarnSpinnerTestPlanParser.actionJumpToNode`.
     * @param ctx the parse tree
     */
    enterActionJumpToNode?: (ctx: ActionJumpToNodeContext) => void;
    /**
     * Exit a parse tree produced by `YarnSpinnerTestPlanParser.actionJumpToNode`.
     * @param ctx the parse tree
     */
    exitActionJumpToNode?: (ctx: ActionJumpToNodeContext) => void;

    visitTerminal(node: TerminalNode): void {}
    visitErrorNode(node: ErrorNode): void {}
    enterEveryRule(node: ParserRuleContext): void {}
    exitEveryRule(node: ParserRuleContext): void {}
}

