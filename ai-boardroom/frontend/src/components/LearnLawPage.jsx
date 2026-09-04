import { useState, useMemo } from "react";
import { BookOpen, AlertCircle, CheckCircle2, Loader } from "lucide-react";
import { Button } from "./ui/Button";
import { useAppStore } from "../store/useAppStore";
import { api } from "../lib/api";

/**
 * LearnLawPage - Interactive legal learning through expert panel discussions
 * 
 * Features:
 * - Select legal topics or enter custom topics
 * - AI matches relevant legal experts (judges, advocates, scholars)
 * - Select preferred experts for debate panel
 * - Start learning session with selected experts
 * 
 * Agents used: law_makers array from PreBuildAgents.js
 * (Dr. Ambedkar, Nariman, Palkhivala, etc.)
 */
export default function LearnLawPage({
  onSelectExperts,
  onClose
}) {
  const [lawTopic, setLawTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedExperts, setSelectedExperts] = useState(new Set());
  const [showPanel, setShowPanel] = useState(false);
  const [panelExperts, setPanelExperts] = useState([]);
  const token = useAppStore((state) => state.token);

  const exampleTopics = [
    "Constitutional Rights",
    "Indian Penal Code Basics",
    "Property Transfer Laws",
    "Family Law & Marriage",
    "Consumer Protection Act",
    "Right to Information",
    "Fundamental Duties",
    "Emergency Provisions"
  ];

  const generateLawPanel = async () => {
    if (!lawTopic.trim()) {
      setError("Please enter a legal topic");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await api.generateLawPanel({ topic: lawTopic }, token);
      const experts = result.experts || [];
      if (!experts.length) throw new Error("No legal experts found for this topic");
      setPanelExperts(experts);
      setSelectedExperts(new Set(experts.map((expert) => expert.id)));
      setShowPanel(true);
    } catch (err) {
      setError(err.message || "Failed to generate panel");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpertSelection = (id) => {
    const newSelected = new Set(selectedExperts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedExperts(newSelected);
  };

  const startLawSession = () => {
    if (selectedExperts.size < 2) {
      setError("Select at least 2 legal experts");
      return;
    }

    const selected = panelExperts.filter((expert) => selectedExperts.has(expert.id));
    onSelectExperts(selected, lawTopic, "learn-law");
  };

  const displayedExperts = useMemo(() => {
    if (!showPanel) return [];
    return panelExperts;
  }, [showPanel, panelExperts]);

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Learn Indian Laws
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Explore constitutional concepts, legal principles, and case law through expert discussion
            with judges, advocates, and constitutional scholars.
          </p>
        </div>

        {/* Topic Input */}
        <div className="space-y-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Legal Topic
            </span>
            <input
              type="text"
              value={lawTopic}
              onChange={(e) => setLawTopic(e.target.value)}
              placeholder="e.g., Constitutional Rights, IPC Sections, Property Laws..."
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && generateLawPanel()}
            />
          </label>

          {/* Example Topics */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Popular Topics:
            </p>
            <div className="flex flex-wrap gap-2">
              {exampleTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setLawTopic(topic)}
                  className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateLawPanel}
            disabled={loading || !lawTopic.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Assembling Legal Panel...
              </>
            ) : (
              "Generate Legal Panel"
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Expert Panel Results */}
        {showPanel && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Legal Experts ({displayedExperts.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayedExperts.map((expert) => (
                  <button
                    key={expert.id}
                    onClick={() => toggleExpertSelection(expert.id)}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                      selectedExperts.has(expert.id)
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {expert.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {expert.role}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                        {expert.expertise}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded">
                          Logic: {expert.stats?.logic || 0}
                        </span>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded">
                          Rhetoric: {expert.stats?.rhetoric || 0}
                        </span>
                      </div>
                    </div>
                    {selectedExperts.has(expert.id) && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 sticky bottom-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-lg">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={startLawSession}
                disabled={selectedExperts.size < 2}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start Learning Session ({selectedExperts.size} selected)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
