function resolveOllamaModel(ollamaModel) {
  return (
    String(ollamaModel || "").trim() ||
    process.env.OLLAMA_AGENT_MODEL ||
    process.env.OLLAMA_MODEL ||
    "llama3.1:latest"
  );
}

function hasOpenRouterKey() {
  return Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY1);
}

const AGENT_MODEL_MAP = {
  "1": { provider: "gemini", model: process.env.GEMINI_MODEL || "gemini-2.5-flash" },
  "2": { provider: "deepseek", model: process.env.DEEPSEEK_MODEL || "deepseek-chat" },
  "3": { provider: "claude", model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest" },
  "4": { provider: "ollama", model: resolveOllamaModel() },
  "5": { provider: "gemini", model: process.env.GEMINI_MODEL || "gemini-2.5-flash" },
  "6": { provider: "deepseek", model: process.env.DEEPSEEK_MODEL || "deepseek-chat" },
  "7": { provider: "claude", model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest" },
  "8": { provider: "ollama", model: resolveOllamaModel() },
};

function getPreferredApiConfig(ollamaModel) {
  if (hasOpenRouterKey()) {
    return {
      provider: "openrouter",
      model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
    };
  }

  return {
    provider: "ollama",
    model: resolveOllamaModel(ollamaModel),
  };
}

function getAgentModelConfig(agentId, ollamaModel) {
  const modelConfig = AGENT_MODEL_MAP[String(agentId)];
  if (modelConfig?.provider === "ollama") {
    return { ...modelConfig, model: resolveOllamaModel(ollamaModel) };
  }
  return modelConfig || getPreferredApiConfig(ollamaModel);
}

function resolveAgentModelConfig(agentId, apiRoutingMode = "persona", ollamaModel) {
  if (apiRoutingMode === "ollama_only") {
    return {
      provider: "ollama",
      model: resolveOllamaModel(ollamaModel),
    };
  }
  if (apiRoutingMode === "openrouter_only") {
    return {
      provider: "openrouter",
      model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
    };
  }
  if (hasOpenRouterKey()) {
    return {
      provider: "openrouter",
      model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
    };
  }
  return getAgentModelConfig(agentId, ollamaModel);
}

export { AGENT_MODEL_MAP, getAgentModelConfig, resolveAgentModelConfig, resolveOllamaModel };
