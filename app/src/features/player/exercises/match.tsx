"use client";

import { useMemo, useState } from "react";
import { m } from "motion/react";
import { seededShuffle } from "@/lib/course/random";
import { playGerman } from "../audio";
import { playEffect } from "../feedback-fx";
import { Prompt, type ExerciseProps } from "./shared";

/** Tap a German word, then its meaning. Wrong pairs shake; the step completes itself when every pair is found. */
export function MatchExercise({ step, disabled, onSubmit }: ExerciseProps) {
  const pairs = useMemo(() => step.pairs ?? [], [step.pairs]);
  const left = useMemo(() => seededShuffle(pairs.map(([de]) => de), `${step.id}:l`), [pairs, step.id]);
  const right = useMemo(() => seededShuffle(pairs.map(([, en]) => en), `${step.id}:r`), [pairs, step.id]);
  const [picked, setPicked] = useState<{ side: "de" | "en"; value: string } | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<[string, string][]>([]);
  const [shake, setShake] = useState<string | null>(null);

  function tap(side: "de" | "en", value: string) {
    if (disabled || matched.includes(value)) return;
    if (side === "de") playGerman(value);
    if (!picked || picked.side === side) { setPicked({ side, value }); playEffect("tap"); return; }
    const de = side === "de" ? value : picked.value;
    const en = side === "en" ? value : picked.value;
    const nextAttempts: [string, string][] = [...attempts, [de, en]];
    setAttempts(nextAttempts);
    setPicked(null);
    if (pairs.some(([a, b]) => a === de && b === en)) {
      const nextMatched = [...matched, de, en];
      setMatched(nextMatched);
      playEffect("correct");
      if (nextMatched.length === pairs.length * 2) setTimeout(() => onSubmit(JSON.stringify(nextAttempts)), 350);
    } else {
      setShake(`${de}|${en}`);
      playEffect("wrong");
      setTimeout(() => setShake(null), 450);
    }
  }

  const tile = (side: "de" | "en", value: string) => {
    const done = matched.includes(value);
    const active = picked?.value === value && picked.side === side;
    const shaking = shake?.split("|").includes(value);
    return (
      <m.button key={`${side}-${value}`} type="button" disabled={disabled || done} onClick={() => tap(side, value)} lang={side === "de" ? "de" : undefined}
        animate={shaking ? { x: [0, -8, 8, -5, 5, 0] } : done ? { scale: [1, 1.06, 1], opacity: 0.45 } : { x: 0, opacity: 1 }} transition={{ duration: 0.4 }}
        className={`min-h-14 rounded-2xl border-2 px-3 py-2 text-base font-medium transition-colors sm:text-lg
          ${done ? "border-success bg-success-soft text-success" : active ? "border-brand bg-brand-soft shadow-[0_3px_0_var(--v2-brand)]" : shaking ? "border-danger bg-danger-soft" : "border-line bg-surface shadow-[0_3px_0_var(--v2-line)] hover:bg-surface-2"}`}>
        {value}
      </m.button>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Prompt>{step.prompt}</Prompt>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-3" aria-label="German">{left.map((value) => tile("de", value))}</div>
        <div className="grid gap-3" aria-label="English">{right.map((value) => tile("en", value))}</div>
      </div>
    </div>
  );
}
