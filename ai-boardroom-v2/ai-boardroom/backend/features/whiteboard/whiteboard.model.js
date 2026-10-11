/**
 * Whiteboard Model
 * WHY: Persist the "single source of truth" board for a Boardroom debate session —
 *      problems raised, whether they've been resolved, and open questions.
 * HOW: One document per sessionId. Agents/orchestrator update it via tool-call-style
 *      ops (see whiteboard.service.js); the founder can also edit it directly.
 */

import mongoose from "mongoose";

const problemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    raisedBy: { type: String, trim: true, default: "" },
    raisedMessageId: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
    solution: { type: String, trim: true, default: "" },
    resolvedBy: { type: String, trim: true, default: "" },
    resolvedMessageId: { type: String, trim: true, default: "" },
    createdAt: { type: Number, default: () => Date.now() },
    resolvedAt: { type: Number, default: null },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    raisedBy: { type: String, trim: true, default: "" },
    raisedMessageId: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
    answer: { type: String, trim: true, default: "" },
    resolvedBy: { type: String, trim: true, default: "" },
    resolvedMessageId: { type: String, trim: true, default: "" },
    createdAt: { type: Number, default: () => Date.now() },
    resolvedAt: { type: Number, default: null },
  },
  { _id: false }
);

const whiteboardSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, trim: true, index: true },
  topic: { type: String, trim: true, default: "" },
  problems: { type: [problemSchema], default: [] },
  openQuestions: { type: [questionSchema], default: [] },
  updatedAt: { type: Number, default: () => Date.now() },
});

const Whiteboard = mongoose.model("Whiteboard", whiteboardSchema);

export default Whiteboard;
