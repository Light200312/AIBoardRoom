/**
 * Combat Controller
 * WHY: Manage debate/combat mode interactions between player and AI opponents
 * HOW: Orchestrate opponent selection, turn logic, judgment, and verdict
 * RESULT: Combat session data with team selections, judgments, and final verdict
 */

import { chooseOpponentTeam, chooseOpponentTurn, judgeRound, finalizeDebateVerdict } from "./combat.service.js";
import DiscussionReport from "../message/discussionReport.model.js";

/**
 * selectTeam - Choose AI opponent team for the debate
 * WHY: Initialize combat with balanced opponent selection
 * HOW: LLM-based selection from candidate agents based on difficulty and topic
 * RESULT: Opponent team IDs and agent profiles for this combat session
 */
export async function selectTeam(req, res) {
  try {
    const { topic, candidateIds = [], count = 3, difficulty = "standard", ollamaModel = "" } = req.body || {};
    if (!topic) return res.status(400).json({ message: "topic is required." });
    const result = await chooseOpponentTeam({ topic, candidateIds, count, difficulty, ollamaModel });
    return res.json(result);
  } catch (error) { console.error("Combat select-team failed:", error); return res.status(500).json({ message: "Failed to select opponent team.", error: error.message }); }
}


/**
 * nextTurn - Generate opponent response for current combat turn
 * WHY: Keep debate moving with intelligent opponent arguments
 * HOW: Analyze user argument, select opposing agent, generate counter-argument
 * RESULT: Opponent agent ID and their tactical argument response
 */
export async function nextTurn(req, res) {
  try {
    const { topic, opponentTeamIds = [], userArgument = "", strategies = [], difficulty = "standard", ollamaModel = "" } = req.body || {};
    if (!topic) return res.status(400).json({ message: "topic is required." });
    if (!opponentTeamIds.length) return res.status(400).json({ message: "opponentTeamIds is required." });
    if (!strategies.length) return res.status(400).json({ message: "strategies is required." });
    const result = await chooseOpponentTurn({ topic, opponentTeamIds, userArgument, strategies, difficulty, ollamaModel });
    return res.json(result);
  } catch (error) { console.error("Combat next-turn failed:", error); return res.status(500).json({ message: "Failed to select opponent turn.", error: error.message }); }
}


/**
 * judge - Evaluate and score a single debate round
 * WHY: Provide objective assessment of argument quality
 * HOW: LLM comparison of both arguments on topic relevance, logic, persuasion
 * RESULT: Round judgment with scores, reasoning, and winner determination
 */
export async function judge(req, res) {
  try {
    const { topic, playerArgument, opponentArgument, ollamaModel = "" } = req.body || {};
    if (!topic) return res.status(400).json({ message: "topic is required." });
    if (!playerArgument || !opponentArgument) return res.status(400).json({ message: "playerArgument and opponentArgument are required." });
    const result = await judgeRound({ topic, playerArgument, opponentArgument, ollamaModel });
    return res.json(result);
  } catch (error) { console.error("Combat judge failed:", error); return res.status(500).json({ message: "Failed to judge round.", error: error.message }); }
}


/**
 * verdict - Determine overall combat winner and final assessment
 * WHY: Conclude debate session with comprehensive final analysis
 * HOW: Aggregate round scores, analyze performance, generate final verdict (mode-specific)
 * RESULT: Combat winner, performance metrics, and detailed conclusion summary
 */
export async function verdict(req, res) {
  try {
    const { sessionId = "", topic, playerTeam = [], opponentTeam = [], combatLog = [], roundResults = [], scores = {}, ollamaModel = "", mode = "combat" } = req.body || {};
    if (!topic) return res.status(400).json({ message: "topic is required." });
    const generatedAt = Date.now();
    const result = await finalizeDebateVerdict({ topic, playerTeam, opponentTeam, combatLog, roundResults, scores, ollamaModel, mode });
    const verdict = {
      ...result,
      mode,
      topic,
      sessionId: String(sessionId || "").trim(),
      generatedAt,
    };

    if (verdict.sessionId) {
      await DiscussionReport.findOneAndUpdate(
        { sessionId: verdict.sessionId, topic },
        {
          $set: {
            mode,
            verdict,
            messageCount: Array.isArray(combatLog) ? combatLog.length : 0,
            generatedAt,
            updatedAt: generatedAt,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return res.json({ verdict });
  } catch (error) { console.error("Combat final verdict failed:", error); return res.status(500).json({ message: "Failed to finalize verdict.", error: error.message }); }
}
