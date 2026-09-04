import { useState } from "react";
import { Users, Plus } from "lucide-react";
import { Button } from "./ui/Button";
import { useAppStore } from "../store/useAppStore";

function getSessionDisplayCode(sessionId) {
  const normalized = String(sessionId || "").trim();
  if (!normalized) return "----";

  const digitCode = normalized.replace(/\D/g, "").slice(-4);
  if (digitCode.length === 4) return digitCode;

  return normalized.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "----";
}

// ControlBar shows session-level actions and live status.
// Routing/model settings live on the Profile page now (see ProfilePage.jsx).
function ControlBar({ onConcludeDebate, isGeneratingReport = false }) {
  const [exportError, setExportError] = useState("");
  const sessionId = useAppStore((state) => state.gameState.sessionId);
  const mode = useAppStore((state) => state.gameState.mode);
  const roundResults = useAppStore((state) => state.gameState.roundResults);
  const combatLog = useAppStore((state) => state.gameState.combatLog);
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

  return (
    <div className="min-h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 px-4 py-3 sticky top-0 z-20 lg:px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Debate Session #{sessionDisplayCode}</h2>
        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 text-xs font-mono rounded-full border border-green-200 dark:border-green-800 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
          LIVE
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="secondary" size="small" leftIcon={<Users className="w-4 h-4" />}>
          Audience Mode
        </Button>
        <Button variant="secondary" size="small" onClick={handlePrimaryAction} disabled={!canConcludeDebate} loading={isGeneratingReport}>
          Conclude Debate
        </Button>
        <Button variant="primary" size="small" leftIcon={<Plus className="w-4 h-4" />}>
          New Debate
        </Button>
      </div>
      {exportError ? <div className="w-full text-right text-xs text-red-600 dark:text-red-400">{exportError}</div> : null}
    </div>
  );
}

export { ControlBar };
