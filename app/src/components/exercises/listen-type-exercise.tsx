"use client";

import { useEffect, useState } from "react";
import { speakGerman } from "@/lib/speech";
import { isCloseEnough } from "@/lib/text-match";
import { TalkingCharacter } from "@/components/talking-character";

interface Props {
  targetText: string;
  hintEn?: string | null;
  onResult: (correct: boolean) => void;
}

export function ListenTypeExercise({ targetText, hintEn, onResult }: Props) {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState<null | boolean>(null);
  const [speaking, setSpeaking] = useState(false);

  function replay() {
    speakGerman(targetText, { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) });
  }

  // play automatically whenever a new item is shown, not just on manual click
  useEffect(() => {
    replay();
    setValue("");
    setChecked(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetText]);

  function check() {
    if (checked !== null) return;
    const correct = isCloseEnough(value, targetText);
    setChecked(correct);
    window.setTimeout(() => onResult(correct), 900);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-neutral-400">Listen and type what you hear</p>
        <div className="mt-4">
          <TalkingCharacter speaking={speaking} onClick={replay} />
        </div>
        {hintEn && <p className="mt-3 text-sm text-neutral-500">Hint: {hintEn}</p>}
      </div>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && check()}
        disabled={checked !== null}
        placeholder="Type in German..."
        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-3 text-center text-lg text-neutral-100 outline-none focus:border-blue-500"
        autoFocus
      />

      {checked === false && (
        <p className="text-center text-sm text-red-400">Correct answer: {targetText}</p>
      )}

      <button
        type="button"
        onClick={check}
        disabled={checked !== null || value.trim().length === 0}
        className="w-full rounded-lg bg-blue-600 px-3 py-2 font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
      >
        Check
      </button>
    </div>
  );
}
