import mongoose from "mongoose";

const discussionReportSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, trim: true, index: true },
    topic: { type: String, required: true, trim: true, index: true },
    mode: { type: String, required: true, trim: true, default: "combat" },
    verdict: { type: mongoose.Schema.Types.Mixed, required: true },
    messageCount: { type: Number, default: 0 },
    generatedAt: { type: Number, required: true, default: Date.now },
    updatedAt: { type: Number, required: true, default: Date.now },
  },
  { minimize: false }
);

discussionReportSchema.index({ sessionId: 1, topic: 1 }, { unique: true });

const DiscussionReport = mongoose.model("DiscussionReport", discussionReportSchema);

export default DiscussionReport;
