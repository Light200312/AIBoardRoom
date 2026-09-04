import { useMemo, useState } from "react";
import { Check, ChevronLeft, Pencil, Search, Trash2 } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { AgentCard } from "./AgentCard";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "./ui/Dialog";
import { useAppStore } from "../store/useAppStore";

// MemberSelect filters and selects council members during setup.
function MemberSelect({
  availableAgents,
  selectedAgents,
  onToggleAgent,
  onConfirm,
  onBack,
  onOpenPersonaEditor,
  maxSelection = 3,
  onMaxSelectionChange,
  argumentLimit = 10,
  onArgumentLimitChange,
  difficulty = "standard",
  onDifficultyChange
}) {
  const updateAgent = useAppStore((s) => s.updateAgent);
  const deleteAgent = useAppStore((s) => s.deleteAgent);
  const mode = useAppStore((s) => s.gameState.mode);
  const copyByMode = {
    "learn-law": {
      title: "Select Lawmakers",
      subtitle: "Choose the legal experts you want in this discussion",
      searchPlaceholder: "Search lawmakers by name, role, era..."
    },
    "interview-simulator": {
      title: "Select Interview Panel",
      subtitle: "Choose the interviewers for this session",
      searchPlaceholder: "Search interviewers by name, role, expertise..."
    },
    "medical-consulting": {
      title: "Select Medical Specialists",
      subtitle: "Choose the specialists for this consultation",
      searchPlaceholder: "Search specialists by name, role, expertise..."
    }
  };
  const modeCopy = copyByMode[mode];
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [editingAgent, setEditingAgent] = useState(null);
  const [editDraft, setEditDraft] = useState({
    personalityTraits: "",
    backstoryLore: "",
    speechStyle: "",
    domain: "",
    sourceTitle: "",
    sourceType: "",
    genre: "",
  });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const remaining = maxSelection - selectedAgents.length;
  const isComplete = remaining === 0;
  const domainLabel = useMemo(
    () => ({
      philosophy: "Philosophy",
      tech: "Tech",
      math: "Math",
      economics: "Economics",
      law: "Law",
      politics: "Politics",
      history: "History",
      science: "Science",
      fantasy: "Fantasy",
      other: "Other"
    }),
    []
  );
  const normalizeText = (value = "") => String(value || "").trim().toLowerCase();
  const featureConfigByMode = useMemo(
    () => ({
      "learn-law": {
        title: "Recommended Lawmakers",
        subtitle: "Prebuilt legal experts matched to this feature",
        topics: ["indian law makers"],
        domains: ["law"],
        terms: ["law", "legal", "constitution", "constitutional", "rights"],
        accent: {
          container: "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40",
          title: "text-amber-900 dark:text-amber-100",
          subtitle: "text-amber-700 dark:text-amber-300",
          badge: "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-900/70 dark:text-amber-100",
        },
      },
      "interview-simulator": {
        title: "Recommended Interview Panel",
        subtitle: "Prebuilt interviewers matched to this feature",
        topics: ["interview panel"],
        domains: ["technology", "human resources", "business"],
        terms: ["interview", "hiring", "hr", "recruit", "system design"],
        accent: {
          container: "border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40",
          title: "text-sky-900 dark:text-sky-100",
          subtitle: "text-sky-700 dark:text-sky-300",
          badge: "border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-700 dark:bg-sky-900/70 dark:text-sky-100",
        },
      },
      "medical-consulting": {
        title: "Recommended Medical Specialists",
        subtitle: "Prebuilt doctors and specialists matched to this feature",
        topics: ["medical specialists"],
        domains: ["medicine", "medical", "health"],
        terms: ["doctor", "medical", "medicine", "surgery", "clinical"],
        accent: {
          container: "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40",
          title: "text-emerald-900 dark:text-emerald-100",
          subtitle: "text-emerald-700 dark:text-emerald-300",
          badge: "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-100",
        },
      },
      historical: {
        title: "Recommended Historians",
        subtitle: "Prebuilt historians matched to this mode",
        topics: ["historians"],
        domains: ["history"],
        terms: ["history", "historian", "historical"],
        accent: {
          container: "border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/40",
          title: "text-violet-900 dark:text-violet-100",
          subtitle: "text-violet-700 dark:text-violet-300",
          badge: "border-violet-300 bg-violet-100 text-violet-900 dark:border-violet-700 dark:bg-violet-900/70 dark:text-violet-100",
        },
      },
      fantasy: {
        title: "Recommended Fantasy Council",
        subtitle: "Fictional characters are prioritized for this mode",
        topics: [],
        domains: ["fantasy"],
        terms: ["fantasy", "fictional", "lore"],
        accent: {
          container: "border-fuchsia-300 bg-fuchsia-50 dark:border-fuchsia-800 dark:bg-fuchsia-950/40",
          title: "text-fuchsia-900 dark:text-fuchsia-100",
          subtitle: "text-fuchsia-700 dark:text-fuchsia-300",
          badge: "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-900 dark:border-fuchsia-700 dark:bg-fuchsia-900/70 dark:text-fuchsia-100",
        },
      },
    }),
    []
  );
  const inferDomain = (agent) => {
    if (agent?.domain) return String(agent.domain).toLowerCase();
    const tagText = (agent.tags || []).map((t) => String(t).toLowerCase());
    if (tagText.includes("philosophy")) return "philosophy";
    if (tagText.includes("tech") || tagText.includes("technology")) return "tech";
    if (tagText.includes("math") || tagText.includes("mathematics")) return "math";
    if (tagText.includes("economics")) return "economics";
    if (tagText.includes("law") || tagText.includes("legal")) return "law";
    if (tagText.includes("politics") || tagText.includes("political")) return "politics";
    if (tagText.includes("history") || tagText.includes("historical")) return "history";
    if (tagText.includes("science") || tagText.includes("scientist")) return "science";

    const roleText = `${agent.role || ""} ${agent.description || ""}`.toLowerCase();
    if (roleText.includes("philosoph")) return "philosophy";
    if (roleText.includes("technolog") || roleText.includes("engineer") || roleText.includes("inventor")) return "tech";
    if (roleText.includes("math") || roleText.includes("statistic")) return "math";
    if (roleText.includes("econom")) return "economics";
    if (roleText.includes("law") || roleText.includes("legal") || roleText.includes("jurist")) return "law";
    if (roleText.includes("politic") || roleText.includes("strateg")) return "politics";
    if (roleText.includes("histor")) return "history";
    if (roleText.includes("science") || roleText.includes("scientist") || roleText.includes("physician")) return "science";
    return "other";
  };
  const isFeaturedAgentForMode = (agent) => {
    const config = featureConfigByMode[mode];
    if (!config) return false;
    if (mode === "fantasy") return Boolean(agent?.isFantasy);

    const sourceTopic = normalizeText(agent?.sourceTopic);
    const domain = normalizeText(agent?.domain);
    const haystack = [
      agent?.name,
      agent?.role,
      agent?.description,
      agent?.specialAbility,
      ...(Array.isArray(agent?.tags) ? agent.tags : []),
    ]
      .map((item) => normalizeText(item))
      .join(" ");

    return (
      config.topics.some((topic) => sourceTopic === topic) ||
      config.domains.some((candidateDomain) => domain === candidateDomain) ||
      config.terms.some((term) => haystack.includes(term))
    );
  };
  const scopedAgents = useMemo(() => {
    if (mode === "fantasy") {
      return availableAgents.filter((agent) => agent.isFantasy);
    }
    return availableAgents;
  }, [availableAgents, mode]);

  const availableDomains = useMemo(() => {
    const domainSet = new Set();
    scopedAgents.forEach((agent) => domainSet.add(inferDomain(agent)));
    return Array.from(domainSet);
  }, [scopedAgents]);
  // Filter experts by searchable profile fields and domain.
  const filteredAgents = useMemo(() => {
    const domainFiltered =
      domainFilter === "all"
        ? scopedAgents
        : scopedAgents.filter((agent) => inferDomain(agent) === domainFilter);
    const q = searchQuery.toLowerCase();
    if (!searchQuery.trim()) return domainFiltered;
    return domainFiltered.filter(
      (agent) => agent.name.toLowerCase().includes(q) || agent.role.toLowerCase().includes(q) || agent.era.toLowerCase().includes(q) || agent.description.toLowerCase().includes(q) || agent.specialAbility.toLowerCase().includes(q)
    );
  }, [scopedAgents, searchQuery, domainFilter]);
  const featuredAgents = useMemo(
    () =>
      filteredAgents
        .filter((agent) => isFeaturedAgentForMode(agent))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [filteredAgents, mode]
  );
  const featuredAgentIds = useMemo(() => new Set(featuredAgents.map((agent) => agent.id)), [featuredAgents]);
  const regularAgents = useMemo(
    () => filteredAgents.filter((agent) => !featuredAgentIds.has(agent.id)),
    [filteredAgents, featuredAgentIds]
  );
  const groupedAgents = useMemo(() => {
    const groups = {};
    regularAgents.forEach((agent) => {
      const key = inferDomain(agent);
      if (!groups[key]) groups[key] = [];
      groups[key].push(agent);
    });
    return groups;
  }, [regularAgents]);
  const openEditor = (agent) => {
    setEditingAgent(agent);
    setEditDraft({
      personalityTraits: agent?.personalityTraits || "",
      backstoryLore: agent?.backstoryLore || "",
      speechStyle: agent?.speechStyle || "",
      domain: agent?.domain || "",
      sourceTitle: agent?.sourceTitle || "",
      sourceType: agent?.sourceType || "",
      genre: agent?.genre || "",
    });
    setEditError("");
  };

  const closeEditor = () => {
    setEditingAgent(null);
    setEditDraft({
      personalityTraits: "",
      backstoryLore: "",
      speechStyle: "",
      domain: "",
      sourceTitle: "",
      sourceType: "",
      genre: "",
    });
    setEditError("");
    setEditLoading(false);
  };

  const handleSave = async () => {
    if (!editingAgent) return;
    setEditLoading(true);
    setEditError("");
    try {
      await updateAgent(editingAgent.id, {
        personalityTraits: editDraft.personalityTraits?.trim(),
        backstoryLore: editDraft.backstoryLore?.trim(),
        speechStyle: editDraft.speechStyle?.trim(),
        domain: editDraft.domain?.trim(),
        sourceTitle: editDraft.sourceTitle?.trim(),
        sourceType: editDraft.sourceType?.trim(),
        genre: editDraft.genre?.trim(),
      });
      closeEditor();
    } catch (e) {
      setEditError(e.message || "Update failed.");
      setEditLoading(false);
    }
  };

  const handleDelete = async (agent) => {
    const confirmed = window.confirm(`Delete ${agent.name}? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await deleteAgent(agent.id);
    } catch (e) {
      setEditError(e.message || "Delete failed.");
    }
  };
  return <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-8 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
    variant="tertiary"
    leftIcon={<ChevronLeft className="w-4 h-4" />}
    onClick={onBack}
  >

            Back to Topics
          </Button>

          <div className="text-right">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {modeCopy?.title || "Select Council Members"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-mono">
              {modeCopy?.subtitle || (remaining > 0 ? `Select ${remaining} more members` : "Selection Complete")}
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-end justify-between gap-4">
          <div className="max-w-md w-full">
            <Input
              placeholder={modeCopy?.searchPlaceholder || "Search experts by name, role, era..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400">Council size</label>
              <select
                className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200"
                value={maxSelection}
                onChange={(e) => onMaxSelectionChange?.(e.target.value)}
              >
                {[3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} members
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400">Arguments</label>
              <select
                className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200"
                value={argumentLimit}
                onChange={(e) => onArgumentLimitChange?.(e.target.value)}
              >
                <option value={10}>10 rounds</option>
                <option value={20}>20 rounds</option>
                <option value="infinite">Infinite</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400">Difficulty</label>
              <select
                className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200"
                value={difficulty}
                onChange={(e) => onDifficultyChange?.(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="standard">Standard</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            {onOpenPersonaEditor ? (
              <Button size="large" onClick={onOpenPersonaEditor}>
                Create Agent
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              domainFilter === "all"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
            onClick={() => setDomainFilter("all")}
          >
            All Domains
          </button>
          {availableDomains.map((domain) => (
            <button
              key={domain}
              type="button"
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                domainFilter === domain
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
              onClick={() => setDomainFilter(domain)}
            >
              {domainLabel[domain] || domain}
            </button>
          ))}
        </div>

        {searchQuery.trim() && <p className="text-xs font-mono text-slate-400 mb-4">
            {filteredAgents.length} expert
            {filteredAgents.length !== 1 ? "s" : ""} found
          </p>}

        <div className="space-y-8 mb-24">
          {featuredAgents.length > 0 ? (
            <div className={`rounded-2xl border p-5 ${featureConfigByMode[mode]?.accent.container || "border-slate-200 bg-slate-50"}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className={`text-base font-bold ${featureConfigByMode[mode]?.accent.title || "text-slate-900 dark:text-white"}`}>
                    {featureConfigByMode[mode]?.title || "Recommended Agents"}
                  </h3>
                  <p className={`text-sm ${featureConfigByMode[mode]?.accent.subtitle || "text-slate-600 dark:text-slate-300"}`}>
                    {featureConfigByMode[mode]?.subtitle || "Mode-relevant agents are highlighted here first."}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${featureConfigByMode[mode]?.accent.badge || "border-slate-300 bg-white text-slate-700"}`}>
                  Featured
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {featuredAgents.map((agent) => (
                  <div key={agent.id} className="relative ">
                    <div className="absolute left-2 top-2 z-10 rounded-full border border-white/70 bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-200">
                      {agent.sourceTopic || "Featured"}
                    </div>
                    <div className="absolute right-2 top-2 z-10 flex gap-2">
                      <button
                        type="button"
                        className="rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-300 shadow-sm hover:text-slate-900 dark:hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditor(agent);
                        }}
                        title="Edit persona fields"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-300 shadow-sm hover:text-red-600 dark:hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(agent);
                        }}
                        title="Delete agent"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <AgentCard
                      agent={agent}
                      isSelected={selectedAgents.includes(agent.id)}
                      onClick={() => onToggleAgent(agent.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {featuredAgents.length === 0 && Object.keys(groupedAgents).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 font-mono">
                No experts match "{searchQuery}"
              </p>
              <button
                className="mt-2 text-sm text-slate-500 underline hover:text-slate-700"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </button>
            </div>
          ) : (
            (domainFilter === "all" ? Object.keys(groupedAgents) : [domainFilter]).map((domainKey) => {
              const items = groupedAgents[domainKey] || [];
              if (!items.length) return null;
              return (
                <div key={domainKey}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-mono text-slate-600 uppercase tracking-wide">
                      {domainLabel[domainKey] || domainKey}
                    </h3>
                    <span className="text-xs text-slate-400">{items.length} members</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((agent) => (
                      <div key={agent.id} className="relative">
                        <div className="absolute right-2 top-2 z-10 flex gap-2">
                          <button
                            type="button"
                            className="rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-300 shadow-sm hover:text-slate-900 dark:hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditor(agent);
                            }}
                            title="Edit persona fields"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-300 shadow-sm hover:text-red-600 dark:hover:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(agent);
                            }}
                            title="Delete agent"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <AgentCard
                          agent={agent}
                          isSelected={selectedAgents.includes(agent.id)}
                          onClick={() => onToggleAgent(agent.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-6 shadow-lg z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {selectedAgents.map((id) => {
    const agent = availableAgents.find((a) => a.id === id);
    return <div
      key={id}
      className="w-10 h-10 rounded-full border-2 border-white bg-slate-800 text-white flex items-center justify-center font-mono text-xs font-bold"
      title={agent?.name}
    >

                      {agent?.avatarInitials}
                    </div>;
  })}
                {Array(remaining).fill(0).map(
    (_, i) => <div
      key={`empty-${i}`}
      className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 border-dashed flex items-center justify-center text-slate-300 dark:text-slate-500"
    >

                      ?
                    </div>
  )}
              </div>
              <span className="text-sm text-slate-500 font-mono">
                {selectedAgents.length} / {maxSelection} Selected
              </span>
            </div>

            <Button
    size="large"
    disabled={!isComplete}
    onClick={onConfirm}
    rightIcon={<Check className="w-5 h-5" />}
  >

              Confirm Council
            </Button>
          </div>
        </div>
      </div>
      <Dialog isOpen={!!editingAgent} onClose={closeEditor} size="md">
        <DialogHeader>Edit Persona Fields</DialogHeader>
        <DialogContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{editingAgent?.name}</p>
            <p className="text-xs text-slate-500">{editingAgent?.role} - {editingAgent?.era}</p>
          </div>
          {editError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {editError}
            </div>
          ) : null}
          <Input
            label="Personality traits"
            placeholder="Comma-separated traits"
            value={editDraft.personalityTraits}
            onChange={(e) => setEditDraft((d) => ({ ...d, personalityTraits: e.target.value }))}
          />
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-500">Backstory / lore</label>
            <textarea
              className="w-full min-h-[90px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-slate-700 dark:text-slate-100"
              placeholder="1-2 sentences of background or lore"
              value={editDraft.backstoryLore}
              onChange={(e) => setEditDraft((d) => ({ ...d, backstoryLore: e.target.value }))}
            />
          </div>
          <Input
            label="Speech style"
            placeholder="Short voice/tone description"
            value={editDraft.speechStyle}
            onChange={(e) => setEditDraft((d) => ({ ...d, speechStyle: e.target.value }))}
          />
          <Input
            label="Domain"
            placeholder="politics, tech, fantasy, law..."
            value={editDraft.domain}
            onChange={(e) => setEditDraft((d) => ({ ...d, domain: e.target.value }))}
          />
          {editingAgent?.isFantasy ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="From (book/series)"
                placeholder="e.g. The Lord of the Rings"
                value={editDraft.sourceTitle}
                onChange={(e) => setEditDraft((d) => ({ ...d, sourceTitle: e.target.value }))}
              />
              <Input
                label="Type"
                placeholder="webnovel, webseries, movie, tv..."
                value={editDraft.sourceType}
                onChange={(e) => setEditDraft((d) => ({ ...d, sourceType: e.target.value }))}
              />
              <Input
                label="Genre"
                placeholder="fantasy, sci-fi, myth..."
                value={editDraft.genre}
                onChange={(e) => setEditDraft((d) => ({ ...d, genre: e.target.value }))}
              />
            </div>
          ) : null}
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={closeEditor} disabled={editLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={editLoading}>
            Save Changes
          </Button>
        </DialogFooter>
      </Dialog>
    </div>;
}
export {
  MemberSelect
};
