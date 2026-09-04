// ─────────────────────────────────────────────────────────────
// Memory Service — manages topic-scoped conversation memory
// with minimal and rich summarization modes.
// ─────────────────────────────────────────────────────────────

import TopicMemory from "./topicMemory.model.js";
import { callOrchestratorLLM } from "./llmClient.js";
import { truncateText } from "./helpers.js";

// ─── Constants ──────────────────────────────────────────────

const ACTIVE_CONTEXT_LIMIT = 8;
const FLUSH_MIN_MESSAGES = 6;
const MAX_SUMMARY_MESSAGES = 24;

// ─── Internal Helpers ───────────────────────────────────────

function normalizeTopic(taskGoal, topic) {
  const fromTopic = String(topic || "").trim();
  if (fromTopic) return fromTopic;
  const fromGoal = String(taskGoal || "").trim();
  return fromGoal;
}

function sortMessages(messages = []) {
  return [...messages].sort((a, b) => Number(a?.timestamp || 0) - Number(b?.timestamp || 0));
}

function summarizeHistory(messages = [], limit = ACTIVE_CONTEXT_LIMIT) {
  return messages
    .slice(-limit)
    .map((m) => `${m.speakerName}: ${truncateText(m.text)}`)
    .join("\n");
}

function getLastUserMessage(messages = []) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.isUser) return messages[i];
  }
  return null;
}

function shouldTriggerRetrieval(messages = []) {
  const lastUser = getLastUserMessage(messages);
  if (!lastUser?.text) return false;
  const text = String(lastUser.text).toLowerCase();
  return [
    "earlier",
    "previous",
    "before",
    "as we said",
    "as you said",
    "back to",
    "remember",
    "you mentioned",
    "we mentioned",
    "that point",
    "that claim",
    "from above",
  ].some((phrase) => text.includes(phrase));
}

function extractPendingMessages(messages = [], lastFlushedAt, activeLimit = ACTIVE_CONTEXT_LIMIT) {
  const sorted = sortMessages(messages).filter((m) => String(m?.speakerId || "") !== "orchestrator");
  const cutoffIndex = Math.max(0, sorted.length - activeLimit);
  const olderMessages = sorted.slice(0, cutoffIndex);
  const pending = olderMessages.filter((m) => Number(m?.timestamp || 0) > Number(lastFlushedAt || 0));
  return pending.slice(0, MAX_SUMMARY_MESSAGES);
}

function formatTranscript(messages = []) {
  return messages.map((m) => `${m.speakerName}: ${truncateText(m.text)}`).join("\n");
}

// ─── Summarizers ────────────────────────────────────────────

async function summarizeMinimal({ topic, priorSummary, messages }) {
  const system = "You are a concise memory summarizer for a discussion assistant.";
  const prompt = `Topic:
${topic}

Prior summary:
${priorSummary || "None"}

New transcript excerpt:
${formatTranscript(messages) || "No new messages."}

Update the summary in <= 120 words. Focus on durable facts, decisions, and unresolved points. Return only the summary text.`;
  const text = await callOrchestratorLLM({ system, prompt, temperature: 0.2 });
  return String(text || "").trim();
}

async function summarizeRich({ topic, priorSummary, messages, priorFacts = [], priorQuestions = [] }) {
  const system = "You are a discussion memory curator. Extract durable knowledge only.";
  const prompt = `Topic:
${topic}

Prior summary:
${priorSummary || "None"}

Prior key facts:
${priorFacts.length ? priorFacts.map((f) => `- ${f}`).join("\n") : "None"}

Prior open questions:
${priorQuestions.length ? priorQuestions.map((q) => `- ${q}`).join("\n") : "None"}

New transcript excerpt:
${formatTranscript(messages) || "No new messages."}

Return strict JSON with:
{
  "summary": "updated summary in <= 140 words",
  "keyFacts": ["up to 6 concise facts"],
  "openQuestions": ["up to 4 unresolved questions"]
}`;
  const raw = await callOrchestratorLLM({ system, prompt, temperature: 0.2 });
  try {
    const parsed = JSON.parse(raw);
    return {
      summary: String(parsed.summary || "").trim(),
      keyFacts: Array.isArray(parsed.keyFacts) ? parsed.keyFacts.map((f) => String(f).trim()).filter(Boolean) : [],
      openQuestions: Array.isArray(parsed.openQuestions)
        ? parsed.openQuestions.map((q) => String(q).trim()).filter(Boolean)
        : [],
    };
  } catch (_) {
    return {
      summary: String(raw || "").trim(),
      keyFacts: priorFacts,
      openQuestions: priorQuestions,
    };
  }
}

// ─── Topic Memory Updates ───────────────────────────────────

async function updateTopicMemory({ topic, sessionId = "", messages = [], memoryMode = "minimal" }) {
  if (!topic) return { memory: null, updated: false };
  const key = { topic, sessionId: String(sessionId || "") };
  const existing = await TopicMemory.findOne(key).lean();

  const lastFlushedAt = Number(existing?.lastFlushedAt || 0);
  const pending = extractPendingMessages(messages, lastFlushedAt);
  if (!pending.length) return { memory: existing || null, updated: false };

  if (pending.length < FLUSH_MIN_MESSAGES && existing?.summary) {
    return { memory: existing, updated: false };
  }

  const newestTimestamp = Number(pending[pending.length - 1]?.timestamp || Date.now());
  const base = {
    summary: existing?.summary || "",
    keyFacts: existing?.keyFacts || [],
    openQuestions: existing?.openQuestions || [],
  };

  let nextSummary = base.summary;
  let nextFacts = base.keyFacts;
  let nextQuestions = base.openQuestions;

  if (memoryMode === "rich") {
    const result = await summarizeRich({
      topic,
      priorSummary: base.summary,
      priorFacts: base.keyFacts,
      priorQuestions: base.openQuestions,
      messages: pending,
    });
    nextSummary = result.summary || base.summary;
    nextFacts = result.keyFacts.length ? result.keyFacts : base.keyFacts;
    nextQuestions = result.openQuestions.length ? result.openQuestions : base.openQuestions;
  } else {
    nextSummary = await summarizeMinimal({
      topic,
      priorSummary: base.summary,
      messages: pending,
    });
  }

  const update = {
    topic,
    sessionId: String(sessionId || ""),
    summary: nextSummary,
    keyFacts: nextFacts,
    openQuestions: nextQuestions,
    lastUpdated: Date.now(),
    lastFlushedAt: newestTimestamp,
    messageCount: Number(existing?.messageCount || 0) + pending.length,
  };

  const memory = await TopicMemory.findOneAndUpdate(key, { $set: update }, { upsert: true, new: true }).lean();
  return { memory, updated: true };
}

// ─── Memory Formatting ──────────────────────────────────────

function formatMemoryBlock(memory, { mode = "minimal", triggerRetrieval = false } = {}) {
  if (!memory?.summary) return "";
  if (mode !== "rich" || !triggerRetrieval) {
    return `Topic memory (summary):\n${memory.summary}`;
  }
  const facts = (memory.keyFacts || []).slice(0, 6);
  const questions = (memory.openQuestions || []).slice(0, 4);
  const parts = [
    "Topic memory:",
    `Summary: ${memory.summary}`,
    facts.length ? `Key facts:\n${facts.map((f) => `- ${f}`).join("\n")}` : "",
    questions.length ? `Open questions:\n${questions.map((q) => `- ${q}`).join("\n")}` : "",
  ].filter(Boolean);
  return parts.join("\n");
}

// ─── Context Builder (main export) ──────────────────────────

async function buildContextSummary({ taskGoal, topic, sessionId, messages, memoryMode = "minimal" }) {
  const resolvedTopic = normalizeTopic(taskGoal, topic);
  const activeContext = summarizeHistory(messages);

  if (!resolvedTopic || memoryMode === "off") {
    return { contextSummary: activeContext, memory: null };
  }

  let memory = null;
  try {
    const result = await updateTopicMemory({
      topic: resolvedTopic,
      sessionId,
      messages,
      memoryMode,
    });
    memory = result.memory || null;
  } catch (_) {
    memory = null;
  }

  const memoryBlock = formatMemoryBlock(memory, {
    mode: memoryMode,
    triggerRetrieval: shouldTriggerRetrieval(messages),
  });

  const contextSummary = [memoryBlock, activeContext].filter(Boolean).join("\n\n");
  return { contextSummary, memory };
}

export {
  buildContextSummary,
  summarizeHistory,
  normalizeTopic,
  updateTopicMemory,
  ACTIVE_CONTEXT_LIMIT,
};
