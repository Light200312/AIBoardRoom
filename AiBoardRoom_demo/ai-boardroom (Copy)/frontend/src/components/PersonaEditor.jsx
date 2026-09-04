import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "./ui/Dialog";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { useAppStore } from "../store/useAppStore";

function AgentPreview({ draft, subtitle }) {
  if (!draft) return null;
  const hasMeta =
    draft.personalityTraits ||
    draft.backstoryLore ||
    draft.speechStyle;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{draft.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {draft.role} • {draft.era}
          </p>
          {subtitle ? <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p> : null}
        </div>
        <div className="shrink-0 w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-mono text-xs font-bold">
          {draft.avatarInitials}
        </div>
      </div>

      <p className="text-xs text-slate-700 dark:text-slate-200 leading-snug">{draft.description}</p>

      {hasMeta ? (
        <div className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
          {draft.personalityTraits ? (
            <div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Personality Traits
              </span>
              <p className="mt-1">{draft.personalityTraits}</p>
            </div>
          ) : null}
          {draft.speechStyle ? (
            <div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Speech Style
              </span>
              <p className="mt-1">{draft.speechStyle}</p>
            </div>
          ) : null}
          {draft.backstoryLore ? (
            <div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Backstory
              </span>
              <p className="mt-1">{draft.backstoryLore}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
        <div className="rounded-md bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-1">
          Logic: <span className="text-slate-900 dark:text-white">{draft.stats?.logic}</span>
        </div>
        <div className="rounded-md bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-1">
          Rhetoric: <span className="text-slate-900 dark:text-white">{draft.stats?.rhetoric}</span>
        </div>
        <div className="rounded-md bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-1">
          Bias: <span className="text-slate-900 dark:text-white">{draft.stats?.bias}</span>
        </div>
      </div>
    </div>
  );
}

// PersonaEditor provides two AI-powered flows:
// - Suggestions: analyze a topic and suggest important figures.
// - Finder: draft a persona from a provided name.
function PersonaEditor({ isOpen, onClose, onCreated }) {
  const topicFromSession = useAppStore((s) => s.gameState.topic);
  const modeFromSession = useAppStore((s) => s.gameState.mode);
  const suggestAgents = useAppStore((s) => s.suggestAgents);
  const findAgentDraft = useAppStore((s) => s.findAgentDraft);
  const createAgent = useAppStore((s) => s.createAgent);

  const [tab, setTab] = useState("suggest");

  const [topic, setTopic] = useState(topicFromSession || "");
  const [maxSuggestions, setMaxSuggestions] = useState(6);
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const [nameQuery, setNameQuery] = useState("");
  const [finderTopic, setFinderTopic] = useState(topicFromSession || "");
  const [finderDraft, setFinderDraft] = useState(null);
  const [finderNotes, setFinderNotes] = useState("");
  const [finderExisting, setFinderExisting] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSuccess("");
    setTopic(topicFromSession || "");
    setFinderTopic(topicFromSession || "");
  }, [isOpen, topicFromSession]);

  const canSuggest = useMemo(() => Boolean(String(topic || "").trim()), [topic]);
  const canFind = useMemo(() => Boolean(String(nameQuery || "").trim()), [nameQuery]);

  const handleSuggest = async () => {
    if (!canSuggest) return;
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await suggestAgents({ topic, maxSuggestions, mode: modeFromSession });
      setAnalysis(result.analysis || null);
      setSuggestions(result.suggestions || []);
      if (!result.suggestions?.length) {
        setError("No suggestions returned. Try a more specific topic.");
      }
    } catch (e) {
      setError(e.message || "Suggestion failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFind = async () => {
    if (!canFind) return;
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await findAgentDraft({ name: nameQuery, topic: finderTopic });
      setFinderExisting(result.existing || null);
      setFinderDraft(result.draft || null);
      setFinderNotes(result.notes || "");
      if (result.existing) {
        setSuccess("This character already exists in your database.");
      }
    } catch (e) {
      setError(e.message || "Finder failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (draft) => {
    if (!draft) return;
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const agent = await createAgent(draft);
      setSuccess(`Created: ${agent.name}`);
      if (onCreated) onCreated(agent);
    } catch (e) {
      setError(e.message || "Create failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeAndReset = () => {
    setTab("suggest");
    setTopic(topicFromSession || "");
    setFinderTopic(topicFromSession || "");
    setAnalysis(null);
    setSuggestions([]);
    setFinderDraft(null);
    setFinderNotes("");
    setFinderExisting(null);
    setNameQuery("");
    setError("");
    setSuccess("");
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={closeAndReset} size="lg">
      <DialogHeader>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Agent</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Use AI suggestions from a topic, or find a character by name.
        </p>
      </DialogHeader>

      <DialogContent className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              tab === "suggest"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
            onClick={() => setTab("suggest")}
          >
            AI Suggestions
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              tab === "find"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
            onClick={() => setTab("find")}
          >
            Character Finder
          </button>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        {tab === "suggest" ? (
          <div className="space-y-4">
            <Input
              label="Topic"
              placeholder="e.g. French Revolution, Stoicism, Antibiotic resistance..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="How many suggestions?"
                type="number"
                value={maxSuggestions}
                onChange={(e) => setMaxSuggestions(Number(e.target.value || 6))}
              />
              <div className="flex items-end">
                <Button
                  size="large"
                  disabled={!canSuggest || isLoading}
                  onClick={handleSuggest}
                >
                  Analyze & Suggest
                </Button>
              </div>
            </div>

            {analysis ? (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Topic Analysis
                </p>
                <p className="text-sm text-slate-900 dark:text-white mt-1">
                  {analysis.domain ? `Domain: ${analysis.domain}` : "Domain: (unspecified)"}
                  {analysis.timePeriod ? ` • Period: ${analysis.timePeriod}` : ""}
                </p>
                {analysis.keyPerspectives?.length ? (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Perspectives: {analysis.keyPerspectives.slice(0, 6).join(", ")}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-3">
              {(suggestions || []).map((s, idx) => (
                <div key={s?.draft?.id || idx} className="space-y-2">
                  <AgentPreview draft={s.draft} subtitle={s.justification} />
                  <div className="flex items-center justify-end">
                    <Button
                      disabled={isLoading}
                      onClick={() => handleCreate(s.draft)}
                    >
                      Create Agent
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Character name"
              placeholder="e.g. Napoleon Bonaparte, Avicenna, Simone de Beauvoir..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
            />
            <Input
              label="Topic context (optional)"
              placeholder="Helps tailor the persona to your session topic"
              value={finderTopic}
              onChange={(e) => setFinderTopic(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <Button size="large" disabled={!canFind || isLoading} onClick={handleFind}>
                Find & Draft
              </Button>
            </div>

            {finderNotes ? (
              <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                {finderNotes}
              </div>
            ) : null}

            {finderDraft ? (
              <div className="space-y-2">
                <AgentPreview
                  draft={finderDraft}
                  subtitle={finderExisting ? "Already exists in your database." : "Draft preview"}
                />
                <div className="flex items-center justify-end">
                  {finderExisting ? (
                    <Button
                      variant="secondary"
                      disabled={isLoading}
                      onClick={() => {
                        if (onCreated) onCreated(finderExisting);
                        setSuccess(`Using existing: ${finderExisting.name}`);
                      }}
                    >
                      Use Existing
                    </Button>
                  ) : (
                    <Button disabled={isLoading} onClick={() => handleCreate(finderDraft)}>
                      Create Agent
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>

      <DialogFooter>
        <Button variant="secondary" onClick={closeAndReset} disabled={isLoading}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
export {
  PersonaEditor
};
