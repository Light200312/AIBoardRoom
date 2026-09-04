import Agent from "../features/agent/agent.model.js";
import Message from "../features/message/message.model.js";
import { AGENTS, MENTOR_MOCK_MESSAGES } from "./mockData.js";
import { world_leaders, business_men, historians, medical_specialists, interview_panel, law_makers } from "./preBuildAgents.js";

function enrichDescription(agent) {
  const methodsByRole = {
    Philosopher: "Method: Socratic questioning and contradiction testing.",
    Economist: "Method: incentive analysis, trade-off modeling, and second-order effects.",
    "Legal Scholar": "Method: precedent-based reasoning, rights-liability balance, and constitutional framing.",
    Strategist: "Method: adversarial planning, scenario branching, and win-condition design.",
    Technologist: "Method: systems decomposition, algorithmic rigor, and feasibility checks.",
    Mathematician: "Method: formal logic, proof structure, and assumption isolation.",
    "Political Theorist": "Method: power-structure analysis and institutional realism.",
    Inventor: "Method: first-principles design and high-variance innovation thinking.",
  };
  const constraints = "Constraints: stay in character, be evidence-led, avoid hallucinated facts, and explicitly flag uncertainty.";
  return `${agent.description} ${methodsByRole[agent.role] || "Method: structured analytical reasoning."} ${constraints}`;
}

async function seedDatabase() {
  const prebuiltAgents = [...world_leaders, ...business_men, ...historians, ...medical_specialists, ...interview_panel, ...law_makers];
  const mergedAgents = [...AGENTS, ...prebuiltAgents].reduce((acc, agent) => { acc.set(agent.id, agent); return acc; }, new Map());
  const enrichedAgents = Array.from(mergedAgents.values()).map((agent) => ({ ...agent, description: enrichDescription(agent) }));

  await Promise.all(enrichedAgents.map((agent) => Agent.updateOne({ id: agent.id }, { $set: agent }, { upsert: true })));
  await Promise.all(MENTOR_MOCK_MESSAGES.map((message) => Message.updateOne({ id: message.id }, { $set: message }, { upsert: true })));
}

export { seedDatabase };
