/**
 * Orchestrator Service
 * ========================================
 * Coordinates multi-agent conversations with intelligent agent selection.
 * 
 * Features:
 * - Dynamic agent selection using LLM-based policy or round-robin rotation
 * - Fairness mechanism to ensure all agents get equal speaking time
 * - Speaker history tracking and recent participant awareness
 * - Conversation scope resolution for memory and session continuity
 * - Message formatting and orchestrator announcements
 */


import Agent from "../agent/agent.model.js";
import { runAgentStep } from "../agent/agentRuntime.service.js";
import { resolveAgentModelConfig } from "../../shared/agentModelRegistry.js";
import { callOrchestratorLLM } from "../../shared/llmClient.js";
import { truncateText, generateMessageId } from "../../shared/helpers.js";

// ═════════════════════════════════════════════════════════════════
// MESSAGE FORMATTING UTILITIES
// ═════════════════════════════════════════════════════════════════
// Helper functions to format message history and create orchestrator announcements.
// ═════════════════════════════════════════════════════════════════

/**
 * formatMessages - Converts message array into readable text format
 * 
 * Takes recent messages and joins them into a single formatted string
 * for use in LLM prompts. Limits the number of messages to avoid token overflow.
 * 
 * @param {Array} messages - Array of message objects with speakerName and text
 * @param {number} limit - Maximum number of recent messages to include (default: 12)
 * @returns {string} Formatted messages as "SpeakerName: message text" lines
 */
function formatMessages(messages = [], limit = 12) {
  return messages.slice(-limit).map((m) => `${m.speakerName}: ${m.text}`).join("\
");
}

/**
 * makeOrchestratorMessage - Creates a system message from the orchestrator
 * 
 * Generates a structured message object to be inserted into the conversation.
 * These messages announce decisions and guide the flow of the council session.
 * 
 * @param {string} text - The message content to announce
 * @returns {Object} Message object with orchestrator metadata
 */
function makeOrchestratorMessage(text) {
  return {
    id: generateMessageId(),
    speakerId: "orchestrator",
    speakerName: "Orchestrator",
    speakerInitials: "OR",
    isUser: false,
    text,
    timestamp: Date.now()
  };
}

// ═════════════════════════════════════════════════════════════════
// SPEAKER HISTORY & CONVERSATION TRACKING
// ═════════════════════════════════════════════════════════════════
// Functions to track which agents have spoken and participation patterns.
// Used for fairness checks and speaker rotation logic.
// ═════════════════════════════════════════════════════════════════

/**
 * getLastSpeakingAgentId - Finds the most recent agent to speak
 * Scans message history backwards to find the last candidate agent message.
 */
function getLastSpeakingAgentId(messages, candidates) {
  const candidateIds = new Set(candidates.map((c) => String(c.id)));
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const speakerId = String(messages[i]?.speakerId || "");
    if (candidateIds.has(speakerId)) return speakerId;
  }
  return "";
}

/**
 * hasOrchestratorOpening - Checks if session was opened by orchestrator
 * Prevents duplicate opening messages and determines session freshness.
 */
function hasOrchestratorOpening(messages = []) {
  return messages.some((m) => String(m.speakerId || "") === "orchestrator");
}

/**
 * getRecentSpeakerIds - Returns recently active agents in reverse chronological order
 * Extracts unique agent IDs backwards through history.
 * Useful for avoiding immediate speaker repetition.
 */
function getRecentSpeakerIds(messages, candidates, limit = candidates.length) {
  const candidateIds = new Set(candidates.map((c) => String(c.id)));
  const recent = [];
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const speakerId = String(messages[i]?.speakerId || "");
    if (!candidateIds.has(speakerId) || recent.includes(speakerId)) continue;
    recent.push(speakerId);
    if (recent.length >= limit) break;
  }
  return recent;
}

// ═════════════════════════════════════════════════════════════════
// CANDIDATE PROFILE BUILDING & SORTING
// ═════════════════════════════════════════════════════════════════
// Functions to build agent profile data showing participation stats.
// Used for intelligent agent selection and fairness calculations.
// ═════════════════════════════════════════════════════════════════

/**
 * sortCandidatesBySelectionOrder - Arranges agents by user-specified order
 * If user provided selectedAgentIds, reorder the candidates to match that order.
 * Candidates not in the selection order are moved to the end.
 */
function sortCandidatesBySelectionOrder(candidates, selectedAgentIds = []) {
  if (!selectedAgentIds.length) return candidates;
  const orderMap = new Map(selectedAgentIds.map((id, i) => [String(id), i]));
  return [...candidates].sort((a, b) => {
    const aO = orderMap.get(String(a.id)); const bO = orderMap.get(String(b.id));
    if (aO == null && bO == null) return 0; if (aO == null) return 1; if (bO == null) return -1; return aO - bO;
  });
}

/**
 * buildParticipationStats - Analyzes message history to calculate participation metrics
 * Tracks how many turns each agent has taken and when they last spoke.
 * Returns stats map and total number of agent turns in the conversation.
 */
function buildParticipationStats(messages, candidates) {
  // Filter to only candidate agent IDs to ignore user and system messages
  const candidateIds = new Set(candidates.map((c) => String(c.id)));
  // Sort all messages by timestamp to get chronological order
  const ordered = [...messages].sort((a, b) => Number(a?.timestamp || 0) - Number(b?.timestamp || 0));
  // Initialize stats tracking for each candidate with zero turns
  const stats = new Map(candidates.map((c) => [String(c.id), { turnsTaken: 0, lastSpokeTimestamp: 0, lastSpokeTurnIndex: -1 }]));
  let speakingTurnIndex = 0;
  // Count turns and track timing information
  ordered.forEach((m) => {
    const sid = String(m?.speakerId || "");
    if (!candidateIds.has(sid)) return;
    const entry = stats.get(sid);
    if (!entry) return;
    entry.turnsTaken += 1;
    entry.lastSpokeTimestamp = Number(m?.timestamp || 0);
    entry.lastSpokeTurnIndex = speakingTurnIndex;
    speakingTurnIndex += 1;
  });
  return { stats, totalAgentTurns: speakingTurnIndex };
}

/**
 * buildCandidateProfile - Creates a detailed profile for a single agent
 * Extracts participation stats, role, domain, and specialization info.
 */
function buildCandidateProfile(candidate, participationStats, totalAgentTurns) {
  const agentId = String(candidate.id);
  const stats = participationStats.get(agentId) || { turnsTaken: 0, lastSpokeTimestamp: 0, lastSpokeTurnIndex: -1 };
  // Calculate how many turns have passed since this agent last spoke
  const turnsSinceLastSpeak = stats.lastSpokeTurnIndex < 0 ? "never" : String(Math.max(0, totalAgentTurns - stats.lastSpokeTurnIndex - 1));
  return {
    id: agentId,
    name: String(candidate.name || ""),
    role: String(candidate.role || ""),
    domain: String(candidate.domain || "other"),
    specialization: truncateText(candidate.specialAbility || candidate.description || candidate.personalityTraits || candidate.role, 100),
    turnsTaken: stats.turnsTaken,
    turnsSinceLastSpeak,
    hasSpokenYet: stats.turnsTaken > 0
  };
}

/**
 * buildCandidateProfiles - Batch process all candidates to create detailed profiles
 * Makes participation stats available for intelligent selection decisions.
 */
function buildCandidateProfiles(candidates, messages) {
  const { stats, totalAgentTurns } = buildParticipationStats(messages, candidates);
  return candidates.map((c) => buildCandidateProfile(c, stats, totalAgentTurns));
}

/**
 * formatCandidateProfiles - Converts detailed profiles into readable text format
 * Used in LLM prompts to provide context for intelligent agent selection.
 */
function formatCandidateProfiles(profiles = []) {
  return profiles.map((c) => `- id: ${c.id} | ${c.name} | ${c.role} | domain: ${c.domain} | strengths: ${c.specialization} | turnsTaken: ${c.turnsTaken} | turnsSinceLastSpeak: ${c.turnsSinceLastSpeak}`).join("");
}

// ═════════════════════════════════════════════════════════════════
// FAIRNESS & SPEAKER ROTATION LOGIC
// ═════════════════════════════════════════════════════════════════
// Functions to ensure fair speaking opportunities and prevent domination.
// Implements both LLM-driven and rotation-based selection strategies.
// ═════════════════════════════════════════════════════════════════

/**
 * getSoftEligibleCandidates - Determines which agents are fair candidates to speak next
 * 
 * Selection algorithm:
 * 1. Exclude the last speaker to avoid immediate repetition
 * 2. Prioritize agents who haven't spoken yet
 * 3. If everyone has spoken, select agents with minimum turns to balance participation
 * 4. If difference is small, include all agents
 */
function getSoftEligibleCandidates(profiles, lastSpeakerId = "") {
  // Start with all non-last-speaker candidates
  const nonRepeating = profiles.filter((c) => c.id !== String(lastSpeakerId || ""));
  const pool = nonRepeating.length ? nonRepeating : profiles;
  
  // Tier 1: Agents who haven't spoken yet (if there are at least 2)
  const unspoken = pool.filter((c) => !c.hasSpokenYet);
  if (unspoken.length >= 2) return unspoken;
  
  // Tier 2: Agents with minimum turns (fair load balancing)
  const turnCounts = pool.map((c) => c.turnsTaken);
  const minT = Math.min(...turnCounts);
  const maxT = Math.max(...turnCounts);
  
  // Only enforce minimum-turn selection if there's a significant imbalance
  if (maxT - minT >= 2) return pool.filter((c) => c.turnsTaken === minT);
  
  // Tier 3: All candidates are eligible if balanced
  return pool;
}

/**
 * shouldOverrideForFairness - Checks if LLM selection violates fairness constraints
 * 
 * Overrides LLM choice if the selected agent has significantly more turns
 * than eligible alternatives (turnsTaken difference >= 2).
 */
function shouldOverrideForFairness(selectedProfile, eligible = []) {
  if (!selectedProfile || !eligible.length) return false;
  // If the selected agent is already eligible, allow it
  if (eligible.some((c) => c.id === selectedProfile.id)) return false;
  // Check if selected agent has taken too many turns compared to eligible agents
  const minT = Math.min(...eligible.map((c) => c.turnsTaken));
  return selectedProfile.turnsTaken - minT >= 2;
}

/**
 * pickNextByRotation - Selects next agent using round-robin rotation
 * 
 * Creates a circular rotation starting after the last speaker.
 * Ensures deterministic, fair speaker order without LLM dependency.
 */
function pickNextByRotation(candidates, lastSpeakerId = "", excludeIds = []) {
  if (!candidates.length) return null;
  const excluded = new Set(excludeIds.map((id) => String(id)));
  const startIndex = Math.max(candidates.findIndex((c) => String(c.id) === String(lastSpeakerId || "")), -1);
  
  // Rotate through candidates starting from index after last speaker
  for (let offset = 1; offset <= candidates.length; offset += 1) {
    const c = candidates[(startIndex + offset) % candidates.length];
    if (!excluded.has(String(c.id))) return c;
  }
  // Fallback: return next candidate in rotation
  return candidates[(startIndex + 1 + candidates.length) % candidates.length] || candidates[0];
}

/**
 * pickFairFallbackCandidate - Fallback agent selection when LLM fails or is unavailable
 * 
 * Combines fairness metrics with recent speaker awareness to choose
 * a balanced next speaker without relying on the LLM.
 */
function pickFairFallbackCandidate({ candidates, messages, lastSpeakerId = "" }) {
  // Build participation profiles for all candidates
  const profiles = buildCandidateProfiles(candidates, messages);
  // Get eligible candidates based on fairness rules
  const eligibleIds = new Set(getSoftEligibleCandidates(profiles, lastSpeakerId).map((c) => c.id));
  const preferred = candidates.filter((c) => eligibleIds.has(String(c.id)));
  // Get recent speakers to avoid immediate reruns
  const recentIds = getRecentSpeakerIds(messages, preferred.length ? preferred : candidates);
  // Use preferred candidates if available, otherwise use all candidates
  const pool = preferred.length ? preferred : candidates;
  // Select unseen agents first, then use rotation
  const unseen = pool.filter((c) => !recentIds.includes(String(c.id)));
  return pickNextByRotation(unseen.length ? unseen : pool, lastSpeakerId);
}

// ═════════════════════════════════════════════════════════════════
// MODE & SCOPE RESOLUTION
// ═════════════════════════════════════════════════════════════════
// Functions to resolve orchestration mode and conversation context.
// ═════════════════════════════════════════════════════════════════

/**
 * resolveOrchestratorMode - Validates and normalizes the orchestration mode
 * 
 * Returns either "dynamic" (LLM-based agent selection) or "fast" (round-robin).
 * Any invalid mode defaults to "fast" for lower latency.
 */
function resolveOrchestratorMode(mode) {
  return mode === "dynamic" ? "dynamic" : "fast";
}

/**
 * resolveConversationScope - Determines topic and session context
 * 
 * Resolves scope by checking in order:
 * 1. Provided topic/sessionId parameters
 * 2. Most recent message with topic/sessionId
 * 3. Fall back to taskGoal for topic
 * 
 * This enables continuity across multi-turn conversations.
 */
function resolveConversationScope({ taskGoal, topic, sessionId, messages }) {
  // Start with provided or empty values
  let t = String(topic || "").trim();
  let s = String(sessionId || "").trim();
  
  // Try to find topic in recent messages if not provided
  if (!t) {
    const m = [...messages].reverse().find((m) => String(m?.topic || "").trim());
    if (m) t = String(m.topic || "").trim();
  }
  
  // Fall back to taskGoal if no topic found
  if (!t) t = String(taskGoal || "").trim();
  
  // Try to find sessionId in recent messages if not provided
  if (!s) {
    const m = [...messages].reverse().find((m) => String(m?.sessionId || "").trim());
    if (m) s = String(m.sessionId || "").trim();
  }
  
  return { topic: t, sessionId: s };
}

// ═════════════════════════════════════════════════════════════════
// DYNAMIC AGENT SELECTION
// ═════════════════════════════════════════════════════════════════
// LLM-based agent selection with fairness validation and fallback.
// ═════════════════════════════════════════════════════════════════

/**
 * selectNextAgent - Uses LLM to intelligently select the next speaker
 * 
 * Sends candidate profiles and conversation context to an LLM to select
 * the most relevant agent. Validates selection for fairness and repeats.
 * Falls back to rotation-based selection if LLM fails.
 * 
 * @async
 * @param {Object} config - Configuration object
 * @param {string} config.taskGoal - The topic being discussed
 * @param {Array} config.messages - Conversation history
 * @param {Array} config.candidates - Available agents
 * @param {string} config.lastSpeakerId - ID of the agent who just spoke
 * @param {string} config.ollamaModel - Optional local model override
 * @returns {Object} { agentId, reason } - Selected agent and selection rationale
 */
async function selectNextAgent({ taskGoal, messages, candidates, lastSpeakerId = "", ollamaModel = "" }) {
  // Build detailed profiles showing each agent's participation history
  const profiles = buildCandidateProfiles(candidates, messages);
  // Get recent speakers to inform the LLM
  const recentIds = getRecentSpeakerIds(messages, candidates, Math.min(3, candidates.length));
  // Get eligible candidates based on fairness rules
  const eligible = getSoftEligibleCandidates(profiles, lastSpeakerId);
  
  // Construct LLM context and instructions
  const system = "You are an orchestration policy controller for a teaching council.";
  const prompt = `Select the next agent id from the eligible set below.

Topic:
${taskGoal}

Eligible candidates:
${formatCandidateProfiles(eligible) || "none"}

All candidates:
${formatCandidateProfiles(profiles) || "none"}

Recent conversation:
${formatMessages(messages, 6) || "none"}

Last speaking agent id: ${lastSpeakerId || "none"}
Recent speaker ids: ${recentIds.join(", ") || "none"}

Rules:
- choose ONE next speaker only
- optimize for relevance
- avoid selecting the same speaker as the last turn
- return strict JSON: {"agentId":"<id>","reason":"<short reason>"}`;
  
  // Call the LLM with low temperature for deterministic selection
  const raw = await callOrchestratorLLM({ system, prompt, temperature: 0.2, ollamaModel });
  
  try {
    // Parse the LLM response
    const parsed = JSON.parse(raw);
    const selectedId = String(parsed.agentId || "");
    
    // Validation checks
    const isValid = candidates.some((c) => String(c.id) === selectedId); // Verify agent exists
    const selectedProfile = profiles.find((c) => c.id === selectedId);
    const isRepeat = selectedId && lastSpeakerId && selectedId === String(lastSpeakerId) && candidates.length > 1; // Check for immediate repetition
    const fairOverride = shouldOverrideForFairness(selectedProfile, eligible); // Check for fairness violations
    
    // Accept selection only if it passes all validation checks
    if (isValid && !isRepeat && !fairOverride) {
      return {
        agentId: selectedId,
        reason: String(parsed.reason || "Selected for relevance.")
      };
    }
  } catch (_) {
    // Silently fall through to fallback if JSON parsing fails
  }
  
  // Fallback: Use fair rotation when LLM selection fails or is invalid
  const fallback = pickFairFallbackCandidate({ candidates, messages, lastSpeakerId });
  return {
    agentId: String(fallback.id),
    reason: "Fallback rotation to keep turns moving."
  };
}

// ═════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATION ENTRY POINT
// ═════════════════════════════════════════════════════════════════
// Core orchestration logic that runs one agent turn and queues the next.
// Returns messages, trace data, performance metrics, and next steps.
// ═════════════════════════════════════════════════════════════════

/**
 * orchestrateTask - Main orchestration function for multi-agent conversations
 * 
 * Orchestrates a single turn of a multi-agent coaching session:
 * 1. Load and validate agents
 * 2. Select the next speaker (dynamic or round-robin)
 * 3. Run the selected agent's response
 * 4. Select and announce the upcoming speaker
 * 5. Return results and guidance for next user turn
 * 
 * This function completes ONE agent turn. Multi-turn orchestration
 * is handled at the API level by repeated calls with updated messages.
 * 
 * @async
 * @param {Object} config - Full orchestration configuration
 * @param {string} config.taskGoal [required] - The discussion topic or task
 * @param {string[]} config.selectedAgentIds - Specific agents to use (empty = all)
 * @param {Array} config.priorMessages - Previous conversation messages
 * @param {number} config.maxIterations - Max turns (not used in single-turn mode)
 * @param {boolean} config.allowMetaMemory - Enable meta-learning
 * @param {Object} config.metaMemory - Meta-learning context
 * @param {string} config.apiRoutingMode - How to route agent calls ("persona", "standard")
 * @param {string} config.ollamaModel - Local model override for Ollama
 * @param {string} config.orchestratorMode - "dynamic" (LLM) or "fast" (round-robin)
 * @param {string} config.memoryMode - "minimal" or "full"
 * @param {string} config.topic - Topic context for memory
 * @param {string} config.sessionId - Session identifier for continuity
 * 
 * @returns {Object} Orchestration result containing:
 *   - summary: Overview of what happened
 *   - messages: Full conversation transcript including orchestrator announcements
 *   - trace: Decision log with agent selection reasoning
 *   - performance: Quality metrics for this turn
 *   - clarifyingQuestion: Prompt for user's next input
 *   - suggestion: Recommendation for user's response
 *   - termination: Reason this turn completed
 */
async function orchestrateTask({
  taskGoal,
  selectedAgentIds = [],
  priorMessages = [],
  maxIterations,
  allowMetaMemory = false,
  metaMemory = null,
  apiRoutingMode = "persona",
  ollamaModel = "",
  orchestratorMode = "fast",
  memoryMode = "minimal",
  topic = "",
  sessionId = "",
  discussionMode = "",
  toolCallingEnabled = false,
}) {
  // ─────────────────────────────────────────────────────────────
  // PHASE 1: LOAD AND VALIDATE AGENTS
  // ─────────────────────────────────────────────────────────────
  
  // Load agents from database (either specific IDs or all)
  const fetched = await Agent.find(selectedAgentIds.length ? { id: { $in: selectedAgentIds } } : {}).lean();
  // Sort candidates to match user's selection order preference
  const candidates = sortCandidatesBySelectionOrder(fetched, selectedAgentIds);
  
  // Validate required inputs
  if (!taskGoal) throw new Error("Task goal is required.");
  if (!candidates.length) throw new Error("No agents available for orchestration.");

  // ─────────────────────────────────────────────────────────────
  // PHASE 2: INITIALIZE CONVERSATION STATE
  // ─────────────────────────────────────────────────────────────
  
  // Copy prior messages to avoid mutation
  const messages = [...priorMessages];
  // Arrays to track decision history and quality metrics
  const performance = [];
  const trace = [];
  
  // Analyze existing conversation to find context
  const lastSpeakerId = getLastSpeakingAgentId(messages, candidates);
  const mode = resolveOrchestratorMode(orchestratorMode);
  const scope = resolveConversationScope({ taskGoal, topic, sessionId, messages });
  const candidateProfiles = buildCandidateProfiles(candidates, messages);

  // ─────────────────────────────────────────────────────────────
  // PHASE 3: OPENING ANNOUNCEMENT
  // ─────────────────────────────────────────────────────────────
  
  // Add opening message if this is a fresh session
  if (!hasOrchestratorOpening(messages)) {
    messages.push(makeOrchestratorMessage(`Welcome to the council session on "${taskGoal}". I will coordinate one speaker at a time, and after each turn you can respond so the council can coach you.`));
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 4: SELECT CURRENT SPEAKER
  // ─────────────────────────────────────────────────────────────
  
  // Choose next speaker based on orchestration mode
  let nextAgent;
  if (mode === "dynamic") {
    // Use LLM-based intelligent selection
    nextAgent = await selectNextAgent({ taskGoal, messages, candidates, lastSpeakerId, ollamaModel });
  } else {
    // Use fast round-robin selection
    const rotated = pickNextByRotation(candidates, lastSpeakerId);
    nextAgent = { agentId: String(rotated.id), reason: "Fast mode rotation for low latency." };
  }
  
  // Find the selected agent object and announce the decision
  const selected = candidates.find((c) => String(c.id) === String(nextAgent.agentId)) || candidates[0];
  messages.push(makeOrchestratorMessage(`Decision: ${selected.name} (${selected.role}) will speak next. Reason: ${nextAgent.reason}`));

  // ─────────────────────────────────────────────────────────────
  // PHASE 5: RUN SELECTED AGENT
  // ─────────────────────────────────────────────────────────────
  
  // Execute the agent's turn with coaching instructions
  let agentMessage;
  try {
    agentMessage = await runAgentStep({
      agentId: selected.id,
      taskGoal,
      messages,
      outputConstraints: "Teach the user directly. Evaluate the user's last point, correct mistakes clearly, praise valid reasoning, and give one concrete improvement step. Keep it concise.",
      apiRoutingMode,
      ollamaModel,
      memoryMode,
      topic: scope.topic,
      sessionId: scope.sessionId,
      discussionMode,
      toolCallingEnabled,
    });
  } catch (_) {
    // Graceful fallback if agent fails
    agentMessage = {
      id: generateMessageId(),
      speakerId: String(selected.id),
      speakerName: selected.name,
      speakerInitials: selected.avatarInitials || "AI",
      isUser: false,
      text: "I could not respond due to a temporary model issue. Share your next point, and I will continue coaching.",
      timestamp: Date.now(),
      modelProvider: "fallback",
      modelName: "fallback",
      toolCalls: [],
    };
  }
  messages.push(agentMessage);

  // ─────────────────────────────────────────────────────────────
  // PHASE 6: SELECT UPCOMING SPEAKER
  // ─────────────────────────────────────────────────────────────
  
  // Look ahead to the next agent (helps users know what's coming)
  let upcomingAgent, upcomingReason;
  if (mode === "dynamic") {
    const upcoming = await selectNextAgent({ taskGoal, messages, candidates, lastSpeakerId: String(selected.id), ollamaModel });
    upcomingAgent = candidates.find((c) => String(c.id) === String(upcoming.agentId)) || 
                    pickFairFallbackCandidate({ candidates, messages, lastSpeakerId: String(selected.id) });
    upcomingReason = upcoming.reason || "Dynamic selection.";
  } else {
    upcomingAgent = pickNextByRotation(candidates, String(selected.id));
    upcomingReason = "Round-robin rotation for low-latency turn management.";
  }
  
  // Announce the upcoming speaker and invite user input
  messages.push(makeOrchestratorMessage(`Decision: Next speaker is ${upcomingAgent.name} (${upcomingAgent.role}). Reason: ${upcomingReason}. Your turn first: share your view or question, then I will hand over to ${upcomingAgent.name}.`));

  // ─────────────────────────────────────────────────────────────
  // PHASE 7: BUILD RESPONSE DATA
  // ─────────────────────────────────────────────────────────────
  
  // Log this turn's decisions for debugging and analysis
  trace.push({
    iteration: 1,
    selectedAgentId: String(selected.id),
    selectedAgentModel: resolveAgentModelConfig(selected.id, apiRoutingMode, ollamaModel),
    selectionReason: nextAgent.reason,
    confidence: 0.7,
    candidateProfiles,
    suggestion: `One agent turn completed using ${mode} orchestrator mode. Awaiting user input for the next turn.`
  });
  
  // Record quality metrics for this turn
  performance.push({
    iteration: 1,
    confidence: 0.7,
    completeness: 0.5,
    conflictDetected: false,
    improvementDetected: true
  });
  
  // Create human-readable summary
  const summary = `Completed one guided turn on "${taskGoal}". ${selected.name} responded, and ${upcomingAgent.name} is queued for the next turn after user input.`;

  // ─────────────────────────────────────────────────────────────
  // PHASE 8: RETURN RESULTS
  // ─────────────────────────────────────────────────────────────
  
  return {
    summary,
    messages,
    trace,
    performance,
    clarifyingQuestion: `Your turn: respond to ${selected.name}'s advice. Then ${upcomingAgent.name} will speak.`,
    suggestion: "Provide a specific claim and your reasoning so the next coach can critique it precisely.",
    termination: `Single-turn orchestration completed (${mode} mode).`
  };
}

export { orchestrateTask };
