"use client";

import { m } from "motion/react";
import { Check, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import { hash } from "@/lib/course/random";
import type { Step } from "@/lib/course/types";
import { Button } from "@/ui/button";
import { playGerman } from "./audio";
import type { AnsweredResult } from "./engine";
import { IntroCard, PatternCard } from "./exercises/cards";
import { ChoiceExercise } from "./exercises/choice";
import { MatchExercise } from "./exercises/match";
import { BuildExercise } from "./exercises/build";
import { TextExercise } from "./exercises/text";
import type { ExerciseProps } from "./exercises/shared";

// Shared by the lesson Player and the open-ended practice drill, so a question looks and
// behaves the same however the learner reached it.

export const PRAISE = ["Richtig!", "Super!", "Genau!", "Sehr gut!", "Toll!", "Perfekt!", "Klasse!", "Prima!"];

export function Exercise(props: ExerciseProps) {
  switch (props.step.type) {
    case "intro": return <IntroCard {...props} />;
    case "pattern": return <PatternCard {...props} />;
    case "match": return <MatchExercise {...props} />;
    case "build": return <BuildExercise {...props} />;
    case "type": case "dictation": case "respond": case "speak": case "repeat": return <TextExercise {...props} />;
    case "fill_gap": return props.step.options ? <ChoiceExercise {...props} /> : <TextExercise {...props} />;
    default: return <ChoiceExercise {...props} />;
  }
}

export function FeedbackSheet({ step, result, onContinue }: { step: Step; result: AnsweredResult; onContinue: () => void }) {
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
