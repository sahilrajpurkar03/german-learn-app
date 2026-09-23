"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { Check, Eye, Flag, RotateCcw, Sparkles, Volume2, X } from "lucide-react";
import { checkAnswer, type CheckResult } from "@/lib/course/answer-check";
import { hash } from "@/lib/course/random";
import { stepSpeech } from "@/lib/course/speech-text";
import type { Attempt } from "@/lib/course/progress";
import type { Step } from "@/lib/course/types";
import { Button, ButtonLink } from "@/ui/button";
import { ProgressBar, ProgressRing } from "@/ui/progress";
import { CountUp, StreakBadge } from "@/ui/stats";
import { Partner, type PartnerMood } from "@/ui/partner";
import { currentStep, playerReducer, progressOf, startPlayer, summary } from "./engine";
import { playGerman, preloadGerman, stopAudio } from "./audio";
import { celebrate, playEffect } from "./feedback-fx";
import { enqueue, flush, installOutboxSync, type ServerSummary } from "./outbox";
import { IntroCard, PatternCard } from "./exercises/cards";
import { ChoiceExercise } from "./exercises/choice";
import { MatchExercise } from "./exercises/match";
import { BuildExercise } from "./exercises/build";
import { TextExercise } from "./exercises/text";
import type { ExerciseProps } from "./exercises/shared";

export type PlayerProps = {
  mode: "online" | "demo";
  lessonId: string;
  runId: string;
  kind: "core" | "conversation" | "checkpoint" | "review";
  title: string;
  goal?: string;
  steps: Step[];
  startIndex?: number;
  exitHref: string;
  nextHref: string;
  nextLabel?: string;
  learned?: { de: string; en: string }[];
  daily?: ServerSummary | null;
  /** review steps shown before the lesson; saved positions count lesson steps only */
  warmupCount?: number;
};

const PRAISE = ["Richtig!", "Super!", "Genau!", "Sehr gut!", "Toll!", "Perfekt!", "Klasse!", "Prima!"];

function Exercise(props: ExerciseProps) {
  switch (props.step.type) {
    case "intro": return <IntroCard {...props} />;
    case "pattern": return <PatternCard {...props} />;
    case "match": return <MatchExercise {...props} />;
    case "build": return <BuildExercise {...props} />;
    case "type": case "dictation": case "respond": case "speak": return <TextExercise {...props} />;
    case "fill_gap": return props.step.options ? <ChoiceExercise {...props} /> : <TextExercise {...props} />;
    default: return <ChoiceExercise {...props} />;
  }
}

export function Player(props: PlayerProps) {
  const [state, dispatch] = useReducer(playerReducer, props, (initial) => startPlayer(initial.steps, initial.startIndex ?? 0));
  const [speaking, setSpeaking] = useState(false);
  // Per-step UI state is keyed by the step, so it resets by itself when the step changes.
  const [pendingEntry, setPendingEntry] = useState<{ key: string; value: string | null }>({ key: "", value: null });
  const [translationKey, setTranslationKey] = useState<string | null>(null);
  const [combo, setCombo] = useState<number | null>(null);
  const [server, setServer] = useState<ServerSummary | null>(props.daily ?? null);
  const shownAt = useRef(0);
  const step = currentStep(state);
  const stepKey = step ? `${step.id}:${state.done}` : "";
  const pending = pendingEntry.key === stepKey ? pendingEntry.value : null;
  const setPending = (value: string | null) => setPendingEntry({ key: stepKey, value });
  const showTranslation = translationKey === stepKey;
  const progress = progressOf(state);
  const online = props.mode === "online";

  useEffect(() => { if (online) installOutboxSync(); }, [online]);
  useEffect(() => () => stopAudio(), []);

  useEffect(() => {
    shownAt.current = performance.now();
    if (!step) return;
    const upcoming = state.queue.slice(1, 3).flatMap((index) => stepSpeech(state.steps[index]));
    preloadGerman(upcoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id, state.queue.length]);

  function record(kind: Attempt["kind"], stepId: string, answer: string) {
    if (!online) return;
    const attempt: Attempt = {
      attemptId: crypto.randomUUID(), runId: props.runId, lessonId: props.lessonId, stepId, kind, answer: answer.slice(0, 500),
      responseMs: Math.min(3600000, Math.max(0, Math.round(performance.now() - shownAt.current))), occurredAt: new Date().toISOString(), stepIndex: Math.max(0, state.done - (props.warmupCount ?? 0)),
    };
    void enqueue([attempt]).then(() => flush()).then((summary) => { if (summary) setServer(summary); });
  }

  function submit(answer: string) {
    if (!step || state.phase !== "answering") return;
    stopAudio();
    const result: CheckResult = checkAnswer(step, answer);
    dispatch({ type: "answer", result, answer });
    record("answer", step.id, answer);
    if (result.verdict === "correct") playEffect("correct");
    else if (result.verdict === "close") playEffect("close");
    else if (result.verdict === "wrong") playEffect("wrong");
    const nextStreak = result.verdict === "correct" || result.verdict === "close" ? state.streak + 1 : 0;
    if ([3, 5, 10, 15].includes(nextStreak)) { setCombo(nextStreak); setTimeout(() => setCombo(null), 1600); }
  }

  function next() {
    stopAudio();
    dispatch({ type: "continue" });
  }

  // Finishing: tell the server once, then celebrate.
  const finished = state.phase === "complete";
  const reported = useRef(false);
  useEffect(() => {
    if (!finished || reported.current) return;
    reported.current = true;
    playEffect("complete");
    void celebrate(props.kind === "checkpoint" ? "big" : "lesson");
    if (online) {
      const attempt: Attempt = { attemptId: crypto.randomUUID(), runId: props.runId, lessonId: props.lessonId, stepId: props.lessonId, kind: "complete", answer: "", responseMs: 0, occurredAt: new Date().toISOString(), stepIndex: 0 };
      void enqueue([attempt]).then(() => flush()).then((summary) => { if (summary) setServer(summary); });
    }
  }, [finished, online, props.kind, props.lessonId, props.runId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Enter" || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLButtonElement) return;
      if (state.phase === "feedback") { event.preventDefault(); next(); }
      else if (step && (step.type === "intro" || step.type === "pattern")) { event.preventDefault(); submit(""); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (finished) return <Completion {...props} stats={summary(state)} server={server} />;
  if (!step) return null;

  const result = state.result;
  const mood: PartnerMood = speaking ? "speaking" : result ? (result.verdict === "correct" || result.verdict === "close" ? "happy" : "thinking") : "idle";
  const isCard = step.type === "intro" || step.type === "pattern";
  const hideLine = step.type === "listen_choose" && !result && !showTranslation;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-canvas/90 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur">
        <Link href={props.exitHref} aria-label="Leave the lesson (your place is saved)" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-soft hover:bg-surface-2 hover:text-ink"><X size={24} aria-hidden="true" /></Link>
        <ProgressBar value={progress.done} max={progress.total} label={`Lesson progress: ${progress.done} of ${progress.total}`} tone={state.streak >= 3 ? "gold" : "brand"} />
        <span className="shrink-0 text-sm font-bold tabular text-ink-soft" aria-live="polite"><Sparkles size={14} className="-mt-0.5 mr-0.5 inline text-gold" aria-hidden="true" />{state.xp}</span>
      </header>

      <AnimatePresence>
        {combo && (
          <m.div key={combo} initial={{ opacity: 0, y: -10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} role="status"
            className="pointer-events-none fixed bottom-32 left-1/2 z-30 -translate-x-1/2 rounded-full bg-gold px-4 py-1.5 text-sm font-bold text-white shadow-[var(--shadow-lift)]">
            🔥 {combo} in a row!
          </m.div>
        )}
      </AnimatePresence>

      <form className="flex flex-1 flex-col" onSubmit={(event) => { event.preventDefault(); if (state.phase === "answering" && pending !== null) submit(pending); }}>
        <main className="flex-1 px-4 pb-44 pt-2">
          <AnimatePresence mode="wait" initial={false}>
            <m.section key={`${step.id}:${state.done}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }} aria-label={step.prompt}>
              {step.speaker && (
                <div className="mb-5 flex items-end gap-3">
                  <Partner name={step.speaker.name} mood={mood} size={104} />
                  <div className="relative mb-6 flex-1 rounded-3xl rounded-bl-md bg-surface p-4 shadow-[var(--shadow-card)]">
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{step.speaker.name} · {step.speaker.role}</span>
                    {hideLine
                      ? <p className="mt-1 text-lg text-ink-soft">🎧 Listen carefully…</p>
                      : <p lang="de" className="mt-1 text-xl font-medium leading-snug text-ink">{step.text}</p>}
                    {showTranslation && step.translation && <p className="mt-1 text-ink-soft">{step.translation}</p>}
                    <div className="mt-3 flex items-center gap-2">
                      {step.audio && <SpeakLine text={step.audio} onSpeaking={setSpeaking} />}
                      {step.translation && (
                        <button type="button" onClick={() => setTranslationKey(showTranslation ? null : stepKey)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-ink-soft hover:bg-surface-2" aria-pressed={showTranslation}>
                          <Eye size={15} aria-hidden="true" />{hideLine ? "Show text" : "Translate"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {step.speaker && <p className="mb-4 font-display text-xl font-semibold text-ink">{step.prompt}</p>}
              <Exercise key={step.id + state.done} step={step} disabled={state.phase !== "answering"} revealed={state.phase === "feedback"} onReady={setPending} onSubmit={submit} onSpeaking={setSpeaking} />
            </m.section>
          </AnimatePresence>
        </main>

        <footer className="fixed inset-x-0 bottom-0 z-20">
          <AnimatePresence mode="wait" initial={false}>
            {result && state.phase === "feedback" ? (
              <FeedbackSheet key="feedback" step={step} result={result} onContinue={next} />
            ) : (
              <m.div key="check" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="border-t-2 border-line bg-canvas">
                <div className="v2-safe-bottom mx-auto flex max-w-2xl gap-3 px-4 pt-4">
                  {isCard ? (
                    <Button type="button" size="lg" onClick={() => submit("")}>Continue</Button>
                  ) : step.type === "match" ? (
                    <p className="w-full py-3 text-center text-ink-soft">Tap a German word, then its meaning.</p>
                  ) : (
                    <Button type="submit" size="lg" disabled={pending === null}>Check</Button>
                  )}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </footer>
      </form>
    </div>
  );
}

function SpeakLine({ text, onSpeaking }: { text: string; onSpeaking: (value: boolean) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => playGerman(text, { onStart: () => onSpeaking(true), onEnd: () => onSpeaking(false) }), 300);
    return () => { clearTimeout(timer); onSpeaking(false); };
  }, [text, onSpeaking]);
  return (
    <button type="button" onClick={() => playGerman(text, { onStart: () => onSpeaking(true), onEnd: () => onSpeaking(false) })} className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand" aria-label="Replay what they said">
      <Volume2 size={18} aria-hidden="true" />
    </button>
  );
}

function FeedbackSheet({ step, result, onContinue }: { step: Step; result: NonNullable<ReturnType<typeof playerReducer>["result"]>; onContinue: () => void }) {
  const good = result.verdict === "correct";
  const close = result.verdict === "close";
  const compare = result.verdict === "seen";
  const tone = good ? "bg-success-soft text-success" : close || compare ? "bg-gold-soft text-gold" : "bg-danger-soft text-danger";
  const heading = good ? PRAISE[hash(step.id) % PRAISE.length] : close ? "Almost!" : compare ? "Compare your reply" : "Not quite";
  const germanAnswer = !["choose", "listen_choose", "match"].includes(step.type) || Boolean(step.speaker && step.type === "choose");
  const showAnswer = !good || (germanAnswer && step.accepted.length > 1 && result.expected !== result.answer);
  return (
    <m.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 34 }} role="status" aria-live="assertive" className={`${tone} rounded-t-3xl shadow-[0_-8px_30px_rgb(0_0_0/0.08)]`}>
      <div className="v2-safe-bottom mx-auto max-w-2xl px-5 pt-5">
        <div className="flex items-start gap-3">
          <m.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${good ? "bg-success" : close || compare ? "bg-gold" : "bg-danger"} text-white`} aria-hidden="true">
            {good ? <Check size={24} strokeWidth={3} /> : close || compare ? <Sparkles size={20} /> : <RotateCcw size={20} />}
          </m.span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl font-bold">{heading}</p>
            {showAnswer && (
              <p className="mt-1 text-ink">
                <span className="text-sm font-semibold text-ink-soft">{good ? "Also correct: " : "Correct answer: "}</span>
                {result.diff && !good
                  ? <span lang="de" className="text-lg font-semibold">{result.diff.map((token, index) => <span key={index} className={token.ok ? "" : "rounded bg-white/60 px-0.5 underline decoration-2 underline-offset-4"}>{token.token}{" "}</span>)}</span>
                  : <span lang={germanAnswer ? "de" : undefined} className="text-lg font-semibold">{result.expected}</span>}
              </p>
            )}
            {result.feedback && <p className="mt-1 text-ink">{result.feedback}</p>}
            {step.note && !good && <p className="mt-1 text-sm text-ink-soft">💡 {step.note}</p>}
            {result.verdict === "wrong" && !result.retry && <p className="mt-1 text-sm text-ink-soft">You&apos;ll get another go at the end.</p>}
          </div>
          {germanAnswer && step.accepted[0] && (
            <button type="button" onClick={() => playGerman(result.expected || step.accepted[0])} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/60 text-ink" aria-label="Hear the correct German">
              <Volume2 size={20} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="mt-4">
          <Button type="button" size="lg" variant={good ? "success" : close || compare ? "gold" : "danger"} onClick={onContinue} autoFocus>Continue</Button>
        </div>
      </div>
    </m.div>
  );
}

function Completion(props: PlayerProps & { stats: ReturnType<typeof summary>; server: ServerSummary | null }) {
  const { stats, server } = props;
  const checkpointFailed = props.kind === "checkpoint" && stats.accuracy < 80;
  const heading = checkpointFailed ? "So close!" : props.kind === "review" ? "Review done!" : props.kind === "checkpoint" ? "Unit complete!" : "Lesson complete!";
  const goalMet = server ? server.todayXp >= server.goalXp : false;
  const learned = useMemo(() => props.learned ?? [], [props.learned]);
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center gap-6 px-5 pb-10 pt-[max(env(safe-area-inset-top),2rem)] text-center">
      <m.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 12 }}
        className={`grid h-28 w-28 place-items-center rounded-[2rem] text-6xl shadow-[var(--shadow-lift)] ${checkpointFailed ? "bg-surface" : "bg-gold-soft"}`} aria-hidden="true">
        {checkpointFailed ? "💪" : props.kind === "checkpoint" ? "🏆" : props.kind === "review" ? "🧠" : "🎉"}
      </m.div>
      <div>
        <h1 className="font-display text-4xl font-bold">{heading}</h1>
        <p className="mt-2 text-lg text-ink-soft">
          {checkpointFailed ? "80% right first time unlocks the next unit. Try again whenever you like — mistakes are now on your review list." : props.goal ?? props.title}
        </p>
      </div>
      <div className="grid w-full grid-cols-3 gap-3">
        <Stat label="XP earned" tone="gold"><CountUp value={stats.xp} /></Stat>
        <Stat label="Accuracy" tone="success"><CountUp value={stats.accuracy} />%</Stat>
        <Stat label="Best run" tone="brand"><CountUp value={stats.bestStreak} /></Stat>
      </div>
      {server && (
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex w-full items-center gap-4 rounded-3xl bg-surface p-4 text-left shadow-[var(--shadow-card)]">
          <ProgressRing value={server.todayXp} max={server.goalXp} label={`Daily goal ${server.todayXp} of ${server.goalXp} XP`} tone={goalMet ? "success" : "gold"}>
            <span className="text-xs font-bold tabular">{Math.min(server.todayXp, server.goalXp)}</span>
          </ProgressRing>
          <div className="flex-1">
            <p className="font-semibold">{goalMet ? "Daily goal reached!" : `${server.goalXp - server.todayXp} XP to today's goal`}</p>
            <p className="text-sm text-ink-soft">{server.streak > 0 ? `${server.streak}-day streak — keep it going tomorrow.` : "Reach your goal to start a streak."}</p>
          </div>
          <StreakBadge days={server.streak} />
        </m.div>
      )}
      {learned.length > 0 && (
        <section className="w-full text-left" aria-labelledby="learned-heading">
          <h2 id="learned-heading" className="mb-2 font-semibold text-ink-soft">You learned</h2>
          <ul className="grid gap-2">
            {learned.map((item, index) => (
              <m.li key={item.de} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + index * 0.06 }}>
                <button type="button" onClick={() => playGerman(item.de)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
                  <span lang="de" className="font-semibold">{item.de}</span><span className="text-sm text-ink-soft">{item.en}</span>
                </button>
              </m.li>
            ))}
          </ul>
        </section>
      )}
      <div className="mt-auto grid w-full gap-3">
        {props.mode === "demo" ? (
          <>
            <ButtonLink href="/signup" size="lg">Create a free account to keep going</ButtonLink>
            <ButtonLink href="/login" size="lg" variant="secondary">I already have an account</ButtonLink>
          </>
        ) : checkpointFailed ? (
          <>
            <Button size="lg" onClick={() => window.location.reload()}><Flag size={20} aria-hidden="true" />Try the checkpoint again</Button>
            <ButtonLink href={props.exitHref} size="lg" variant="secondary">Back to the unit</ButtonLink>
          </>
        ) : (
          <ButtonLink href={props.nextHref} size="lg">{props.nextLabel ?? "Continue"}</ButtonLink>
        )}
      </div>
    </div>
  );
}

function Stat({ label, tone, children }: { label: string; tone: "gold" | "success" | "brand"; children: React.ReactNode }) {
  const color = tone === "gold" ? "text-gold" : tone === "success" ? "text-success" : "text-brand";
  return (
    <div className="rounded-2xl bg-surface p-3 shadow-[var(--shadow-card)]">
      <p className={`font-display text-3xl font-bold ${color}`}>{children}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
    </div>
  );
}
