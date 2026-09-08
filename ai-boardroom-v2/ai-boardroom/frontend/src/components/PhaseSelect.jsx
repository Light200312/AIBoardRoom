import { Target, Hammer, TrendingUp, ArrowRight, Lock, History } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/Card";
import { Button } from "./ui/Button";

const PHASES = [
  {
    id: "boardroom",
    icon: Target,
    title: "Phase 1: Idea Validation",
    tagline: "Stress-test a new, unbuilt concept.",
    description:
      "Submit a business idea to a council of AI experts. They'll debate it, challenge your assumptions, track problems on a live Whiteboard, and hand you a Verdict once the major issues are resolved.",
    deliverable: "Verdict Dashboard: viability scores, risk analysis, identified critical weaknesses.",
    available: true,
  },
  {
    id: "implementation",
    icon: Hammer,
    title: "Phase 2: Implementation",
    tagline: "Executing a validated idea.",
    description: "Turn a validated idea into wireframes and AI coding prompts (tech) or SOPs and service blueprints (non-tech).",
    deliverable: "Implementation Blueprint.",
    available: false,
  },
  {
    id: "scaling",
    icon: TrendingUp,
    title: "Phase 3: Scaling & Expansion",
    tagline: "Pivoting or adding features to an existing product.",
    description: "Get feature-integration guides and go-to-market strategies for a product that's already live.",
    deliverable: "Expansion Plan.",
    available: false,
  },
];

// PhaseSelect is the entry screen for AI Boardroom — pick which phase of the
// product journey you're in. Only Idea Validation is wired up for now.
function PhaseSelect({ onSelectPhase, onOpenHistory }) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-white dark:text-slate-900 font-bold font-mono text-2xl">AB</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">AI BOARDROOM</h1>
        <p className="text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase">
          One Genius vs Team of Geniuses — Which Will You Choose?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {PHASES.map((phase) => {
          const Icon = phase.icon;
          return (
            <Card
              key={phase.id}
              className={`transition-transform duration-300 border-2 border-dashed ${
                phase.available
                  ? "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:-translate-y-2"
                  : "border-slate-200 dark:border-slate-700 opacity-60"
              }`}
            >
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-600">
                  <Icon className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{phase.title}</h2>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {phase.tagline}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400 min-h-[4.5rem] text-sm">{phase.description}</p>
                <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono border-t border-dashed border-slate-200 dark:border-slate-700 pt-3">
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full mt-1 flex-shrink-0" />
                  <span>{phase.deliverable}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                {phase.available ? (
                  <Button
                    className="w-full"
                    size="large"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    onClick={() => onSelectPhase(phase.id)}
                  >
                    Start
                  </Button>
                ) : (
                  <Button className="w-full" size="large" variant="secondary" disabled leftIcon={<Lock className="w-4 h-4" />}>
                    Coming Soon
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {onOpenHistory ? (
        <div className="mt-8">
          <Button
            variant="secondary"
            size="large"
            leftIcon={<History className="w-4 h-4" />}
            onClick={onOpenHistory}
          >
            View Past Discussions
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export { PhaseSelect };
