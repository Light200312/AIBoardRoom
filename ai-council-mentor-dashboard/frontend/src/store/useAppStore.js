import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AGENTS as FALLBACK_AGENTS } from "../data/mockData";
import { api } from "../lib/api";

function createSessionId() {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function initialGameState() {
  return {
    mode: "combat",
    setupPhase: "modeSelect",
    phase: "draft",
    currentRound: 1,
    totalRounds: 10,
    playerTeam: [],
    opponentTeam: [],
    maxMembers: 3,
    argumentLimit: 10,
    difficulty: "standard",
    activeTurn: "player",
    roundStarter: "player",
    roundStep: 0,
    combatLog: [],
    roundResults: [],
    lastVerdict: null,
    finalVerdict: null,
    playerScore: 0,
    opponentScore: 0,
    biasLevel: 50,
    topic: "",
    temperature: null,
    sessionId: "",
  };
}

function reconcileTeam(team = [], agents = []) {
  const agentMap = new Map((agents || []).map((agent) => [String(agent.id), agent]));
  return (team || [])
    .map((member) => agentMap.get(String(member?.id || "")))
    .filter(Boolean);
}

function deriveMembersFromMessages(messages = [], agents = []) {
  const participantSnapshot = [...messages]
    .reverse()
    .find((message) => Array.isArray(message?.sessionParticipants) && message.sessionParticipants.length)
    ?.sessionParticipants;
  if (participantSnapshot?.length) {
    return participantSnapshot.map((participant) => ({
      id: String(participant.id),
      name: String(participant.name || ""),
      role: String(participant.role || ""),
      avatarInitials: String(participant.avatarInitials || ""),
    }));
  }

  const agentMap = new Map((agents || []).map((agent) => [String(agent.id), agent]));
  const seen = new Set();
  const members = [];

  (messages || []).forEach((message) => {
    const speakerId = String(message?.speakerId || "");
    if (!speakerId || speakerId === "user" || speakerId === "orchestrator" || seen.has(speakerId)) return;
    const agent = agentMap.get(speakerId);
    if (!agent) return;
    seen.add(speakerId);
    members.push(agent);
  });

  return members;
}

const useAppStore = create(
  persist(
    (set, get) => ({
      token: "",
      user: null,
      apiRoutingMode: "openrouter_only",
      ollamaModel: "llama3.1:latest",
      orchestratorMode: "fast",
      memoryMode: "minimal",
      toolCallingEnabled: true,
      agents: FALLBACK_AGENTS,
      messages: [],
      discussionHistory: [],
      isLoadingHistory: false,
      knowledgeGrowth: 45,
      appreciationLevel: 72,
      isLoadingReply: false,
      followupQuestion: "",
      suggestion: "",
      theme: "light",
      gameState: initialGameState(),

      bootstrapSession: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const [{ user }, { agents }] = await Promise.all([api.me(token), api.listAgents(token)]);
          const nextAgents = Array.isArray(agents) ? agents : [];
          set((state) => ({
            user,
            agents: nextAgents,
            gameState: {
              ...state.gameState,
              playerTeam: reconcileTeam(state.gameState.playerTeam, nextAgents),
              opponentTeam: reconcileTeam(state.gameState.opponentTeam, nextAgents),
            },
          }));
	        } catch {
	          get().signOut();
	        }
      },

      reloadAgents: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const { agents } = await api.listAgents(token);
          const nextAgents = Array.isArray(agents) ? agents : [];
          set((state) => ({
            agents: nextAgents,
            gameState: {
              ...state.gameState,
              playerTeam: reconcileTeam(state.gameState.playerTeam, nextAgents),
              opponentTeam: reconcileTeam(state.gameState.opponentTeam, nextAgents),
            },
          }));
	        } catch {
	          set({ agents: FALLBACK_AGENTS });
	        }
      },

      createAgent: async (payload) => {
        const token = get().token;
        if (!token) throw new Error("Not authenticated.");
        const { agent } = await api.createAgent(payload, token);
        await get().reloadAgents();
        return agent;
      },

      updateAgent: async (agentId, payload) => {
        const token = get().token;
        if (!token) throw new Error("Not authenticated.");
        const { agent } = await api.updateAgent(agentId, payload, token);
        set((state) => {
          const nextAgents = state.agents.map((a) => (a.id === agent.id ? agent : a));
          const patchTeam = (team) => team.map((a) => (a.id === agent.id ? agent : a));
          return {
            agents: nextAgents,
            gameState: {
              ...state.gameState,
              playerTeam: patchTeam(state.gameState.playerTeam),
              opponentTeam: patchTeam(state.gameState.opponentTeam),
            },
          };
        });
        return agent;
      },

      deleteAgent: async (agentId) => {
        const token = get().token;
        if (!token) throw new Error("Not authenticated.");
        await api.deleteAgent(agentId, token);
        set((state) => {
          const nextAgents = state.agents.filter((a) => a.id !== agentId);
          return {
            agents: nextAgents,
            gameState: {
              ...state.gameState,
              playerTeam: state.gameState.playerTeam.filter((a) => a.id !== agentId),
              opponentTeam: state.gameState.opponentTeam.filter((a) => a.id !== agentId),
            },
          };
        });
      },

      suggestAgents: async ({ topic, maxSuggestions, mode } = {}) => {
        const token = get().token;
        if (!token) throw new Error("Not authenticated.");
        return api.suggestAgents(
          { topic, maxSuggestions, mode, ollamaModel: get().ollamaModel },
          token
        );
      },

      findAgentDraft: async ({ name, topic } = {}) => {
        const token = get().token;
        if (!token) throw new Error("Not authenticated.");
        return api.findAgentDraft({ name, topic, ollamaModel: get().ollamaModel }, token);
      },

      respondAsAgent: async ({ agentId, taskGoal, messages = [], outputConstraints }) => {
        const token = get().token;
        if (!token) throw new Error("Not authenticated.");
        return api.respondAgent(
          agentId,
          {
            taskGoal,
            messages,
            outputConstraints,
            apiRoutingMode: get().apiRoutingMode,
            ollamaModel: get().ollamaModel,
            discussionMode: get().gameState.mode,
            toolCallingEnabled: get().toolCallingEnabled,
          },
          token
        );
      },

      combatNextOpponentTurn: async ({ topic, opponentTeamIds, userArgument, strategies, difficulty }) => {
        const token = get().token;
        if (!token) throw new Error("Not authenticated.");
        return api.combatNextOpponentTurn(
          {
            topic,
            opponentTeamIds,
            userArgument,
            strategies,
            difficulty,
            ollamaModel: get().ollamaModel,
          },
          token
        );
      },

      combatJudgeRound: async ({ topic, playerArgument, opponentArgument }) => {
        const token = get().token;
        if (!token) throw new Error("Not authenticated.");
        return api.combatJudgeRound(
          { topic, playerArgument, opponentArgument, ollamaModel: get().ollamaModel },
          token
        );
      },

      combatFinalizeVerdict: async ({ sessionId, topic, playerTeam, opponentTeam, combatLog, roundResults, scores, mode = "combat" }) => {
        const token = get().token;
        if (!token) throw new Error("Not authenticated.");
        const { verdict } = await api.combatFinalizeVerdict(
          {
            sessionId,
            topic,
            playerTeam,
            opponentTeam,
            combatLog,
            roundResults,
            scores,
            ollamaModel: get().ollamaModel,
            mode,
          },
          token
        );
        set((state) => ({
          gameState: {
            ...state.gameState,
            finalVerdict: verdict || null,
          },
        }));
        return verdict;
      },

      authenticate: async (mode, payload) => {
        const response = mode === "register" ? await api.register(payload) : await api.login(payload);
        set({ token: response.token, user: response.user });
      },

      signOut: () =>
        set({
          token: "",
          user: null,
          apiRoutingMode: "openrouter_only",
          ollamaModel: "llama3.1:latest",
          orchestratorMode: "fast",
          memoryMode: "minimal",
          toolCallingEnabled: true,
          gameState: initialGameState(),
          messages: [],
          discussionHistory: [],
          followupQuestion: "",
          suggestion: "",
        }),

      loadMessages: async () => {
        const token = get().token;
        const { topic, sessionId } = get().gameState;
        if (!token || !topic || !sessionId) {
          set({ messages: [] });
          return;
        }
        try {
          const { messages, reports } = await api.listMessages(token, { topic, sessionId });
          const savedReport = Array.isArray(reports) ? reports[0]?.verdict || null : null;
          set((state) => ({
            messages: messages || [],
            gameState: {
              ...state.gameState,
              finalVerdict: savedReport,
            },
          }));
	        } catch {
	          set((state) => ({
              messages: [],
              gameState: {
                ...state.gameState,
                finalVerdict: null,
              },
            }));
	        }
      },

      loadDiscussionHistory: async () => {
        const token = get().token;
        if (!token) {
          set({ discussionHistory: [] });
          return;
        }

        set({ isLoadingHistory: true });
        try {
          const { messages, reports } = await api.listMessages(token);
          const grouped = new Map();
          const reportMap = new Map(
            (Array.isArray(reports) ? reports : []).map((report) => [`${report.sessionId}::${report.topic}`, report])
          );

          (messages || []).forEach((msg) => {
            const sessionId = String(msg.sessionId || "");
            const topic = String(msg.topic || "");
            if (!sessionId || !topic) return;

            const key = `${sessionId}::${topic}`;
            const existing = grouped.get(key) || {
              sessionId,
              topic,
              messages: [],
              lastTimestamp: 0,
              totalMessages: 0,
            };

            existing.messages.push(msg);
            existing.totalMessages += 1;
            existing.lastTimestamp = Math.max(existing.lastTimestamp, Number(msg.timestamp || 0));
            grouped.set(key, existing);
          });

          const discussionHistory = Array.from(grouped.values())
            .map((entry) => ({
              ...entry,
              messages: entry.messages.sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0)),
              report: reportMap.get(`${entry.sessionId}::${entry.topic}`)?.verdict || null,
              mode: reportMap.get(`${entry.sessionId}::${entry.topic}`)?.mode || "mentor",
            }))
            .sort((a, b) => b.lastTimestamp - a.lastTimestamp);

          set({ discussionHistory });
	        } catch {
	          set({ discussionHistory: [] });
	        } finally {
          set({ isLoadingHistory: false });
        }
      },

      openHistoryDiscussion: (entry) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            mode: entry.report?.mode || entry.mode || "mentor",
            setupPhase: "ready",
            phase: "draft",
            topic: entry.topic,
            sessionId: entry.sessionId,
            playerTeam: deriveMembersFromMessages(entry.messages || [], state.agents),
            finalVerdict: entry.report || null,
          },
          messages: entry.messages || [],
          followupQuestion: "",
          suggestion: "",
        })),

      sendMentorMessage: async (text) => {
        const token = get().token;
        const { gameState, messages } = get();
        if (!token || !text.trim() || !gameState.topic || !gameState.sessionId) return;
        const sessionParticipants = gameState.playerTeam.map((member) => ({
          id: member.id,
          name: member.name,
          role: member.role,
          avatarInitials: member.avatarInitials,
        }));
        const sessionParticipantIds = sessionParticipants.map((member) => member.id);

        const userMessage = {
          sessionId: gameState.sessionId,
          topic: gameState.topic,
          sessionParticipantIds,
          sessionParticipants,
          speakerId: "user",
          speakerName: "You",
          speakerInitials: "ME",
          isUser: true,
          text: text.trim(),
          timestamp: Date.now(),
        };

        const optimisticMessageId = `local-orchestrator-${Date.now()}`;
        const mergedMessages = [...messages, { ...userMessage, id: `local-${Date.now()}` }];
        const optimisticOrchestratorMessage = {
          id: optimisticMessageId,
          speakerId: "orchestrator",
          speakerName: "Orchestrator",
          speakerInitials: "OR",
          isUser: false,
          text: "Selecting next speaker...",
          timestamp: Date.now(),
        };
        set((state) => ({
          messages: [...mergedMessages, optimisticOrchestratorMessage],
          followupQuestion: "",
          suggestion: "",
          knowledgeGrowth: Math.min(100, state.knowledgeGrowth + 5),
          appreciationLevel: Math.min(100, state.appreciationLevel + 2),
        }));

	        try {
	          await api.createMessage(userMessage, token);
	        } catch {
	          void 0;
	        }

        set({ isLoadingReply: true });
        try {
          const result = await api.runOrchestrator(
            {
              taskGoal: gameState.topic || "Advance the discussion with clear, role-grounded reasoning.",
              selectedAgentIds: gameState.playerTeam.map((m) => m.id),
              priorMessages: mergedMessages,
              maxIterations: 1,
              allowMetaMemory: true,
              metaMemory: { summary: "" },
              apiRoutingMode: get().apiRoutingMode,
              ollamaModel: get().ollamaModel,
              orchestratorMode: get().orchestratorMode,
              memoryMode: get().memoryMode,
              topic: gameState.topic,
              sessionId: gameState.sessionId,
              discussionMode: gameState.mode,
              toolCallingEnabled: get().toolCallingEnabled,
            },
            token
          );

          const scopedMessages = (result.messages || []).filter(
            (m) => !m.topic || (m.topic === gameState.topic && m.sessionId === gameState.sessionId)
          );
          const resolvedMessages = scopedMessages.length ? scopedMessages : get().messages;

          set({
            messages: resolvedMessages,
            followupQuestion: result.clarifyingQuestion || "",
            suggestion: result.suggestion || "",
          });

          const newAgentMessages = resolvedMessages.filter(
            (m) => !m.isUser && Number(m.timestamp || 0) >= userMessage.timestamp
          );
          await Promise.all(
            newAgentMessages.map((m) =>
              api.createMessage(
                {
                  sessionId: gameState.sessionId,
                  topic: gameState.topic,
                  sessionParticipantIds,
                  sessionParticipants,
                  speakerId: m.speakerId,
                  speakerName: m.speakerName,
                  speakerInitials: m.speakerInitials,
                  isUser: false,
                  text: m.text,
                  toolCalls: Array.isArray(m.toolCalls) ? m.toolCalls : [],
                  timestamp: m.timestamp || Date.now(),
                },
                token
              ).catch(() => null)
            )
          );
	        } catch {
	          set((state) => ({
	            messages: state.messages.filter((m) => m.id !== optimisticMessageId),
	            followupQuestion: "Temporary orchestration issue. Please send again.",
          }));
        } finally {
          set({ isLoadingReply: false });
        }
      },

      setMode: (mode) =>
        set(() => ({
          gameState: {
            ...initialGameState(),
            mode,
            setupPhase: "topicSelect",
          },
          messages: [],
          followupQuestion: "",
          suggestion: "",
        })),

      setTopic: (topic, temperature) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            topic,
            temperature,
            sessionId: createSessionId(),
            setupPhase: "memberSelect",
          },
          messages: [],
          followupQuestion: "",
          suggestion: "",
        })),

      goToSetupPhase: (setupPhase) =>
        set((state) => ({ gameState: { ...state.gameState, setupPhase } })),

      setArgumentLimit: (value) =>
        set((state) => {
          const parsed = value === "infinite" ? "infinite" : Number(value);
          const totalRounds = parsed === "infinite" ? null : Math.max(1, Math.min(50, parsed || 10));
          return {
            gameState: {
              ...state.gameState,
              argumentLimit: parsed === "infinite" ? "infinite" : totalRounds,
              totalRounds,
            },
          };
        }),

      setDifficulty: (difficulty) =>
        set((state) => ({
          gameState: { ...state.gameState, difficulty: difficulty || "standard" },
        })),

      setMaxMembers: (value) =>
        set((state) => {
          const nextValue = Math.max(1, Math.min(8, Number(value) || 3));
          const nextTeam = state.gameState.playerTeam.slice(0, nextValue);
          return {
            gameState: {
              ...state.gameState,
              maxMembers: nextValue,
              playerTeam: nextTeam,
            },
          };
        }),

      toggleMember: (agentId) => {
        const { gameState, agents } = get();
        const exists = gameState.playerTeam.find((a) => a.id === agentId);
        if (exists) {
          set((state) => ({
            gameState: {
              ...state.gameState,
              playerTeam: state.gameState.playerTeam.filter((a) => a.id !== agentId),
            },
          }));
          return;
        }
        if (gameState.playerTeam.length >= gameState.maxMembers) return;
        const agent = agents.find((a) => a.id === agentId);
        if (!agent) return;
        set((state) => ({
          gameState: { ...state.gameState, playerTeam: [...state.gameState.playerTeam, agent] },
        }));
      },

      completeSetup: async () => {
        const token = get().token;
        const { gameState, agents } = get();
        if (gameState.mode === "combat") {
          const remainingAgents = agents.filter((a) => !gameState.playerTeam.includes(a));
          let opponentTeam = remainingAgents.slice(0, gameState.maxMembers);
          if (token) {
            try {
              const result = await api.combatSelectOpponentTeam(
                {
                  topic: gameState.topic,
                  candidateIds: remainingAgents.map((a) => a.id),
                  count: gameState.maxMembers,
                  difficulty: gameState.difficulty,
                  ollamaModel: get().ollamaModel,
                },
                token
              );
              if (result?.opponentTeam?.length) {
                opponentTeam = result.opponentTeam;
              }
	            } catch {
	              opponentTeam = remainingAgents.slice(0, gameState.maxMembers);
	            }
	          }
          set({
            gameState: {
              ...gameState,
              opponentTeam,
              setupPhase: "ready",
              phase: "coinToss",
            },
          });
          return;
        }
        set({
          gameState: { ...gameState, setupPhase: "ready" },
        });
      },

      confirmDraft: () =>
        set((state) => {
          const remainingAgents = state.agents.filter((a) => !state.gameState.playerTeam.includes(a));
          return {
            gameState: {
              ...state.gameState,
              opponentTeam: remainingAgents.slice(0, state.gameState.maxMembers),
              phase: "coinToss",
            },
          };
        }),

      setCombatStarted: () =>
        set((state) => ({ gameState: { ...state.gameState, phase: "combat" } })),

      applyStrategyRound: () =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            playerScore: state.gameState.playerScore + 10 + Math.floor(Math.random() * 5),
            currentRound: Math.min(state.gameState.currentRound + 1, state.gameState.totalRounds),
          },
        })),

      setBiasLevel: (biasLevel) =>
        set((state) => ({ gameState: { ...state.gameState, biasLevel } })),

      updateGameState: (partial) =>
        set((state) => ({ gameState: { ...state.gameState, ...partial } })),

      appendCombatLog: (entry) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            combatLog: [...state.gameState.combatLog, entry],
          },
        })),

      addRoundResult: (result) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            roundResults: [...state.gameState.roundResults, result],
            lastVerdict: result,
          },
        })),

      setApiRoutingMode: (apiRoutingMode) => set({ apiRoutingMode }),
      setOllamaModel: (ollamaModel) => set({ ollamaModel }),
      setOrchestratorMode: (orchestratorMode) => set({ orchestratorMode }),
      setMemoryMode: (memoryMode) => set({ memoryMode }),
      setToolCallingEnabled: (toolCallingEnabled) => set({ toolCallingEnabled: Boolean(toolCallingEnabled) }),

      resetSession: () =>
        set({
          gameState: initialGameState(),
          messages: [],
          discussionHistory: [],
          followupQuestion: "",
          suggestion: "",
        }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "light" ? "dark" : "light",
        })),
    }),
    {
      name: "ai-council-store",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        theme: state.theme,
        apiRoutingMode: state.apiRoutingMode,
        ollamaModel: state.ollamaModel,
        orchestratorMode: state.orchestratorMode,
        memoryMode: state.memoryMode,
        toolCallingEnabled: state.toolCallingEnabled,
        gameState: state.gameState,
        discussionHistory: state.discussionHistory,
        messages: state.messages,
      }),
    }
  )
);

export { useAppStore, initialGameState };
