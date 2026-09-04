import { useState } from "react";
import { Briefcase, AlertCircle, CheckCircle2, Loader } from "lucide-react";
import { Button } from "./ui/Button";
import { useAppStore } from "../store/useAppStore";
import { api } from "../lib/api";

/**
 * InterviewSimulatorPage - Practice interviews and group discussions
 * 
 * Features:
 * - Select interview type (tech, HR, startup pitch, case study, management)
 * - AI matches relevant interviewers from interview_panel
 * - Select preferred interviewers
 * - Start interview session with selected expert panel
 * 
 * Agents used: interview_panel array from PreBuildAgents.js
 * (Priya Sharma, Marcus Chen, Rahul Nair, etc.)
 */
export default function InterviewSimulatorPage({
  onSelectInterviewers,
  onClose
}) {
  const [scenarioType, setScenarioType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedInterviewers, setSelectedInterviewers] = useState(new Set());
  const [showPanel, setShowPanel] = useState(false);
  const [panelInterviewers, setPanelInterviewers] = useState([]);
  const token = useAppStore((state) => state.token);

  const scenarioOptions = [
    {
      id: "tech-dsa",
      label: "Technical DSA",
      description: "Data structures & algorithms questions",
      keywords: ["dsa", "algorithm", "coding", "data structure"]
    },
    {
      id: "system-design",
      label: "System Design",
      description: "Large-scale system design problems",
      keywords: ["system design", "architecture", "scalability"]
    },
    {
      id: "behavioral",
      label: "Behavioral Round",
      description: "Leadership & situational questions",
      keywords: ["leadership", "behavioral", "hr", "communication"]
    },
    {
      id: "startup-pitch",
      label: "Startup Pitch",
      description: "Pitch your idea to investors",
      keywords: ["startup", "pitch", "business", "solution"]
    },
    {
      id: "case-study",
      label: "Case Study",
      description: "Solve complex business cases",
      keywords: ["case study", "problem solving", "analysis"]
    },
    {
      id: "management-gd",
      label: "Management GD",
      description: "Group discussion on strategy",
      keywords: ["management", "strategy", "business"]
    }
  ];

  const generateInterviewPanel = async () => {
    if (!scenarioType) {
      setError("Please select an interview type");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await api.generateInterviewPanel({ scenario: scenarioType }, token);
      const matched = result.interviewers || [];
      if (!matched.length) throw new Error("No interviewers found for this scenario");
      setPanelInterviewers(matched);
      setSelectedInterviewers(new Set(matched.map((interviewer) => interviewer.id)));
      setShowPanel(true);
    } catch (err) {
      setError(err.message || "Failed to generate panel");
    } finally {
      setLoading(false);
    }
  };

  const toggleInterviewerSelection = (id) => {
    const newSelected = new Set(selectedInterviewers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedInterviewers(newSelected);
  };

  const startInterviewSession = () => {
    if (selectedInterviewers.size < 1) {
      setError("Select at least 1 interviewer");
      return;
    }

    const selected = panelInterviewers.filter((interviewer) => selectedInterviewers.has(interviewer.id));
    const scenario = scenarioOptions.find(s => s.id === scenarioType);
    onSelectInterviewers(selected, scenario?.label || scenarioType, "interview-simulator");
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Interview Simulator
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Practice interviews and group discussions with expert interviewers and engineers.
            Get feedback from hiring managers, tech leads, and HR professionals.
          </p>
        </div>

        {/* Scenario Selection */}
        <div className="space-y-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
              Select Interview Type
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scenarioOptions.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setScenarioType(scenario.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    scenarioType === scenario.id
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <p className="font-medium text-slate-900 dark:text-white">
                    {scenario.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {scenario.description}
                  </p>
                </button>
              ))}
            </div>
          </label>

          {/* Generate Button */}
          <Button
            onClick={generateInterviewPanel}
            disabled={loading || !scenarioType}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-4"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Assembling Interview Panel...
              </>
            ) : (
              "Generate Interview Panel"
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

        {/* Interviewer Panel Results */}
        {showPanel && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                Interview Panel ({selectedInterviewers.size})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {panelInterviewers.map((interviewer) => (
                  <button
                    key={interviewer.id}
                    onClick={() => toggleInterviewerSelection(interviewer.id)}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                      selectedInterviewers.has(interviewer.id)
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {interviewer.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {interviewer.role}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                        {interviewer.expertise}
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded">
                          Logic: {interviewer.stats?.logic || 0}
                        </span>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded">
                          Rhetoric: {interviewer.stats?.rhetoric || 0}
                        </span>
                      </div>
                    </div>
                    {selectedInterviewers.has(interviewer.id) && (
                      <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
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
                onClick={startInterviewSession}
                disabled={selectedInterviewers.size < 1}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Start Interview ({selectedInterviewers.size} selected)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
