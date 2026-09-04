import { ArrowLeft, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "./ui/Button";
import { Toggle } from "./ui/Toggle";
import { useAppStore } from "../store/useAppStore";

function OptionGroup({ title, description, options, selectedValue, onChange }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        {description ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const isActive = selectedValue === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                isActive
                  ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                  : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <span className="text-sm font-medium">{option.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                  isActive ? "bg-white/15 text-slate-100" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
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

      <div className="space-y-8">
        <OptionGroup title="API Mode" options={apiModes} selectedValue={apiRoutingMode} onChange={setApiRoutingMode} />
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
