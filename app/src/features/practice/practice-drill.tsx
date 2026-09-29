"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Flame, Sparkles, Target, X } from "lucide-react";
import { checkAnswer, type CheckResult } from "@/lib/course/answer-check";
import { reviewSubject } from "@/lib/course/catalog";
import { applyGrade, gradeFor, type MemoryState } from "@/lib/course/memory";
import { masteryLabel, masteryPercent, pickPracticeKey } from "@/lib/course/practice";
import { flashcardStepFor, reviewStepFor, siblingExclusion } from "@/lib/course/review";
import { REVIEW_LESSON_ID, type Attempt } from "@/lib/course/progress";
import type { AnsweredResult } from "@/features/player/engine";
import { stopAudio } from "@/features/player/audio";
import { playEffect } from "@/features/player/feedback-fx";
import { enqueue, flush } from "@/features/player/outbox";
import { Exercise, FeedbackSheet } from "@/features/player/exercise-view";
import { ButtonLink } from "@/ui/button";

export type PracticeItem = { key: string; strength: number };

const now = () => new Date();

/** Open-ended flashcard/sentence drill: same questions and scoring as a review session, but it
 * never ends on its own — it keeps drawing from everything the learner has met, leaning toward
 * whatever is weakest, until they choose to stop. */
export function PracticeDrill({ kind, items, emptyHref, emptyLabel }: { kind: "vocabulary" | "sentence"; items: PracticeItem[]; emptyHref: string; emptyLabel: string }) {
  // The full local SRS state, not just strength — carrying it forward (rather than rebuilding a
  // fresh "never practised" state on every answer) is what lets repeated correct answers in the
  // same sitting actually raise a word's strength instead of it feeling stuck at "New" forever.
  const memory = useRef(new Map<string, MemoryState>(items.map((item) => {
    const at = now().toISOString();
    return [item.key, { key: item.key, ease: 2.5, intervalDays: 0, repetitions: item.strength > 0 ? 1 : 0, dueAt: at, strength: item.strength, lapses: 0, seen: 1, correct: 0, introducedAt: at, lastSeenAt: at }];
  })));
  const history = useRef<string[]>([]);
  const runId = useRef(crypto.randomUUID());
  const shownAt = useRef(0);
  const pool = items;

  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [currentStrength, setCurrentStrength] = useState(0);
  // Bumped on every draw so the Exercise remounts even when the same item (and so the same
  // step id) comes up twice in a row — otherwise its internal answer state goes stale and the
  // Check button never re-arms after the first question.
  const [round, setRound] = useState(0);
  const [step, setStep] = useState<ReturnType<typeof reviewStepFor> | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [result, setResult] = useState<AnsweredResult | null>(null);
  const [started, setStarted] = useState(false);
  const [stats, setStats] = useState({ answered: 0, correct: 0, streak: 0, best: 0 });

  // Mirrors the lesson Player: the impure clock read lives only in an effect, never mixed
  // into the same statement sequence as a state update.
  useEffect(() => {
    shownAt.current = performance.now();
  }, [step?.id]);

  function draw() {
    const candidates = pool.map((item) => ({ key: item.key, strength: memory.current.get(item.key)?.strength ?? item.strength }));
    const picked = pickPracticeKey(candidates, history.current);
    if (!picked) { setCurrentKey(null); setStep(null); return; }
    const subject = reviewSubject(picked.key);
    if (!subject) { setCurrentKey(null); setStep(null); return; }
    const build = kind === "vocabulary" ? flashcardStepFor : reviewStepFor;
    // Never offer a recently-seen item's real answer as a wrong option here — it's easy to
    // spot as "the other question's answer" rather than something that needs recognising.
    const exclude = siblingExclusion(subject, history.current);
    setCurrentKey(picked.key);
    setCurrentStrength(picked.strength);
    setStep(build(subject, { strength: picked.strength, seen: 1 }, exclude));
    setRound((current) => current + 1);
    setPending(null);
    setResult(null);
  }

  function start() {
    setStarted(true);
    history.current = [];
    draw();
  }

  // Impure: builds and queues an attempt for the server. Kept separate from submit()'s
  // state updates, the same split the lesson Player uses between submit() and record().
  function record(stepId: string, answer: string, stepIndex: number) {
    const attempt: Attempt = {
      attemptId: crypto.randomUUID(), runId: runId.current, lessonId: REVIEW_LESSON_ID, stepId, kind: "answer",
      answer: answer.slice(0, 500), responseMs: Math.min(3600000, Math.max(0, Math.round(performance.now() - shownAt.current))), occurredAt: now().toISOString(), stepIndex,
    };
    void enqueue([attempt]).then(() => flush());
  }

  function submit(answer: string) {
    if (!step || !currentKey) return;
    stopAudio();
    const outcome: CheckResult = checkAnswer(step, answer);
    setResult({ ...outcome, retry: false, answer });
    playEffect(outcome.verdict === "correct" ? "correct" : outcome.verdict === "close" ? "close" : outcome.verdict === "wrong" ? "wrong" : "tap");

    const grade = gradeFor(outcome.verdict, step.type, false);
    if (grade !== null) {
      const previous = memory.current.get(currentKey);
      memory.current.set(currentKey, applyGrade(previous, currentKey, grade, now()));
    }
    const good = outcome.verdict === "correct" || outcome.verdict === "close";
    setStats((current) => {
      const streak = good ? current.streak + 1 : 0;
      return { answered: current.answered + 1, correct: current.correct + (good ? 1 : 0), streak, best: Math.max(current.best, streak) };
    });

    record(step.id, answer, stats.answered);
  }

  function next() {
    stopAudio();
    // Keeps enough history for pickPracticeKey's recentWindow (up to 15) to actually hold back
    // a large chunk of a big pool, not just the last couple of items.
    if (currentKey) history.current = [...history.current.slice(-19), currentKey];
    draw();
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl bg-surface p-6 text-center shadow-[var(--shadow-card)]">
        <p className="text-4xl" aria-hidden="true">🌱</p>
        <p className="mt-2 font-semibold">Nothing to practise here yet</p>
        <p className="mt-1 text-sm text-ink-soft">{kind === "vocabulary" ? "Words and verbs appear here once a lesson has taught them to you." : "Phrases appear here once a lesson or conversation has taught them to you."}</p>
        <ButtonLink href={emptyHref} size="md" className="mt-4">{emptyLabel}</ButtonLink>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="rounded-3xl bg-surface p-6 text-center shadow-[var(--shadow-card)]">
        <p className="text-4xl" aria-hidden="true">{kind === "vocabulary" ? "🔤" : "📝"}</p>
        <p className="mt-2 font-display text-xl font-semibold">{kind === "vocabulary" ? "Vocabulary & verb drill" : "Sentence practice"}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
          {kind === "vocabulary" ? "Quick-fire questions on the words and verbs you've met, from every unit so far." : "Build and type the phrases you've met, from every unit so far."}
          {" "}As long as you like — no fixed number of questions. Words you know less well turn up more often.
        </p>
        <p className="mt-2 text-xs text-ink-soft">{items.length} {items.length === 1 ? "item" : "items"} in this drill</p>
        <button type="button" onClick={start} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand px-6 font-semibold text-on-brand shadow-[0_4px_0_var(--v2-brand-strong)] active:translate-y-1 active:shadow-none">
          <Sparkles size={18} aria-hidden="true" />Start practising
        </button>
      </div>
    );
  }

  if (!step || !currentKey) {
    return <p role="status" className="rounded-3xl bg-surface p-6 text-center text-ink-soft shadow-[var(--shadow-card)]">Nothing left to draw from right now — try again in a moment.</p>;
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={() => { stopAudio(); setStarted(false); }} aria-label="Stop practising" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-ink-soft hover:bg-surface-2 hover:text-ink"><X size={20} aria-hidden="true" /></button>
        <div className="flex flex-1 items-center gap-1.5" aria-label={`Memory: ${masteryLabel(currentStrength)}, ${masteryPercent(currentStrength)} percent`}>
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={`h-2 flex-1 rounded-full ${masteryPercent(currentStrength) >= (index + 1) * 20 ? (currentStrength >= 0.8 ? "bg-success" : "bg-gold") : "bg-surface-2"}`} />
          ))}
        </div>
        <span className="flex shrink-0 items-center gap-1 text-sm font-bold tabular text-ink-soft" title="Correct in a row"><Flame size={15} className={stats.streak >= 3 ? "text-gold" : ""} aria-hidden="true" />{stats.streak}</span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-bold tabular text-ink-soft" title="Answered this session"><Target size={15} aria-hidden="true" />{stats.answered}</span>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); if (!result && pending !== null) submit(pending); }}>
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={`${step.id}:${round}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.18 }}
            className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-card)]">
            <Exercise step={step} disabled={Boolean(result)} revealed={Boolean(result)} onReady={setPending} onSubmit={submit} />
          </m.div>
        </AnimatePresence>
        {!result && (
          <button type="submit" disabled={pending === null} className="mt-4 min-h-12 w-full rounded-2xl bg-brand px-6 font-semibold text-on-brand shadow-[0_4px_0_var(--v2-brand-strong)] active:translate-y-1 active:shadow-none disabled:opacity-50">Check</button>
        )}
      </form>
      <AnimatePresence>
        {result && (
          /* Unlike the full-screen lesson Player, this drill lives inside the tab layout, so the
             sheet must clear the fixed bottom tab bar (z-30) instead of sitting under it. */
          <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 md:bottom-0">
            <FeedbackSheet step={step} result={result} onContinue={next} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
