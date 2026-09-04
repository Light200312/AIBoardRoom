import mongoose from "mongoose";

const topicMemorySchema = new mongoose.Schema({
  topic: { type: String, required: true, trim: true, index: true },
  sessionId: { type: String, trim: true, index: true, default: "" },
  summary: { type: String, trim: true, default: "" },
  keyFacts: [{ type: String, trim: true }],
  openQuestions: [{ type: String, trim: true }],
  lastUpdated: { type: Number, default: Date.now },
  lastFlushedAt: { type: Number, default: 0 },
  messageCount: { type: Number, default: 0 },
});

topicMemorySchema.index({ topic: 1, sessionId: 1 }, { unique: true });

const TopicMemory = mongoose.model("TopicMemory", topicMemorySchema);

export default TopicMemory;
