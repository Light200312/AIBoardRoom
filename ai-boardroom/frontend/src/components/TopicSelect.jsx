import { useState } from "react";
import { ArrowRight, ChevronLeft, PenLine, Info, Check } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { TOPICS, DEBATE_TEMPERATURES, FANTASY_TOPICS } from "../data/mockData";
import { useAppStore } from "../store/useAppStore";

const FEATURE_TOPIC_CONFIG = {
  "learn-law": {
    title: "Learn Indian Laws",
    subtitle: "Choose an important law or enter any other legal topic to learn with a panel of lawmakers.",
    customLabel: "Custom Law / Legal Topic",
    customPlaceholder: "e.g. Fundamental Rights, Article 21, Consumer Protection Act, IPC basics...",
    presetLabel: "Important Laws",
    presets: [
      "Fundamental Rights",
      "Directive Principles of State Policy",
      "Right to Information Act",
      "Consumer Protection Act",
      "Indian Penal Code Basics",
      "Property Transfer Laws",
      "Family Law & Marriage",
      "Emergency Provisions"
    ]
  },
  "interview-simulator": {
    title: "Interview Simulator",
    subtitle: "Pick an interview scenario or enter a custom focus before assembling your panel.",
    customLabel: "Custom Interview Scenario",
    customPlaceholder: "e.g. Product manager interview, ML engineer round, startup founder pitch...",
    presetLabel: "Interview Scenarios",
    presets: [
      "Technical DSA Interview",
      "System Design Interview",
      "Behavioral Round",
      "Startup Pitch",
      "Case Study Interview",
      "Management Group Discussion"
    ]
  },
  "medical-consulting": {
    title: "Medical Consulting",
    subtitle: "Choose a common case or describe any symptoms before selecting the specialist panel.",
    customLabel: "Custom Medical Case",
    customPlaceholder: "e.g. Persistent chest pain with shortness of breath and fatigue...",
    presetLabel: "Common Medical Cases",
    presets: [
      "Persistent chest pain & shortness of breath",
      "Neurological symptoms - headaches & dizziness",
      "Respiratory infection with high fever",
      "Gastrointestinal issues & weight loss",
      "Mental health - anxiety & sleep disorders",
      "Cardiac arrhythmia & palpitations"
    ]
  }
};

// TopicSelect configures debate temperature and topic before member selection.
function TopicSelect({ onSelectTopic, onBack }) {
  const mode = useAppStore((s) => s.gameState.mode);
  const [customTopic, setCustomTopic] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedTemp, setSelectedTemp] = useState(
    null
  );
  const [expandedInfo, setExpandedInfo] = useState(
    null
  );
  const featureConfig = FEATURE_TOPIC_CONFIG[mode];
  const isFeatureMode = Boolean(featureConfig);
  const topicOptions = featureConfig?.presets || (mode === "fantasy" ? FANTASY_TOPICS : TOPICS);
  const activeTopic = selectedTopic || (customTopic.trim() ? customTopic.trim() : null);
  const canContinue = activeTopic && (isFeatureMode || selectedTemp);
  // Continue only when both a topic and temperature are selected.
  const handleContinue = () => {
    if (activeTopic && (isFeatureMode || selectedTemp)) {
      onSelectTopic(activeTopic, isFeatureMode ? null : selectedTemp);
    }
  };
  return <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-8 text-slate-900 dark:text-slate-100">
      <div className="max-w-3xl mx-auto">
        <Button
    variant="tertiary"
    leftIcon={<ChevronLeft className="w-4 h-4" />}
    onClick={onBack}
    className="mb-8"
  >

          Back to Modes
        </Button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {featureConfig?.title || (mode === "fantasy" ? "Configure Your Fantasy Session" : "Configure Your Debate")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-mono">
            {featureConfig?.subtitle || "Set the topic and temperature before entering the council"}
          </p>
        </div>

        {
    /* ── STEP 1: Debate Temperature ── */
  }
        {!isFeatureMode && <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold font-mono flex items-center justify-center">
              1
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Debate Temperature
            </h2>
            {selectedTemp && <span className="ml-auto text-xs font-mono text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Selected
              </span>}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {DEBATE_TEMPERATURES.map((temp) => {
    const isSelected = selectedTemp === temp.id;
    const isInfoOpen = expandedInfo === temp.id;
    return <div key={temp.id} className="flex flex-col gap-1">
                  <button
      onClick={() => {
        setSelectedTemp(temp.id);
        setExpandedInfo(null);
      }}
      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center ${isSelected ? "border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500"}`}
    >

                    <span className="text-xl">{temp.emoji}</span>
                    <span className="text-[10px] font-bold leading-tight">
                      {temp.label}
                    </span>
                  </button>
                  <button
      onClick={(e) => {
        e.stopPropagation();
        setExpandedInfo(isInfoOpen ? null : temp.id);
      }}
      className="flex items-center justify-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-mono py-0.5"
    >

                    <Info className="w-3 h-3" />
                    info
                  </button>
                </div>;
  })}
          </div>

          {
    /* Info Popover */
  }
          {expandedInfo && (() => {
    const t = DEBATE_TEMPERATURES.find((t2) => t2.id === expandedInfo);
    return <div className="mt-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-sm space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-normal font-mono">
                      - {t.tagline}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="font-mono text-slate-400 dark:text-slate-500 uppercase block mb-0.5">
                        Goal
                      </span>
                      <span className="text-slate-700 dark:text-slate-200">{t.goal}</span>
                    </div>
                    <div>
                      <span className="font-mono text-slate-400 dark:text-slate-500 uppercase block mb-0.5">
                        Tone
                      </span>
                      <span className="text-slate-700 dark:text-slate-200">{t.tone}</span>
                    </div>
                    <div>
                      <span className="font-mono text-slate-400 dark:text-slate-500 uppercase block mb-0.5">
                        Focus
                      </span>
                      <span className="text-slate-700 dark:text-slate-200">{t.focus}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-mono border-t border-slate-100 dark:border-slate-700 pt-2">
                    e.g. {t.example}
                  </div>
                </div>;
  })()}
        </div>}

        {
    /* ── STEP 2: Topic ── */
  }
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold font-mono flex items-center justify-center">
              {isFeatureMode ? 1 : 2}
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {featureConfig?.presetLabel || (mode === "fantasy" ? "Universe / Series" : "Debate Topic")}
            </h2>
            {activeTopic && <span className="ml-auto text-xs font-mono text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Selected
              </span>}
          </div>

          {
    /* Custom Topic Input */
  }
          <div
    className={`bg-white dark:bg-slate-800 p-5 rounded-xl border-2 border-dashed mb-6 transition-colors ${customTopic.trim() && !selectedTopic ? "border-slate-900 dark:border-slate-100" : "border-slate-300 dark:border-slate-700"}`}
  >

            <div className="flex items-center gap-2 mb-3">
              <PenLine className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                {featureConfig?.customLabel || "Custom Topic"}
              </span>
            </div>
            <Input
    placeholder={featureConfig?.customPlaceholder || (mode === "fantasy" ? "e.g. The Stormlight Archive" : "e.g. Is consciousness computable?")}
    value={customTopic}
	    onChange={(e) => {
	      setCustomTopic(e.target.value);
	      if (e.target.value.trim()) setSelectedTopic(null);
	    }}
	    onKeyDown={(e) => {
	      if (e.key === "Enter" && customTopic.trim() && (isFeatureMode || selectedTemp))
	        handleContinue();
	    }}
	  />

          </div>

          {
    /* Divider */
  }
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {featureConfig ? `Or choose from ${featureConfig.presetLabel.toLowerCase()}` : mode === "fantasy" ? "Or choose a universe" : "Or choose a preset"}
            </span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {
    /* Preset Topics */
  }
          <div className="space-y-3">
            {topicOptions.map((topic, idx) => {
    const isSelected = selectedTopic === topic;
    return <button
      key={idx}
      onClick={() => {
        setSelectedTopic(isSelected ? null : topic);
        setCustomTopic("");
      }}
      className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left ${isSelected ? "border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-500"}`}
    >

                  <div className="flex items-center gap-4">
                    <span
      className={`w-8 h-8 rounded-md flex items-center justify-center font-mono font-bold text-sm flex-shrink-0 ${isSelected ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"}`}
    >

                      {idx + 1}
                    </span>
                    <span className="font-medium">{topic}</span>
                  </div>
                  {isSelected ? <Check className="w-4 h-4 flex-shrink-0" /> : <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-500 flex-shrink-0" />}
                </button>;
  })}
          </div>
        </div>

        {
    /* ── Continue CTA ── */
  }
        <div
    className={`sticky bottom-6 transition-all ${canContinue ? "opacity-100" : "opacity-50 pointer-events-none"}`}
  >

	          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-md flex items-center justify-between">
	            <div className="text-sm text-slate-600 dark:text-slate-300">
	              {(isFeatureMode ? activeTopic : selectedTemp && activeTopic) ? <span className="font-mono">
	                    {!isFeatureMode ? (
		                  <span className="font-bold text-slate-900 dark:text-white">
		                    {DEBATE_TEMPERATURES.find((t) => t.id === selectedTemp)?.emoji}{" "}
		                    {DEBATE_TEMPERATURES.find((t) => t.id === selectedTemp)?.label}
		                  </span>
	                    ) : null}
	                    {!isFeatureMode ? <>·{" "}</> : null}
		                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs inline-block align-bottom">
	                    {activeTopic}
	                  </span>
	                </span> : <span className="text-slate-400 dark:text-slate-500 font-mono">
	                  {isFeatureMode
                      ? "Select or enter a topic to continue"
                      : !selectedTemp && !activeTopic
                        ? "Select temperature and topic to continue"
                        : !selectedTemp
                          ? "Select a temperature to continue"
                          : "Select a topic to continue"}
	                </span>}
	            </div>
            <Button
    size="medium"
    disabled={!canContinue}
    rightIcon={<ArrowRight className="w-4 h-4" />}
    onClick={handleContinue}
  >

	              Select Members
	            </Button>
          </div>
        </div>
      </div>
    </div>;
}
export {
  TopicSelect
};
