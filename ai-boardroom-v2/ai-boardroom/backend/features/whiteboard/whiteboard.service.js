/**
 * Whiteboard Service
 * ========================================
 * The Boardroom's "single source of truth" board. Instead of re-reading the whole
 * transcript on every turn, agents read a condensed JSON state (problems + open
 * questions) and can update it via a strict-JSON "tool call" the same way the
 * agent runtime already does tool planning (see agentRuntime.service.js).
 *
 * Flow per turn (discussionMode === "boardroom" only):
 *   1. Whiteboard state is stringified and injected into the speaker-selection
 *      and agent prompts as established facts.
 *   2. After an agent responds, planWhiteboardUpdate() asks a lightweight LLM
 *      call whether the board should change (new problem, resolved problem,
 *      new/answered question) and returns a small ops array.
 *   3. applyWhiteboardOps() merges those ops into the board — this is a pure
 *      function so it's easy to test and to apply founder edits the same way.
 */

import Whiteboard from "./whiteboard.model.js";
import { callOrchestratorLLM } from "../../shared/llmClient.js";
import { extractFirstJsonObject, generateMessageId } from "../../shared/helpers.js";

// ─────────────────────────────────────────────────────────────
// PERSISTENCE
// ─────────────────────────────────────────────────────────────

async function getOrCreateWhiteboard(sessionId, topic = "") {
  if (!sessionId) return { sessionId: "", topic, problems: [], openQuestions: [], updatedAt: Date.now() };
  let board = await Whiteboard.findOne({ sessionId }).lean();
  if (!board) {
    const created = await Whiteboard.create({ sessionId, topic, problems: [], openQuestions: [] });
    board = created.toObject();
  }
  return board;
}

async function saveWhiteboard(sessionId, board) {
  if (!sessionId) return board;
  const payload = {
    topic: board.topic || "",
    problems: board.problems || [],
    openQuestions: board.openQuestions || [],
    updatedAt: Date.now(),
  };
  const updated = await Whiteboard.findOneAndUpdate(
    { sessionId },
    { $set: payload, $setOnInsert: { sessionId } },
    { new: true, upsert: true }
  ).lean();
  return updated;
}

// ─────────────────────────────────────────────────────────────
// PURE OPS APPLICATION (also used for direct founder edits)
// ─────────────────────────────────────────────────────────────

/**
 * applyWhiteboardOps - Merge a list of ops into a board. Pure function.
 * Supported op types:
 *   add_problem      { text, raisedBy }
 *   resolve_problem   { id, solution, resolvedBy }
 *   reopen_problem    { id }
 *   add_question      { text, raisedBy }
 *   resolve_question  { id, answer, resolvedBy }
 *   delete_problem    { id }   (founder human-override)
 *   delete_question   { id }   (founder human-override)
 */
function applyWhiteboardOps(board, ops = []) {
  const next = {
    sessionId: board.sessionId,
    topic: board.topic || "",
    problems: [...(board.problems || [])],
    openQuestions: [...(board.openQuestions || [])],
  };

  (Array.isArray(ops) ? ops : []).forEach((op) => {
    const type = String(op?.type || "");
    switch (type) {
      case "add_problem": {
        const text = String(op.text || "").trim();
        if (!text) break;
        next.problems.push({
          id: generateMessageId(),
          text,
          raisedBy: String(op.raisedBy || "").trim(),
          status: "open",
          solution: "",
          resolvedBy: "",
          createdAt: Date.now(),
          resolvedAt: null,
        });
        break;
      }
      case "resolve_problem": {
        const id = String(op.id || "");
        next.problems = next.problems.map((p) =>
          p.id === id
            ? {
                ...p,
                status: "resolved",
                solution: String(op.solution || p.solution || "").trim(),
                resolvedBy: String(op.resolvedBy || "").trim(),
                resolvedAt: Date.now(),
              }
            : p
        );
        break;
      }
      case "reopen_problem": {
        const id = String(op.id || "");
        next.problems = next.problems.map((p) =>
          p.id === id ? { ...p, status: "open", resolvedAt: null } : p
        );
        break;
      }
      case "add_question": {
        const text = String(op.text || "").trim();
        if (!text) break;
        next.openQuestions.push({
          id: generateMessageId(),
          text,
          raisedBy: String(op.raisedBy || "").trim(),
          status: "open",
          answer: "",
          resolvedBy: "",
          createdAt: Date.now(),
        });
        break;
      }
      case "resolve_question": {
        const id = String(op.id || "");
        next.openQuestions = next.openQuestions.map((q) =>
          q.id === id
            ? {
                ...q,
                status: "resolved",
                answer: String(op.answer || q.answer || "").trim(),
                resolvedBy: String(op.resolvedBy || "").trim(),
              }
            : q
        );
        break;
      }
      case "delete_problem": {
        const id = String(op.id || "");
        next.problems = next.problems.filter((p) => p.id !== id);
        break;
      }
      case "delete_question": {
        const id = String(op.id || "");
        next.openQuestions = next.openQuestions.filter((q) => q.id !== id);
        break;
      }
      default:
        break;
    }
  });

  return next;
}

// ─────────────────────────────────────────────────────────────
// CONTEXT INJECTION (whiteboard as "established facts")
// ─────────────────────────────────────────────────────────────

function buildWhiteboardContextText(board) {
  if (!board) return "No whiteboard yet — this is the first turn.";
  const problems = board.problems || [];
  const questions = board.openQuestions || [];
  if (!problems.length && !questions.length) return "Whiteboard is empty — no problems or questions raised yet.";

  const lines = [];
  const open = problems.filter((p) => p.status !== "resolved");
  const resolved = problems.filter((p) => p.status === "resolved");
  if (open.length) {
    lines.push("Open problems (unresolved — treat as active flaws to press on):");
    open.forEach((p) => lines.push(`  - [${p.id}] ${p.text} (raised by ${p.raisedBy || "unknown"})`));
  }
  if (resolved.length) {
    lines.push("Resolved problems (treat as settled facts, do not re-litigate unless new evidence appears):");
    resolved.forEach((p) => lines.push(`  - [${p.id}] ${p.text} -> Solution: ${p.solution || "(none recorded)"}`));
  }
  if (questions.length) {
    lines.push("Open questions:");
    questions
      .filter((q) => q.status !== "resolved")
      .forEach((q) => lines.push(`  - [${q.id}] ${q.text} (raised by ${q.raisedBy || "unknown"})`));
  }
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────
// LLM-DRIVEN UPDATE PLANNER
// ─────────────────────────────────────────────────────────────

/**
 * planWhiteboardUpdate - Ask a lightweight LLM call whether the latest agent
 * turn should change the whiteboard. Mirrors the JSON-planner pattern used by
 * agentRuntime's tool planner. Never throws — falls back to no-ops on failure.
 */
async function planWhiteboardUpdate({ taskGoal, board, latestMessage, ollamaModel = "" }) {
  const system =
    "You maintain the shared Whiteboard for a startup Boardroom debate. You update it only when the latest turn " +
    "genuinely raises a new flaw/question or resolves an existing one. Be conservative — most turns need zero ops.";

  const prompt = `Business idea: ${taskGoal}

Current whiteboard state:
${buildWhiteboardContextText(board)}

Latest turn:
${latestMessage.speakerName}: ${latestMessage.text}

Decide whether to update the whiteboard. Rules:
- If this turn identifies a new, concrete flaw/risk not already listed, add it with "add_problem".
- If this turn provides a concrete fix/mitigation for an EXISTING open problem (match by id from the list above), resolve it with "resolve_problem" including a short "solution" string.
- If this turn raises a genuine open question needing more info, add it with "add_question".
- If this turn answers an EXISTING open question (match by id), resolve it with "resolve_question" including a short "answer".
- Do not duplicate a problem/question that is already listed (open or resolved).
- If nothing qualifies, return an empty ops array.
- Return strict JSON only, in this shape:
{"ops":[{"type":"add_problem","text":"...","raisedBy":"${latestMessage.speakerName}"}]}`;

  try {
    const raw = await callOrchestratorLLM({ system, prompt, temperature: 0.2, ollamaModel });
    const json = extractFirstJsonObject(raw);
    if (!json) return [];
    const parsed = JSON.parse(json);
    const ops = Array.isArray(parsed?.ops) ? parsed.ops : [];
    return ops.slice(0, 3); // cap: at most a few board changes per turn
  } catch (_) {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// VERDICT READINESS
// ─────────────────────────────────────────────────────────────

/**
 * shouldSuggestVerdict - True once every problem raised so far has been
 * resolved (there must be at least one). The orchestrator uses this to
 * *suggest* concluding — the founder still decides whether to end the session.
 */
function shouldSuggestVerdict(board) {
  const problems = board?.problems || [];
  if (!problems.length) return false;
  return problems.every((p) => p.status === "resolved");
}

export {
  getOrCreateWhiteboard,
  saveWhiteboard,
  applyWhiteboardOps,
  buildWhiteboardContextText,
  planWhiteboardUpdate,
  shouldSuggestVerdict,
};
