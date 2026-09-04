/**
 * Message Model
 * WHY: Define data structure for persisting conversation messages
 * HOW: mongoose schema with sessionId/topic indexing for fast queries
 * RESULT: Message collection with speaker identity and conversation context
 */

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, trim: true },
  sessionId: { type: String, required: true, trim: true, index: true },
  topic: { type: String, required: true, trim: true, index: true },
  sessionParticipantIds: [{ type: String, trim: true }],
  sessionParticipants: [
    {
      id: { type: String, trim: true },
      name: { type: String, trim: true },
      role: { type: String, trim: true },
      avatarInitials: { type: String, trim: true },
    },
  ],
  speakerId: { type: String, required: true, trim: true },
  speakerName: { type: String, required: true, trim: true },
  speakerInitials: { type: String, required: true, trim: true },
  isUser: { type: Boolean, required: true },
  text: { type: String, required: true, trim: true },
  toolCalls: [
    {
      toolName: { type: String, trim: true },
      args: { type: mongoose.Schema.Types.Mixed, default: {} },
      ok: { type: Boolean, default: true },
      text: { type: String, trim: true },
      durationMs: { type: Number, default: 0 },
    },
  ],
  timestamp: { type: Number, required: true, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
