import dotenv from "dotenv";
import { callOrchestratorLLM, callGemini, callClaude, callDeepSeek } from "../services/llmClient.js";

dotenv.config();

const checks = [
  {
    name: "orchestrator-ollama",
    run: () =>
      callOrchestratorLLM({
        system: "You are a test assistant.",
        prompt: "Reply with exactly: OK_OLLAMA",
        temperature: 0,
      }),
  },
  {
    name: "agent-gemini",
    run: () =>
      callGemini({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        system: "You are a test assistant.",
        prompt: "Reply with exactly: OK_GEMINI",
        temperature: 0,
      }),
  },
  {
    name: "agent-claude",
    run: () =>
      callClaude({
        model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest",
        system: "You are a test assistant.",
        prompt: "Reply with exactly: OK_CLAUDE",
        temperature: 0,
      }),
  },
  {
    name: "agent-deepseek",
    run: () =>
      callDeepSeek({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        system: "You are a test assistant.",
        prompt: "Reply with exactly: OK_DEEPSEEK",
        temperature: 0,
      }),
  },
];

async function main() {
  const results = [];
  for (const check of checks) {
    try {
      const text = await check.run();
      results.push({
        check: check.name,
        ok: Boolean(text && text.trim().length),
        sample: String(text || "").slice(0, 80),
      });
    } catch (error) {
      results.push({
        check: check.name,
        ok: false,
        error: error.message,
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Model API check failed:", error.message);
  process.exit(1);
});
