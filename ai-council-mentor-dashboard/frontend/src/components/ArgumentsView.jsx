import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * ArgumentsView Component
 * WHY: Display all arguments from both player and opponent sides side-by-side
 * HOW: Extract and organize combatLog into structured argument panels
 * RESULT: Clear visualization of debate arguments for all modes
 */
function ArgumentsView({ combatLog = [], playerTeam = [], opponentTeam = [], topic = "" }) {
  const [expandedRound, setExpandedRound] = useState(null);

  // Extract arguments by round
  const argumentsByRound = {};
  combatLog.forEach((entry) => {
    const round = entry.round || 1;
    if (!argumentsByRound[round]) {
      argumentsByRound[round] = { player: [], opponent: [] };
    }

    const arg = {
      speaker: entry.speakerName || (entry.isUser ? "Player" : "Opponent"),
      text: entry.text || "",
      timestamp: entry.timestamp,
    };

    if (entry.isUser || entry.speakerName === "Player") {
      argumentsByRound[round].player.push(arg);
    } else {
      argumentsByRound[round].opponent.push(arg);
    }
  });

  const rounds = Object.keys(argumentsByRound).sort((a, b) => Number(a) - Number(b));

  if (rounds.length === 0) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
        <p className="text-amber-700 dark:text-amber-200">No arguments recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Topic</h3>
        <p className="text-blue-800 dark:text-blue-200">{topic}</p>
      </div>

      {rounds.map((round) => {
        const roundNum = Number(round);
        const isExpanded = expandedRound === roundNum;
        const { player: playerArgs, opponent: opponentArgs } = argumentsByRound[round];

        return (
          <div key={round} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            {/* Round Header */}
            <button
              onClick={() => setExpandedRound(isExpanded ? null : roundNum)}
              className="w-full flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                Round {roundNum}
                <span className="ml-3 text-sm text-slate-600 dark:text-slate-400">
                  ({playerArgs.length} player, {opponentArgs.length} opponent)
                </span>
              </h4>
              <ChevronDown
                className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Round Content */}
            {isExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white dark:bg-slate-900">
                {/* Player Arguments */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h5 className="font-semibold text-green-700 dark:text-green-400 mb-3">
                    Player Arguments
                  </h5>
                  <div className="space-y-3">
                    {playerArgs.length > 0 ? (
                      playerArgs.map((arg, i) => (
                        <div key={i} className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                          <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-1">
                            {arg.speaker}
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{arg.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                        No arguments in this round
                      </p>
                    )}
                  </div>
                </div>

                {/* Opponent Arguments */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <h5 className="font-semibold text-orange-700 dark:text-orange-400 mb-3">
                    Opponent Arguments
                  </h5>
                  <div className="space-y-3">
                    {opponentArgs.length > 0 ? (
                      opponentArgs.map((arg, i) => (
                        <div key={i} className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
                          <p className="text-sm font-medium text-orange-900 dark:text-orange-200 mb-1">
                            {arg.speaker}
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{arg.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                        No arguments in this round
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ArgumentsView;
