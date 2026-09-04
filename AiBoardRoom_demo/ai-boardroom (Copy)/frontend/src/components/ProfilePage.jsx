import { ArrowLeft, LogOut, Moon, Sun, Zap, Layers } from "lucide-react";
import { Button } from "./ui/Button";
import { Toggle } from "./ui/Toggle";
import { useAppStore } from "../store/useAppStore";

function OptionGroup({ title, description, options, selectedValue, onChange, disabled }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        {description ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const isActive = selectedValue === option.id;
          const isDisabled = disabled || false;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => !isDisabled && onChange(option.id)}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                isDisabled
                  ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                  : isActive
                    ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <span className="text-sm font-medium">{option.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  isDisabled
                    ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                    : isActive ? "bg-white/15 text-slate-100" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                }`}
              >
                {isActive ? "Active" : "Set"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// Available API providers — each maps to a backend key (e.g. OPENROUTER_API_KEY, QWEN_API_KEY).
const API_PROVIDERS = [
  { id: "openrouter", label: "OpenRouter" },
  { id: "ollama", label: "Ollama (Local)" },
  { id: "qwen", label: "Qwen" },
  { id: "gemini", label: "Gemini" },
  { id: "claude", label: "Claude" },
  { id: "deepsearch", label: "DeepSearch" },
];

// ProfilePage holds account info, appearance, and the routing/model settings
// that used to live in the ControlBar's Settings dialog.
function ProfilePage({ onBack }) {
  const user = useAppStore((state) => state.user);
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const signOut = useAppStore((state) => state.signOut);
  const apiRoutingMode = useAppStore((state) => state.apiRoutingMode);
  const setApiRoutingMode = useAppStore((state) => state.setApiRoutingMode);
  const ollamaModel = useAppStore((state) => state.ollamaModel);
  const setOllamaModel = useAppStore((state) => state.setOllamaModel);
  const orchestratorMode = useAppStore((state) => state.orchestratorMode);
  const setOrchestratorMode = useAppStore((state) => state.setOrchestratorMode);
  const memoryMode = useAppStore((state) => state.memoryMode);
  const setMemoryMode = useAppStore((state) => state.setMemoryMode);
  const toolCallingEnabled = useAppStore((state) => state.toolCallingEnabled);
  const setToolCallingEnabled = useAppStore((state) => state.setToolCallingEnabled);
  const aiMode = useAppStore((state) => state.aiMode);
  const setAiMode = useAppStore((state) => state.setAiMode);
  const defaultApi = useAppStore((state) => state.defaultApi);
  const setDefaultApi = useAppStore((state) => state.setDefaultApi);
  const fallbackApi = useAppStore((state) => state.fallbackApi);
  const setFallbackApi = useAppStore((state) => state.setFallbackApi);

  const isSingleMode = aiMode === "single";

  const apiModes = [
    { id: "persona", label: "Per Personality" },
    { id: "ollama_only", label: "Ollama Only" },
    { id: "openrouter_only", label: "OpenRouter Only" },
  ];
  const orchestrationModes = [
    { id: "dynamic", label: "Dynamic" },
    { id: "fast", label: "Fast" },
  ];
  const ollamaModels = [
    { id: "llama3.1:latest", label: "Llama 3.1 Latest" },
    { id: "qwen2.5:latest", label: "Qwen 2.5 Latest" },
  ];
  const memoryModes = [
    { id: "minimal", label: "Memory: Minimal" },
    { id: "rich", label: "Memory: Rich" },
  ];

  // Fallback options exclude the currently selected default API.
  const fallbackOptions = API_PROVIDERS.filter((p) => p.id !== defaultApi);

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : null}
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
      </div>

      <section className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-mono font-bold">
            {(user?.username || "U").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{user?.username || "User"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || ""}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
      </section>

      {/* ── AI Mode Toggle (Single / Multi) ── */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI Mode</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Single AI uses one API for everything. Multi AI routes per-persona with fallback support.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3">
          <button
            type="button"
            onClick={() => setAiMode("single")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              isSingleMode
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <Zap className="w-4 h-4" />
            Single AI
          </button>
          <button
            type="button"
            onClick={() => setAiMode("multi")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              !isSingleMode
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <Layers className="w-4 h-4" />
            Multi AI
          </button>
        </div>
      </section>

      {/* ── Default API ── */}
      <OptionGroup
        title="Default API"
        description={
          isSingleMode
            ? "All requests will be routed through this API."
            : "Primary API used for persona routing. Others fall back to this when their provider is unavailable."
        }
        options={API_PROVIDERS}
        selectedValue={defaultApi}
        onChange={setDefaultApi}
      />

      {/* ── Fallback API (only visible in Multi AI mode) ── */}
      {!isSingleMode && (
        <OptionGroup
          title="Fallback API"
          description="When the default or persona-assigned API fails, requests are re-routed here."
          options={fallbackOptions}
          selectedValue={fallbackApi}
          onChange={setFallbackApi}
        />
      )}

      <div className="space-y-8">
        <OptionGroup
          title="API Routing Mode"
          description={isSingleMode ? "Locked to single-provider routing in Single AI mode." : undefined}
          options={apiModes}
          selectedValue={apiRoutingMode}
          onChange={setApiRoutingMode}
          disabled={isSingleMode}
        />
        <OptionGroup title="Ollama Model" options={ollamaModels} selectedValue={ollamaModel} onChange={setOllamaModel} />
        <OptionGroup title="Orchestrator" options={orchestrationModes} selectedValue={orchestratorMode} onChange={setOrchestratorMode} />
        <OptionGroup title="Context Memory" options={memoryModes} selectedValue={memoryMode} onChange={setMemoryMode} />

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Persona Tool Calling</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Let personas decide when live tools are needed for medical, legal, research, news, and other factual topics.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {toolCallingEnabled ? "Enabled" : "Disabled"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personas can pull real-world context only when it helps the current discussion.
              </p>
            </div>
            <Toggle checked={toolCallingEnabled} onChange={setToolCallingEnabled} aria-label="Toggle persona tool calling" />
          </div>
        </section>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <Button variant="destructive" leftIcon={<LogOut className="w-4 h-4" />} onClick={signOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export { ProfilePage };
