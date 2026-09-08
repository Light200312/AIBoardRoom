import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { ControlBar } from "./components/ControlBar";
import { DraftBoard } from "./components/DraftBoard";
import { DirectorChoice } from "./components/DirectorChoice";
import { LiveAnalytics } from "./components/LiveAnalytics";
import { BiasSlider } from "./components/BiasSlider";
import { CoinToss } from "./components/CoinToss";
import { PersonaEditor } from "./components/PersonaEditor";
import { PhaseSelect } from "./components/PhaseSelect";
import { TopicSelect } from "./components/TopicSelect";
import { MemberSelect } from "./components/MemberSelect";
import { MentorDashboard } from "./components/MentorDashboard";
import { BoardroomDashboard } from "./components/BoardroomDashboard";
import { ProfilePage } from "./components/ProfilePage";
import { DiscussionHistory } from "./components/DiscussionHistory";
import { AuthPage } from "./components/AuthPage";
import { Button } from "./components/ui/Button";
import ArgumentsView from "./components/ArgumentsView";
import VerdictReportViewer from "./components/VerdictReportViewer";
import LearnLawPage from "./components/LearnLawPage";
import InterviewSimulatorPage from "./components/InterviewSimulatorPage";
import MedicalConsultingPage from "./components/MedicalConsultingPage";
import { STRATEGIES, MOCK_HEATMAP } from "./data/mockData";
import { useAppStore } from "./store/useAppStore";
import { downloadPdf } from "./lib/pdf";

function buildReportCombatLog(mode, combatLog = [], messages = []) {
  if (mode === "combat") return combatLog;

  let round = 1;
  let sawUserTurnInRound = false;

  return (messages || [])
    .filter((entry) => entry && entry.speakerId !== "orchestrator" && String(entry.text || "").trim())
    .map((entry) => {
      const normalized = {
        id: entry.id,
        speakerId: entry.speakerId,
        speakerName: entry.speakerName,
        speakerInitials: entry.speakerInitials,
        isUser: Boolean(entry.isUser),
        text: String(entry.text || "").trim(),
        timestamp: entry.timestamp,
        round,
      };

      if (entry.isUser) {
        sawUserTurnInRound = true;
      } else if (sawUserTurnInRound) {
        sawUserTurnInRound = false;
        round += 1;
      }

      return normalized;
    });
}

function buildReportPdfSections({ verdict, mode, topic, playerTeam = [], opponentTeam = [], combatLog = [], roundResults = [] }) {
  if (!verdict) return [];

  const sections = [
    { type: "title", text: `AI Council Report - ${String(mode || "session").replace(/-/g, " ")}` },
    { type: "paragraph", text: `Topic: ${topic || "Untitled debate"}` },
  ];

  if (mode === "combat") {
    sections.push(
      { type: "paragraph", text: `Player Council: ${playerTeam.map((agent) => agent.name).join(", ") || "Unknown"}` },
      { type: "paragraph", text: `Opponent Council: ${opponentTeam.map((agent) => agent.name).join(", ") || "Unknown"}` },
      {
        type: "paragraph",
        text: `Winner: ${String(verdict?.winner || "tie").toUpperCase()} | Final Score: Player ${verdict?.finalScore?.player ?? 0} - Opponent ${verdict?.finalScore?.opponent ?? 0}`,
      },
      { type: "heading", text: "Final Summary" },
      { type: "paragraph", text: verdict.summary || verdict.reasoning || "No final summary available." },
      { type: "heading", text: "Judge Reasoning" },
      { type: "paragraph", text: verdict.reasoning || "No judge reasoning available." },
      { type: "heading", text: "Key Moments" },
      {
        type: "list",
        items:
          verdict?.keyMoments?.length
            ? verdict.keyMoments
            : roundResults.map((result) => `Round ${result.round}: ${result.reasoning || result.winner}`),
      },
      { type: "heading", text: "Player Strengths" },
      { type: "list", items: verdict?.playerStrengths?.length ? verdict.playerStrengths : ["No strengths recorded."] },
      { type: "heading", text: "Player Weaknesses" },
      { type: "list", items: verdict?.playerWeaknesses?.length ? verdict.playerWeaknesses : ["No weaknesses recorded."] },
      { type: "heading", text: "Opponent Strengths" },
      { type: "list", items: verdict?.opponentStrengths?.length ? verdict.opponentStrengths : ["No strengths recorded."] },
      { type: "heading", text: "Opponent Weaknesses" },
      { type: "list", items: verdict?.opponentWeaknesses?.length ? verdict.opponentWeaknesses : ["No weaknesses recorded."] },
      { type: "heading", text: "Transcript Highlights" },
      {
        type: "list",
        items: combatLog.map((entry) => `${entry.speakerName}: ${String(entry.text || "").replace(/\s+/g, " ").trim()}`),
      }
    );
    return sections;
  }

  // ── Boardroom / Idea Validation report ──────────────────────
  if (mode === "boardroom" || verdict.type === "boardroom") {
    if (verdict.overallVerdict) {
      sections.push({ type: "heading", text: "Overall Verdict" }, { type: "paragraph", text: verdict.overallVerdict });
    }
    if (verdict.executiveSummary) {
      sections.push({ type: "heading", text: "Executive Summary" }, { type: "paragraph", text: verdict.executiveSummary });
    }
    if (verdict.scores) {
      sections.push(
        { type: "heading", text: "Viability Scores" },
        {
          type: "list",
          items: [
            `Market Opportunity: ${verdict.scores.marketOpportunity ?? "—"}/100`,
            `Financial Viability: ${verdict.scores.financialViability ?? "—"}/100`,
            `Technical Feasibility: ${verdict.scores.technicalFeasibility ?? "—"}/100`,
            `Investment Attractiveness: ${verdict.scores.investmentAttractiveness ?? "—"}/100`,
          ],
        }
      );
    }
    if (verdict.risks) {
      sections.push(
        { type: "heading", text: "Risk Assessment" },
        {
          type: "list",
          items: [
            `Legal Risk: ${verdict.risks.legalRisk ?? "—"}`,
            `Ethical Risk: ${verdict.risks.ethicalRisk ?? "—"}`,
            `Operational Risk: ${verdict.risks.operationalRisk ?? "—"}`,
            `Market Risk: ${verdict.risks.marketRisk ?? "—"}`,
          ],
        }
      );
    }
    if (verdict.keyStrengths?.length) {
      sections.push({ type: "heading", text: "Key Strengths" }, { type: "list", items: verdict.keyStrengths });
    }
    if (verdict.criticalWeaknesses?.length) {
      sections.push({ type: "heading", text: "Critical Weaknesses" }, { type: "list", items: verdict.criticalWeaknesses });
    }
    if (verdict.recommendedNextSteps?.length) {
      sections.push({ type: "heading", text: "Recommended Next Steps" }, { type: "list", items: verdict.recommendedNextSteps });
    }
    if (verdict.councilNotes) {
      sections.push({ type: "heading", text: "Council Notes" }, { type: "paragraph", text: verdict.councilNotes });
    }
    return sections;
  }

  if (verdict.conclusion) {
    sections.push({ type: "heading", text: "Conclusion" }, { type: "paragraph", text: verdict.conclusion });
  }  if (verdict.overallAssessment) {
    sections.push({ type: "heading", text: "Overall Assessment" }, { type: "paragraph", text: verdict.overallAssessment });
  }
  if (verdict.temporaryDiagnosis) {
    sections.push({ type: "heading", text: "Temporary Diagnosis" }, { type: "paragraph", text: verdict.temporaryDiagnosis });
  }
  if (verdict.legalAnalysis) {
    sections.push({ type: "heading", text: "Legal Analysis" }, { type: "paragraph", text: verdict.legalAnalysis });
  }
  if (verdict.eventSummary) {
    sections.push({ type: "heading", text: "Event Summary" }, { type: "paragraph", text: verdict.eventSummary });
  }
  if (verdict.topicOverview) {
    sections.push({ type: "heading", text: "Topic Overview" }, { type: "paragraph", text: verdict.topicOverview });
  }

  const listGroups = [
    ["strengths", "Strengths"],
    ["improvements", "Areas for Improvement"],
    ["advices", "Actionable Advice"],
    ["keyTakeaways", "Key Takeaways"],
    ["flaws", "Flaws to Fix"],
    ["technicalAdvice", "Technical Advice"],
    ["communicationAdvice", "Communication Advice"],
    ["nextSteps", "Next Steps"],
    ["urgentConcerns", "Urgent Concerns"],
    ["immediateActions", "Immediate Actions"],
    ["recommendedSpecialists", "Recommended Specialists"],
    ["preventiveMeasures", "Preventive Measures"],
    ["argumentsFor", "Arguments Supporting"],
    ["argumentsAgainst", "Counterarguments"],
    ["relevantLaws", "Applicable Laws"],
    ["caseReferences", "Case References"],
    ["references", "References"],
    ["commonThemes", "Common Themes"],
    ["divergentViews", "Divergent Views"],
  ];

  listGroups.forEach(([key, label]) => {
    if (Array.isArray(verdict[key]) && verdict[key].length) {
      sections.push({ type: "heading", text: label }, { type: "list", items: verdict[key] });
    }
  });

  if (Array.isArray(verdict.keyPerspectives) && verdict.keyPerspectives.length) {
    sections.push({
      type: "heading",
      text: "Key Perspectives",
    });
    sections.push({
      type: "list",
      items: verdict.keyPerspectives.map((item) => `${item.figure}: ${item.view}${item.era ? ` (${item.era})` : ""}`),
    });
  }

  if (Array.isArray(verdict.characterAnalysis) && verdict.characterAnalysis.length) {
    sections.push({
      type: "heading",
      text: "Character Analysis",
    });
    sections.push({
      type: "list",
      items: verdict.characterAnalysis.map(
        (item) => `${item.character}: ${item.perspective}${item.loreBackground ? ` | ${item.loreBackground}` : ""}`
      ),
    });
  }

  ["confidenceLevel", "doctorVisitUrgency", "whenToSeeFully", "recommendation", "conclusions", "historicalContext", "legacyAndImpact", "worldbuildingContext", "consensusAndConflict", "loreImplications", "synthesisReport", "disclaimer"].forEach((key) => {
    if (verdict[key]) {
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
      sections.push({ type: "heading", text: label }, { type: "paragraph", text: verdict[key] });
    }
  });

  return sections;
}

function App() {
  // Global app state + actions from the central store.
  const token = useAppStore((state) => state.token);
  const agents = useAppStore((state) => state.agents);
  const gameState = useAppStore((state) => state.gameState);
  const messages = useAppStore((state) => state.messages);
  const theme = useAppStore((state) => state.theme);
  const authenticate = useAppStore((state) => state.authenticate);
  const signOut = useAppStore((state) => state.signOut);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const bootstrapSession = useAppStore((state) => state.bootstrapSession);
  const setMode = useAppStore((state) => state.setMode);
  const setTopic = useAppStore((state) => state.setTopic);
  const goToSetupPhase = useAppStore((state) => state.goToSetupPhase);
  const toggleMember = useAppStore((state) => state.toggleMember);
  const completeSetup = useAppStore((state) => state.completeSetup);
  const confirmDraft = useAppStore((state) => state.confirmDraft);
  const resetSession = useAppStore((state) => state.resetSession);
  const loadDiscussionHistory = useAppStore((state) => state.loadDiscussionHistory);
  const openHistoryDiscussion = useAppStore((state) => state.openHistoryDiscussion);
  const discussionHistory = useAppStore((state) => state.discussionHistory);
  const isLoadingHistory = useAppStore((state) => state.isLoadingHistory);
  const setCombatStarted = useAppStore((state) => state.setCombatStarted);
  const setBiasLevel = useAppStore((state) => state.setBiasLevel);
  const reloadAgents = useAppStore((state) => state.reloadAgents);
  const maxMembers = useAppStore((state) => state.gameState.maxMembers);
  const setMaxMembers = useAppStore((state) => state.setMaxMembers);
  const argumentLimit = useAppStore((state) => state.gameState.argumentLimit);
  const setArgumentLimit = useAppStore((state) => state.setArgumentLimit);
  const difficulty = useAppStore((state) => state.gameState.difficulty);
  const setDifficulty = useAppStore((state) => state.setDifficulty);
  const respondAsAgent = useAppStore((state) => state.respondAsAgent);
  const combatNextOpponentTurn = useAppStore((state) => state.combatNextOpponentTurn);
  const combatJudgeRound = useAppStore((state) => state.combatJudgeRound);
  const combatFinalizeVerdict = useAppStore((state) => state.combatFinalizeVerdict);
  const appendCombatLog = useAppStore((state) => state.appendCombatLog);
  const addRoundResult = useAppStore((state) => state.addRoundResult);
  const updateGameState = useAppStore((state) => state.updateGameState);
  const lastVerdict = useAppStore((state) => state.gameState.lastVerdict);
  const roundResults = useAppStore((state) => state.gameState.roundResults);
  const finalVerdict = useAppStore((state) => state.gameState.finalVerdict);
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebarCollapsed = useAppStore((state) => state.toggleSidebarCollapsed);
  const setSidebarCollapsed = useAppStore((state) => state.setSidebarCollapsed);

  // Local UI state for tabs, drawers, editor, and combat UX.
  const [activeTab, setActiveTab] = useState("arena");
  const [activeArenaPanel, setActiveArenaPanel] = useState("session");
  const [isPersonaEditorOpen, setIsPersonaEditorOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState();
  const [selectedStrategy, setSelectedStrategy] = useState(
    STRATEGIES.find((s) => s.type === "free_style") || null
  );
  const [isResolvingTurn, setIsResolvingTurn] = useState(false);
  const [pendingOpponentArgument, setPendingOpponentArgument] = useState(null);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(null);
  const [previewText, setPreviewText] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [tweakInstruction, setTweakInstruction] = useState("");
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState("");
  const userRowRefs = useRef([]);
  const opponentRowRefs = useRef([]);
  const [rowHeights, setRowHeights] = useState([]);
  const [showSetupHistory, setShowSetupHistory] = useState(false);
  const reportCacheKeyRef = useRef("");
  const previousPhaseRef = useRef(gameState.phase);

  // Bootstrap persisted session on first load.
  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  // Left sidebar auto-collapses to the icon rail below a narrow-screen breakpoint.
  // The manual toggle still works within a given width; this just reacts to resize crossings.
  useEffect(() => {
    const SIDEBAR_BREAKPOINT_PX = 1024;
    const evaluate = () => setSidebarCollapsed(window.innerWidth < SIDEBAR_BREAKPOINT_PX);
    evaluate();
    window.addEventListener("resize", evaluate);
    return () => window.removeEventListener("resize", evaluate);
  }, [setSidebarCollapsed]);

  // Apply dark theme class to document root.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Pair user/opponent messages into rounds for the combat log display.
  const roundPairs = useMemo(() => {
    const pairs = [];
    let current = { round: 1, player: null, opponent: null };
    gameState.combatLog.forEach((entry) => {
      if (entry.isUser) {
        if (current.player || current.opponent) {
          pairs.push(current);
          current = { round: current.round + 1, player: null, opponent: null };
        }
        current.player = entry;
      } else {
        if (current.opponent) {
          pairs.push(current);
          current = { round: current.round + 1, player: null, opponent: null };
        }
        current.opponent = entry;
      }
    });
    if (current.player || current.opponent) pairs.push(current);
    return pairs;
  }, [gameState.combatLog]);

  // Keep left/right message cards aligned to the same height per round.
  useLayoutEffect(() => {
    const heights = roundPairs.map((_, index) => {
      const left = userRowRefs.current[index];
      const right = opponentRowRefs.current[index];
      const leftHeight = left ? left.offsetHeight : 0;
      const rightHeight = right ? right.offsetHeight : 0;
      return Math.max(leftHeight, rightHeight, 0);
    });
    setRowHeights(heights);
  }, [roundPairs, previewText, gameState.combatLog.length]);

  const reportCombatLog = useMemo(
    () => buildReportCombatLog(gameState.mode, gameState.combatLog, messages),
    [gameState.mode, gameState.combatLog, messages]
  );
  const reportCacheKey = useMemo(
    () => `${gameState.sessionId || "session"}::${gameState.mode || "mode"}::${gameState.topic || "topic"}`,
    [gameState.sessionId, gameState.mode, gameState.topic]
  );
  const hasStoredReportForCurrentSession = useMemo(
    () =>
      Boolean(finalVerdict) &&
      String(finalVerdict.sessionId || "") === String(gameState.sessionId || "") &&
      String(finalVerdict.topic || "") === String(gameState.topic || "") &&
      String(finalVerdict.mode || gameState.mode || "") === String(gameState.mode || ""),
    [finalVerdict, gameState.sessionId, gameState.topic, gameState.mode]
  );
  const hasReportData =
    gameState.mode === "combat"
      ? roundResults.length > 0 || reportCombatLog.length > 1
      : reportCombatLog.length > 0;
  const hasCachedReport = hasStoredReportForCurrentSession || reportCacheKeyRef.current === reportCacheKey;
  const mentorStyleModes = [
    "mentor",
    "historical",
    "fantasy",
    "learn-law",
    "interview-simulator",
    "medical-consulting",
  ];

  useEffect(() => {
    if (hasStoredReportForCurrentSession) {
      reportCacheKeyRef.current = reportCacheKey;
    }
  }, [hasStoredReportForCurrentSession, reportCacheKey]);

  // Transition from coin toss into the first combat round.
  const handleCoinTossComplete = (winner) => {
    setCombatStarted();
    updateGameState({
      phase: "combat",
      activeTurn: winner,
      roundStarter: winner,
      roundStep: 0,
      currentRound: 1,
    });
    if (winner === "opponent") {
      setTimeout(() => {
        runOpponentTurn({ userArgument: "" });
      }, 400);
    }
  };

  // Build prompt constraints to guide model responses for a given role/strategy.
  const buildOutputConstraints = (strategy, role = "player") => {
    const base = `Stay in character. Respond to the debate topic directly. Keep it concise but strong.`;
    const strategyLine =
      strategy?.type === "free_style"
        ? "Choose the best tone and intensity based on the opponent's last argument."
        : `Use the ${strategy?.title || "selected"} strategy style.`;
    const roleLine = role === "opponent" ? "You are the opponent." : "You are the player.";
    return `${base} ${strategyLine} ${roleLine}`;
  };

  // Resolve the opponent turn: pick agent + strategy, generate response, log it.
  const runOpponentTurn = async ({ userArgument }) => {
    const state = useAppStore.getState();
    if (state.gameState.activeTurn !== "opponent") return;
    const opponentTeamIds = state.gameState.opponentTeam.map((a) => a.id);
    if (!opponentTeamIds.length) return;

    setIsResolvingTurn(true);
    const decision = await combatNextOpponentTurn({
      topic: state.gameState.topic,
      opponentTeamIds,
      userArgument,
      strategies: STRATEGIES,
      difficulty: state.gameState.difficulty,
    });
    const opponentAgent = state.gameState.opponentTeam.find((a) => a.id === decision.agentId);
    const strategy = STRATEGIES.find((s) => s.type === decision.strategyType) || STRATEGIES[0];

    setIsSpeaking(true);
    setActiveSpeakerId(decision.agentId);
    const opponentResponse = await respondAsAgent({
      agentId: decision.agentId,
      taskGoal: state.gameState.topic,
      messages: state.gameState.combatLog,
      outputConstraints: buildOutputConstraints(strategy, "opponent"),
    });
    setIsSpeaking(false);
    const opponentText = opponentResponse?.response?.text || "";
    if (opponentAgent) {
      appendCombatLog({
        speakerId: opponentAgent.id,
        speakerName: opponentAgent.name,
        speakerInitials: opponentAgent.avatarInitials,
        isUser: false,
        text: opponentText,
        timestamp: Date.now(),
      });
    }

    updateGameState({
      activeTurn: "player",
      roundStep: 1,
    });

    setPendingOpponentArgument({
      text: opponentText,
      agentId: decision.agentId,
      strategyType: strategy.type,
    });
    setIsResolvingTurn(false);
  };

  // Choose a strategy for the user's next response.
  const handleStrategySelect = (strategy) => {
    setSelectedStrategy(strategy);
    setPreviewText("");
  };

  // Select which player agent speaks for the current round.
  const handleSpeakerSelect = (agentId) => {
    if (gameState.phase !== "combat") return;
    if (gameState.activeTurn !== "player") return;
    if (!selectedStrategy || isResolvingTurn) return;
    setSelectedSpeakerId(agentId);
    setPreviewText("");
  };

  // Ask the model for a draft response for the selected agent.
  const generatePreview = async () => {
    const state = useAppStore.getState();
    if (!selectedSpeakerId || !selectedStrategy) return;
    if (state.gameState.activeTurn !== "player") return;
    setPreviewLoading(true);
    setIsSpeaking(true);
    setActiveSpeakerId(selectedSpeakerId);
    const lastOpponent = [...state.gameState.combatLog].reverse().find((m) => !m.isUser);
    const lastOpponentText = lastOpponent?.text || "";
    const constraints = `${buildOutputConstraints(selectedStrategy, "player")} ${
      lastOpponentText ? "Respond directly to the opponent's last argument." : "Respond directly to the topic."
    }`;
    const playerResponse = await respondAsAgent({
      agentId: selectedSpeakerId,
      taskGoal: state.gameState.topic,
      messages: state.gameState.combatLog,
      outputConstraints: constraints,
    });
    setIsSpeaking(false);
    setPreviewText(playerResponse?.response?.text || "");
    setPreviewLoading(false);
  };

  // Apply a tweak instruction to the current draft.
  const applyTweak = async () => {
    const state = useAppStore.getState();
    if (!selectedSpeakerId || !selectedStrategy || !previewText.trim() || !tweakInstruction.trim()) return;
    if (state.gameState.activeTurn !== "player") return;
    setPreviewLoading(true);
    setIsSpeaking(true);
    setActiveSpeakerId(selectedSpeakerId);
    const constraints = `${buildOutputConstraints(selectedStrategy, "player")} Revise the draft below using the tweak instructions. Draft: "${previewText}". Tweak: "${tweakInstruction}".`;
    const playerResponse = await respondAsAgent({
      agentId: selectedSpeakerId,
      taskGoal: state.gameState.topic,
      messages: state.gameState.combatLog,
      outputConstraints: constraints,
    });
    setIsSpeaking(false);
    setPreviewText(playerResponse?.response?.text || previewText);
    setPreviewLoading(false);
  };

  // Clear draft and tweak inputs.
  const discardPreview = () => {
    setPreviewText("");
    setTweakInstruction("");
  };

  // Send the draft to the combat log and advance the round.
  const sendPreview = async () => {
    const state = useAppStore.getState();
    if (!selectedSpeakerId || !selectedStrategy || !previewText) return;
    if (state.gameState.activeTurn !== "player") return;
    setIsResolvingTurn(true);
    const playerAgent = state.gameState.playerTeam.find((a) => a.id === selectedSpeakerId);
    if (playerAgent) {
      appendCombatLog({
        speakerId: playerAgent.id,
        speakerName: playerAgent.name,
        speakerInitials: playerAgent.avatarInitials,
        isUser: true,
        text: previewText,
        timestamp: Date.now(),
      });
    }

    updateGameState({ activeTurn: "opponent" });

    let opponentText = "";
    if (state.gameState.roundStarter === "player") {
      await runOpponentTurn({ userArgument: previewText });
      const latest = useAppStore.getState().gameState.combatLog;
      const lastOpponent = [...latest].reverse().find((m) => !m.isUser);
      opponentText = lastOpponent?.text || "";
    } else if (pendingOpponentArgument?.text) {
      opponentText = pendingOpponentArgument.text;
    }

    if (opponentText) {
      const verdict = await combatJudgeRound({
        topic: state.gameState.topic,
        playerArgument: previewText,
        opponentArgument: opponentText,
      });

      const current = useAppStore.getState().gameState;
      updateGameState({
        playerScore: current.playerScore + (verdict.playerScore || 0),
        opponentScore: current.opponentScore + (verdict.opponentScore || 0),
      });
      addRoundResult({
        round: current.currentRound,
        ...verdict,
      });
    }

    setPendingOpponentArgument(null);
    setPreviewText("");
    setSelectedStrategy(null);
    setSelectedSpeakerId(null);

    const currentState = useAppStore.getState().gameState;
    const nextRound = currentState.currentRound + 1;
    const totalRounds = currentState.totalRounds;
    if (totalRounds && nextRound > totalRounds) {
      updateGameState({ phase: "complete" });
    } else {
      updateGameState({
        currentRound: nextRound,
        roundStep: 0,
        activeTurn: currentState.roundStarter,
      });
      if (currentState.roundStarter === "opponent") {
        setTimeout(() => {
          runOpponentTurn({ userArgument: "" });
        }, 500);
      }
    }

    setIsResolvingTurn(false);
  };

  // Force the combat to finish (infinite rounds mode).
  const handleEndGame = () => {
    updateGameState({ phase: "complete" });
  };

  // Reset draft selection when the round or turn changes.
  useEffect(() => {
    if (gameState.phase !== "combat") return;
    if (gameState.activeTurn !== "player") return;
    setSelectedSpeakerId(null);
    setPreviewText("");
  }, [gameState.currentRound, gameState.activeTurn, gameState.phase]);

  // Switch left sidebar tab and optionally load history.
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId !== "arena") setActiveArenaPanel("session");
    if (tabId === "history") {
      loadDiscussionHistory();
    }
  };

  // Handle feature selection from the Features section in Sidebar
  const handleFeatureSelect = (featureId) => {
    setActiveTab(featureId);
    setActiveArenaPanel("session");
    // Set the mode to match the feature
    if (featureId === "learn-law") {
      setMode("learn-law");
    } else if (featureId === "interview-simulator") {
      setMode("interview-simulator");
    } else if (featureId === "medical-consulting") {
      setMode("medical-consulting");
    }
  };

  // Handle agent selection from feature pages and start debate
  const handleSelectExperts = (selectedExperts, topic, mode) => {
    // Set player team (selectedExperts are agent objects from the page)
    const expertIds = selectedExperts.map((e) => (typeof e === "object" ? e.id : e));
    expertIds.forEach((expertId) => {
      if (!gameState.playerTeam.find((m) => m.id === expertId)) {
        toggleMember(expertId);
      }
    });
    // Set topic and mode, transition to discussion view (like mentor mode)
    setTopic(topic);
    setMode(mode || "learn-law");
    // Clear active tab to show the main arena view
    setActiveTab("arena");
  };

  const handleSelectInterviewers = (selectedInterviewers, topic, mode) => {
    // Set player team (selectedInterviewers are agent objects from the page)
    const interviewerIds = selectedInterviewers.map((i) => (typeof i === "object" ? i.id : i));
    interviewerIds.forEach((interviewerId) => {
      if (!gameState.playerTeam.find((m) => m.id === interviewerId)) {
        toggleMember(interviewerId);
      }
    });
    // Set topic and mode, transition to discussion view
    setTopic(topic);
    setMode(mode || "interview-simulator");
    // Clear active tab to show the main arena view
    setActiveTab("arena");
  };

  const handleSelectDoctors = (selectedDoctors, topic, mode) => {
    // Set player team (selectedDoctors are agent objects from the page)
    const doctorIds = selectedDoctors.map((d) => (typeof d === "object" ? d.id : d));
    doctorIds.forEach((doctorId) => {
      if (!gameState.playerTeam.find((m) => m.id === doctorId)) {
        toggleMember(doctorId);
      }
    });
    // Set topic and mode, transition to discussion view
    setTopic(topic);
    setMode(mode || "medical-consulting");
    // Clear active tab to show the main arena view
    setActiveTab("arena");
  };

  const handleViewReport = async ({ forceRefresh = false } = {}) => {
    setActiveArenaPanel("report");
    if (!hasReportData) {
      setReportError("Complete a few discussion turns before generating a report.");
      return;
    }

    if (hasCachedReport && !forceRefresh) {
      setReportError("");
      return;
    }

    setReportError("");
    setIsGeneratingReport(true);
    try {
      await combatFinalizeVerdict({
        sessionId: gameState.sessionId,
        topic: gameState.topic,
        playerTeam: gameState.mode === "combat" ? gameState.playerTeam : [],
        opponentTeam: gameState.mode === "combat" ? gameState.opponentTeam : gameState.playerTeam,
        combatLog: reportCombatLog,
        roundResults: gameState.mode === "combat" ? roundResults : [],
        scores: {
          playerScore: gameState.playerScore,
          opponentScore: gameState.opponentScore,
        },
        mode: gameState.mode,
      });
      reportCacheKeyRef.current = reportCacheKey;
    } catch (error) {
      setReportError(error.message || "Could not generate the report right now.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadReportPdf = () => {
    if (!hasCachedReport) {
      setReportError("Generate the report once before downloading the PDF.");
      return;
    }

    const safeTopic = String(gameState.topic || "session")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    const sections = buildReportPdfSections({
      verdict: finalVerdict,
      mode: gameState.mode,
      topic: gameState.topic,
      playerTeam: gameState.playerTeam,
      opponentTeam: gameState.opponentTeam,
      combatLog: reportCombatLog,
      roundResults,
    });

    downloadPdf(`report-${safeTopic || "session"}.pdf`, sections);
  };

  useEffect(() => {
    setActiveArenaPanel("session");
    setReportError("");
    if (!hasStoredReportForCurrentSession) {
      reportCacheKeyRef.current = "";
    }
  }, [gameState.mode, gameState.topic, gameState.setupPhase, gameState.sessionId]);

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;
    if (previousPhase !== "complete" && gameState.phase === "complete" && hasReportData && !hasCachedReport) {
      handleViewReport();
    }
    previousPhaseRef.current = gameState.phase;
  }, [gameState.phase, hasReportData, hasCachedReport]);

  const renderArenaPanelTabs = () => (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {[
        { id: "session", label: gameState.mode === "combat" ? "Live Debate" : "Discussion" },
        { id: "arguments", label: "Arguments" },
        { id: "report", label: "Report" },
      ].map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => {
            setActiveArenaPanel(tab.id);
            if (tab.id === "report" && !hasCachedReport && !isGeneratingReport && hasReportData) {
              handleViewReport();
            }
          }}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            activeArenaPanel === tab.id
              ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderReportPanel = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Mode-Specific Report
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{gameState.topic || "Untitled debate"}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            AI-generated analysis tailored to {gameState.mode.replace(/-/g, " ")}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => handleViewReport({ forceRefresh: true })}
            loading={isGeneratingReport}
            disabled={!hasReportData}
          >
            Refresh Report
          </Button>
          <Button variant="primary" onClick={handleDownloadReportPdf} disabled={!hasCachedReport || isGeneratingReport}>
            Download PDF
          </Button>
        </div>
      </div>

      {reportError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {reportError}
        </div>
      ) : null}

      {!hasReportData ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          Add a few arguments first, then open the report to generate an AI summary and analysis.
        </div>
      ) : isGeneratingReport && !hasCachedReport ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          Generating report...
        </div>
      ) : (
        <VerdictReportViewer verdict={hasCachedReport ? finalVerdict : null} mode={gameState.mode} topic={gameState.topic} />
      )}
    </div>
  );

  // Auth gate: show sign-in when no token exists.
  if (!token) {
    return <AuthPage onAuthenticate={authenticate} />;
  }

  // Setup flow: pick mode, topic, and roster before entering combat.
  if (gameState.setupPhase === "modeSelect") {
    if (showSetupHistory) {
      return (
        <div className="min-h-screen bg-[#f5f5f7] p-8">
          <div className="max-w-6xl mx-auto space-y-4">
            <Button variant="secondary" onClick={() => setShowSetupHistory(false)}>
              Back To Mode Selection
            </Button>
            <DiscussionHistory
              discussions={discussionHistory}
              isLoading={isLoadingHistory}
              onOpenDiscussion={(entry) => {
                openHistoryDiscussion(entry);
                setShowSetupHistory(false);
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <>
        <PhaseSelect 
          onSelectPhase={setMode} 
          onOpenHistory={() => {
            loadDiscussionHistory();
            setShowSetupHistory(true);
          }} 
        />
        <PersonaEditor
          isOpen={isPersonaEditorOpen}
          onClose={() => setIsPersonaEditorOpen(false)}
          onCreated={async (agent) => {
            if (!agent?.id) return;
            await reloadAgents();
            toggleMember(agent.id);
          }}
        />
      </>
    );
  }
  if (gameState.setupPhase === "topicSelect") {
    return (
      <>
        <TopicSelect onSelectTopic={setTopic} onBack={() => goToSetupPhase("modeSelect")} />
        <PersonaEditor
          isOpen={isPersonaEditorOpen}
          onClose={() => setIsPersonaEditorOpen(false)}
          onCreated={async (agent) => {
            if (!agent?.id) return;
            await reloadAgents();
            toggleMember(agent.id);
          }}
        />
      </>
    );
  }
  if (gameState.setupPhase === "memberSelect") {
    return (
      <>
        <MemberSelect
          availableAgents={agents}
          selectedAgents={gameState.playerTeam.map((a) => a.id)}
          onToggleAgent={toggleMember}
          onConfirm={completeSetup}
          onBack={() => goToSetupPhase("topicSelect")}
          onOpenPersonaEditor={() => setIsPersonaEditorOpen(true)}
          maxSelection={maxMembers}
          onMaxSelectionChange={setMaxMembers}
          argumentLimit={argumentLimit}
          onArgumentLimitChange={setArgumentLimit}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
        />
        <PersonaEditor
          isOpen={isPersonaEditorOpen}
          onClose={() => setIsPersonaEditorOpen(false)}
          onCreated={async (agent) => {
            if (!agent?.id) return;
            await reloadAgents();
            toggleMember(agent.id);
          }}
        />
      </>
    );
  }

  // Main arena layout (sidebar + content area).
  return (
    <div className="flex h-screen w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentMode={gameState.mode}
        currentTopic={gameState.topic}
        currentMembers={gameState.playerTeam}
        currentTemperature={gameState.temperature}
        onNewSession={resetSession}
        onSignOut={signOut}
        onOpenProfile={() => setActiveTab("profile")}
        theme={theme}
        onThemeToggle={toggleTheme}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
      />

      <div className={`flex-1 ${sidebarCollapsed ? "ml-[72px]" : "ml-64"} flex flex-col h-full overflow-hidden relative dark:bg-slate-900 transition-all duration-200`}>
        <ControlBar
          onConcludeDebate={handleViewReport}
          isGeneratingReport={isGeneratingReport}
        />
        {gameState.mode !== "boardroom" && activeTab !== "profile" ? (
          <div className="absolute right-6 top-15 z-30">
            <button
             className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl p-1"
              onClick={() => setShowRightSidebar((prev) => !prev)}
            >
              {showRightSidebar ? "<" : ">"}
            </button>
          </div>
        ) : null}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "profile" ? (
            <ProfilePage onBack={() => setActiveTab("arena")} />
          ) : activeTab === "history" ? (
            <DiscussionHistory
              discussions={discussionHistory}
              isLoading={isLoadingHistory}
              onOpenDiscussion={(entry) => {
                openHistoryDiscussion(entry);
                setActiveTab("arena");
              }}
            />
          ) : activeTab === "learn-law" && gameState.mode !== "learn-law" ? (
            <LearnLawPage
              onSelectExperts={handleSelectExperts}
              onClose={() => setActiveTab("arena")}
            />
          ) : activeTab === "interview-simulator" && gameState.mode !== "interview-simulator" ? (
            <InterviewSimulatorPage
              onSelectInterviewers={handleSelectInterviewers}
              onClose={() => setActiveTab("arena")}
            />
          ) : activeTab === "medical-consulting" && gameState.mode !== "medical-consulting" ? (
            <MedicalConsultingPage
              onSelectDoctors={handleSelectDoctors}
              onClose={() => setActiveTab("arena")}
            />
          ) : gameState.mode === "boardroom" ? (
            <>
              {renderArenaPanelTabs()}
              {activeArenaPanel === "arguments" ? (
                <ArgumentsView
                  combatLog={reportCombatLog}
                  playerTeam={[]}
                  opponentTeam={gameState.playerTeam}
                  topic={gameState.topic}
                />
              ) : activeArenaPanel === "report" ? (
                renderReportPanel()
              ) : (
                <BoardroomDashboard
                  topic={gameState.topic}
                  members={gameState.playerTeam}
                  onRequestVerdict={() => handleViewReport({ forceRefresh: true })}
                />
              )}
            </>
          ) : mentorStyleModes.includes(gameState.mode) ? (
            <>
              {renderArenaPanelTabs()}
              {activeArenaPanel === "arguments" ? (
                <ArgumentsView
                  combatLog={reportCombatLog}
                  playerTeam={[]}
                  opponentTeam={gameState.playerTeam}
                  topic={gameState.topic}
                />
              ) : activeArenaPanel === "report" ? (
                renderReportPanel()
              ) : (
                <MentorDashboard topic={gameState.topic} members={gameState.playerTeam} />
              )}
            </>
          ) : (
            <>
              {renderArenaPanelTabs()}
              {/* Drafting, results, and live combat views */}
              {activeArenaPanel === "arguments" ? (
                <ArgumentsView
                  combatLog={reportCombatLog}
                  playerTeam={gameState.playerTeam}
                  opponentTeam={gameState.opponentTeam}
                  topic={gameState.topic}
                />
              ) : activeArenaPanel === "report" ? (
                renderReportPanel()
              ) : gameState.phase === "draft" ? (
                <DraftBoard
                  availableAgents={agents}
                  selectedAgents={gameState.playerTeam.map((a) => a.id)}
                  onSelectAgent={toggleMember}
                  onConfirmDraft={confirmDraft}
                  maxSelection={maxMembers}
                />
              ) : gameState.phase === "complete" ? (
                <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Debate Results
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Final score: {gameState.playerScore} / {gameState.playerScore + gameState.opponentScore}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 p-4">
                      <h3 className="text-sm font-mono text-slate-500 dark:text-slate-400 mb-2">YOU</h3>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">{gameState.playerScore}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 p-4">
                      <h3 className="text-sm font-mono text-slate-500 dark:text-slate-400 mb-2">OPPONENT</h3>
                      <div className="text-3xl font-bold text-slate-400 dark:text-slate-500">{gameState.opponentScore}</div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Round Verdicts</h3>
                    <div className="space-y-3">
                      {roundResults.map((result) => (
                        <div key={result.round} className="border border-slate-200 rounded-lg p-3">
                          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
                            <span>Round {result.round}</span>
                            <span>{String(result.winner || "tie").toUpperCase()}</span>
                          </div>
                          <div className="text-xs text-slate-600 mb-2">
                            {result.reasoning || "No reasoning provided."}
                          </div>
                          <div className="flex gap-3 text-xs font-mono">
                            <span>Player: {Math.round((result.probabilities?.player || 0) * 100)}%</span>
                            <span>Opponent: {Math.round((result.probabilities?.opponent || 0) * 100)}%</span>
                          </div>
                        </div>
                      ))}
                      {roundResults.length === 0 ? (
                        <div className="text-xs text-slate-400">No rounds completed.</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-6 h-full">
                  <div className={`${showRightSidebar ? "col-span-9" : "col-span-12"} flex flex-col gap-6`}>
                    <div className={`grid ${showRightSidebar ? "grid-cols-12" : "grid-cols-14"} gap-6`}>
                      <div className="col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">User</div>
                        <div className="space-y-3">
                          {gameState.playerTeam.map((agent) => (
                            <div key={agent.id} className="flex flex-col items-center gap-2">
                              <div
                                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-mono text-sm font-bold ${
                                  activeSpeakerId === agent.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                }`}
                              >
                                {agent.avatarInitials}
                              </div>
                              <div className="text-xs text-slate-700 dark:text-slate-300 text-center">{agent.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={`${showRightSidebar ? "col-span-8" : "col-span-10"} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm max-h-[60vh] overflow-hidden`}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">Topic</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">{gameState.topic}</div>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Round {gameState.currentRound}
                            {gameState.totalRounds ? ` / ${gameState.totalRounds}` : " / Infinity"}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="text-xs font-mono text-slate-500">User Response</div>
                          <div className="text-xs font-mono text-slate-500">Computer Response</div>
                        </div>
                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                          {roundPairs.map((pair, index) => (
                            <div key={`round-${pair.round}`} className="grid grid-cols-2 gap-4 items-stretch">
                              <div
                                ref={(el) => (userRowRefs.current[index] = el)}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
                                style={rowHeights[index] ? { minHeight: `${rowHeights[index]}px` } : undefined}
                              >
                                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                                  <span>Round {pair.round}</span>
                                  <span>{pair.player?.speakerName || "-"}</span>
                                </div>
                                <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                                  {pair.player?.text || "No response yet."}
                                </div>
                              </div>
                              <div
                                ref={(el) => (opponentRowRefs.current[index] = el)}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
                                style={rowHeights[index] ? { minHeight: `${rowHeights[index]}px` } : undefined}
                              >
                                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                                  <span>Round {pair.round}</span>
                                  <span>{pair.opponent?.speakerName || "-"}</span>
                                </div>
                                <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                                  {pair.opponent?.text || "No response yet."}
                                </div>
                              </div>
                            </div>
                          ))}
                          {roundPairs.length === 0 ? (
                            <div className="text-xs text-slate-400">No responses yet.</div>
                          ) : null}
                        </div>
                      </div>

                      <div className="col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Computer</div>
                        <div className="space-y-3">
                          {gameState.opponentTeam.map((agent) => (
                            <div key={agent.id} className="flex flex-col items-center gap-2">
                              <div
                                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-mono text-sm font-bold ${
                                  activeSpeakerId === agent.id
                                    ? "border-red-400 bg-red-50 dark:bg-red-950"
                                    : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                                }`}
                              >
                                {agent.avatarInitials}
                              </div>
                              <div className="text-xs text-slate-700 dark:text-slate-200 text-center">{agent.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Strategy selection + preview workflow */}
                    <DirectorChoice
                      options={STRATEGIES}
                      onSelect={handleStrategySelect}
                      isLoading={isSpeaking || isResolvingTurn}
                      previewStrategy={selectedStrategy}
                      previewText={previewText}
                      previewLoading={previewLoading}
                      onGeneratePreview={generatePreview}
                      onDiscardPreview={discardPreview}
                      onSendPreview={sendPreview}
                    />
                    {/* Draft editor appears once a speaker is chosen */}
                    {gameState.phase === "combat" && selectedSpeakerId ? (
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Response Editor</h4>
                        <textarea
                          className="w-full min-h-[220px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-slate-700 dark:text-slate-100"
                          placeholder="Generated response will appear here. You can edit it before sending."
                          value={previewText}
                          onChange={(e) => setPreviewText(e.target.value)}
                        />
                        <div className="mt-3 flex items-center gap-3">
                          <input
                            className="flex-1 h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-100"
                            placeholder="Tweak instructions (optional)"
                            value={tweakInstruction}
                            onChange={(e) => setTweakInstruction(e.target.value)}
                          />
                          <Button
                            variant="secondary"
                            loading={previewLoading}
                            onClick={applyTweak}
                            disabled={!previewText.trim() || !tweakInstruction.trim()}
                          >
                            Apply Tweak
                          </Button>
                        </div>
                        <div className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                          Edit the response directly, or use a tweak instruction to revise it.
                        </div>
                      </div>
                    ) : null}
                    {/* Speaker selection / round controls */}
                    {gameState.phase === "combat" ? (
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Choose Speaker</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Round {gameState.currentRound}
                              {gameState.totalRounds ? ` / ${gameState.totalRounds}` : " / Infinity"}
                            </p>
                          </div>
                          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            Turn: {gameState.activeTurn === "player" ? "YOU" : "OPPONENT"}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                          Strategy: <span className="font-medium text-slate-700 dark:text-slate-200">{selectedStrategy?.title || "None"}</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {gameState.playerTeam.map((agent) => (
                            <button
                              key={agent.id}
                              type="button"
                              disabled={isResolvingTurn || gameState.activeTurn !== "player" || !selectedStrategy}
                              onClick={() => handleSpeakerSelect(agent.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition ${
                                selectedSpeakerId === agent.id
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-200"
                                  : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                              } ${
                                isResolvingTurn || gameState.activeTurn !== "player" || !selectedStrategy
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              <span className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-xs font-mono">
                                {agent.avatarInitials}
                              </span>
                              {agent.name}
                            </button>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <Button
                            variant="primary"
                            onClick={generatePreview}
                            loading={previewLoading}
                            disabled={!selectedSpeakerId || !selectedStrategy || previewLoading || isResolvingTurn}
                          >
                            Generate Preview
                          </Button>
                          {previewLoading ? (
                            <span className="text-xs text-slate-400 dark:text-slate-500">Generating preview...</span>
                          ) : null}
                        </div>
                        {!selectedStrategy ? (
                          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                            Select a Director's Choice first.
                          </p>
                        ) : null}
                        {gameState.argumentLimit === "infinite" ? (
                          <div className="mt-4 flex justify-end">
                            <Button variant="secondary" onClick={handleEndGame}>
                              End Game
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {/* Optional right sidebar for bias + analytics */}
                  {showRightSidebar ? (
                    <div className="col-span-3 space-y-6">
                      <BiasSlider value={gameState.biasLevel} onChange={setBiasLevel} />
                      <LiveAnalytics
                        heatmapData={MOCK_HEATMAP}
                        playerScore={gameState.playerScore}
                        opponentScore={gameState.opponentScore}
                        lastVerdict={lastVerdict}
                        currentRound={gameState.currentRound}
                        totalRounds={gameState.totalRounds}
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {gameState.phase === "coinToss" && gameState.mode === "combat" && (
        <CoinToss onComplete={handleCoinTossComplete} />
      )}

      <PersonaEditor
        isOpen={isPersonaEditorOpen}
        onClose={() => setIsPersonaEditorOpen(false)}
        onCreated={async (agent) => {
          if (!agent?.id) return;
          await reloadAgents();
          toggleMember(agent.id);
        }}
      />
    </div>
  );
}

export default App;
