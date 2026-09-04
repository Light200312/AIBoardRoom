import { executeToolCall, listToolDefinitions } from "../tools/tools.js";

const SAMPLE_ARGS = {
  wiki_search: { query: "Artificial intelligence" },
  medical_search: { query: "Type 2 diabetes symptoms", max_results: 2 },
  drug_info: { drug_name: "Ibuprofen" },
  find_hospital: { condition: "cardiology", location: "Mumbai", radius_km: 3 },
  news_search: { query: "global economy", max_results: 2 },
  stanford_encyclopedia: { topic: "utilitarianism" },
  world_bank_data: { country: "IN", indicator: "gdp_per_capita" },
  supreme_court_cases: { query: "freedom of speech", max_results: 2 },
  arxiv_search: { query: "large language models", max_results: 2 },
  country_profile: { country: "India" },
  fallacy_detector: { argument: "You should ignore her tax policy because she is annoying." },
  quote_search: { person: "Mahatma Gandhi" },
  un_stats: { country_iso: "IND", stat: "internet_users" },
};

function parseArgs(raw = "") {
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON args: ${error.message}`);
  }
}

async function main() {
  const [, , toolName = "", rawArgs = ""] = process.argv;

  if (!toolName) {
    console.log("Usage: node scripts/testTools.js <tool_name> [json_args]");
    console.log("Available tools:");
    listToolDefinitions().forEach((tool) => {
      console.log(`- ${tool.name}`);
    });
    process.exit(0);
  }

  const args = parseArgs(rawArgs) || SAMPLE_ARGS[toolName] || {};
  const result = await executeToolCall({ toolName, args });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
