import { Card, CardContent, CardHeader, CardFooter } from "./ui/Card";
import { Brain, MessageSquare, Scale, Info } from "lucide-react";

// AgentCard renders a candidate/member profile with stats and selection state.
function AgentCard({
  agent,
  isSelected,
  onClick,
  compact = false
}) {
  return <Card
    variant={isSelected ? "filled" : "outlined"}
    isClickable={!!onClick}
    className={`transition-all duration-200 ${isSelected ? "ring-2 ring-slate-900 dark:ring-slate-200 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900" : ""}`}
  >

      <div onClick={onClick} className="h-full mt-6 flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div
    className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-lg border ${isSelected ? "bg-white dark:bg-slate-100 text-slate-900 border-slate-900 dark:border-slate-200" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-600"}`}
  >

                {agent.avatarInitials}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{agent.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono uppercase">
                  {agent.role}
                </p>
              </div>
            </div>
            {isSelected && <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs px-2 py-1 rounded font-mono">
                SELECTED
              </div>}
          </div>
        </CardHeader>

        <CardContent className="py-2 flex-1">
          {!compact && <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
              {agent.description}
            </p>}

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600 text-center">
              <div className="flex justify-center mb-1 text-slate-400 dark:text-slate-300">
                <Brain className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                Logic
              </div>
              <div className="font-bold text-slate-900 dark:text-white">
                {agent.stats.logic}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600 text-center">
              <div className="flex justify-center mb-1 text-slate-400 dark:text-slate-300">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                Rhetoric
              </div>
              <div className="font-bold text-slate-900 dark:text-white">
                {agent.stats.rhetoric}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-100 dark:border-slate-600 text-center">
              <div className="flex justify-center mb-1 text-slate-400 dark:text-slate-300">
                <Scale className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                Bias
              </div>
              <div className="font-bold text-slate-900 dark:text-white">{agent.stats.bias}</div>
            </div>
          </div>
        </CardContent>

        {!compact && <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-700 mt-auto">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 w-full">
              <Info className="w-3 h-3" />
              <span className="font-mono truncate">
                Special: {agent.specialAbility}
              </span>
            </div>
          </CardFooter>}
      </div>
    </Card>;
}
export {
  AgentCard
};
