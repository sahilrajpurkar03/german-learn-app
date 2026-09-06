"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionItem } from "@/lib/content";
import { recordAnswer, completeSession } from "@/lib/session-actions";
import { McqExercise } from "@/components/exercises/mcq-exercise";
import { ListenTypeExercise } from "@/components/exercises/listen-type-exercise";
import { WordBankExercise } from "@/components/exercises/word-bank-exercise";
import { SpeakExercise } from "@/components/exercises/speak-exercise";

interface Props {
  sessionId: string;
  items: SessionItem[];
}

const XP_PER_CORRECT = 10;

export function SessionRunner({ sessionId, items }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [itemStartedAt, setItemStartedAt] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const current = items[index];

  async function handleResult(correct: boolean) {
    const responseMs = Date.now() - itemStartedAt;
    if (correct) setCorrectCount((c) => c + 1);

    await recordAnswer({
      sessionId,
      itemType: current.itemType,
      itemId: current.id,
      exerciseType: current.exercise,
      correct,
      responseMs,
    });

    if (index + 1 >= items.length) {
      const earned = (correctCount + (correct ? 1 : 0)) * XP_PER_CORRECT;
      setXpEarned(earned);
      setElapsedSeconds(Math.round((Date.now() - startedAt) / 1000));
      await completeSession(sessionId, earned);
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setItemStartedAt(Date.now());
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center">
        <p className="text-neutral-300">No content available yet. Please seed the content database.</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="text-2xl font-semibold text-neutral-50">Session complete!</h1>
        <p className="text-neutral-400">
          {correctCount}/{items.length} correct &middot; {elapsedSeconds}s &middot; +{xpEarned} XP
        </p>
        <button
          type="button"
          onClick={() => router.push("/learn")}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${((index + 1) / items.length) * 100}%` }}
        />
      </div>

      {current.itemType === "vocab" && current.exercise === "mcq" && (
        <McqExercise item={current} onResult={handleResult} />
      )}
      {current.itemType === "vocab" && current.exercise === "listen_type" && (
        <ListenTypeExercise targetText={current.lemma} hintEn={current.translationEn} onResult={handleResult} />
      )}
      {current.itemType === "phrase" && current.exercise === "listen_type" && (
        <ListenTypeExercise targetText={current.deText} hintEn={current.enText} onResult={handleResult} />
      )}
      {current.itemType === "phrase" && current.exercise === "word_bank" && (
        <WordBankExercise targetText={current.deText} hintEn={current.enText} onResult={handleResult} />
      )}
      {current.itemType === "phrase" && current.exercise === "speak" && (
        <SpeakExercise targetText={current.deText} hintEn={current.enText} onResult={handleResult} />
      )}
    </div>
  );
}
