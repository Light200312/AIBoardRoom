import { useEffect, useMemo, useState } from "react";
import { Download, FileText, X } from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "./ui/Button";

const ARGUMENT_SIGNAL_WORDS = [
  "should",
  "must",
  "because",
  "therefore",
  "evidence",
  "reason",
  "argue",
  "claim",
  "supports",
  "demonstrates",
];

const COUNTER_SIGNAL_WORDS = [
  "however",
  "but",
  "although",
  "counter",
  "disagree",
  "challenge",
  "rebut",
  "oppose",
  "critic",
  "concern",
];

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "Unknown time";
  return new Date(timestamp).toLocaleString();
}

function scoreMessage(text = "", critiqueTags = []) {
  const normalized = normalizeText(text).toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  const argumentScore =
    ARGUMENT_SIGNAL_WORDS.reduce((score, term) => score + (normalized.includes(term) ? 2 : 0), 0) +
    Math.min(words.length, 40) / 8 +
    critiqueTags.length;
  const counterScore =
    COUNTER_SIGNAL_WORDS.reduce((score, term) => score + (normalized.includes(term) ? 2 : 0), 0) +
    critiqueTags.reduce(
      (score, tag) =>
        score +
        (/rebut|fallacy|weak|critic|counter/i.test(`${tag.type || ""} ${tag.label || ""}`) ? 3 : 0),
      0
    );

  return { argumentScore, counterScore };
}

function summarizeMessage(text = "", maxLength = 220) {
  const normalized = normalizeText(text);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function buildDiscussionReport(messages = [], topic = "") {
  const candidateMessages = messages
    .filter((msg) => !msg.isUser && msg.speakerId !== "orchestrator" && normalizeText(msg.text))
    .map((msg) => {
      const text = normalizeText(msg.text);
      const scores = scoreMessage(text, msg.critiqueTags || []);
      return {
        id: msg.id,
        speaker: msg.speakerName || "Council Member",
        text,
        summary: summarizeMessage(text),
        rawTimestamp: Number(msg.timestamp || 0),
        timestamp: formatTimestamp(msg.timestamp),
        critiqueTags: msg.critiqueTags || [],
        ...scores,
      };
    });

  const mainArguments = [...candidateMessages]
    .sort((a, b) => b.argumentScore - a.argumentScore)
    .slice(0, 5);

  const counterArguments = [...candidateMessages]
    .filter((msg) => msg.counterScore > 0)
    .sort((a, b) => b.counterScore - a.counterScore)
    .slice(0, 5);

  const recentClosingRemarks = [...candidateMessages]
    .sort((a, b) => b.rawTimestamp - a.rawTimestamp)
    .slice(0, 3)
    .map((msg) => `${msg.speaker}: ${msg.summary}`);

  const conclusionDraft =
    recentClosingRemarks.length > 0
      ? `On "${topic}", the discussion converged around these closing ideas:\n\n${recentClosingRemarks.join(
          "\n\n"
        )}\n\nOverall, the council weighed the strongest supporting claims against their most serious objections before moving toward a balanced conclusion.`
      : `The council discussion on "${topic}" surfaced both supporting arguments and serious objections, leading to a measured concluding assessment.`;

  return {
    mainArguments,
    counterArguments,
    recentClosingRemarks,
    conclusionDraft,
  };
}

function ConcludeDebateModal({ isOpen, onClose, topic, messages, members }) {
  const report = useMemo(() => buildDiscussionReport(messages, topic), [messages, topic]);
  const [conclusion, setConclusion] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setConclusion(report.conclusionDraft);
  }, [isOpen, report.conclusionDraft]);

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 16;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      const ensureSpace = (needed = 10) => {
        if (y + needed <= pageHeight - 18) return;
        pdf.addPage();
        y = 20;
      };

      const writeWrapped = (text, { size = 11, style = "normal", indent = 0, color } = {}) => {
        const safeText = normalizeText(text) || " ";
        pdf.setFont("helvetica", style);
        pdf.setFontSize(size);
        if (color) {
          pdf.setTextColor(...color);
        } else {
          pdf.setTextColor(17, 24, 39);
        }
        const wrapped = pdf.splitTextToSize(safeText, contentWidth - indent);
        ensureSpace(wrapped.length * (size * 0.45) + 4);
        pdf.text(wrapped, margin + indent, y);
        y += wrapped.length * (size * 0.45) + 4;
      };

      const writeSectionTitle = (text) => {
        ensureSpace(14);
        pdf.setDrawColor(203, 213, 225);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 6;
        writeWrapped(text, { size: 14, style: "bold" });
      };

      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(margin, y - 6, contentWidth, 24, 3, 3, "F");
      writeWrapped("Council Debate Report", { size: 20, style: "bold" });
      writeWrapped(`Topic: ${topic || "Untitled discussion"}`, { size: 11 });
      writeWrapped(`Participants: ${members.map((member) => member.name).join(", ") || "Council members unavailable"}`, {
        size: 10,
        color: [71, 85, 105],
      });
      writeWrapped(`Generated: ${new Date().toLocaleString()}`, { size: 10, color: [71, 85, 105] });

      writeSectionTitle("Discussion Snapshot");
      writeWrapped(`Total messages reviewed: ${messages.length}`, { size: 11 });
      writeWrapped(
        `Main arguments identified: ${report.mainArguments.length}. Counter-arguments identified: ${report.counterArguments.length}.`,
        { size: 11 }
      );

      writeSectionTitle("Main Arguments");
      if (!report.mainArguments.length) {
        writeWrapped("No major argument blocks were detected from the current discussion.");
      } else {
        report.mainArguments.forEach((entry, index) => {
          writeWrapped(`${index + 1}. ${entry.speaker}`, { size: 11, style: "bold" });
          writeWrapped(entry.summary, { size: 10, indent: 4 });
          writeWrapped(`Spoken at ${entry.timestamp}`, { size: 9, indent: 4, color: [100, 116, 139] });
        });
      }

      writeSectionTitle("Counter-Arguments");
      if (!report.counterArguments.length) {
        writeWrapped("No explicit counter-arguments were detected from the current discussion.");
      } else {
        report.counterArguments.forEach((entry, index) => {
          writeWrapped(`${index + 1}. ${entry.speaker}`, { size: 11, style: "bold" });
          writeWrapped(entry.summary, { size: 10, indent: 4 });
          writeWrapped(`Spoken at ${entry.timestamp}`, { size: 9, indent: 4, color: [100, 116, 139] });
        });
      }

      writeSectionTitle("Concluding Statements");
      if (report.recentClosingRemarks.length) {
        report.recentClosingRemarks.forEach((remark) => {
          writeWrapped(remark, { size: 10 });
        });
      } else {
        writeWrapped("No distinct concluding remarks were found, so the final conclusion below summarizes the discussion.");
      }

      writeSectionTitle("Final Conclusion");
      writeWrapped(conclusion || report.conclusionDraft, { size: 11 });

      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text("Generated by AI Council", margin, pageHeight - 10);

      const safeTopic = (topic || "debate").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
      pdf.save(`conclude-debate-${safeTopic || "session"}.pdf`);
      onClose();
    } catch (error) {
      console.error("Failed to generate debate report PDF", error);
      window.alert("Could not generate the PDF report. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-700 dark:bg-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Mentor Report
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Conclude Debate</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Topic
            </p>
            <p className="mt-2 text-base text-slate-900 dark:text-slate-100">{topic}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Messages
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{messages.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Main Args
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{report.mainArguments.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Counters
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {report.counterArguments.length}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">
                Report Preview
              </h3>
            </div>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Main Arguments</p>
                <div className="mt-3 space-y-3">
                  {report.mainArguments.length ? (
                    report.mainArguments.map((entry) => (
                      <div key={entry.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{entry.speaker}</p>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">{entry.summary}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No main arguments identified yet.</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Counter-Arguments</p>
                <div className="mt-3 space-y-3">
                  {report.counterArguments.length ? (
                    report.counterArguments.map((entry) => (
                      <div key={entry.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{entry.speaker}</p>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">{entry.summary}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No counter-arguments identified yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900 dark:text-white">Concluding Statement</label>
            <textarea
              value={conclusion}
              onChange={(event) => setConclusion(event.target.value)}
              placeholder="Write the final conclusion for this debate report..."
              className="h-44 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-700"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This text is included in the PDF as the final conclusion and can be edited before download.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white px-6 py-5 dark:border-slate-700 dark:bg-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={generatePDF}
            loading={isGeneratingPDF}
            rightIcon={<Download className="h-4 w-4" />}
          >
            {isGeneratingPDF ? "Generating PDF..." : "Download Report PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { ConcludeDebateModal };
