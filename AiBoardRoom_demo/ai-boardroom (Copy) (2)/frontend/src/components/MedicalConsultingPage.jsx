import { useState } from "react";
import { Stethoscope, AlertCircle, CheckCircle2, Loader } from "lucide-react";
import { Button } from "./ui/Button";
import { useAppStore } from "../store/useAppStore";
import { api } from "../lib/api";

/**
 * MedicalConsultingPage - Collaborative medical diagnosis and consultation
 * 
 * Features:
 * - Describe medical case or symptoms
 * - AI matches relevant medical specialists
 * - Select preferred doctors and specialists
 * - Start medical consultation session
 * 
 * Agents used: medical_specialists array from PreBuildAgents.js
 * (Dr. Devi Prasad Shetty, Dr. Siddhartha Mukherjee, etc.)
 */
export default function MedicalConsultingPage({
  onSelectDoctors,
  onClose
}) {
  const [medicalCase, setMedicalCase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDoctors, setSelectedDoctors] = useState(new Set());
  const [showPanel, setShowPanel] = useState(false);
  const [panelDoctors, setPanelDoctors] = useState([]);
  const token = useAppStore((state) => state.token);

  const caseExamples = [
    "Persistent chest pain & shortness of breath",
    "Neurological symptoms - headaches & dizziness",
    "Gastrointestinal issues & weight loss",
    "Respiratory infection with high fever",
    "Mental health - anxiety & sleep disorders",
    "Chronic pain in joints & muscles",
    "Cardiac arrhythmia & palpitations"
  ];

  const generateMedicalPanel = async () => {
    if (!medicalCase.trim()) {
      setError("Please describe the medical case or symptoms");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await api.generateMedicalPanel({ medicalCase }, token);
      const matched = result.doctors || [];
      if (!matched.length) throw new Error("No specialists found for this case");
      setPanelDoctors(matched);
      setSelectedDoctors(new Set(matched.map((doctor) => doctor.id)));
      setShowPanel(true);
    } catch (err) {
      setError(err.message || "Failed to generate medical panel");
    } finally {
      setLoading(false);
    }
  };

  const toggleDoctorSelection = (id) => {
    const newSelected = new Set(selectedDoctors);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDoctors(newSelected);
  };

  const startMedicalSession = () => {
    if (selectedDoctors.size < 2) {
      setError("Select at least 2 doctors for discussion");
      return;
    }

    const selected = panelDoctors.filter((doctor) => selectedDoctors.has(doctor.id));
    onSelectDoctors(selected, medicalCase, "medical-consulting");
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="w-8 h-8 text-green-600 dark:text-green-400" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Medical Consulting
            </h1>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Consult with multiple doctors and medical specialists for collaborative diagnosis
            discussions and expert medical opinions on complex health cases.
          </p>
        </div>

        {/* Case Input Section */}
        <div className="space-y-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Medical Case / Symptoms
            </span>
            <textarea
              value={medicalCase}
              onChange={(e) => setMedicalCase(e.target.value)}
              placeholder="Describe the patient's symptoms, medical history, and any relevant test results..."
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-24 resize-none"
            />
          </label>

          {/* Case Examples */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Example Cases:
            </p>
            <div className="flex flex-wrap gap-2">
              {caseExamples.map((example) => (
                <button
                  key={example}
                  onClick={() => setMedicalCase(example)}
                  className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateMedicalPanel}
            disabled={loading || !medicalCase.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Assembling Medical Panel...
              </>
            ) : (
              "Generate Medical Panel"
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

        {/* Medical Panel Results */}
        {showPanel && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
                Medical Specialists ({selectedDoctors.size})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {panelDoctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => toggleDoctorSelection(doctor.id)}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                      selectedDoctors.has(doctor.id)
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {doctor.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {doctor.role}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                        {doctor.expertise}
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded">
                          Logic: {doctor.stats?.logic || 0}
                        </span>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded">
                          Domain: {doctor.domain}
                        </span>
                      </div>
                    </div>
                    {selectedDoctors.has(doctor.id) && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
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
                onClick={startMedicalSession}
                disabled={selectedDoctors.size < 2}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Start Medical Consultation ({selectedDoctors.size} selected)
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
