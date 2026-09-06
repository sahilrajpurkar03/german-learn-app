"use client";

import { useState } from "react";
import { isSpeechRecognitionSupported, listenOnce, speakGerman } from "@/lib/speech";
import { isCloseEnough } from "@/lib/text-match";

interface Props {
  targetText: string;
  hintEn?: string | null;
  onResult: (correct: boolean) => void;
}

export function SpeakExercise({ targetText, hintEn, onResult }: Props) {
  const [status, setStatus] = useState<"idle" | "listening" | "checked">("idle");
  const [heard, setHeard] = useState("");
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supported = isSpeechRecognitionSupported();

  async function record() {
    setError(null);
    setStatus("listening");
    try {
      const transcript = await listenOnce("de-DE");
      const isRight = isCloseEnough(transcript, targetText, 0.7);
      setHeard(transcript);
      setCorrect(isRight);
      setStatus("checked");
      window.setTimeout(() => onResult(isRight), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("idle");
    }
  }

  function skipWithoutMic() {
    // let the learner self-report if the browser has no mic support
    setStatus("checked");
    setCorrect(true);
    window.setTimeout(() => onResult(true), 400);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-neutral-400">Say this out loud in German</p>
        {hintEn && <p className="mt-1 text-sm text-neutral-500">{hintEn}</p>}
        <p className="mt-3 text-2xl font-semibold text-neutral-50">{targetText}</p>
        <button
          type="button"
          onClick={() => speakGerman(targetText)}
          className="mt-2 text-sm text-blue-400 hover:underline"
        >
          🔊 Hear it first
        </button>
      </div>

      {supported ? (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={record}
            disabled={status === "listening" || status === "checked"}
            className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl text-white transition ${
              status === "listening" ? "animate-pulse bg-red-600" : "bg-blue-600 hover:bg-blue-500"
            } disabled:opacity-60`}
            aria-label="Record"
          >
            🎙️
          </button>
          {status === "listening" && <p className="text-sm text-neutral-400">Listening...</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {status === "checked" && (
            <div className="text-center">
              <p className="text-sm text-neutral-400">We heard: &quot;{heard}&quot;</p>
              <p className={`text-sm font-medium ${correct ? "text-green-400" : "text-red-400"}`}>
                {correct ? "Nice pronunciation!" : "Not quite — try to match it closer next time."}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-neutral-500">
            Your browser doesn&apos;t support speech recognition. Say it out loud anyway, then continue.
          </p>
          <button
            type="button"
            onClick={skipWithoutMic}
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
          >
            I said it, continue
          </button>
        </div>
      )}
    </div>
  );
}
