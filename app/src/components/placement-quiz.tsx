"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitPlacement } from "@/lib/placement-actions";
import type { PlacementQuestion } from "@/lib/content";
import type { Level } from "@/lib/supabase/database.types";
import { TalkingCharacter } from "@/components/talking-character";

interface Props {
  questions: PlacementQuestion[];
  heading?: string;
  introText?: string;
  resultText?: (level: Level) => string;
  onFinish?: (level: Level) => Promise<void>;
  onAnswer?: (question: PlacementQuestion, correct: boolean) => void;
  showSkip?: boolean;
}

type LevelScores = Record<Level, { correct: number; total: number }>;
type Phase = "intro" | "quiz" | "result";

const LEVEL_LABEL: Record<Level, string> = { a1: "Beginner (A1)", a2: "Elementary (A2)", b1: "Intermediate (B1)" };

function emptyScores(): LevelScores {
  return { a1: { correct: 0, total: 0 }, a2: { correct: 0, total: 0 }, b1: { correct: 0, total: 0 } };
}

function decideLevel(scores: LevelScores): Level {
  const accuracy = (level: Level) => (scores[level].total ? scores[level].correct / scores[level].total : 0);
  if (accuracy("b1") >= 0.7 && accuracy("a2") >= 0.6) return "b1";
  if (accuracy("a2") >= 0.6) return "a2";
  return "a1";
}

export function PlacementQuiz({
  questions,
  heading = "Quick placement test",
  introText = "Hallo! I'm Fritz. Answer a few quick questions so I can find the right level for you.",
  resultText = (level) => `Nice! You're starting at ${LEVEL_LABEL[level]}.`,
  onFinish,
  onAnswer,
  showSkip = true,
}: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<LevelScores>(emptyScores);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultLevel, setResultLevel] = useState<Level>("a1");

  const current = questions[index];
  const finish = onFinish ?? ((level: Level) => submitPlacement(level));

  async function complete(finalScores: LevelScores) {
    setSubmitting(true);
    const level = decideLevel(finalScores);
    await finish(level);
    setResultLevel(level);
    setSubmitting(false);
    setPhase("result");
  }

  function choose(option: string) {
    if (selected || !current) return;
    setSelected(option);
    const correct = option === current.translationEn;
    onAnswer?.(current, correct);
    const updated: LevelScores = {
      ...scores,
      [current.level]: {
        correct: scores[current.level].correct + (correct ? 1 : 0),
        total: scores[current.level].total + 1,
      },
    };
    setScores(updated);
    window.setTimeout(() => {
      if (index + 1 >= questions.length) {
        void complete(updated);
      } else {
        setIndex((i) => i + 1);
        setSelected(null);
      }
    }, 500);
  }

  function skip() {
    setSubmitting(true);
    void finish("a1").then(() => router.push("/learn"));
  }

  if (phase === "intro") {
    return (
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        <TalkingCharacter speaking={false} mood="idle" bubbleText={introText} onClick={undefined} size="lg" />
        <div>
          <h1 className="text-2xl font-semibold text-neutral-50">{heading}</h1>
          <p className="mt-2 text-sm text-neutral-400">{questions.length} quick questions &middot; takes about 2 minutes</p>
        </div>
        <button
          type="button"
          onClick={() => setPhase("quiz")}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition active:scale-[0.98] hover:bg-blue-500"
        >
          Let&apos;s go
        </button>
        {showSkip && (
          <button type="button" onClick={skip} className="w-full text-center text-sm text-neutral-500 hover:text-neutral-300">
            Skip and start at A1
          </button>
        )}
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        <TalkingCharacter speaking={false} mood="happy" bubbleText={resultText(resultLevel)} onClick={undefined} size="lg" />
        <button
          type="button"
          onClick={() => router.push("/learn")}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition active:scale-[0.98] hover:bg-blue-500"
        >
          Start learning
        </button>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= index ? "bg-blue-600" : "bg-neutral-800"}`}
            />
          ))}
        </div>
        <p className="mt-3 text-center text-xs uppercase tracking-wide text-neutral-500">
          {heading} &middot; {index + 1}/{questions.length}
        </p>
        <h1 className="mt-2 text-center text-2xl font-semibold text-neutral-50">{current.lemma}</h1>
        <p className="mt-1 text-center text-sm text-neutral-400">What does this mean?</p>
      </div>

      <div className="grid gap-2">
        {current.options.map((option) => {
          const isSelected = selected === option;
          const isRight = option === current.translationEn;
          const showResult = selected !== null;
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              disabled={showResult}
              className={`rounded-lg border-2 px-4 py-3 text-left transition active:scale-[0.98] ${
                showResult
                  ? isRight
                    ? "border-green-500 bg-green-500/10 text-green-300"
                    : isSelected
                      ? "border-red-500 bg-red-500/10 text-red-300 animate-shake-x"
                      : "border-neutral-800 text-neutral-500"
                  : "border-neutral-700 text-neutral-100 hover:border-blue-500"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {submitting && <p className="text-center text-sm text-neutral-500">Setting up your level…</p>}
    </div>
  );
}
