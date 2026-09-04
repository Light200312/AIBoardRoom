import { useState } from "react";
import { Button } from "./ui/Button";

// CoinToss handles the pre-combat turn order decision overlay.
function CoinToss({ onComplete }) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState(null);
  // Animate flip, resolve random outcome, then hand control back to parent.
  const handleFlip = () => {
    setIsFlipping(true);
    setTimeout(() => {
      const outcome = Math.random() > 0.5 ? "heads" : "tails";
      setResult(outcome);
      setIsFlipping(false);
      setTimeout(() => {
        onComplete(outcome === "heads" ? "player" : "opponent");
      }, 1500);
    }, 2e3);
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl shadow-2xl text-center max-w-md w-full border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
          Opening Coin Toss
        </h2>

        <div className="relative h-40 w-40 mx-auto mb-8 perspective-1000">
          <div
    className={`w-full h-full rounded-full border-8 border-slate-200 dark:border-slate-600 flex items-center justify-center text-4xl font-bold text-slate-400 dark:text-slate-500 transition-all duration-500 ${isFlipping ? "animate-spin" : ""} ${result ? "bg-slate-100 dark:bg-slate-900 border-slate-900 dark:border-white text-slate-900 dark:text-white" : "bg-white dark:bg-slate-700"}`}
  >

            {isFlipping ? "..." : result ? result.toUpperCase() : "?"}
          </div>
        </div>

        {!result && !isFlipping && <Button size="large" onClick={handleFlip} className="w-full">
            Flip Coin
          </Button>}

        {result && <div className="animate-fade-in">
            <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              {result === "heads" ? "You won the toss!" : "Opponent goes first."}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Preparing arena...</p>
          </div>}
      </div>
    </div>;
}
export {
  CoinToss
};
