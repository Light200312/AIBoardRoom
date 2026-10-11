import { useEffect, useRef, useState } from "react";
import { Send, Volume2, Square, X, Sparkles, Play, Pause, StopCircle } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Whiteboard } from "./Whiteboard";
import { useAppStore } from "../store/useAppStore";
import { DUMMY_DEBATE } from "../data/dummyDebate";

function pickPreferredVoice(voices = []) {
  return (
    voices.find((voice) => /en/i.test(voice.lang) && /google|natural|zira|david|samantha/i.test(voice.name)) ||
    voices.find((voice) => /en/i.test(voice.lang)) ||
    null
  );
}

// BoardroomDashboard is the Idea Validation debate view: a one-line header with
// a member ribbon underneath, the debate transcript, and the Whiteboard in the
// column that used to hold the "Present Members" sidebar.
function BoardroomDashboard({ topic, members, onRequestVerdict }) {
  const messages = useAppStore((state) => state.messages);
  const isLoadingReply = useAppStore((state) => state.isLoadingReply);
  const followupQuestion = useAppStore((state) => state.followupQuestion);
  const suggestion = useAppStore((state) => state.suggestion);
  const token = useAppStore((state) => state.token);
  const sessionId = useAppStore((state) => state.gameState.sessionId);
  const loadMessages = useAppStore((state) => state.loadMessages);
  const sendMentorMessage = useAppStore((state) => state.sendMentorMessage);
  const whiteboard = useAppStore((state) => state.whiteboard);
  const isLoadingWhiteboard = useAppStore((state) => state.isLoadingWhiteboard);
  const suggestVerdict = useAppStore((state) => state.suggestVerdict);
  const applyFounderWhiteboardOp = useAppStore((state) => state.applyFounderWhiteboardOp);
  const pendingPin = useAppStore((state) => state.pendingPin);
  const setPendingPin = useAppStore((state) => state.setPendingPin);
  const clearPendingPin = useAppStore((state) => state.clearPendingPin);

  // Replay state
  const isReplaying = useAppStore((state) => state.isReplaying);
  const replaySpeed = useAppStore((state) => state.replaySpeed);
  const replayCurrentIndex = useAppStore((state) => state.replayCurrentIndex);
  const replayMessages = useAppStore((state) => state.replayMessages);
  const replayIntervalId = useAppStore((state) => state.replayIntervalId);
  const startReplay = useAppStore((state) => state.startReplay);
  const stopReplay = useAppStore((state) => state.stopReplay);
  const setReplaySpeed = useAppStore((state) => state.setReplaySpeed);
  const toggleReplayPlayPause = useAppStore((state) => state.toggleReplayPlayPause);

  const [inputValue, setInputValue] = useState("");
  const [speakingMessageId, setSpeakingMessageId] = useState("");
  const [speechReady, setSpeechReady] = useState(false);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef(new Map());
  const availableVoicesRef = useRef([]);
  
  const isPlaying = replayIntervalId !== null;

  useEffect(() => {
    if (token) loadMessages();
  }, [token, sessionId, topic, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoadingReply]);

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
    if (!inputValue.trim() || isReplaying) return;
    const text = inputValue;
    setInputValue("");
    await sendMentorMessage(text, pendingPin);
  };

  const handleStartReplay = () => {
    startReplay(DUMMY_DEBATE);
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
    synth.speak(utterance);
    synth.resume();
  };

  const handleNavigateToMessage = (messageId) => {
    const messageElement = messageRefs.current.get(messageId);
    if (!messageElement) return;

    messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
    messageElement.classList.add("ring-2", "ring-blue-400", "rounded-2xl");
    window.setTimeout(() => {
      messageElement.classList.remove("ring-2", "ring-blue-400", "rounded-2xl");
    }, 1800);
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-7rem)]">
      <div className="col-span-8 flex flex-col min-h-0">
        <div className="bg-white dark:bg-slate-800 border-2 border-b-0 border-dashed border-slate-300 dark:border-slate-700 rounded-t-xl px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Council Discussion</h2>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-mono truncate">— {topic}</span>
            </div>
            
            {/* Replay Controls */}
            <div className="flex items-center gap-2">
              {isReplaying ? (
                <>
                  {/* Replay Mode Indicator */}
                  <div className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700">
                    <span className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">
                      Replay
                    </span>
                  </div>
                  
                  {/* Progress */}
                  <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                    {replayCurrentIndex}/{replayMessages.length}
                  </div>
                  
                  {/* Speed Control */}
                  <select
                    value={replaySpeed}
                    onChange={(e) => setReplaySpeed(Number(e.target.value))}
                    className="h-7 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 text-xs text-slate-700 dark:text-slate-200"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={4}>4x</option>
                  </select>
                  
                  {/* Play/Pause */}
                  <button
                    onClick={toggleReplayPlayPause}
                    className="p-1.5 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  
                  {/* Stop */}
                  <button
                    onClick={stopReplay}
                    className="p-1.5 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400"
                    title="Stop Replay"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                /* Show Replay Button for demo */
                <Button
                  size="small"
                  variant="secondary"
                  onClick={handleStartReplay}
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                >
                  Replay Demo
                </Button>
              )}
            </div>
          </div>
          
          {/* Member ribbon: replaces the old sidebar "Present Members" list */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {members.map((member) => (
              <div
                key={member.id}
                title={`${member.name} — ${member.role}`}
                className="flex items-center gap-1.5 flex-shrink-0 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 pl-1 pr-2.5 py-1"
              >
                <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-mono text-[10px] font-bold">
                  {member.avatarInitials}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{member.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 flex-shrink-0 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-900 dark:bg-slate-100 pl-1 pr-2.5 py-1">
              <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-center font-mono text-[10px] font-bold">
                ME
              </div>
              <span className="text-xs font-medium text-white dark:text-slate-900">You</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-b-xl bg-slate-50 dark:bg-slate-900">
          {suggestVerdict ? (
            <div className="m-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 px-4 py-3 flex-shrink-0">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-100 text-sm">
                <Sparkles className="h-4 w-4 flex-shrink-0" />
                Major whiteboard problems are resolved — ready for a Verdict?
              </div>
              <Button size="small" onClick={onRequestVerdict}>
                Get Verdict
              </Button>
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => {
              const isOrchestrator = msg.speakerId === "orchestrator";
              return (
                <div
                  key={msg.id}
                  ref={(element) => {
                    if (element) messageRefs.current.set(msg.id, element);
                    else messageRefs.current.delete(msg.id);
                  }}
                  className={`flex gap-4 transition-shadow ${msg.isUser ? "flex-row-reverse" : ""}`}
                >
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
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{msg.speakerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {msg.refersTo ? (
                      <div className="text-[10px] font-mono uppercase tracking-wide text-blue-500 dark:text-blue-400 border-l-2 border-blue-300 dark:border-blue-700 pl-2">
                        Re: {msg.refersTo.snippet || msg.refersTo.itemType}
                      </div>
                    ) : null}
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
            {pendingPin ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 px-3 py-2 text-xs text-blue-700 dark:text-blue-200">
                <span>
                  Replying to {pendingPin.itemType}: <span className="italic">"{pendingPin.snippet}"</span>
                </span>
                <button type="button" onClick={clearPendingPin} className="flex-shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}

            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder={isReplaying ? "Message input disabled during replay..." : "Contribute to the discussion..."}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={isReplaying}
                />
              </div>
              <Button 
                onClick={handleSendMessage} 
                rightIcon={<Send className="w-4 h-4" />} 
                loading={isLoadingReply}
                disabled={isReplaying}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-4 h-full min-h-0">
        <Whiteboard
          whiteboard={whiteboard}
          isLoading={isLoadingWhiteboard}
          onComment={(pin) => setPendingPin(pin)}
          onFounderOp={(op) => applyFounderWhiteboardOp(op)}
          onNavigateToMessage={handleNavigateToMessage}
        />
      </div>
    </div>
  );
}

export { BoardroomDashboard };
