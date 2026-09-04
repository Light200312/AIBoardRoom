import { TrendingUp } from "lucide-react";

// KnowledgeGrowth displays learner progression as a level/progress bar.
function KnowledgeGrowth({ value }) {
  return <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Knowledge Growth
        </h3>
      </div>

      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 dark:text-blue-300 bg-blue-200 dark:bg-blue-900 font-mono">
              Level {Math.floor(value / 20) + 1}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-300 font-mono">
              {value}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100 dark:bg-blue-900">
          <div
    style={{
      width: `${value}%`
    }}
    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 dark:bg-blue-600 transition-all duration-500"
  >
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          Consistent logical argumentation increases your standing with the
          council.
        </p>
      </div>
    </div>;
}
export {
  KnowledgeGrowth
};
