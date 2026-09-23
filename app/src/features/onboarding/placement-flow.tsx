"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { X } from "lucide-react";
import { ASSESSMENT_BANK } from "@/lib/learning-content";
import { SKILL_NAMES, nextAssessmentItem, type AssessmentAnswer } from "@/lib/learning-engine";
import { savePlacement } from "@/lib/learning/actions";
import { Button, ButtonLink } from "@/ui/button";
import { ProgressBar } from "@/ui/progress";
import { SpeakButton } from "@/features/player/exercises/shared";
import { celebrate } from "@/features/player/feedback-fx";

type Result = Awaited<ReturnType<typeof savePlacement>>;

/** Adaptive level check: 16 questions across four skills. No feedback during the check, so nobody feels tested. */
export function PlacementFlow() {
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const item = nextAssessmentItem(ASSESSMENT_BANK, answers);

  function answer(given: string, skipped = false) {
    if (!item) return;
    const next = [...answers, { id: item.id, value: given, skipped }];
    setAnswers(next);
    setValue("");
    if (!nextAssessmentItem(ASSESSMENT_BANK, next)) submit(next);
  }

  function submit(all: AssessmentAnswer[]) {
    setError(null);
    startTransition(async () => {
      try {
        const saved = await savePlacement(all);
        setResult(saved);
        void celebrate("lesson");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Your result could not be saved.");
      }
    });
  }

  if (result) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center gap-5 px-5 pb-8 pt-12 text-center">
        <m.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid h-24 w-24 place-items-center rounded-[2rem] bg-gold-soft text-5xl" aria-hidden="true">🧭</m.span>
        <h1 className="font-display text-3xl font-semibold">You&apos;ll start at Unit {result.startUnit}</h1>
        <p className="text-ink-soft">Estimated level: <strong className="text-ink">{result.band.toUpperCase()}</strong>. Earlier units stay open — dip back any time or take their checkpoints.</p>
        <ul className="w-full space-y-3 text-left">
          {result.skills.map((skill) => (
            <li key={skill.skill}>
              <div className="mb-1 flex justify-between text-sm font-semibold"><span>{SKILL_NAMES[skill.skill]}</span><span className="tabular">{skill.accuracy ?? 0}%</span></div>
              <ProgressBar value={skill.accuracy ?? 0} max={100} label={`${SKILL_NAMES[skill.skill]}: ${skill.accuracy ?? 0}%`} tone="gold" />
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-soft">A practice starting point, not an official certificate.</p>
        <div className="mt-auto w-full"><ButtonLink href="/today" size="lg">Start learning</ButtonLink></div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-8 pt-[max(env(safe-area-inset-top),1rem)]">
      <div className="flex items-center gap-3">
        <Link href="/today" aria-label="Leave the level check" className="grid h-10 w-10 place-items-center rounded-xl text-ink-soft hover:bg-surface-2"><X size={22} aria-hidden="true" /></Link>
        <ProgressBar value={answers.length} max={16} label={`Question ${Math.min(answers.length + 1, 16)} of 16`} />
      </div>
      <AnimatePresence mode="wait">
        {item && (
          <m.form key={item.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="mt-8 flex flex-1 flex-col gap-5"
            onSubmit={(event) => { event.preventDefault(); if (value.trim()) answer(value); }}>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{SKILL_NAMES[item.skill]}</p>
            <h1 className="font-display text-2xl font-semibold">{item.prompt}</h1>
            {item.audio && <div className="flex justify-center"><SpeakButton text={item.audio} autoPlay size="lg" /></div>}
            {item.context && <p lang="de" className="rounded-2xl bg-surface p-4 text-xl shadow-[var(--shadow-card)]">{item.context}</p>}
            {item.options ? (
              <div className="grid gap-3">
                {item.options.map((option) => (
                  <button key={option} type="button" disabled={pending} onClick={() => answer(option)} className="min-h-14 rounded-2xl border-2 border-line bg-surface px-4 text-left text-lg font-medium shadow-[0_3px_0_var(--v2-line)] hover:bg-surface-2">{option}</button>
                ))}
              </div>
            ) : (
              <>
                <input lang="de" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Type in German…" autoFocus
                  className="min-h-14 rounded-2xl border-2 border-line bg-surface px-4 text-xl outline-none focus:border-brand" />
                <Button type="submit" size="lg" disabled={!value.trim() || pending}>Next</Button>
              </>
            )}
            <button type="button" disabled={pending} onClick={() => answer("", true)} className="mt-auto text-sm font-semibold text-ink-soft hover:text-brand">I don&apos;t know yet — skip</button>
          </m.form>
        )}
      </AnimatePresence>
      {pending && <p role="status" className="mt-6 text-center text-ink-soft">Working out your starting point…</p>}
      {error && (
        <div role="alert" className="mt-6 text-center">
          <p className="text-danger">{error}</p>
          <Button className="mt-3" variant="secondary" onClick={() => submit(answers)}>Try again</Button>
        </div>
      )}
    </main>
  );
}
