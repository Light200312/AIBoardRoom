import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

function DiscussionHistory({ discussions = [], isLoading = false, onOpenDiscussion }) {
  return (
    <div className="h-full overflow-y-auto">
      <Card>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Past Discussions</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Re-open a previous council session</p>
        </div>

        <div className="p-4 space-y-3">
          {isLoading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading discussion history...</p> : null}

          {!isLoading && discussions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No previous discussions found.</p>
          ) : null}

          {discussions.map((item) => (
            <div
              key={`${item.sessionId}-${item.lastTimestamp}`}
              className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.topic}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                  {new Date(item.lastTimestamp).toLocaleString()} | {item.totalMessages} messages
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-1 truncate">
                  Session: {item.sessionId}
                </p>
              </div>
              <Button size="small" variant="secondary" onClick={() => onOpenDiscussion?.(item)}>
                Open
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export { DiscussionHistory };
