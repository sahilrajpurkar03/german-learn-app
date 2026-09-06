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

  function choose(option: string) {
    if (selected) return;
    setSelected(option);
    const correct = option === item.translationEn;
    window.setTimeout(() => onResult(correct), 550);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-neutral-400">What does this mean?</p>
        <p className="mt-2 text-3xl font-semibold text-neutral-50">{item.lemma}</p>
        {item.exampleDe && <p className="mt-2 text-sm italic text-neutral-500">{item.exampleDe}</p>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selected === option;
          const isCorrect = option === item.translationEn;
          const showState = selected !== null;
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              disabled={selected !== null}
              className={`rounded-xl border px-4 py-3 text-left text-neutral-100 transition ${
                showState && isCorrect
                  ? "border-green-500 bg-green-500/10"
                  : showState && isSelected
                    ? "border-red-500 bg-red-500/10"
                    : "border-neutral-700 bg-neutral-900 hover:border-blue-500"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
