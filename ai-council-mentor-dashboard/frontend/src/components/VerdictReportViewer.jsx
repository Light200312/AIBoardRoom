import React from "react";
import { CheckCircle, AlertCircle, BarChart3, Heart, Briefcase, Book, Clock, Sparkles } from "lucide-react";

/**
 * VerdictReportViewer Component
 * WHY: Display mode-specific verdict/report based on debate type
 * HOW: Render different report layouts based on verdict.type field
 * RESULT: Comprehensive, actionable reports tailored to each mode (combat, mentor, interview, medical, law, historical, fantasy)
 */
function VerdictReportViewer({ verdict, mode, topic }) {
  if (!verdict) {
    return (
      <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg text-center">
        <p className="text-slate-600 dark:text-slate-400">Awaiting verdict...</p>
      </div>
    );
  }

  // Route to appropriate renderer based on verdict type
  switch (verdict.type || "combat") {
    case "combat":
      return <CombatVerdictReport verdict={verdict} />;
    case "mentor":
      return <MentorVerdictReport verdict={verdict} />;
    case "interview":
      return <InterviewVerdictReport verdict={verdict} />;
    case "medical":
      return <MedicalVerdictReport verdict={verdict} />;
    case "law":
      return <LawVerdictReport verdict={verdict} />;
    case "historical":
      return <HistoricalVerdictReport verdict={verdict} />;
    case "fantasy":
      return <FantasyVerdictReport verdict={verdict} />;
    default:
      return <CombatVerdictReport verdict={verdict} />;
  }
}

// ─────────────────────────────────────────────────────────────
// COMBAT MODE REPORT
// ─────────────────────────────────────────────────────────────
function CombatVerdictReport({ verdict }) {
  const { winner, confidence, finalScore, summary, keyMoments, playerStrengths, playerWeaknesses, opponentStrengths, opponentWeaknesses, reasoning } = verdict;

  return (
    <div className="space-y-6">
      {/* Winner & Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg border-2 ${
          winner === "tie"
            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
            : winner === "player"
            ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
            : "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700"
        }`}>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Winner</p>
          <p className={`text-2xl font-bold ${
            winner === "tie"
              ? "text-blue-900 dark:text-blue-100"
              : winner === "player"
              ? "text-green-900 dark:text-green-100"
              : "text-orange-900 dark:text-orange-100"
          }`}>
            {winner === "tie" ? "TIE" : winner.toUpperCase()}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
            Confidence: {(confidence * 100).toFixed(0)}%
          </p>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Final Scores</p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-green-700 dark:text-green-400 font-medium">Player</span>
              <span className="text-green-900 dark:text-green-100 font-bold">{finalScore.player}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-orange-700 dark:text-orange-400 font-medium">Opponent</span>
              <span className="text-orange-900 dark:text-orange-100 font-bold">{finalScore.opponent}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Verdict Summary</h3>
        <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">{summary}</p>
      </div>

      {/* Key Moments */}
      {keyMoments?.length > 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Key Moments</h3>
          <ul className="space-y-2">
            {keyMoments.map((moment, i) => (
              <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>{moment}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">Player Strengths</h4>
          <ul className="space-y-2">
            {playerStrengths?.map((s, i) => (
              <li key={i} className="text-sm text-green-800 dark:text-green-200 flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-green-600" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3">Player Weaknesses</h4>
          <ul className="space-y-2">
            {playerWeaknesses?.map((w, i) => (
              <li key={i} className="text-sm text-red-800 dark:text-red-200 flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-red-600" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Reasoning */}
      {reasoning && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Judge's Reasoning</h3>
          <p className="text-slate-700 dark:text-slate-300 text-sm">{reasoning}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MENTOR MODE REPORT
// ─────────────────────────────────────────────────────────────
function MentorVerdictReport({ verdict }) {
  const { strengths, improvements, advices, conclusion, keyTakeaways } = verdict;

  return (
    <div className="space-y-6">
      {/* Conclusion */}
      {conclusion && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Mentor's Summary</h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">{conclusion}</p>
        </div>
      )}

      {/* Strengths */}
      {strengths?.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Strengths
          </h3>
          <ul className="space-y-2">
            {strengths.map((s, i) => (
              <li key={i} className="text-sm text-green-800 dark:text-green-200">✓ {s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Areas for Improvement */}
      {improvements?.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {improvements.map((i, idx) => (
              <li key={idx} className="text-sm text-yellow-800 dark:text-yellow-200">• {i}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actionable Advices */}
      {advices?.length > 0 && (
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">Actionable Advice</h3>
          <ol className="space-y-2">
            {advices.map((a, i) => (
              <li key={i} className="text-sm text-purple-800 dark:text-purple-200">
                <span className="font-medium">{i + 1}.</span> {a}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Key Takeaways */}
      {keyTakeaways?.length > 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Key Takeaways</h3>
          <ul className="space-y-2">
            {keyTakeaways.map((t, i) => (
              <li key={i} className="text-sm text-slate-700 dark:text-slate-300">⭐ {t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INTERVIEW MODE REPORT
// ─────────────────────────────────────────────────────────────
function InterviewVerdictReport({ verdict }) {
  const { strengths, flaws, technicalAdvice, communicationAdvice, confidenceLevel, nextSteps, overallAssessment } = verdict;

  const confidenceColor = {
    low: "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100",
    medium: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100",
    high: "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100",
  };

  return (
    <div className="space-y-6">
      {/* Overall Assessment */}
      {overallAssessment && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Overall Assessment</h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm">{overallAssessment}</p>
        </div>
      )}

      {/* Confidence Level */}
      <div className={`p-4 border rounded-lg ${confidenceColor[confidenceLevel]}`}>
        <p className="text-sm font-medium mb-1">Interview Readiness</p>
        <p className="text-lg font-bold capitalize">{confidenceLevel}</p>
      </div>

      {/* Strengths */}
      {strengths?.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">Strengths</h3>
          <ul className="space-y-2">
            {strengths.map((s, i) => (
              <li key={i} className="text-sm text-green-800 dark:text-green-200">✓ {s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Flaws to Fix */}
      {flaws?.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h3 className="font-semibold text-red-900 dark:text-red-100 mb-3">Flaws to Fix</h3>
          <ul className="space-y-2">
            {flaws.map((f, i) => (
              <li key={i} className="text-sm text-red-800 dark:text-red-200">⚠ {f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Technical Advice */}
      {technicalAdvice?.length > 0 && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3">Technical/Content Tips</h3>
          <ul className="space-y-2">
            {technicalAdvice.map((t, i) => (
              <li key={i} className="text-sm text-indigo-800 dark:text-indigo-200">{i + 1}. {t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Communication Advice */}
      {communicationAdvice?.length > 0 && (
        <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
          <h3 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-3">Communication Tips</h3>
          <ul className="space-y-2">
            {communicationAdvice.map((c, i) => (
              <li key={i} className="text-sm text-cyan-800 dark:text-cyan-200">{i + 1}. {c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {nextSteps?.length > 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Next Steps to Prepare</h3>
          <ol className="space-y-2">
            {nextSteps.map((step, i) => (
              <li key={i} className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded inline-block mr-2">{i + 1}</span> {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MEDICAL MODE REPORT
// ─────────────────────────────────────────────────────────────
function MedicalVerdictReport({ verdict }) {
  const {
    temporaryDiagnosis,
    urgentConcerns,
    immediateActions,
    doctorVisitUrgency,
    whenToSeeFully,
    recommendedSpecialists,
    preventiveMeasures,
    disclaimer,
  } = verdict;

  const urgencyColor = {
    low: "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100",
    medium: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100",
    high: "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100",
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
        <p className="text-red-800 dark:text-red-200 text-sm font-medium">
          ⚠️ {disclaimer}
        </p>
      </div>

      {/* Doctor Visit Urgency */}
      <div className={`p-4 border rounded-lg ${urgencyColor[doctorVisitUrgency]}`}>
        <p className="text-sm font-medium mb-1">Doctor Visit Urgency</p>
        <p className="text-lg font-bold capitalize">{doctorVisitUrgency}</p>
        {whenToSeeFully && <p className="text-xs mt-2">{whenToSeeFully}</p>}
      </div>

      {/* Temporary Diagnosis */}
      {temporaryDiagnosis && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Temporary Assessment</h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm">{temporaryDiagnosis}</p>
        </div>
      )}

      {/* Urgent Concerns */}
      {urgentConcerns?.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h3 className="font-semibold text-red-900 dark:text-red-100 mb-3">⚠️ Urgent Concerns</h3>
          <ul className="space-y-2">
            {urgentConcerns.map((c, i) => (
              <li key={i} className="text-sm text-red-800 dark:text-red-200">• {c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Immediate Actions */}
      {immediateActions?.length > 0 && (
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-3">🚑 Immediate First Aid Actions</h3>
          <ol className="space-y-2">
            {immediateActions.map((a, i) => (
              <li key={i} className="text-sm text-orange-800 dark:text-orange-200">
                <span className="font-bold">{i + 1}.</span> {a}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Recommended Specialists */}
      {recommendedSpecialists?.length > 0 && (
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">👨‍⚕️ Recommended Specialists</h3>
          <ul className="space-y-2">
            {recommendedSpecialists.map((s, i) => (
              <li key={i} className="text-sm text-purple-800 dark:text-purple-200">• {s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preventive Measures */}
      {preventiveMeasures?.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">💪 Preventive Measures</h3>
          <ul className="space-y-2">
            {preventiveMeasures.map((m, i) => (
              <li key={i} className="text-sm text-green-800 dark:text-green-200">✓ {m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LAW MODE REPORT
// ─────────────────────────────────────────────────────────────
function LawVerdictReport({ verdict }) {
  const { topic, legalAnalysis, argumentsFor, argumentsAgainst, relevantLaws, caseReferences, conclusions, recommendation, references } = verdict;

  return (
    <div className="space-y-6">
      {/* Legal Analysis */}
      {legalAnalysis && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Legal Analysis</h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">{legalAnalysis}</p>
        </div>
      )}

      {/* Arguments For & Against */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {argumentsFor?.length > 0 && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">Arguments Supporting</h3>
            <ul className="space-y-2">
              {argumentsFor.map((a, i) => (
                <li key={i} className="text-sm text-green-800 dark:text-green-200">✓ {a}</li>
              ))}
            </ul>
          </div>
        )}

        {argumentsAgainst?.length > 0 && (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-3">Counterarguments</h3>
            <ul className="space-y-2">
              {argumentsAgainst.map((a, i) => (
                <li key={i} className="text-sm text-orange-800 dark:text-orange-200">✗ {a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Relevant Laws */}
      {relevantLaws?.length > 0 && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3">⚖️ Applicable Laws & Articles</h3>
          <ul className="space-y-2">
            {relevantLaws.map((l, i) => (
              <li key={i} className="text-sm text-indigo-800 dark:text-indigo-200">📜 {l}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Case References */}
      {caseReferences?.length > 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Case Precedents</h3>
          <ul className="space-y-2">
            {caseReferences.map((c, i) => (
              <li key={i} className="text-sm text-slate-700 dark:text-slate-300">🔗 {c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Conclusions */}
      {conclusions && (
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Balanced Conclusion</h3>
          <p className="text-purple-800 dark:text-purple-200 text-sm leading-relaxed">{conclusions}</p>
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">✓ Recommendation</h3>
          <p className="text-green-800 dark:text-green-200 text-sm">{recommendation}</p>
        </div>
      )}

      {/* References */}
      {references?.length > 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">References & Citations</h3>
          <ul className="space-y-1">
            {references.map((r, i) => (
              <li key={i} className="text-xs text-slate-700 dark:text-slate-300">{i + 1}. {r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HISTORICAL MODE REPORT
// ─────────────────────────────────────────────────────────────
function HistoricalVerdictReport({ verdict }) {
  const { eventSummary, keyPerspectives, commonThemes, divergentViews, historicalContext, legacyAndImpact, conclusions } = verdict;

  return (
    <div className="space-y-6">
      {/* Event Summary */}
      {eventSummary && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Event Overview</h3>
          <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">{eventSummary}</p>
        </div>
      )}

      {/* Historical Context */}
      {historicalContext && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📜 Historical Context</h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">{historicalContext}</p>
        </div>
      )}

      {/* Key Perspectives */}
      {keyPerspectives?.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">👥 Key Historical Figures & Their Perspectives</h3>
          {keyPerspectives.map((p, i) => (
            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{p.figure}</p>
              {p.era && <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{p.era}</p>}
              <p className="text-sm text-slate-700 dark:text-slate-300">{p.view}</p>
            </div>
          ))}
        </div>
      )}

      {/* Common Themes */}
      {commonThemes?.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">🔗 Common Themes</h3>
          <ul className="space-y-2">
            {commonThemes.map((t, i) => (
              <li key={i} className="text-sm text-green-800 dark:text-green-200">• {t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Divergent Views */}
      {divergentViews?.length > 0 && (
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-3">⚡ Areas of Disagreement</h3>
          <ul className="space-y-2">
            {divergentViews.map((v, i) => (
              <li key={i} className="text-sm text-orange-800 dark:text-orange-200">• {v}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Legacy & Impact */}
      {legacyAndImpact && (
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">🌍 Legacy & Historical Impact</h3>
          <p className="text-purple-800 dark:text-purple-200 text-sm leading-relaxed">{legacyAndImpact}</p>
        </div>
      )}

      {/* Conclusions */}
      {conclusions && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">📝 Synthesis</h3>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{conclusions}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FANTASY MODE REPORT
// ─────────────────────────────────────────────────────────────
function FantasyVerdictReport({ verdict }) {
  const { topicOverview, characterAnalysis, worldbuildingContext, consensusAndConflict, loreImplications, synthesisReport } = verdict;

  return (
    <div className="space-y-6">
      {/* Topic Overview */}
      {topicOverview && (
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 rounded-lg">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">✨ Topic Overview</h3>
          <p className="text-purple-800 dark:text-purple-200 text-sm leading-relaxed">{topicOverview}</p>
        </div>
      )}

      {/* Worldbuilding Context */}
      {worldbuildingContext && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🌍 Worldbuilding Context</h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">{worldbuildingContext}</p>
        </div>
      )}

      {/* Character Analysis */}
      {characterAnalysis?.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">👤 Character Perspectives</h3>
          {characterAnalysis.map((c, i) => (
            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                <Sparkles className="w-4 h-4 mr-2" />
                {c.character}
              </p>
              {c.loreBackground && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 mb-2">{c.loreBackground}</p>
              )}
              <p className="text-sm text-slate-700 dark:text-slate-300">{c.perspective}</p>
            </div>
          ))}
        </div>
      )}

      {/* Consensus & Conflict */}
      {consensusAndConflict && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">⚔️ Character Accord & Discord</h3>
          <p className="text-indigo-800 dark:text-indigo-200 text-sm leading-relaxed">{consensusAndConflict}</p>
        </div>
      )}

      {/* Lore Implications */}
      {loreImplications && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">📖 Lore Implications</h3>
          <p className="text-green-800 dark:text-green-200 text-sm leading-relaxed">{loreImplications}</p>
        </div>
      )}

      {/* Synthesis Report */}
      {synthesisReport && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">📚 Comprehensive Synthesis</h3>
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{synthesisReport}</p>
        </div>
      )}
    </div>
  );
}

export default VerdictReportViewer;
