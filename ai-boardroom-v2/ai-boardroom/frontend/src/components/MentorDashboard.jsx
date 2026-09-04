import { useEffect, useRef, useState } from "react";
import { Send, Volume2, Square } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card } from "./ui/Card";
import { KnowledgeGrowth } from "./KnowledgeGrowth";
import { AppreciationMeter } from "./AppreciationMeter";
import { CRITIQUE_TAG_STYLES } from "../data/mockData";
import { useAppStore } from "../store/useAppStore";

function pickPreferredVoice(voices = []) {
  return (
    voices.find((voice) => /en/i.test(voice.lang) && /google|natural|zira|david|samantha/i.test(voice.name)) ||
    voices.find((voice) => /en/i.test(voice.lang)) ||
    null
  );
}

function MentorDashboard({ topic, members }) {
  const messages = useAppStore((state) => state.messages);
  const knowledgeGrowth = useAppStore((state) => state.knowledgeGrowth);
  const appreciationLevel = useAppStore((state) => state.appreciationLevel);
  const isLoadingReply = useAppStore((state) => state.isLoadingReply);
  const followupQuestion = useAppStore((state) => state.followupQuestion);
  const suggestion = useAppStore((state) => state.suggestion);
  const token = useAppStore((state) => state.token);
  const sessionId = useAppStore((state) => state.gameState.sessionId);
  const loadMessages = useAppStore((state) => state.loadMessages);
  const sendMentorMessage = useAppStore((state) => state.sendMentorMessage);

  const [inputValue, setInputValue] = useState("");
  const [speakingMessageId, setSpeakingMessageId] = useState("");
  const [speechReady, setSpeechReady] = useState(false);
  const [toolToasts, setToolToasts] = useState([]);
  const messagesEndRef = useRef(null);
  const availableVoicesRef = useRef([]);
  const seenToolToastIdsRef = useRef(new Set());

  useEffect(() => {
    if (token) loadMessages();
  }, [token, sessionId, topic, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoadingReply]);

  useEffect(() => {
    const nextToasts = [];
    messages.forEach((message) => {
      if (!Array.isArray(message?.toolCalls) || !message.toolCalls.length) return;
      const toastId = `${message.id}:${message.toolCalls.map((tool) => tool.toolName).join(",")}`;
      if (seenToolToastIdsRef.current.has(toastId)) return;
      seenToolToastIdsRef.current.add(toastId);
      nextToasts.push({
        id: toastId,
        speakerName: message.speakerName,
        tools: message.toolCalls.map((tool) => tool.toolName),
      });
    });

    if (!nextToasts.length) return undefined;

    setToolToasts((current) => [...current, ...nextToasts].slice(-4));
    const timers = nextToasts.map((toast) =>
      window.setTimeout(() => {
        setToolToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 4500)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [messages]);

  useEffect(
    () => () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;

    const synth = window.speechSynthesis;
    const updateVoices = () => {
      const voices = synth.getVoices();
      availableVoicesRef.current = voices;
      setSpeechReady(voices.length > 0);
    };

    updateVoices();
    synth.onvoiceschanged = updateVoices;

    const warmupTimer = window.setTimeout(updateVoices, 250);
    return () => {
      window.clearTimeout(warmupTimer);
      if (synth.onvoiceschanged === updateVoices) synth.onvoiceschanged = null;
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const text = inputValue;
    setInputValue("");
    await sendMentorMessage(text);
  };

  const handleSpeakMessage = (msg) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;
    if (speakingMessageId === msg.id) {
      synth.cancel();
      setSpeakingMessageId("");
      return;
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(String(msg.text || ""));
    utterance.lang = "en-US";
    utterance.rate = msg.isUser ? 1 : 0.96;
    utterance.pitch = msg.isUser ? 1 : msg.speakerId === "orchestrator" ? 0.92 : 1.02;
    utterance.volume = 1;

    const voices = availableVoicesRef.current.length ? availableVoicesRef.current : synth.getVoices();
    const preferredVoice = pickPreferredVoice(voices);
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setSpeakingMessageId("");
    utterance.onerror = () => setSpeakingMessageId("");

    setSpeakingMessageId(msg.id);

    if (!voices.length) {
      window.setTimeout(() => {
        const retryVoices = synth.getVoices();
        const retryVoice = pickPreferredVoice(retryVoices);
        if (retryVoice) utterance.voice = retryVoice;
        synth.speak(utterance);
        synth.resume();
      }, 150);
      return;
    }

    synth.speak(utterance);
    synth.resume();
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-7rem)]">
      <div className="col-span-9 flex flex-col min-h-0">
        {toolToasts.length ? (
          <div className="fixed right-6 top-24 z-30 space-y-2">
            {toolToasts.map((toast) => (
              <div
                key={toast.id}
                className="min-w-[260px] rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-lg dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
              >
                <p className="font-semibold">{toast.speakerName} called tools</p>
                <p className="mt-1 text-xs font-mono">{toast.tools.join(" • ")}</p>
              </div>
            ))}
          </div>
        ) : null}
        <Card className="flex-1 flex flex-col overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Council Discussion</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">Topic: {topic}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => {
              const isOrchestrator = msg.speakerId === "orchestrator";
              return (
                <div key={msg.id} className={`flex gap-4 ${msg.isUser ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border-2 font-mono font-bold text-sm ${
                      msg.isUser
                        ? "bg-slate-900 text-white border-slate-900"
                        : isOrchestrator
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {msg.speakerInitials}
                  </div>
                  <div className={`max-w-[70%] space-y-2 ${msg.isUser ? "items-end flex flex-col" : ""}`}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-slate-700">{msg.speakerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.isUser
                          ? "bg-slate-900 text-white rounded-tr-none"
                          : isOrchestrator
                          ? "bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 rounded-tl-none shadow-sm"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
                      <button
                        type="button"
                        onClick={() => handleSpeakMessage(msg)}
                        disabled={typeof window === "undefined" ? true : !("speechSynthesis" in window)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {speakingMessageId === msg.id ? (
                          <>
                            <Square className="h-3 w-3" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3 w-3" />
                            Speak
                          </>
                        )}
                      </button>
                    </div>
                    {msg.critiqueTags?.length ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {msg.critiqueTags.map((tag) => (
                          <span
                            key={tag.id}
                            className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                              CRITIQUE_TAG_STYLES[tag.type] ||
                                "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-600"
                            }`}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {msg.toolCalls?.length ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {msg.toolCalls.map((tool, index) => (
                          <span
                            key={`${msg.id}-${tool.toolName}-${index}`}
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                            title={tool.text || tool.toolName}
                          >
                            Tool: {tool.toolName}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {isLoadingReply ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">Orchestrator is coordinating agents...</p>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 space-y-2">
            {followupQuestion ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Orchestrator prompt: {followupQuestion}
              </p>
            ) : null}
            {suggestion ? (
              <p className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md px-3 py-2">
                Improvement suggestion: {suggestion}
              </p>
            ) : null}
            {!speechReady && typeof window !== "undefined" && "speechSynthesis" in window ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2">
                Voice engine is still loading. In Brave, audio may start after a short delay on first use.
              </p>
            ) : null}

            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Contribute to the discussion..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
              </div>
              <Button onClick={handleSendMessage} rightIcon={<Send className="w-4 h-4" />} loading={isLoadingReply}>
                Send
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="col-span-3 h-full overflow-y-auto">
        <div className="sticky top-0 space-y-6">
          <KnowledgeGrowth value={knowledgeGrowth} />
          <AppreciationMeter value={appreciationLevel} />

          <Card>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Present Members
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-mono text-xs font-bold text-slate-600 dark:text-slate-200">
                    {member.avatarInitials}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{member.role}</div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center font-mono text-xs font-bold text-white">
                  ME
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">You</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">Student</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { MentorDashboard };
