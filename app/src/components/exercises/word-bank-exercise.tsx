"use client";

import { useMemo, useState } from "react";

interface Props {
  targetText: string;
  hintEn?: string | null;
  onResult: (correct: boolean) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function WordBankExercise({ targetText, hintEn, onResult }: Props) {
  const words = useMemo(() => targetText.replace(/[.,!?]/g, "").split(" "), [targetText]);
  const [bank, setBank] = useState(() => shuffle(words).map((w, i) => ({ word: w, key: `${w}-${i}` })));
  const [chosen, setChosen] = useState<Array<{ word: string; key: string }>>([]);
  const [checked, setChecked] = useState<null | boolean>(null);

  function pick(entry: { word: string; key: string }) {
    if (checked !== null) return;
    setBank((b) => b.filter((e) => e.key !== entry.key));
    setChosen((c) => [...c, entry]);
  }

  function unpick(entry: { word: string; key: string }) {
    if (checked !== null) return;
    setChosen((c) => c.filter((e) => e.key !== entry.key));
    setBank((b) => [...b, entry]);
  }

  function check() {
    if (checked !== null || chosen.length !== words.length) return;
    const built = chosen.map((c) => c.word).join(" ");
    const correct = built.toLowerCase() === words.join(" ").toLowerCase();
    setChecked(correct);
    window.setTimeout(() => onResult(correct), 900);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-6 py-6 text-center shadow-inner">
        <p className="text-sm text-neutral-400">Build the German sentence</p>
        {hintEn && <p className="mt-2 text-xl font-medium text-neutral-100">{hintEn}</p>}
      </div>

      <div className="flex min-h-16 flex-wrap gap-2 rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-900/40 p-3">
        {chosen.length === 0 && (
          <span className="px-1 py-1.5 text-sm text-neutral-600">Tap words below in order...</span>
        )}
        {chosen.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => unpick(entry)}
            className="animate-pop-in rounded-lg bg-blue-600 px-3 py-1.5 text-white shadow shadow-blue-600/30 transition active:scale-95"
          >
            {entry.word}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {bank.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => pick(entry)}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-neutral-100 transition hover:border-blue-500 hover:bg-neutral-800 active:scale-95"
          >
            {entry.word}
          </button>
        ))}
      </div>

      {checked === false && (
        <p className="text-center text-sm text-red-400">Correct answer: {targetText}</p>
      )}

      <button
        type="button"
        onClick={check}
        disabled={checked !== null || chosen.length !== words.length}
        className="w-full rounded-xl bg-blue-600 px-3 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition active:scale-[0.98] hover:bg-blue-500 disabled:opacity-50 disabled:active:scale-100"
      >
        Check
      </button>
    </div>
  );
}
