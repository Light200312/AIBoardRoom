// ─────────────────────────────────────────────────────────────
// Agent controller — request handling for /api/agents routes.
// ─────────────────────────────────────────────────────────────

import Agent from "./agent.model.js";
import { runAgentStep } from "./agentRuntime.service.js";
import {
  findOrDraftAgentByName,
  normalizeAgentDraft,
  suggestAgentsFromTopic,
} from "./agentCreator.service.js";
import { escapeRegex, stripUndefined } from "../../shared/helpers.js";

// ── GET / ────────────────────────────────────────────────────
export async function listAgents(_req, res) {
  try {
    const agents = await Agent.find({}).sort({ id: 1 }).lean();
    return res.json({ agents });
  } catch (error) {
    console.error("Agent list failed:", error);
    return res.status(500).json({ message: "Failed to fetch agents.", error: error.message });
  }
}

// ── POST / ───────────────────────────────────────────────────
export async function createAgent(req, res) {
  try {
    const payload = req.body || {};
    const createdBy = req.auth?.sub ? req.auth.sub : undefined;

    const draft = normalizeAgentDraft(payload, {
      topic: payload?.sourceTopic,
      createdBy,
      createdFrom: payload?.createdFrom || "manual",
      nameQuery: payload?.sourceNameQuery,
    });

    if (!draft.name) return res.status(400).json({ message: "name is required." });
    if (!draft.role) return res.status(400).json({ message: "role is required." });
    if (!draft.era) return res.status(400).json({ message: "era is required." });
    if (!draft.description) return res.status(400).json({ message: "description is required." });

    const existingById = await Agent.findOne({ id: draft.id }).lean();
    if (existingById) {
      return res.status(409).json({ message: "Agent id already exists.", agent: existingById });
    }

    const existingByName = await Agent.findOne({
      name: new RegExp(`^${escapeRegex(draft.name)}$`, "i"),
    }).lean();
    if (existingByName) {
      return res.status(409).json({ message: "Agent name already exists.", agent: existingByName });
    }

    const agent = await Agent.create(draft);
    return res.status(201).json({ agent });
  } catch (error) {
    console.error("Agent create failed:", error);
    return res.status(500).json({ message: "Failed to create agent.", error: error.message });
  }
}

// ── GET /:id ─────────────────────────────────────────────────
export async function getAgent(req, res) {
  try {
    const agent = await Agent.findOne({ id: req.params.id }).lean();
    if (!agent) return res.status(404).json({ message: "Agent not found." });
    return res.json({ agent });
  } catch (error) {
    console.error("Agent fetch failed:", error);
    return res.status(500).json({ message: "Failed to fetch agent.", error: error.message });
  }
}

// ── PUT /:id ─────────────────────────────────────────────────
export async function updateAgent(req, res) {
  try {
    const payload = req.body || {};
    const updates = stripUndefined({
      personalityTraits: payload.personalityTraits,
      backstoryLore: payload.backstoryLore,
      speechStyle: payload.speechStyle,
      domain: payload.domain,
      isFantasy: payload.isFantasy,
      sourceTitle: payload.sourceTitle,
      sourceType: payload.sourceType,
      genre: payload.genre,
    });

    const agent = await Agent.findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { new: true }
    ).lean();
    if (!agent) return res.status(404).json({ message: "Agent not found." });
    return res.json({ agent });
  } catch (error) {
    console.error("Agent update failed:", error);
    return res.status(500).json({ message: "Failed to update agent.", error: error.message });
  }
}

// ── DELETE /:id ──────────────────────────────────────────────
export async function deleteAgent(req, res) {
  try {
    const agent = await Agent.findOneAndDelete({ id: req.params.id }).lean();
    if (!agent) return res.status(404).json({ message: "Agent not found." });
    return res.json({ agent });
  } catch (error) {
    console.error("Agent delete failed:", error);
    return res.status(500).json({ message: "Failed to delete agent.", error: error.message });
  }
}

// ── POST /suggest ────────────────────────────────────────────
export async function suggestAgents(req, res) {
  try {
    const { topic, maxSuggestions = 6, mode } = req.body || {};
    const createdBy = req.auth?.sub ? req.auth.sub : undefined;
    if (!topic) return res.status(400).json({ message: "topic is required." });

    const result = await suggestAgentsFromTopic({ topic, maxSuggestions, createdBy, mode });
    return res.json({
      analysis: result.analysis,
      suggestions: result.suggestions,
    });
  } catch (error) {
    console.error("Agent suggest failed:", error);
    return res.status(500).json({ message: "Failed to generate suggestions.", error: error.message });
  }
}

// ── POST /find ───────────────────────────────────────────────
export async function findAgent(req, res) {
  try {
    const { name, topic } = req.body || {};
    const createdBy = req.auth?.sub ? req.auth.sub : undefined;
    if (!name) return res.status(400).json({ message: "name is required." });

    const result = await findOrDraftAgentByName({ name, topic, createdBy });
    return res.json({
      existing: result.existing,
      draft: result.draft,
      notes: result.notes || "",
    });
  } catch (error) {
    console.error("Agent find failed:", error);
    return res.status(500).json({ message: "Failed to find character.", error: error.message });
  }
}

// ── POST /:id/respond ────────────────────────────────────────
export async function agentRespond(req, res) {
  try {
    const {
      taskGoal,
      messages = [],
      outputConstraints,
      apiRoutingMode = "persona",
      ollamaModel = "",
      memoryMode = "minimal",
      topic = "",
      sessionId = "",
      discussionMode = "",
      toolCallingEnabled = false,
    } = req.body || {};
    if (!taskGoal) return res.status(400).json({ message: "taskGoal is required." });

    const response = await runAgentStep({
      agentId: req.params.id,
      taskGoal,
      messages,
      outputConstraints,
      apiRoutingMode,
      ollamaModel,
      memoryMode,
      topic,
      sessionId,
      discussionMode,
      toolCallingEnabled,
    });

    return res.json({ response });
  } catch (error) {
    console.error("Agent respond failed:", error);
    return res.status(500).json({ message: "Agent response failed.", error: error.message });
  }
}
