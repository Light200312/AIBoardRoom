import { interview_panel, law_makers, medical_specialists } from "../../data/preBuildAgents.js";
import { normaliseText } from "../../shared/helpers.js";

function toSearchBlob(agent) {
  return [
    agent.name, agent.role, agent.description, agent.expertise,
    agent.stance, agent.sourceTopic, ...(agent.tags || []),
  ].filter(Boolean).join(" ").toLowerCase();
}

function scoreByKeywords(agent, keywords = [], weightedMatches = {}) {
  const blob = toSearchBlob(agent);
  let score = 0;
  keywords.forEach((keyword) => { if (blob.includes(keyword)) score += 2; });
  Object.entries(weightedMatches).forEach(([keyword, bonus]) => { if (blob.includes(keyword)) score += bonus; });
  return score;
}

function sortByScore(scoredAgents) {
  return [...scoredAgents].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.stats?.logic || 0) - (a.stats?.logic || 0);
  });
}

function trimScore(agent) { const { score, ...rest } = agent; return rest; }

function ensureDiverseFallback(agents, pool, count) {
  if (agents.length >= count) return agents.slice(0, count);
  const usedIds = new Set(agents.map((a) => a.id));
  const fillers = pool.filter((a) => !usedIds.has(a.id)).slice(0, count - agents.length);
  return [...agents, ...fillers];
}

function generateLawPanel(topic) {
  const topicLower = normaliseText(topic);
  const scored = law_makers.map((agent) => ({
    ...agent,
    score: scoreByKeywords(agent, topicLower.split(/\W+/).filter(Boolean), {
      constitution: 5, constitutional: 5, rights: 4, liberty: 3, judicial: 3,
      court: 3, emergency: 4, federal: 3, parliament: 3, tax: 3, economics: 2,
      property: 2, labour: 2, family: 2, criminal: 2, public: 2,
    }),
  }));
  const ranked = sortByScore(scored);
  const experts = ensureDiverseFallback(ranked.filter((a) => a.score > 0).map(trimScore), ranked.map(trimScore), 5);
  const judges = experts.filter((a) => /justice|judge|chief justice/i.test(a.role));
  const advocates = experts.filter((a) => !judges.some((j) => j.id === a.id));
  return { experts, judges, advocates };
}

function generateInterviewPanel(scenario) {
  const scenarioLower = normaliseText(scenario);
  const scenarioMap = {
    "tech-dsa": ["dsa", "algorithm", "coding", "data structure", "technical interview"],
    "system-design": ["system design", "distributed systems", "architecture", "scalability", "api"],
    behavioral: ["leadership", "behavioural interview", "conflict", "communication", "culture fit"],
    "startup-pitch": ["startup", "pitch", "management", "communication", "business"],
    "case-study": ["analysis", "problem solving", "system design", "strategy", "trade-offs"],
    "management-gd": ["management", "leadership", "team dynamics", "strategy", "culture fit"],
  };
  const keywords = scenarioMap[scenarioLower] || scenarioLower.split(/\W+/).filter(Boolean);
  const scored = interview_panel.map((agent) => ({
    ...agent,
    score: scoreByKeywords(agent, keywords, {
      technical: 3, hr: 3, behavioural: 3, startup: 3, management: 3,
      ml: scenarioLower.includes("ml") || scenarioLower.includes("ai") ? 4 : 0,
    }),
  }));
  const interviewers = ensureDiverseFallback(sortByScore(scored).filter((a) => a.score > 0).map(trimScore), sortByScore(scored).map(trimScore), 5);
  return { interviewers };
}

function generateMedicalPanel(medicalCase) {
  const caseLower = normaliseText(medicalCase);
  const keywords = caseLower.split(/\W+/).filter(Boolean);
  const specialtyBonuses = {
    cardiac: 4, cardio: 4, heart: 4, neuro: 4, brain: 4, tumour: 4, tumor: 4,
    oncology: 4, cancer: 5, chemo: 4, orthopaedic: 4, orthopedic: 4, bone: 3,
    pain: 2, trauma: 3, gyn: 3, gynec: 3, pregnancy: 3, mental: 3,
    neuroanatomy: 3, surgery: 2, respiratory: 2, infection: 1,
  };
  const scored = medical_specialists.map((agent) => ({ ...agent, score: scoreByKeywords(agent, keywords, specialtyBonuses) }));
  const doctors = ensureDiverseFallback(sortByScore(scored).filter((a) => a.score > 0).map(trimScore), sortByScore(scored).map(trimScore), 6);
  const specialists = doctors.slice(0, 3);
  return { doctors, specialists };
}

export { generateLawPanel, generateInterviewPanel, generateMedicalPanel };
