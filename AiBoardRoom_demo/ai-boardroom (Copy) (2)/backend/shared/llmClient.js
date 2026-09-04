// ─────────────────────────────────────────────────────────────
// LLM Client — unified interface to multiple LLM providers
// (Ollama, Gemini, Grok, Claude, DeepSeek, OpenRouter) with
// automatic fallback and priority-based routing.
// ─────────────────────────────────────────────────────────────

import axios from "axios";
import { resolveOllamaModel } from "./agentModelRegistry.js";

function getOpenRouterApiKeys() {
  return [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY1,
  ].filter((key, index, arr) => key && arr.indexOf(key) === index);
}

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ||
  "http://localhost:11434";
const OLLAMA_ORCHESTRATOR_MODEL = resolveOllamaModel();
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);
const ORCHESTRATOR_TIMEOUT_MS = Number(process.env.ORCHESTRATOR_TIMEOUT_MS || 15000);
const HAS_OPENROUTER_KEY = getOpenRouterApiKeys().length > 0;
const ORCHESTRATOR_PROVIDER =
  process.env.ORCHESTRATOR_PROVIDER ||
  (HAS_OPENROUTER_KEY ? "openrouter" : "");
const ORCHESTRATOR_MODEL = process.env.ORCHESTRATOR_MODEL || "";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GROK_MODEL =
  process.env.XAI_MODEL ||
  process.env.GROK_MODEL ||
  "grok-4.20-reasoning";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 90000);

function getXaiApiKey() {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || "";
}

function getProviderPriority(preferredProvider) {
  const providers = [];
  const pushProvider = (provider, enabled = true) => {
    if (!enabled || providers.includes(provider)) return;
    providers.push(provider);
  };

  pushProvider(preferredProvider, Boolean(preferredProvider));
  pushProvider("openrouter", HAS_OPENROUTER_KEY);
  pushProvider("gemini", Boolean(process.env.GEMINI_API_KEY));
  pushProvider("grok", Boolean(getXaiApiKey()));
  pushProvider("claude", Boolean(process.env.CLAUDE_API_KEY));
  pushProvider("deepseek", Boolean(process.env.DEEPSEEK_API_KEY || process.env.DEEPSEARCH_API_KEY));
  pushProvider("ollama");

  return providers;
}

function getStrictProviderList(provider) {
  const normalizedProvider = String(provider || "").trim();
  return normalizedProvider ? [normalizedProvider] : [];
}

async function callOllama({
  system,
  prompt,
  model = OLLAMA_ORCHESTRATOR_MODEL,
  temperature = 0.4,
  timeoutMs = OLLAMA_TIMEOUT_MS,
}) {
  const response = await axios.post(
    `${OLLAMA_BASE_URL.replace(/\/$/, "")}/api/generate`,
    {
      model,
      system,
      prompt,
      stream: false,
      options: { temperature },
    },
    { timeout: timeoutMs }
  );
  return (response.data?.response || "").trim();
}

async function callGemini({ system, prompt, model = GEMINI_MODEL, temperature = 0.4 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await axios.post(
    url,
    {
      contents: [{ role: "user", parts: [{ text: `${system}\n\n${prompt}` }] }],
      generationConfig: { temperature },
    },
    { timeout: LLM_TIMEOUT_MS }
  );
  return (
    response.data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n").trim() || ""
  );
}

async function callGrok({ system, prompt, model = GROK_MODEL, temperature = 0.4 }) {
  const apiKey = getXaiApiKey();
  if (!apiKey) throw new Error("Missing XAI_API_KEY or GROK_API_KEY.");

  const response = await axios.post(
    "https://api.x.ai/v1/chat/completions",
    {
      model,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    },
    {
      timeout: LLM_TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
    }
  );

  return response.data?.choices?.[0]?.message?.content?.trim() || "";
}

async function callClaude({ system, prompt, model = CLAUDE_MODEL, temperature = 0.4 }) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error("Missing CLAUDE_API_KEY.");

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model,
      max_tokens: 1200,
      temperature,
      system,
      messages: [{ role: "user", content: prompt }],
    },
    {
      timeout: LLM_TIMEOUT_MS,
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
    }
  );

  return (
    response.data?.content
      ?.filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n")
      .trim() || ""
  );
}

async function callDeepSeek({ system, prompt, model = DEEPSEEK_MODEL, temperature = 0.4 }) {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.DEEPSEARCH_API_KEY;
  if (!apiKey) throw new Error("Missing DEEPSEEK_API_KEY/DEEPSEARCH_API_KEY.");

  const response = await axios.post(
    "https://api.deepseek.com/chat/completions",
    {
      model,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    },
    {
      timeout: LLM_TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
    }
  );

  return response.data?.choices?.[0]?.message?.content?.trim() || "";
}

async function callOpenRouter({ system, prompt, model = OPENROUTER_MODEL, temperature = 0.4 }) {
  const apiKeys = getOpenRouterApiKeys();
  if (!apiKeys.length) throw new Error("Missing OPENROUTER_API_KEY or OPENROUTER_API_KEY1.");

  let lastError = null;

  for (const apiKey of apiKeys) {
    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model,
          temperature,
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
        },
        {
          timeout: LLM_TIMEOUT_MS,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
          },
        }
      );

      return response.data?.choices?.[0]?.message?.content?.trim() || "";
    } catch (error) {
      lastError = error;
      console.error("OpenRouter key attempt failed:", {
        keySlot: apiKey === process.env.OPENROUTER_API_KEY ? "primary" : "fallback",
        message: error?.message,
      });
    }
  }

  throw lastError || new Error("OpenRouter request failed.");
}

async function callAgentLLM({ provider, model, system, prompt, temperature = 0.4 }) {
  const providerCandidates = getProviderPriority(provider);
  const requestedModel = model || process.env.OPENROUTER_MODEL || OPENROUTER_MODEL;

  for (const providerCandidate of providerCandidates) {
    try {
      switch (providerCandidate) {
        case "gemini":
          return await callGemini({
            system,
            prompt,
            model: provider === "gemini" ? requestedModel : GEMINI_MODEL,
            temperature,
          });
        case "grok":
          return await callGrok({
            system,
            prompt,
            model: provider === "grok" ? requestedModel : GROK_MODEL,
            temperature,
          });
        case "claude":
          return await callClaude({
            system,
            prompt,
            model: provider === "claude" ? requestedModel : CLAUDE_MODEL,
            temperature,
          });
        case "deepseek":
          return await callDeepSeek({
            system,
            prompt,
            model: provider === "deepseek" ? requestedModel : DEEPSEEK_MODEL,
            temperature,
          });
        case "openrouter":
          return await callOpenRouter({
            system,
            prompt,
            model: provider === "openrouter" ? requestedModel : OPENROUTER_MODEL,
            temperature,
          });
        case "ollama":
        default:
          return await callOllama({
            system,
            prompt,
            model:
              provider === "ollama"
                ? requestedModel
                : process.env.OLLAMA_MODEL || process.env.OLLAMA_MODEL || OLLAMA_ORCHESTRATOR_MODEL,
            temperature,
          });
      }
    } catch (error) {
      console.error("Agent LLM call failed:", {
        provider: providerCandidate,
        model: providerCandidate === provider ? requestedModel : undefined,
        message: error?.message,
      });
    }
  }

  return "I could not reach the model right now. Please continue and I will respond on the next turn.";
}

async function callOrchestratorLLM({ system, prompt, temperature = 0.4, ollamaModel = "" }) {
  const strictProviderCandidates = getStrictProviderList(process.env.ORCHESTRATOR_PROVIDER);
  const providerCandidates = strictProviderCandidates.length
    ? strictProviderCandidates
    : getProviderPriority(ORCHESTRATOR_PROVIDER || "openrouter");
  for (const provider of providerCandidates) {
    try {
      switch (provider) {
        case "gemini":
          return await callGemini({
            system,
            prompt,
            model: ORCHESTRATOR_MODEL || GEMINI_MODEL,
            temperature,
          });
        case "grok":
          return await callGrok({
            system,
            prompt,
            model: ORCHESTRATOR_MODEL || GROK_MODEL,
            temperature,
          });
        case "claude":
          return await callClaude({
            system,
            prompt,
            model: ORCHESTRATOR_MODEL || CLAUDE_MODEL,
            temperature,
          });
        case "deepseek":
          return await callDeepSeek({
            system,
            prompt,
            model: ORCHESTRATOR_MODEL || DEEPSEEK_MODEL,
            temperature,
          });
        case "openrouter":
          return await callOpenRouter({
            system,
            prompt,
            model: ORCHESTRATOR_MODEL || OPENROUTER_MODEL,
            temperature,
          });
        case "ollama":
        default:
          return await callOllama({
            system,
            prompt,
            model: ORCHESTRATOR_MODEL || resolveOllamaModel(ollamaModel) || OLLAMA_ORCHESTRATOR_MODEL,
            temperature,
            timeoutMs: ORCHESTRATOR_TIMEOUT_MS,
          });
      }
    } catch (error) {
      console.error('Orchestrator LLM call failed:', { provider, message: error?.message });
      if (strictProviderCandidates.length) {
        throw new Error(`Orchestrator provider "${provider}" failed: ${error?.message}`);
      }
    }
  }

  throw new Error("Orchestrator model unavailable.");
}

export {
  callAgentLLM,
  callOrchestratorLLM,
  callOllama,
  callGemini,
  callGrok,
  callClaude,
  callDeepSeek,
  callOpenRouter,
  OLLAMA_ORCHESTRATOR_MODEL,
};
