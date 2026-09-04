const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/auth/me", { token }),
  listAgents: (token) => request("/agents", { token }),
  createAgent: (payload, token) => request("/agents", { method: "POST", body: payload, token }),
  updateAgent: (agentId, payload, token) =>
    request(`/agents/${agentId}`, { method: "PUT", body: payload, token }),
  deleteAgent: (agentId, token) => request(`/agents/${agentId}`, { method: "DELETE", token }),
  suggestAgents: (payload, token) =>
    request("/agents/suggest", { method: "POST", body: payload, token }),
  findAgentDraft: (payload, token) =>
    request("/agents/find", { method: "POST", body: payload, token }),
  respondAgent: (agentId, payload, token) =>
    request(`/agents/${agentId}/respond`, { method: "POST", body: payload, token }),
  listMessages: (token, params) => request(`/messages${toQuery(params)}`, { token }),
  createMessage: (payload, token) =>
    request("/messages", { method: "POST", body: payload, token }),
  runOrchestrator: (payload, token) =>
    request("/orchestrator/run", { method: "POST", body: payload, token }),
  combatSelectOpponentTeam: (payload, token) =>
    request("/combat/opponent/select-team", { method: "POST", body: payload, token }),
  combatNextOpponentTurn: (payload, token) =>
    request("/combat/opponent/next-turn", { method: "POST", body: payload, token }),
  combatJudgeRound: (payload, token) =>
    request("/combat/judge", { method: "POST", body: payload, token }),
  combatFinalizeVerdict: (payload, token) =>
    request("/combat/verdict", { method: "POST", body: payload, token }),
  generateLawPanel: (payload, token) =>
    request("/features/law-panel", { method: "POST", body: payload, token }),
  generateInterviewPanel: (payload, token) =>
    request("/features/interview-panel", { method: "POST", body: payload, token }),
  generateMedicalPanel: (payload, token) =>
    request("/features/medical-panel", { method: "POST", body: payload, token }),
};

export { api, API_BASE_URL };
