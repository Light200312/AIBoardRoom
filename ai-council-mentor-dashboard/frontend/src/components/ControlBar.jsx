import { useState } from "react";
import { Users, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "./ui/Button";
import { Dialog, DialogContent, DialogHeader } from "./ui/Dialog";
import { Toggle } from "./ui/Toggle";
import { useAppStore } from "../store/useAppStore";

function getSessionDisplayCode(sessionId) {
  const normalized = String(sessionId || "").trim();
  if (!normalized) return "----";

  const digitCode = normalized.replace(/\D/g, "").slice(-4);
  if (digitCode.length === 4) return digitCode;

  return normalized.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "----";
}

// ControlBar shows session-level actions and live status.
function ControlBar({
  onConcludeDebate,
  isGeneratingReport = false,
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [exportError, setExportError] = useState("");
  const sessionId = useAppStore((state) => state.gameState.sessionId);
  const mode = useAppStore((state) => state.gameState.mode);
  const roundResults = useAppStore((state) => state.gameState.roundResults);
  const combatLog = useAppStore((state) => state.gameState.combatLog);
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
  const selectedApiMode = apiModes.find((mode) => mode.id === apiRoutingMode)?.label || "Per Personality";
  const selectedOllamaModel =
    ollamaModels.find((model) => model.id === ollamaModel)?.label || "Llama 3.1 Latest";
  const selectedOrchestratorMode =
    orchestrationModes.find((mode) => mode.id === orchestratorMode)?.label || "Fast";
  const selectedMemoryMode = memoryModes.find((mode) => mode.id === memoryMode)?.label || "Memory: Minimal";
  const sessionDisplayCode = getSessionDisplayCode(sessionId);
  const canConcludeDebate = mode === "combat" ? roundResults.length > 0 || combatLog.length > 1 : true;

  const handlePrimaryAction = async () => {
    setExportError("");
    if (typeof onConcludeDebate !== "function") {
      setExportError("Conclude debate is unavailable.");
      return;
    }
    await onConcludeDebate();
  };

  const renderOptionGroup = ({ title, options, selectedValue, onChange }) => (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="grid gap-2">
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
                  isActive
                    ? "bg-white/15 text-slate-100"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
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

  return <>
      <div className="min-h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 px-4 py-3 sticky top-0 z-20 lg:px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Debate Session #{sessionDisplayCode}
        </h2>
        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 text-xs font-mono rounded-full border border-green-200 dark:border-green-800 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
          LIVE
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-left transition-colors hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Settings
            </span>
            <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              {selectedApiMode} • {selectedOllamaModel} • {selectedOrchestratorMode} • {selectedMemoryMode.replace("Memory: ", "")} • {toolCallingEnabled ? "Tools On" : "Tools Off"}
            </span>
          </span>
        </button>
        <Button
    variant="secondary"
    size="small"
    leftIcon={<Users className="w-4 h-4" />}
  >

          Audience Mode
        </Button>
        <Button
    variant="secondary"
    size="small"
    onClick={handlePrimaryAction}
    disabled={!canConcludeDebate}
    loading={isGeneratingReport}
  >

          Conclude Debate
        </Button>
        <Button
    variant="primary"
    size="small"
    leftIcon={<Plus className="w-4 h-4" />}
  >

          New Debate
        </Button>
      </div>
      {exportError ? (
        <div className="w-full text-right text-xs text-red-600 dark:text-red-400">
          {exportError}
        </div>
      ) : null}
    </div>

      <Dialog
      isOpen={isSettingsOpen}
      onClose={setIsSettingsOpen}
      position="right"
      backdrop="blur"
      className="relative border-l border-slate-200 dark:border-slate-700"
    >
        <DialogHeader className="bg-slate-50 dark:bg-slate-900">
          <div className="pr-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Session Settings
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Routing and memory controls
            </p>
          </div>
        </DialogHeader>
        <DialogContent className="space-y-8 overflow-y-auto">
          {renderOptionGroup({
            title: "API Mode",
            options: apiModes,
            selectedValue: apiRoutingMode,
            onChange: setApiRoutingMode,
          })}
          {renderOptionGroup({
            title: "Ollama Model",
            options: ollamaModels,
            selectedValue: ollamaModel,
            onChange: setOllamaModel,
          })}
          {renderOptionGroup({
            title: "Orchestrator",
            options: orchestrationModes,
            selectedValue: orchestratorMode,
            onChange: setOrchestratorMode,
          })}
          {renderOptionGroup({
            title: "Context Memory",
            options: memoryModes,
            selectedValue: memoryMode,
            onChange: setMemoryMode,
          })}
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
              <Toggle
                checked={toolCallingEnabled}
                onChange={setToolCallingEnabled}
                aria-label="Toggle persona tool calling"
              />
            </div>
          </section>
        </DialogContent>
      </Dialog>
    </>;
}
export {
  ControlBar
};
