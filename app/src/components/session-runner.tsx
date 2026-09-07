"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionItem } from "@/lib/content";
import { recordAnswer, completeSession } from "@/lib/session-actions";
import { McqExercise } from "@/components/exercises/mcq-exercise";
import { ListenTypeExercise } from "@/components/exercises/listen-type-exercise";
import { WordBankExercise } from "@/components/exercises/word-bank-exercise";
import { SpeakExercise } from "@/components/exercises/speak-exercise";
import { TalkingCharacter, type MascotMood } from "@/components/talking-character";

interface Props {
  sessionId: string;
  items: SessionItem[];
}

const XP_PER_CORRECT = 10;
const STREAK_BONUS_EVERY = 3;

export function SessionRunner({ sessionId, items }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [itemStartedAt, setItemStartedAt] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [mood, setMood] = useState<MascotMood>("idle");
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);

  const current = items[index];

  function showToast(text: string) {
    setToast({ key: Date.now(), text });
    window.setTimeout(() => setToast(null), 1100);
  }

  async function handleResult(correct: boolean) {
    const responseMs = Date.now() - itemStartedAt;
    if (correct) setCorrectCount((c) => c + 1);

    const newStreak = correct ? streak + 1 : 0;
    setStreak(newStreak);
    setBestStreak((b) => Math.max(b, newStreak));
    setMood(correct ? "happy" : "sad");
    window.setTimeout(() => setMood("idle"), 900);

    if (correct) {
      const bonus = newStreak > 0 && newStreak % STREAK_BONUS_EVERY === 0 ? newStreak * 2 : 0;
      showToast(bonus > 0 ? `+${XP_PER_CORRECT + bonus} XP · 🔥 streak x${newStreak}!` : `+${XP_PER_CORRECT} XP`);
    }

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
    const accuracy = Math.round((correctCount / items.length) * 100);
    return (
      <div className="mx-auto max-w-md space-y-6 text-center">
        <TalkingCharacter speaking={false} mood={accuracy >= 60 ? "happy" : "sad"} onClick={undefined} size="lg" />
        <h1 className="text-2xl font-semibold text-neutral-50">Session complete!</h1>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 py-3">
            <p className="text-lg font-bold text-neutral-50">{correctCount}/{items.length}</p>
            <p className="text-xs text-neutral-500">Correct</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 py-3">
            <p className="text-lg font-bold text-neutral-50">🔥 {bestStreak}</p>
            <p className="text-xs text-neutral-500">Best streak</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 py-3">
            <p className="text-lg font-bold text-neutral-50">+{xpEarned}</p>
            <p className="text-xs text-neutral-500">XP · {elapsedSeconds}s</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/learn")}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition active:scale-[0.98] hover:bg-blue-500"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-md space-y-6">
      {toast && (
        <div
          key={toast.key}
          className="animate-float-up-fade pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-full bg-neutral-800 px-4 py-1.5 text-sm font-semibold text-emerald-300 shadow-lg"
        >
          {toast.text}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${((index + 1) / items.length) * 100}%` }}
          />
        </div>
        {streak > 0 && (
          <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-semibold text-orange-400">
            🔥 {streak}
          </span>
        )}
      </div>

      {(current.exercise === "mcq" || current.exercise === "word_bank") && (
        <div className="flex justify-center">
          <TalkingCharacter speaking={false} mood={mood} onClick={undefined} />
        </div>
      )}

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
