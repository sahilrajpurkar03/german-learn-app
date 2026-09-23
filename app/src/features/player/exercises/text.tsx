"use client";

import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useVoice } from "@/components/studio/use-voice";
import { Prompt, SpeakButton, type ExerciseProps } from "./shared";

const SPECIAL = ["ä", "ö", "ü", "ß"];

/** Typed (or dictated) German: translate, dictation, dialogue replies, and speaking practice. */
export function TextExercise({ step, disabled, onReady, onSpeaking }: ExerciseProps) {
  const [value, setValue] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const voice = useVoice();
  const speaking = step.type === "speak";
  const canSpeak = speaking || step.type === "respond";

  function change(next: string) {
    setValue(next);
    onReady(next.trim() ? next : null);
  }

  function insert(char: string) {
    const element = input.current;
    if (!element) return change(value + char);
    const start = element.selectionStart ?? value.length;
    const end = element.selectionEnd ?? value.length;
    change(value.slice(0, start) + char + value.slice(end));
    requestAnimationFrame(() => { element.focus(); element.setSelectionRange(start + 1, start + 1); });
  }

  return (
    <div className="flex flex-col gap-5">
      {!step.speaker && <Prompt>{step.type === "dictation" ? "Type what you hear" : step.prompt}</Prompt>}
      {step.type === "dictation" && <div className="flex justify-center"><SpeakButton text={step.audio!} autoPlay size="lg" onSpeaking={onSpeaking} label="Play the German again" /></div>}
      {(step.type === "type" || step.type === "speak") && step.text && (
        <div className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-2xl font-medium text-ink">{step.text}</p>
        </div>
      )}
      {step.type === "fill_gap" && step.gap && (
        <p lang="de" className="text-2xl">{step.gap.before}<span className="mx-1 inline-block min-w-16 border-b-4 border-line" />{step.gap.after}</p>
      )}
      {speaking && (
        <div className="flex flex-col items-center gap-3">
          <button type="button" disabled={disabled}
            onClick={() => { if (voice.starting) voice.stop(); else if (voice.listening) voice.finish(); else void voice.record(change); }}
            className={`grid h-24 w-24 place-items-center rounded-full text-white shadow-[var(--shadow-lift)] transition ${voice.listening ? "bg-danger animate-pulse" : "bg-brand"}`}
            aria-label={voice.listening ? "Stop recording" : voice.starting ? "Cancel microphone" : "Speak your answer"}>
            {voice.listening || voice.starting ? <Square size={34} aria-hidden="true" /> : <Mic size={38} aria-hidden="true" />}
          </button>
          <span role="status" className="text-sm text-ink-soft">{voice.starting ? "Starting microphone…" : voice.listening ? "Listening… tap to stop" : "Tap and say it in German — or type below"}</span>
        </div>
      )}
      <label className="block">
        <span className="sr-only">Your answer in German</span>
        <textarea ref={input} lang="de" rows={step.type === "respond" ? 2 : 2} value={value} disabled={disabled} autoCapitalize="sentences" autoCorrect="off" spellCheck={false}
          onChange={(event) => change(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); input.current?.form?.requestSubmit(); } }}
          placeholder={step.type === "dictation" ? "Type the German you hear…" : "Type in German…"}
          className="w-full resize-none rounded-2xl border-2 border-line bg-surface px-4 py-3 text-xl text-ink shadow-inner outline-none transition focus:border-brand disabled:opacity-70" />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {SPECIAL.map((char) => (
          <button key={char} type="button" disabled={disabled} onClick={() => insert(char)} className="h-10 w-10 rounded-lg border-2 border-line bg-surface text-lg font-semibold hover:border-brand" aria-label={`Insert ${char}`}>{char}</button>
        ))}
        {canSpeak && !speaking && (
          <button type="button" disabled={disabled} onClick={() => { if (voice.starting) voice.stop(); else if (voice.listening) voice.finish(); else void voice.record(change); }}
            className={`ml-auto inline-flex h-10 items-center gap-1.5 rounded-lg border-2 px-3 text-sm font-semibold ${voice.listening ? "border-danger text-danger" : "border-line text-ink-soft hover:border-brand hover:text-brand"}`}>
            {voice.listening || voice.starting ? <Square size={15} aria-hidden="true" /> : <Mic size={15} aria-hidden="true" />}
            {voice.starting ? "Cancel" : voice.listening ? "Stop" : "Speak"}
          </button>
        )}
      </div>
      {voice.error && <p role="alert" className="text-sm text-danger">{voice.error}</p>}
    </div>
  );
}
