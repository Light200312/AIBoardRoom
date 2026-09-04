/**
 * Orchestrator Controller
 * ========================================
 * Handles HTTP requests for multi-agent orchestration.
 * Routes incoming task requests and delegates to the orchestrator service.
 */

import { orchestrateTask } from "./orchestrator.service.js";

/**
 * run - Main orchestration endpoint handler
 * 
 * Receives a task goal and agent configuration, then coordinates a multi-agent
 * conversation where selected agents take turns responding to guide the user.
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request payload containing:
 *   - taskGoal {string} [required] - The main objective/topic for the council discussion
 *   - selectedAgentIds {string[]} - IDs of agents to participate (empty = all agents)
 *   - priorMessages {Array} - Previous conversation context to continue from
 *   - maxIterations {number} - Max conversation turns (default: 6)
 *   - allowMetaMemory {boolean} - Enable meta-learning across sessions (default: false)
 *   - metaMemory {Object} - Stored meta-learning context from previous sessions
 *   - apiRoutingMode {string} - How to route API calls: "persona" or "standard" (default: "persona")
 *   - ollamaModel {string} - Override model for local Ollama execution
 *   - orchestratorMode {string} - Selection strategy: "fast" (round-robin) or "dynamic" (LLM-based)
 *   - memoryMode {string} - Memory retention level: "minimal" or "full"
 *   - topic {string} - Topic context for memory tracking
 *   - sessionId {string} - Session identifier for continuity
 * 
 * @param {Object} res - Express response object
 * 
 * @returns {Object} JSON response with:
 *   - summary {string} - Overview of orchestration results
 *   - messages {Array} - Full conversation transcript
 *   - trace {Array} - Agent selection decisions with reasoning
 *   - performance {Array} - Metrics on conversation quality
 *   - clarifyingQuestion {string} - Prompt for next user input
 *   - suggestion {string} - Recommendation for improvement
 *   - termination {string} - Reason orchestration stopped
 */
export async function run(req, res) {
  try {
    // Extract and set default values for all orchestration parameters
    const {
      taskGoal,
      selectedAgentIds = [],
      priorMessages = [],
      maxIterations = 6,
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
    } = req.body || {};
    
    // Validate that the task goal is provided (required field)
    if (!taskGoal) {
      return res.status(400).json({ message: "taskGoal is required." });
    }
    
    // Call the orchestration service with validated parameters
    const result = await orchestrateTask({
      taskGoal,
      selectedAgentIds,
      priorMessages,
      maxIterations,
      allowMetaMemory,
      metaMemory,
      apiRoutingMode,
      ollamaModel,
      orchestratorMode,
      memoryMode,
      topic,
      sessionId,
      discussionMode,
      toolCallingEnabled,
    });
    
    // Return successful orchestration result
    return res.json(result);
  } catch (error) {
    // Log error details and return 500 error response
    console.error("Orchestrator run failed:", error);
    return res.status(500).json({
      message: "Orchestrator failed.",
      error: error.message
    });
  }
}
