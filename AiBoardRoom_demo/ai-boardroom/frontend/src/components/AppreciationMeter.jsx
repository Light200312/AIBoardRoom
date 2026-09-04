import { ThumbsUp, Sparkles } from "lucide-react";

// AppreciationMeter visualizes current consensus strength in mentor mode.
function AppreciationMeter({ value }) {
  // Choose ring color based on consensus range.
  const getColor = () => {
    if (value < 30) return "text-slate-400 border-slate-200";
    if (value < 70) return "text-blue-500 border-blue-200";
    return "text-amber-500 border-amber-200";
  };
  // Add glow effect for very high consensus.
  const getGlow = () => {
    if (value >= 80) return "shadow-[0_0_15px_rgba(245,158,11,0.5)]";
    return "";
  };
  return <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ThumbsUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Council Consensus
        </h3>
      </div>

      <div className="flex flex-col items-center justify-center py-2">
        <div
    className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${getColor()} ${getGlow()}`}
  >

          <div className="text-center">
            <span className="text-2xl font-bold font-mono block dark:text-white">{value}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider dark:text-slate-300">
              Score
            </span>
          </div>
        </div>

        {value >= 80 && <div className="mt-3 flex items-center gap-1 text-amber-600 dark:text-amber-400 animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">High Consensus</span>
          </div>}
      </div>
    </div>;
}
export {
  AppreciationMeter
};
