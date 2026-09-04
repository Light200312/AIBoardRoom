// ─────────────────────────────────────────────────────────────
// Combat service — team selection, judging, and verdict.
// ─────────────────────────────────────────────────────────────

import Agent from "../agent/agent.model.js";
import { callOrchestratorLLM } from "../../shared/llmClient.js";
import { extractFirstJsonObject, clampNumber } from "../../shared/helpers.js";

function summarizeCombatLog(combatLog = []) {
  return (combatLog || []).map((entry, i) => {
    const speaker = entry?.speakerName || (entry?.isUser ? "Player" : "Opponent");
    return `${i + 1}. ${speaker}: ${String(entry?.text || "").trim()}`;
  }).join("\n");
}

function summarizeRoundResults(roundResults = []) {
  return (roundResults || []).map((r) =>
    `Round ${r.round}: winner=${r.winner}, playerScore=${r.playerScore}, opponentScore=${r.opponentScore}, reasoning=${String(r.reasoning || "").trim()}`
  ).join("\n");
}

function computeAggregateScores(roundResults = [], scores = {}) {
  const playerFromRounds = roundResults.reduce((sum, r) => sum + Number(r?.playerScore || 0), 0);
  const opponentFromRounds = roundResults.reduce((sum, r) => sum + Number(r?.opponentScore || 0), 0);
  return { playerTotal: Math.max(playerFromRounds, Number(scores?.playerScore || 0)), opponentTotal: Math.max(opponentFromRounds, Number(scores?.opponentScore || 0)) };
}

function scoreCandidate(agent, topic, difficulty = "standard") {
  const topicTokens = String(topic || "").toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 3);
  const text = `${agent.role || ""} ${agent.description || ""}`.toLowerCase();
  const matchScore = topicTokens.reduce((acc, token) => (text.includes(token) ? acc + 3 : acc), 0);
  const logic = Number(agent.stats?.logic || 50);
  const rhetoric = Number(agent.stats?.rhetoric || 50);
  const baseSkill = logic * 0.6 + rhetoric * 0.4;
  if (difficulty === "easy") return matchScore + (100 - baseSkill) * 0.2;
  if (difficulty === "hard") return matchScore + baseSkill * 0.4;
  return matchScore + baseSkill * 0.25;
}

async function chooseOpponentTeam({ topic, candidateIds = [], count = 3, difficulty = "standard", ollamaModel = "" }) {
  const safeCount = clampNumber(count, { min: 1, max: 8, fallback: 3 });
  const candidates = await Agent.find(candidateIds.length ? { id: { $in: candidateIds } } : {}).lean();
  if (!candidates.length) throw new Error("No candidates available.");
  const roster = candidates.map((c) => ({ id: c.id, name: c.name, role: c.role, era: c.era, description: c.description, stats: c.stats }));
  const system = "You select an opponent team for a debate game. Return strict JSON only.";
  const prompt = `Topic: ${topic}\nDifficulty: ${difficulty}\n\nPick ${safeCount} agent ids from this roster that best fit the topic and difficulty.\n\nRoster:\n${roster.map((r) => `${r.id} | ${r.name} | ${r.role} | ${r.era}`).join("\n")}\n\nReturn JSON: {"ids":["id1","id2"],"reason":"short reason"}`;
  const raw = await callOrchestratorLLM({ system, prompt, temperature: 0.2, ollamaModel });
  const jsonText = extractFirstJsonObject(raw);
  try {
    const parsed = JSON.parse(jsonText || "{}");
    const ids = Array.isArray(parsed.ids) ? parsed.ids.map((id) => String(id)) : [];
    const picked = candidates.filter((c) => ids.includes(String(c.id)));
    if (picked.length >= Math.min(safeCount, candidates.length)) return { opponentTeam: picked.slice(0, safeCount), reason: String(parsed.reason || "Selected by AI.") };
  } catch (_) {}
  const sorted = [...candidates].sort((a, b) => scoreCandidate(b, topic, difficulty) - scoreCandidate(a, topic, difficulty));
  const fallback = difficulty === "easy" ? sorted.reverse().slice(0, safeCount) : sorted.slice(0, safeCount);
  return { opponentTeam: fallback, reason: "Fallback heuristic selection." };
}

async function chooseOpponentTurn({ topic, opponentTeamIds = [], userArgument = "", strategies = [], difficulty = "standard", ollamaModel = "" }) {
  const candidates = await Agent.find({ id: { $in: opponentTeamIds } }).lean();
  if (!candidates.length) throw new Error("No opponent team available.");
  const system = "You are selecting the opponent speaker and response strategy. Return strict JSON only.";
  const prompt = `Topic: ${topic}\nDifficulty: ${difficulty}\nUser argument: ${userArgument || "none"}\n\nOpponent team:\n${candidates.map((c) => `${c.id} | ${c.name} | ${c.role}`).join("\n")}\n\nAvailable strategies:\n${strategies.map((s) => `${s.type} | ${s.title} | ${s.description}`).join("\n")}\n\nReturn JSON: {"agentId":"<id>","strategyType":"<type>","reason":"short reason"}`;
  const raw = await callOrchestratorLLM({ system, prompt, temperature: 0.3, ollamaModel });
  const jsonText = extractFirstJsonObject(raw);
  try {
    const parsed = JSON.parse(jsonText || "{}");
    const agentId = String(parsed.agentId || "");
    const strategyType = String(parsed.strategyType || "");
    if (candidates.some((c) => String(c.id) === agentId) && strategies.some((s) => s.type === strategyType)) return { agentId, strategyType, reason: String(parsed.reason || "Selected by AI.") };
  } catch (_) {}
  const fallbackAgent = candidates.sort((a, b) => scoreCandidate(b, topic, difficulty) - scoreCandidate(a, topic, difficulty))[0] || candidates[0];
  const fallbackStrategy = strategies.find((s) => s.type === "free_style") || strategies[0];
  return { agentId: String(fallbackAgent.id), strategyType: String(fallbackStrategy.type), reason: "Fallback selection." };
}

async function judgeRound({ topic, playerArgument, opponentArgument, ollamaModel = "" }) {
  const system = "You are a neutral judge for a debate. Return strict JSON only.";
  const prompt = `Topic: ${topic}\nPlayer argument: ${playerArgument}\nOpponent argument: ${opponentArgument}\n\nReturn JSON:\n{"winner":"player|opponent|tie","playerScore":0-100,"opponentScore":0-100,"confidence":0-1,"probabilities":{"player":0-1,"opponent":0-1},"reasoning":"short reasoning"}`;
  const raw = await callOrchestratorLLM({ system, prompt, temperature: 0.2, ollamaModel });
  const jsonText = extractFirstJsonObject(raw);
  try {
    const parsed = JSON.parse(jsonText || "{}");
    const playerScore = clampNumber(parsed.playerScore, { min: 0, max: 100, fallback: 50 });
    const opponentScore = clampNumber(parsed.opponentScore, { min: 0, max: 100, fallback: 50 });
    const winner = ["player", "opponent", "tie"].includes(parsed.winner) ? parsed.winner : "tie";
    return { winner, playerScore, opponentScore, confidence: clampNumber(parsed.confidence, { min: 0, max: 1, fallback: 0.5 }), probabilities: { player: clampNumber(parsed?.probabilities?.player, { min: 0, max: 1, fallback: 0.5 }), opponent: clampNumber(parsed?.probabilities?.opponent, { min: 0, max: 1, fallback: 0.5 }) }, reasoning: String(parsed.reasoning || "Judged by AI.") };
  } catch (_) {}
  const playerScore = clampNumber(playerArgument?.length || 0, { min: 0, max: 100, fallback: 50 });
  const opponentScore = clampNumber(opponentArgument?.length || 0, { min: 0, max: 100, fallback: 50 });
  const winner = playerScore === opponentScore ? "tie" : playerScore > opponentScore ? "player" : "opponent";
  return { winner, playerScore, opponentScore, confidence: 0.4, probabilities: { player: playerScore >= opponentScore ? 0.6 : 0.4, opponent: opponentScore >= playerScore ? 0.6 : 0.4 }, reasoning: "Fallback scoring by length and heuristics." };
}

// ─────────────────────────────────────────────────────────────
// MODE-SPECIFIC VERDICT GENERATORS
// ─────────────────────────────────────────────────────────────

// Helper: Extract arguments from debate log by side
function extractArgumentsBySide(combatLog = []) {
  const playerArgs = [];
  const opponentArgs = [];
  
  combatLog.forEach(entry => {
    const arg = {
      speaker: entry.speakerName || (entry.isUser ? "Player" : "Opponent"),
      statement: String(entry.text || "").trim(),
      round: entry.round || 0
    };
    
    if (entry.isUser || entry.speakerName === "Player") {
      playerArgs.push(arg);
    } else {
      opponentArgs.push(arg);
    }
  });
  
  return { playerArgs, opponentArgs };
}

// COMBAT MODE: Standard debate verdict
async function finalizeCombatVerdict({ topic, playerTeam, opponentTeam, combatLog, roundResults, scores, ollamaModel }) {
  const { playerTotal, opponentTotal } = computeAggregateScores(roundResults, scores);
  const playerNames = playerTeam.map((a) => a?.name).filter(Boolean);
  const opponentNames = opponentTeam.map((a) => a?.name).filter(Boolean);
  const system = "You are a neutral chief judge producing a final debate verdict. Return strict JSON only.";
  const prompt = `Topic: ${topic}\nPlayer council: ${playerNames.join(", ") || "Unknown"}\nOpponent council: ${opponentNames.join(", ") || "Unknown"}\nAggregate score so far: player=${playerTotal}, opponent=${opponentTotal}\n\nRound results:\n${summarizeRoundResults(roundResults) || "No round-level verdicts recorded."}\n\nFull debate transcript:\n${summarizeCombatLog(combatLog) || "No transcript available."}\n\nReturn JSON:\n{"winner":"player|opponent|tie","confidence":0-1,"finalScore":{"player":0-1000,"opponent":0-1000},"summary":"2-4 sentence final verdict","keyMoments":["up to 4"],"playerStrengths":["up to 4"],"playerWeaknesses":["up to 4"],"opponentStrengths":["up to 4"],"opponentWeaknesses":["up to 4"],"reasoning":"short judge explanation"}`;
  const raw = await callOrchestratorLLM({ system, prompt, temperature: 0.2, ollamaModel });
  const jsonText = extractFirstJsonObject(raw);
  try {
    const parsed = JSON.parse(jsonText || "{}");
    const winner = ["player", "opponent", "tie"].includes(parsed.winner) ? parsed.winner : "tie";
    return {
      winner, confidence: clampNumber(parsed.confidence, { min: 0, max: 1, fallback: 0.5 }),
      finalScore: { player: clampNumber(parsed?.finalScore?.player, { min: 0, max: 1000, fallback: playerTotal }), opponent: clampNumber(parsed?.finalScore?.opponent, { min: 0, max: 1000, fallback: opponentTotal }) },
      summary: String(parsed.summary || "").trim(),
      keyMoments: Array.isArray(parsed.keyMoments) ? parsed.keyMoments.map((i) => String(i).trim()).filter(Boolean) : [],
      playerStrengths: Array.isArray(parsed.playerStrengths) ? parsed.playerStrengths.map((i) => String(i).trim()).filter(Boolean) : [],
      playerWeaknesses: Array.isArray(parsed.playerWeaknesses) ? parsed.playerWeaknesses.map((i) => String(i).trim()).filter(Boolean) : [],
      opponentStrengths: Array.isArray(parsed.opponentStrengths) ? parsed.opponentStrengths.map((i) => String(i).trim()).filter(Boolean) : [],
      opponentWeaknesses: Array.isArray(parsed.opponentWeaknesses) ? parsed.opponentWeaknesses.map((i) => String(i).trim()).filter(Boolean) : [],
      reasoning: String(parsed.reasoning || "Final verdict generated by AI judge.").trim(),
    };
  } catch (_) {}
  const winner = playerTotal === opponentTotal ? "tie" : playerTotal > opponentTotal ? "player" : "opponent";
  return { winner, confidence: 0.45, finalScore: { player: playerTotal, opponent: opponentTotal }, summary: winner === "tie" ? "The debate ended in a narrow tie." : `The ${winner} side earned the stronger overall verdict.`, keyMoments: roundResults.slice(0, 4).map((r) => `Round ${r.round}: ${r.reasoning || r.winner}`), playerStrengths: [], playerWeaknesses: [], opponentStrengths: [], opponentWeaknesses: [], reasoning: "Fallback final verdict based on aggregate round scores." };
}

// MENTOR MODE: Feedback for student growth
async function finalizeMentorVerdict({ topic, playerTeam, opponentTeam, combatLog, roundResults, scores, ollamaModel }) {
  const { playerArgs, opponentArgs } = extractArgumentsBySide(combatLog);
  const mentorTeamNames = opponentTeam.map((a) => a?.name).filter(Boolean);
  const system = "You are an expert mentor providing guidance to a student. Return strict JSON only.";
  const prompt = `Topic: ${topic}\nMentor panel: ${mentorTeamNames.join(", ") || "Expert Panel"}\n\nStudent arguments:\n${playerArgs.map(a => `- ${a.statement}`).join('\n') || "No arguments provided"}\n\nMentor feedback:\n${opponentArgs.slice(0, 5).map(a => `- ${a.speaker}: ${a.statement}`).join('\n') || "No feedback provided"}\n\nReturn JSON:\n{"strengths":["3-4 things student did well"],"improvements":["3-4 specific areas to improve"],"advices":["3-4 actionable tips for growth"],"conclusion":"2-3 sentence encouraging summary","keyTakeaways":["top 3 learnings from this session"]}`;
  const raw = await callOrchestratorLLM({ system, prompt, temperature: 0.3, ollamaModel });
  const jsonText = extractFirstJsonObject(raw);
  try {
    const parsed = JSON.parse(jsonText || "{}");
    return {
      type: "mentor",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(s => String(s).trim()).filter(Boolean) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(i => String(i).trim()).filter(Boolean) : [],
      advices: Array.isArray(parsed.advices) ? parsed.advices.map(a => String(a).trim()).filter(Boolean) : [],
      conclusion: String(parsed.conclusion || "").trim(),
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways.map(t => String(t).trim()).filter(Boolean) : [],
    };
  } catch (_) {}
  return {
    type: "mentor",
    strengths: ["Clear communication", "Good topic understanding"],
    improvements: ["Need more evidence", "Consider alternative viewpoints"],
    advices: ["Prepare more examples", "Practice active listening", "Build confidence gradually"],
    conclusion: "Great effort! Continue practicing and you'll improve significantly.",
    keyTakeaways: ["Topic comprehension", "Argument structure", "Presentation clarity"],
  };
}

// INTERVIEW MODE: Feedback for interview preparation
async function finalizeInterviewVerdict({ topic, playerTeam, opponentTeam, combatLog, roundResults, scores, ollamaModel }) {
  const { playerArgs, opponentArgs } = extractArgumentsBySide(combatLog);
  const interviewerNames = opponentTeam.map((a) => a?.name).filter(Boolean);
  const system = "You are an interview coach evaluating candidate performance. Return strict JSON only.";
  const prompt = `Role/Topic: ${topic}\nInterviewers: ${interviewerNames.join(", ") || "Interview Panel"}\n\nCandidate responses:\n${playerArgs.map(a => `- "${a.statement}"`).join('\n') || "No responses"}\n\nInterviewer feedback:\n${opponentArgs.slice(0, 4).map(a => `- ${a.speaker}: ${a.statement}`).join('\n') || "No feedback"}\n\nReturn JSON:\n{"strengths":["3 things done well"],"flaws":["3-4 specific weaknesses to fix"],"technicalAdvice":["2-3 technical/content improvements"],"communicationAdvice":["2-3 communication improvements"],"confidenceLevel":"low|medium|high","nextSteps":["2-3 action items to prepare better"],"overallAssessment":"1-2 sentence summary"}`;
  const raw = await callOrchestratorLLM({ system, prompt, temperature: 0.3, ollamaModel });
  const jsonText = extractFirstJsonObject(raw);
  try {
    const parsed = JSON.parse(jsonText || "{}");
    return {
      type: "interview",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(s => String(s).trim()).filter(Boolean) : [],
      flaws: Array.isArray(parsed.flaws) ? parsed.flaws.map(f => String(f).trim()).filter(Boolean) : [],
      technicalAdvice: Array.isArray(parsed.technicalAdvice) ? parsed.technicalAdvice.map(t => String(t).trim()).filter(Boolean) : [],
      communicationAdvice: Array.isArray(parsed.communicationAdvice) ? parsed.communicationAdvice.map(c => String(c).trim()).filter(Boolean) : [],
      confidenceLevel: ["low", "medium", "high"].includes(parsed.confidenceLevel) ? parsed.confidenceLevel : "medium",
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map(n => String(n).trim()).filter(Boolean) : [],
      overallAssessment: String(parsed.overallAssessment || "").trim(),
    };
  } catch (_) {}
  return {
    type: "interview",
    strengths: ["Clear articulation", "Problem-solving approach"],
    flaws: ["Need more examples", "Could go deeper on details"],
    technicalAdvice: ["Research company more", "Prepare concrete project examples"],
    communicationAdvice: ["Speak more slowly", "Ask clarifying questions"],
    confidenceLevel: "medium",
    nextSteps: ["Mock interview practice", "Research industry trends", "Prepare stories"],
    overallAssessment: "Good foundation. Practice more specific scenarios to improve.",
  };
}

// MEDICAL MODE: Diagnosis and health advice
async function finalizeMedicalVerdict({ topic, playerTeam, opponentTeam, combatLog, roundResults, scores, ollamaModel }) {
  const { playerArgs, opponentArgs } = extractArgumentsBySide(combatLog);
  const specialistNames = opponentTeam.map((a) => a?.name).filter(Boolean);
  const system = "You are a medical consultant in a specialist panel. Return strict JSON only with medical advice.";
  const prompt = `Patient concern/Case: ${topic}\nSpecialist Panel: ${specialistNames.join(", ") || "Medical Team"}\n\nPatient description:\n${playerArgs.map(a => `- ${a.statement}`).join('\n') || "No description"}\n\nSpecialist analysis:\n${opponentArgs.slice(0, 4).map(a => `- ${a.speaker}: ${a.statement}`).join('\n') || "No analysis"}\n\nReturn JSON:\n{"temporaryDiagnosis":"most likely condition(s)","urgentConcerns":["critical issues if any"],"immediateActions":["1-3 first aid or immediate steps"],"doctorVisitUrgency":"low|medium|high","whenToSeeFully":"recommendation on doctor visit timing","recommendedSpecialists":["relevant doctors to consult"],"preventiveMeasures":["3-4 things to prevent worse symptoms"],"disclaimer":"Medical advice disclaimer"}`;
  const raw = await callOrchestratorLLM({ system, prompt, temperature: 0.2, ollamaModel });
  const jsonText = extractFirstJsonObject(raw);
  try {
    const parsed = JSON.parse(jsonText || "{}");
    return {
      type: "medical",
      temporaryDiagnosis: String(parsed.temporaryDiagnosis || "").trim(),
      urgentConcerns: Array.isArray(parsed.urgentConcerns) ? parsed.urgentConcerns.map(u => String(u).trim()).filter(Boolean) : [],
      immediateActions: Array.isArray(parsed.immediateActions) ? parsed.immediateActions.map(a => String(a).trim()).filter(Boolean) : [],
      doctorVisitUrgency: ["low", "medium", "high"].includes(parsed.doctorVisitUrgency) ? parsed.doctorVisitUrgency : "medium",
      whenToSeeFully: String(parsed.whenToSeeFully || "").trim(),
      recommendedSpecialists: Array.isArray(parsed.recommendedSpecialists) ? parsed.recommendedSpecialists.map(s => String(s).trim()).filter(Boolean) : [],
      preventiveMeasures: Array.isArray(parsed.preventiveMeasures) ? parsed.preventiveMeasures.map(m => String(m).trim()).filter(Boolean) : [],
      disclaimer: String(parsed.disclaimer || "This is not a substitute for professional medical advice.").trim(),
    };
  } catch (_) {}
  return {
    type: "medical",
    temporaryDiagnosis: "Consultation recommended with specialist",
    urgentConcerns: ["Please consult a doctor for accurate diagnosis"],
    immediateActions: ["Rest", "Stay hydrated", "Monitor symptoms"],
    doctorVisitUrgency: "high",
    whenToSeeFully: "As soon as possible",
    recommendedSpecialists: ["General Practitioner", "Relevant Specialist"],
    preventiveMeasures: ["Maintain hygiene", "Proper nutrition", "Regular exercise"],
    disclaimer: "This is not a substitute for professional medical advice.",
  };
}

// LAW MODE: Legal analysis report
async function finalizeLawVerdict({ topic, playerTeam, opponentTeam, combatLog, roundResults, scores, ollamaModel }) {
  const { playerArgs, opponentArgs } = extractArgumentsBySide(combatLog);
  const lawyerNames = opponentTeam.map((a) => a?.name).filter(Boolean);
  const system = "You are a constitutional law expert analyzing a legal topic. Return strict JSON only.";
  const prompt = `Legal Topic: ${topic}\nLegal Experts: ${lawyerNames.join(", ") || "Expert Panel"}\n\nArguments in favor:\n${playerArgs.slice(0, 5).map(a => `- ${a.statement}`).join('\n') || "No arguments"}\n\nCounterarguments/Analysis:\n${opponentArgs.slice(0, 5).map(a => `- ${a.speaker}: ${a.statement}`).join('\n') || "No analysis"}\n\nReturn JSON:\n{"legalAnalysis":"detailed analysis of the topic","argumentsFor":["key points supporting the topic"],"argumentsAgainst":["key counterpoints"],"relevantLaws":["applicable laws and articles"],"caseReferences":["relevant case precedents if any"],"conclusions":"balanced conclusion considering both sides","recommendation":"practical recommendation","references":["sources and citations"]}`;
  const raw = await callOrchestratorLLM({ system, prompt, temperature: 0.2, ollamaModel });
  const jsonText = extractFirstJsonObject(raw);
  try {
    const parsed = JSON.parse(jsonText || "{}");
    return {
      type: "law",
      topic: topic,
      legalAnalysis: String(parsed.legalAnalysis || "").trim(),
      argumentsFor: Array.isArray(parsed.argumentsFor) ? parsed.argumentsFor.map(a => String(a).trim()).filter(Boolean) : [],
      argumentsAgainst: Array.isArray(parsed.argumentsAgainst) ? parsed.argumentsAgainst.map(a => String(a).trim()).filter(Boolean) : [],
      relevantLaws: Array.isArray(parsed.relevantLaws) ? parsed.relevantLaws.map(l => String(l).trim()).filter(Boolean) : [],
      caseReferences: Array.isArray(parsed.caseReferences) ? parsed.caseReferences.map(c => String(c).trim()).filter(Boolean) : [],
      conclusions: String(parsed.conclusions || "").trim(),
      recommendation: String(parsed.recommendation || "").trim(),
      references: Array.isArray(parsed.references) ? parsed.references.map(r => String(r).trim()).filter(Boolean) : [],
    };
  } catch (_) {}
  return {
    type: "law",
    topic: topic,
    legalAnalysis: "Detailed legal analysis pending expert review",
    argumentsFor: playerArgs.slice(0, 3).map(a => a.statement),
    argumentsAgainst: opponentArgs.slice(0, 3).map(a => a.statement),
    relevantLaws: [],
    caseReferences: [],
    conclusions: "Balanced analysis of the legal topic",
    recommendation: "Consult with legal experts for personalized advice",
    references: [],
  };
}

// HISTORICAL MODE: Event analysis with character perspectives
async function finalizeHistoricalVerdict({ topic, playerTeam, opponentTeam, combatLog, roundResults, scores, ollamaModel }) {
  const { playerArgs, opponentArgs } = extractArgumentsBySide(combatLog);
  const historicalFigures = [...playerTeam, ...opponentTeam].map((a) => a?.name).filter(Boolean);
  const system = "You are a historical analyst synthesizing perspectives from different historical figures. Return strict JSON only.";
  const prompt = `Historical Event/Topic: ${topic}\nHistorical Figures: ${historicalFigures.join(", ") || "Historical Panel"}\n\nPerspectives shared:\n${playerArgs.slice(0, 4).map(a => `- ${a.speaker}: ${a.statement}`).join('\n') || "No perspectives"}\n\n${opponentArgs.slice(0, 4).map(a => `- ${a.speaker}: ${a.statement}`).join('\n') || ""}\n\nReturn JSON:\n{"eventSummary":"overview of the historical event","keyPerspectives":[{"figure":"name","view":"their perspective","era":"time period"}],"commonThemes":["shared points across perspectives"],"divergentViews":["areas of disagreement or different interpretations"],"historicalContext":"background and significance","legacyAndImpact":"how this event affected history","conclusions":"synthesis of all perspectives"}`;
  const raw = await callOrchestratorLLM({ system, prompt, temperature: 0.3, ollamaModel });
  const jsonText = extractFirstJsonObject(raw);
  try {
    const parsed = JSON.parse(jsonText || "{}");
    return {
      type: "historical",
      eventSummary: String(parsed.eventSummary || "").trim(),
      keyPerspectives: Array.isArray(parsed.keyPerspectives) ? parsed.keyPerspectives.map(p => ({
        figure: String(p?.figure || "").trim(),
        view: String(p?.view || "").trim(),
        era: String(p?.era || "").trim(),
      })).filter(p => p.figure) : [],
      commonThemes: Array.isArray(parsed.commonThemes) ? parsed.commonThemes.map(t => String(t).trim()).filter(Boolean) : [],
      divergentViews: Array.isArray(parsed.divergentViews) ? parsed.divergentViews.map(v => String(v).trim()).filter(Boolean) : [],
      historicalContext: String(parsed.historicalContext || "").trim(),
      legacyAndImpact: String(parsed.legacyAndImpact || "").trim(),
      conclusions: String(parsed.conclusions || "").trim(),
    };
  } catch (_) {}
  return {
    type: "historical",
    eventSummary: "Historical event discussed from multiple perspectives",
    keyPerspectives: historicalFigures.map((fig, i) => ({
      figure: fig,
      view: (i < playerArgs.length ? playerArgs[i]?.statement : opponentArgs[i - playerArgs.length]?.statement) || "Perspective shared",
      era: "Historical period",
    })),
    commonThemes: ["Historical significance", "Major impact"],
    divergentViews: ["Multiple viewpoints discussed"],
    historicalContext: "Event placed in historical context",
    legacyAndImpact: "Lasting effects on history",
    conclusions: "Analysis of perspectives shared by historical figures",
  };
}

// FANTASY MODE: Event analysis with fictional character perspectives
async function finalizeFantasyVerdict({ topic, playerTeam, opponentTeam, combatLog, roundResults, scores, ollamaModel }) {
  const { playerArgs, opponentArgs } = extractArgumentsBySide(combatLog);
  const fantasyCharacters = [...playerTeam, ...opponentTeam].map((a) => a?.name).filter(Boolean);
  const system = "You are a lore enthusiast analyzing a topic from multiple fictional character perspectives. Return strict JSON only.";
  const prompt = `Topic/Event: ${topic}\nCharacters: ${fantasyCharacters.join(", ") || "Character Panel"}\n\nCharacter perspectives:\n${playerArgs.slice(0, 4).map(a => `- ${a.speaker} (${a.speaker}'s view): ${a.statement}`).join('\n') || "No perspectives"}\n\n${opponentArgs.slice(0, 4).map(a => `- ${a.speaker}: ${a.statement}`).join('\n') || ""}\n\nReturn JSON:\n{"topicOverview":"summary of the topic from lore perspective","characterAnalysis":[{"character":"name","loreBackground":"from their universe/world","perspective":"their view on the topic"}],"worldbuildingContext":"the fictional world and its context","consensusAndConflict":"areas of character agreement and disagreement","loreImplications":"how this affects the fictional world and its lore","synthesisReport":"comprehensive synthesis of all character perspectives"}`;
  const raw = await callOrchestratorLLM({ system, prompt, temperature: 0.35, ollamaModel });
  const jsonText = extractFirstJsonObject(raw);
  try {
    const parsed = JSON.parse(jsonText || "{}");
    return {
      type: "fantasy",
      topicOverview: String(parsed.topicOverview || "").trim(),
      characterAnalysis: Array.isArray(parsed.characterAnalysis) ? parsed.characterAnalysis.map(c => ({
        character: String(c?.character || "").trim(),
        loreBackground: String(c?.loreBackground || "").trim(),
        perspective: String(c?.perspective || "").trim(),
      })).filter(c => c.character) : [],
      worldbuildingContext: String(parsed.worldbuildingContext || "").trim(),
      consensusAndConflict: String(parsed.consensusAndConflict || "").trim(),
      loreImplications: String(parsed.loreImplications || "").trim(),
      synthesisReport: String(parsed.synthesisReport || "").trim(),
    };
  } catch (_) {}
  return {
    type: "fantasy",
    topicOverview: "Discussion of topic within fictional world",
    characterAnalysis: fantasyCharacters.map((char, i) => ({
      character: char,
      loreBackground: "Character from fictional universe",
      perspective: (i < playerArgs.length ? playerArgs[i]?.statement : opponentArgs[i - playerArgs.length]?.statement) || "Shared perspective",
    })),
    worldbuildingContext: "Fictional world discussed",
    consensusAndConflict: "Various character perspectives presented",
    loreImplications: "Impact on the fictional world's lore",
    synthesisReport: "Synthesis of all character viewpoints from fictional universe",
  };
}

// ─────────────────────────────────────────────────────────────
// MAIN VERDICT DISPATCHER - Routes to mode-specific handlers
// ─────────────────────────────────────────────────────────────

async function finalizeDebateVerdict({ topic, playerTeam = [], opponentTeam = [], combatLog = [], roundResults = [], scores = {}, ollamaModel = "", mode = "combat" }) {
  // Route to appropriate mode handler
  switch(mode) {
    case "mentor":
      return await finalizeMentorVerdict({ topic, playerTeam, opponentTeam, combatLog, roundResults, scores, ollamaModel });
    case "interview-simulator":
      return await finalizeInterviewVerdict({ topic, playerTeam, opponentTeam, combatLog, roundResults, scores, ollamaModel });
    case "medical-consulting":
      return await finalizeMedicalVerdict({ topic, playerTeam, opponentTeam, combatLog, roundResults, scores, ollamaModel });
    case "learn-law":
      return await finalizeLawVerdict({ topic, playerTeam, opponentTeam, combatLog, roundResults, scores, ollamaModel });
    case "historical":
      return await finalizeHistoricalVerdict({ topic, playerTeam, opponentTeam, combatLog, roundResults, scores, ollamaModel });
    case "fantasy":
      return await finalizeFantasyVerdict({ topic, playerTeam, opponentTeam, combatLog, roundResults, scores, ollamaModel });
    case "combat":
    default:
      return await finalizeCombatVerdict({ topic, playerTeam, opponentTeam, combatLog, roundResults, scores, ollamaModel });
  }
}

export { chooseOpponentTeam, chooseOpponentTurn, judgeRound, finalizeDebateVerdict };
