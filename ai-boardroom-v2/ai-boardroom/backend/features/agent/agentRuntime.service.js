// ─────────────────────────────────────────────────────────────
// Agent Runtime — executes a single agent turn.
// ─────────────────────────────────────────────────────────────

import Agent from "./agent.model.js";
import { callAgentLLM } from "../../shared/llmClient.js";
import { resolveAgentModelConfig } from "../../shared/agentModelRegistry.js";
import { buildContextSummary } from "../../shared/memoryService.js";
import { executeToolCall, buildToolCatalogText, getPreferredToolsForMode } from "../../tools/tools.js";
import { extractFirstJsonObject, generateMessageId, truncateText } from "../../shared/helpers.js";

function buildAgentPrompt({ agent, taskGoal, contextSummary, outputConstraints }) {
  return `Task goal:\n${taskGoal}\n\nContext:\n${contextSummary || "No prior context."}\n\nOutput constraints:\n${outputConstraints || "Be concise, actionable, and role-consistent."}\n\nDeliver your contribution now.`;
}

function formatMessages(messages = [], limit = 8) {
  return messages
    .slice(-limit)
    .map((message) => `${message.speakerName}: ${message.text}`)
    .join("\n");
}

function sanitizePlannedToolCalls(rawToolCalls = [], discussionMode = "") {
  const allowed = new Set(getPreferredToolsForMode(discussionMode));
  return (Array.isArray(rawToolCalls) ? rawToolCalls : [])
    .slice(0, 3)
    .map((toolCall) => ({
      toolName: String(toolCall?.tool || toolCall?.toolName || "").trim(),
      args: toolCall?.arguments && typeof toolCall.arguments === "object"
        ? toolCall.arguments
        : toolCall?.args && typeof toolCall.args === "object"
        ? toolCall.args
        : {},
    }))
    .filter((toolCall) => toolCall.toolName && allowed.has(toolCall.toolName));
}

async function planToolCalls({
  provider,
  model,
  system,
  taskGoal,
  messages,
  contextSummary,
  discussionMode,
  temperature,
}) {
  const toolCatalog = buildToolCatalogText({ discussionMode });
  const prompt = `Decide whether this persona needs tools before answering.

Discussion mode: ${discussionMode || "general"}
Task goal: ${taskGoal}

Recent conversation:
${formatMessages(messages) || "No prior messages."}

Memory/context:
${contextSummary || "No prior context."}

Tool catalog:
${toolCatalog}

Rules:
- Let the topic type emerge from the task. Use tools only when real, current, factual, medical, legal, economic, research, geopolitical, or quote verification would improve accuracy.
- Prefer medical_search, drug_info, find_hospital for medical conversations.
- Prefer supreme_court_cases for law and precedent questions.
- Prefer news_search, world_bank_data, un_stats, country_profile for current affairs, policy, or real-world country data.
- Prefer arxiv_search for research/technical topics, stanford_encyclopedia for philosophy, and wiki_search for general grounding.
- Do not call tools for purely opinion-based or creative turns.
- Return strict JSON only in this shape:
{"needsTools":true,"topicType":"medical","reason":"short reason","toolCalls":[{"tool":"medical_search","arguments":{"query":"...","max_results":2}}]}
- If no tool is needed, return {"needsTools":false,"topicType":"general","reason":"...", "toolCalls":[]}.`;

  const raw = await callAgentLLM({ provider, model, system, prompt, temperature: Math.min(0.25, temperature) });
  const json = extractFirstJsonObject(raw);
  if (!json) return { needsTools: false, topicType: "general", reason: "Planner returned no JSON.", toolCalls: [] };

  try {
    const parsed = JSON.parse(json);
    return {
      needsTools: Boolean(parsed?.needsTools),
      topicType: String(parsed?.topicType || "general"),
      reason: String(parsed?.reason || ""),
      toolCalls: sanitizePlannedToolCalls(parsed?.toolCalls, discussionMode),
    };
  } catch {
    return { needsTools: false, topicType: "general", reason: "Planner JSON could not be parsed.", toolCalls: [] };
  }
}

async function maybeRunTools({
  provider,
  model,
  system,
  taskGoal,
  messages,
  contextSummary,
  discussionMode,
  toolCallingEnabled,
  temperature,
}) {
  if (!toolCallingEnabled) {
    return { toolPlan: null, toolCalls: [], toolContextBlock: "" };
  }

  const toolPlan = await planToolCalls({
    provider,
    model,
    system,
    taskGoal,
    messages,
    contextSummary,
    discussionMode,
    temperature,
  });

  if (!toolPlan.needsTools || !toolPlan.toolCalls.length) {
    return { toolPlan, toolCalls: [], toolContextBlock: "" };
  }

  const executedCalls = [];
  for (const plannedCall of toolPlan.toolCalls) {
    const result = await executeToolCall({
      toolName: plannedCall.toolName,
      args: plannedCall.args,
    });
    executedCalls.push(result);
  }

  const toolContextBlock = executedCalls.length
    ? `Tool results:\n${executedCalls
        .map(
          (toolCall, index) =>
            `${index + 1}. ${toolCall.toolName}(${JSON.stringify(toolCall.args)})\n${truncateText(toolCall.text, 1800)}`
        )
        .join("\n\n")}`
    : "";

  return { toolPlan, toolCalls: executedCalls, toolContextBlock };
}

async function runAgentStep({
  agentId, taskGoal, messages, outputConstraints, temperature = 0.5,
  apiRoutingMode = "persona", ollamaModel = "", memoryMode = "minimal", topic = "", sessionId = "",
  discussionMode = "", toolCallingEnabled = false,
}) {
  const agent = await Agent.findOne({ id: agentId }).lean();
  if (!agent) throw new Error(`Agent not found: ${agentId}`);

  const personaLines = [
    `Persona and reasoning method: ${agent.description}`,
    agent.personalityTraits ? `Personality traits: ${agent.personalityTraits}` : null,
    agent.backstoryLore ? `Backstory/lore: ${agent.backstoryLore}` : null,
    agent.speechStyle ? `Speech style: ${agent.speechStyle}` : null,
    agent.isFantasy ? `Source: ${agent.sourceTitle || "Unknown"} (${agent.sourceType || "Unknown"}, ${agent.genre || "Unknown"})` : null,
  ].filter(Boolean);

  const system = `You are ${agent.name}, role: ${agent.role}.\n${personaLines.join("\n")}\nStay within this persona and constraints.`;
  const { contextSummary } = await buildContextSummary({ taskGoal, topic, sessionId, messages, memoryMode });
  const modelConfig = resolveAgentModelConfig(agent.id, apiRoutingMode, ollamaModel);
  const { toolCalls, toolContextBlock, toolPlan } = await maybeRunTools({
    provider: modelConfig.provider,
    model: modelConfig.model,
    system,
    taskGoal,
    messages,
    contextSummary,
    discussionMode,
    toolCallingEnabled,
    temperature,
  });
  const prompt = `${buildAgentPrompt({ agent, taskGoal, contextSummary, outputConstraints })}

Discussion mode: ${discussionMode || "general"}
${toolPlan?.topicType ? `Detected topic type: ${toolPlan.topicType}` : ""}
${toolPlan?.reason ? `Tool planner note: ${toolPlan.reason}` : ""}
${toolContextBlock || "Tool results:\nNo external tools were used for this turn."}

If tool results were provided, use them naturally, mention uncertainty where appropriate, and avoid claiming a definitive diagnosis or legal judgment from limited context.`;
  const text = await callAgentLLM({
    provider: modelConfig.provider,
    model: modelConfig.model,
    system,
    prompt,
    temperature,
  });

  return {
    id: generateMessageId(), speakerId: agent.id, speakerName: agent.name,
    speakerInitials: agent.avatarInitials, isUser: false, text, timestamp: Date.now(),
    modelProvider: modelConfig.provider, modelName: modelConfig.model,
    toolCalls,
  };
}

export { runAgentStep };
