// Agent schema for debate characters:
// stores persona, stats, and metadata used for UI display and LLM prompting.
import mongoose from "mongoose";
const agentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    era: { type: String, required: true, trim: true },
    // Core debate stats used by the game logic and balancing.
    stats: {
      logic: { type: Number, required: true },
      rhetoric: { type: Number, required: true },
      bias: { type: Number, required: true },
    },
    // Prompt-friendly description for reasoning style + personality traits.
    description: { type: String, required: true, trim: true },
    personalityTraits: { type: String, trim: true, default: "" },
    backstoryLore: { type: String, trim: true, default: "" },
    speechStyle: { type: String, trim: true, default: "" },
    domain: { type: String, trim: true, default: "other" },
    isFantasy: { type: Boolean, default: false },
    sourceTitle: { type: String, trim: true, default: "" },
    sourceType: { type: String, trim: true, default: "" },
    genre: { type: String, trim: true, default: "" },
    specialAbility: { type: String, required: true, trim: true },
    avatarInitials: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true },
    // Ownership + provenance metadata (who created the agent and why).
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdFrom: {
      type: String,
      enum: ["manual", "ai_suggest", "ai_find"],
      default: "manual",
    },
    sourceTopic: { type: String, trim: true },
    sourceNameQuery: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

const Agent = mongoose.model("Agent", agentSchema);

export default Agent;
