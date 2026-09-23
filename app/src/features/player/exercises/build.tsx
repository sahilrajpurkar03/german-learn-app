"use client";

import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { RotateCcw } from "lucide-react";
import { playEffect } from "../feedback-fx";
import { Prompt, SpeakButton, type ExerciseProps } from "./shared";

/** Tap word tiles to build the sentence. Tiles fly between the bank and the answer line. */
export function BuildExercise({ step, disabled, onReady, onSpeaking }: ExerciseProps) {
  const tiles = step.tiles ?? [];
  const [chosen, setChosen] = useState<number[]>([]);

  function update(next: number[]) {
    setChosen(next);
    onReady(next.length ? next.map((index) => tiles[index]).join(" ") : null);
  }

  return (
    <div className="flex flex-col gap-6">
      {!step.speaker && <Prompt>{step.prompt}</Prompt>}
      {!step.speaker && step.text && (
        <div className="flex items-center gap-3">
          {step.audio && <SpeakButton text={step.audio} onSpeaking={onSpeaking} label="Hear the German sentence" />}
          <p className="text-xl text-ink">{step.text}</p>
        </div>
      )}
      <div aria-label="Your sentence" className="flex min-h-[4.5rem] flex-wrap content-start items-start gap-2 border-b-2 border-line pb-3">
        <AnimatePresence>
          {chosen.length === 0 && <m.span key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-2 text-ink-soft">Tap the words in order</m.span>}
          {chosen.map((index) => (
            <m.button layout layoutId={`tile-${step.id}-${index}`} key={index} type="button" disabled={disabled} lang="de"
              onClick={() => { playEffect("tap"); update(chosen.filter((entry) => entry !== index)); }}
              className="min-h-12 rounded-xl border-2 border-line bg-surface px-3.5 text-lg font-medium shadow-[0_3px_0_var(--v2-line)]">
              {tiles[index]}
            </m.button>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex flex-wrap justify-center gap-2" aria-label="Word bank">
        {tiles.map((tile, index) => (
          <div key={index} className="relative min-h-12 rounded-xl bg-surface-2">
            <span className="invisible block px-3.5 py-2.5 text-lg font-medium" aria-hidden="true">{tile}</span>
            {!chosen.includes(index) && (
              <m.button layout layoutId={`tile-${step.id}-${index}`} type="button" disabled={disabled} lang="de"
                onClick={() => { playEffect("tap"); update([...chosen, index]); }}
                className="absolute inset-0 rounded-xl border-2 border-line bg-surface text-lg font-medium shadow-[0_3px_0_var(--v2-line)] hover:bg-surface-2">
                {tile}
              </m.button>
            )}
          </div>
        ))}
      </div>
      {chosen.length > 0 && !disabled && (
        <button type="button" onClick={() => update([])} className="mx-auto inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-brand"><RotateCcw size={15} aria-hidden="true" />Start over</button>
      )}
    </div>
  );
}
