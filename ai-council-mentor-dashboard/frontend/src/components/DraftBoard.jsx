import { AgentCard } from "./AgentCard";
import { Button } from "./ui/Button";
import { Check } from "lucide-react";

// DraftBoard manages team drafting and confirmation in combat mode.
function DraftBoard({
  availableAgents,
  selectedAgents,
  onSelectAgent,
  onConfirmDraft,
  maxSelection = 3
}) {
  const remainingPicks = maxSelection - selectedAgents.length;
  const isComplete = remainingPicks === 0;
  return <div className="p-8 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Draft Your Council
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Select {maxSelection} experts to represent your argument in the
            arena.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500 dark:text-slate-400 font-mono mb-1">
            REMAINING PICKS
          </div>
          <div className="text-4xl font-bold text-slate-900 dark:text-white">
            {remainingPicks}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {availableAgents.map(
    (agent) => <div key={agent.id} className="relative group">
            <AgentCard
      agent={agent}
      isSelected={selectedAgents.includes(agent.id)}
      onClick={() => onSelectAgent(agent.id)}
    />

          </div>
  )}
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-6 z-30">
        <div className="flex -space-x-2">
          {selectedAgents.map((id) => {
    const agent = availableAgents.find((a) => a.id === id);
    return <div
      key={id}
      className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center font-mono text-xs font-bold"
      title={agent?.name}
    >

                {agent?.avatarInitials}
              </div>;
  })}
          {Array(remainingPicks).fill(0).map(
    (_, i) => <div
      key={`empty-${i}`}
      className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 border-dashed flex items-center justify-center text-slate-300 dark:text-slate-500"
    >

                ?
              </div>
  )}
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-600" />

        <Button
    size="large"
    disabled={!isComplete}
    onClick={onConfirmDraft}
    rightIcon={<Check className="w-5 h-5" />}
  >

          Confirm Council
        </Button>
      </div>
    </div>;
}
export {
  DraftBoard
};
