"use client";

import { useState } from "react";
import type { VocabSessionItem } from "@/lib/content";

interface Props {
  item: VocabSessionItem;
  onResult: (correct: boolean) => void;
}

export function McqExercise({ item, onResult }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const options = item.options ?? [item.translationEn];
  const letters = ["A", "B", "C", "D"];

  function choose(option: string) {
    if (selected) return;
    setSelected(option);
    const correct = option === item.translationEn;
    window.setTimeout(() => onResult(correct), 550);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-6 py-8 text-center shadow-inner">
        <p className="text-sm text-neutral-400">What does this mean?</p>
        <p className="mt-3 text-4xl font-bold text-neutral-50">{item.lemma}</p>
        {item.exampleDe && <p className="mt-3 text-sm italic text-neutral-500">{item.exampleDe}</p>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((option, i) => {
          const isSelected = selected === option;
          const isCorrect = option === item.translationEn;
          const showState = selected !== null;
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              disabled={selected !== null}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-neutral-100 transition active:scale-[0.98] ${
                showState && isCorrect
                  ? "border-green-500 bg-green-500/10"
                  : showState && isSelected
                    ? "border-red-500 bg-red-500/10 animate-shake-x"
                    : "border-neutral-700 bg-neutral-900 hover:border-blue-500 hover:bg-neutral-800"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  showState && isCorrect
                    ? "bg-green-500 text-white"
                    : showState && isSelected
                      ? "bg-red-500 text-white"
                      : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {showState && isCorrect ? "✓" : showState && isSelected ? "✗" : letters[i]}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
