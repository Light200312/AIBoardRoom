/**
 * Whiteboard Controller
 * WHY: Let the frontend load the board on reconnect, and let the founder make
 *      direct edits (delete a hallucinated problem, manually resolve one, etc.)
 *      without going through the debate flow.
 */

import { getOrCreateWhiteboard, saveWhiteboard, applyWhiteboardOps } from "./whiteboard.service.js";

export async function getWhiteboard(req, res) {
  try {
    const { sessionId, topic = "" } = req.query || {};
    if (!sessionId) return res.status(400).json({ message: "sessionId is required." });
    const board = await getOrCreateWhiteboard(String(sessionId), String(topic));
    return res.json({ whiteboard: board });
  } catch (error) {
    console.error("Whiteboard fetch failed:", error);
    return res.status(500).json({ message: "Failed to fetch whiteboard.", error: error.message });
  }
}

/**
 * applyFounderOp - Founder-initiated edit (resolve/delete/reopen/add), applied
 * through the same op pipeline the AI uses, then persisted.
 * body: { sessionId, topic, op: { type, ... } }
 */
export async function applyFounderOp(req, res) {
  try {
    const { sessionId, topic = "", op } = req.body || {};
    if (!sessionId || !op?.type) return res.status(400).json({ message: "sessionId and op.type are required." });
    const board = await getOrCreateWhiteboard(String(sessionId), String(topic));
    const nextBoard = applyWhiteboardOps(board, [{ ...op, resolvedBy: op.resolvedBy || "Founder" }]);
    const saved = await saveWhiteboard(String(sessionId), nextBoard);
    return res.json({ whiteboard: saved });
  } catch (error) {
    console.error("Whiteboard update failed:", error);
    return res.status(500).json({ message: "Failed to update whiteboard.", error: error.message });
  }
}
