import { Card, CardHeader, CardContent } from "./ui/Card";

// LiveAnalytics shows score trend and live quality metrics during debate.
function LiveAnalytics({
  heatmapData,
  playerScore,
  opponentScore,
  lastVerdict,
  currentRound,
  totalRounds
}) {
  const roundLabels = ["R1", "R2", "R3", "R4", "R5", "R6"];
  const playerRoundScores = heatmapData[0] || [65, 72, 58, 85, 90, 78];
  const opponentRoundScores = heatmapData[1] || [55, 68, 75, 60, 45, 82];
  const maxScore = Math.max(...playerRoundScores, ...opponentRoundScores, 1);
  return <div className="space-y-6">
      {lastVerdict ? (
        <Card>
          <CardHeader title="Last Verdict" className="pb-2" />
          <CardContent>
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">
              <span>Round {currentRound || 1}</span>
              <span>{totalRounds ? `${currentRound || 1}/${totalRounds}` : "Infinite"}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Winner</span>
              <span className="text-sm font-mono text-slate-900 dark:text-white">
                {String(lastVerdict.winner || "tie").toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              {lastVerdict.reasoning || "No reasoning provided."}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 p-2">
                Player: {Math.round((lastVerdict.probabilities?.player || 0) * 100)}%
              </div>
              <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 p-2">
                Opponent: {Math.round((lastVerdict.probabilities?.opponent || 0) * 100)}%
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {
    /* Scoreboard */
  }
      <Card>
        <CardHeader title="Moderator Scoreboard" className="pb-2" />
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">YOU</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">OPPONENT</span>
          </div>
          <div className="relative h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
            <div
    className="absolute left-0 top-0 bottom-0 bg-slate-800 transition-all duration-500"
    style={{
      width: `${playerScore + opponentScore > 0 ? playerScore / (playerScore + opponentScore) * 100 : 50}%`
    }}
  >
            </div>
          </div>
          <div className="flex justify-between text-2xl font-mono font-bold">
            <span className="text-slate-900 dark:text-white">{playerScore}</span>
            <span className="text-slate-400 dark:text-slate-500">{opponentScore}</span>
          </div>
        </CardContent>
      </Card>

      {
    /* Logic Score Bar Chart (replaces heatmap) */
  }
      <Card>
        <CardHeader title="Logic Score by Round" className="pb-2" />
        <CardContent>
          <div className="space-y-3">
            {roundLabels.map((label, i) => {
    const pScore = playerRoundScores[i] || 0;
    const oScore = opponentRoundScores[i] || 0;
    return <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-6">
                      {label}
                    </span>
                    <div className="flex gap-3 text-[10px] font-mono">
                      <span className="text-slate-700 dark:text-slate-200">{pScore}</span>
                      <span className="text-slate-400 dark:text-slate-500">{oScore}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-3">
                    <div
      className="bg-slate-700 rounded-sm transition-all duration-500"
      style={{
        width: `${pScore / maxScore * 100}%`
      }}
      title={`You: ${pScore}`}
    >
                    </div>
                    <div
      className="bg-slate-300 rounded-sm transition-all duration-500"
      style={{
        width: `${oScore / maxScore * 100}%`
      }}
      title={`Opponent: ${oScore}`}
    >
                    </div>
                  </div>
                </div>;
  })}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-[10px] font-mono text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 bg-slate-700 rounded-sm" />
              <span>You</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 bg-slate-300 rounded-sm" />
              <span>Opponent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {
    /* Real-time Stats */
  }
      <Card>
        <CardHeader title="Live Metrics" className="pb-2" />
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300">Argument Coherence</span>
                <span className="font-mono font-bold dark:text-white">92%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[92%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300">Fallacy Detection</span>
                <span className="font-mono font-bold dark:text-white">12%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 w-[12%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300">Audience Engagement</span>
                <span className="font-mono font-bold dark:text-white">8.4k</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 w-[75%]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>;
}
export {
  LiveAnalytics
};
