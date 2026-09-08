import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, HelpCircle, MessageSquarePlus, Trash2 } from "lucide-react";
import { Card } from "./ui/Card";

// A single problem card. Open problems are red and always expanded (they're
// the active flaw the council is pressing on). Resolved problems collapse to
// a strikethrough summary; expanding reveals the solution in blue.
function ProblemCard({ problem, onComment, onFounderOp }) {
  const isResolved = problem.status === "resolved";
  const [expanded, setExpanded] = useState(!isResolved);

  return (
    <div
      className={`group rounded-xl border p-3 transition-all duration-500 ${
        problem.highlighted
          ? isResolved
            ? "border-blue-400 bg-blue-100 dark:border-blue-600 dark:bg-blue-900/60 shadow-lg shadow-blue-500/50 animate-pulse"
            : "border-red-500 bg-red-100 dark:border-red-600 dark:bg-red-900/80 shadow-lg shadow-red-500/50 animate-pulse"
          : isResolved
          ? "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60"
          : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
      }`}
    >
      <div className="flex items-start gap-2">
        {isResolved ? (
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-slate-400 dark:text-slate-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
        )}
        <button
          type="button"
          onClick={() => isResolved && setExpanded((v) => !v)}
          className={`flex-1 text-left text-sm leading-snug ${
            isResolved
              ? "text-slate-500 dark:text-slate-400 line-through decoration-slate-400"
              : "text-red-900 dark:text-red-100 font-medium"
          }`}
        >
          {problem.text}
        </button>
        {isResolved ? (
          expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
          )
        ) : null}
      </div>

      {problem.raisedBy ? (
        <p className="mt-1 pl-6 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Raised by {problem.raisedBy}
        </p>
      ) : null}

      {isResolved && expanded ? (
        <div className="mt-2 ml-6 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 px-3 py-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-1">
            Solution{problem.resolvedBy ? ` — ${problem.resolvedBy}` : ""}
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">{problem.solution || "No solution recorded."}</p>
        </div>
      ) : null}

      <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() =>
            onComment({
              itemType: "problem",
              itemId: problem.id,
              snippet: problem.text.slice(0, 80),
            })
          }
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
        >
          <MessageSquarePlus className="h-3 w-3" />
          Comment
        </button>
        {!isResolved ? (
          <button
            type="button"
            onClick={() => onFounderOp({ type: "resolve_problem", id: problem.id, solution: "Marked resolved by founder." })}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
          >
            <CheckCircle2 className="h-3 w-3" />
            Mark resolved
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onFounderOp({ type: "delete_problem", id: problem.id })}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
          title="Remove if an agent hallucinated this"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function QuestionCard({ question, onComment, onFounderOp }) {
  const isResolved = question.status === "resolved";
  return (
    <div className="group rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
      <div className="flex items-start gap-2">
        <HelpCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <p className={`flex-1 text-sm leading-snug ${isResolved ? "text-slate-500 dark:text-slate-400 line-through decoration-slate-400" : "text-amber-900 dark:text-amber-100"}`}>
          {question.text}
        </p>
      </div>
      {question.raisedBy ? (
        <p className="mt-1 pl-6 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Raised by {question.raisedBy}
        </p>
      ) : null}
      {isResolved ? (
        <div className="mt-2 ml-6 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 px-3 py-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-1">
            Answer{question.resolvedBy ? ` — ${question.resolvedBy}` : ""}
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">{question.answer || "No answer recorded."}</p>
        </div>
      ) : null}
      <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() =>
            onComment({
              itemType: "question",
              itemId: question.id,
              snippet: question.text.slice(0, 80),
            })
          }
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
        >
          <MessageSquarePlus className="h-3 w-3" />
          Comment
        </button>
        <button
          type="button"
          onClick={() => onFounderOp({ type: "delete_question", id: question.id })}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// Whiteboard — the Boardroom's shared "single source of truth" board.
// Sits where the Mentor Dashboard's right sidebar used to be.
function Whiteboard({ whiteboard, isLoading, onComment, onFounderOp }) {
  const problems = whiteboard?.problems || [];
  const openQuestions = whiteboard?.openQuestions || [];
  const openProblems = problems.filter((p) => p.status !== "resolved");
  const resolvedProblems = problems.filter((p) => p.status === "resolved");

  return (
    <Card className="flex flex-col h-full overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Whiteboard</h3>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
          {openProblems.length} open · {resolvedProblems.length} resolved
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">Loading board...</p> : null}

        {!isLoading && !problems.length && !openQuestions.length ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            No problems raised yet. The board fills in as the council debates.
          </p>
        ) : null}

        {openProblems.map((problem) => (
          <ProblemCard key={problem.id} problem={problem} onComment={onComment} onFounderOp={onFounderOp} />
        ))}
        {resolvedProblems.map((problem) => (
          <ProblemCard key={problem.id} problem={problem} onComment={onComment} onFounderOp={onFounderOp} />
        ))}

        {openQuestions.length ? (
          <div className="pt-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Open Questions
            </p>
            <div className="space-y-3">
              {openQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} onComment={onComment} onFounderOp={onFounderOp} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export { Whiteboard };
