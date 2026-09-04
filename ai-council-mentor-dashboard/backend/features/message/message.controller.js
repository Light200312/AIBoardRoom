/**
 * Message Controller
 * WHY: Handle message storage and retrieval for conversation continuity
 * HOW: Query MongoDB for messages by session/topic, validate inputs, sanitize data
 * RESULT: JSON response with stored messages or error status
 */

import Message from "./message.model.js";
import DiscussionReport from "./discussionReport.model.js";
import { generateMessageId, sanitizeStringArray } from "../../shared/helpers.js";

/**
 * listMessages - Retrieve stored messages by session and topic
 * WHY: Allow users to restore conversation history across sessions
 * HOW: Filter database by sessionId and topic, sort chronologically
 * RESULT: Array of message objects with speaker info and text
 */
export async function listMessages(req, res) {
  try {
    const { sessionId, topic } = req.query || {};
    const filter = {};
    if (sessionId) filter.sessionId = String(sessionId);
    if (topic) filter.topic = String(topic);
    const [messages, reports] = await Promise.all([
      Message.find(filter).sort({ timestamp: 1 }).lean(),
      DiscussionReport.find(filter).sort({ updatedAt: -1 }).lean(),
    ]);
    return res.json({ messages, reports });
  } catch (error) { console.error("Message list failed:", error); return res.status(500).json({ message: "Failed to fetch messages.", error: error.message }); }
}


/**
 * createMessage - Store a new message in the conversation
 * WHY: Persist messages for audit trail and session history
 * HOW: Validate required fields, sanitize arrays, generate unique ID, save to DB
 * RESULT: Created message object with generated ID and timestamp
 */
export async function createMessage(req, res) {
  try {
    const {
      sessionId,
      topic,
      sessionParticipantIds = [],
      sessionParticipants = [],
      speakerId,
      speakerName,
      speakerInitials,
      isUser,
      text,
      toolCalls = [],
      timestamp,
    } = req.body || {};
    if (!speakerId || !speakerName || !speakerInitials || typeof isUser !== "boolean" || !text) return res.status(400).json({ message: "Invalid message payload." });
    if (!sessionId || !topic) return res.status(400).json({ message: "sessionId and topic are required." });
    const created = await Message.create({
      id: generateMessageId(), sessionId, topic,
      sessionParticipantIds: sanitizeStringArray(sessionParticipantIds),
      sessionParticipants: Array.isArray(sessionParticipants) ? sessionParticipants.map((p) => ({ id: String(p?.id || "").trim(), name: String(p?.name || "").trim(), role: String(p?.role || "").trim(), avatarInitials: String(p?.avatarInitials || "").trim() })).filter((p) => p.id && p.name) : [],
      speakerId, speakerName, speakerInitials, isUser, text, timestamp: timestamp || Date.now(),
      toolCalls: Array.isArray(toolCalls)
        ? toolCalls.map((tool) => ({
            toolName: String(tool?.toolName || "").trim(),
            args: tool?.args && typeof tool.args === "object" ? tool.args : {},
            ok: typeof tool?.ok === "boolean" ? tool.ok : true,
            text: String(tool?.text || "").trim(),
            durationMs: Number(tool?.durationMs || 0),
          })).filter((tool) => tool.toolName)
        : [],
    });
    return res.status(201).json({ message: created });
  } catch (error) { console.error("Message create failed:", error); return res.status(500).json({ message: "Failed to save message.", error: error.message }); }
}
