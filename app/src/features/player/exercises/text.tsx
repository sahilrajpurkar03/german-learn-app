"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { useVoice } from "@/components/studio/use-voice";
import { isSpeechRecognitionSupported } from "@/lib/speech";
import { SKIP_SPEAKING } from "@/lib/course/types";
import { Prompt, SpeakButton, type ExerciseProps } from "./shared";

const SPECIAL = ["ä", "ö", "ü", "ß"];

// "Can't speak now" turns speaking steps off for a while (on the bus, in the office), like the big apps do.
const SPEAKING_OFF_KEY = "sprechen-speaking-off-until";
const SPEAKING_EVENT = "sprechen-speaking-change";
function subscribe(callback: () => void) {
  window.addEventListener(SPEAKING_EVENT, callback);
  return () => window.removeEventListener(SPEAKING_EVENT, callback);
}
function speakingOff(): boolean {
  try { return Number(window.localStorage.getItem(SPEAKING_OFF_KEY) ?? 0) > Date.now(); } catch { return false; }
}
function setSpeakingOff(minutes: number) {
  try {
    if (minutes > 0) window.localStorage.setItem(SPEAKING_OFF_KEY, String(Date.now() + minutes * 60000));
    else window.localStorage.removeItem(SPEAKING_OFF_KEY);
  } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(SPEAKING_EVENT));
}

/** Typed (or dictated) German: translate, dictation, dialogue replies, and the two speaking exercises. */
export function TextExercise({ step, disabled, onReady, onSubmit, onSpeaking }: ExerciseProps) {
  const [value, setValue] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const voice = useVoice();
  const spoken = step.type === "speak" || step.type === "repeat";
  const canSpeak = spoken || step.type === "respond";
  const off = useSyncExternalStore(subscribe, speakingOff, () => false);
  // Firefox (and some embedded browsers) can't listen; the exercise then works by typing.
  const canListen = useSyncExternalStore(() => () => {}, isSpeechRecognitionSupported, () => true);

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

  function toggleMic() {
    if (voice.starting) voice.stop();
    else if (voice.listening) voice.finish();
    else void voice.record(change);
  }

  if (spoken && off && canListen) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-3xl bg-surface-2 text-ink-soft"><MicOff size={30} aria-hidden="true" /></span>
        <Prompt>Speaking is off for now</Prompt>
        <p className="text-ink-soft">You skipped speaking exercises. They&apos;ll come back in a few minutes.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" disabled={disabled} onClick={() => onSubmit(SKIP_SPEAKING)} className="min-h-11 rounded-xl bg-brand px-4 font-semibold text-on-brand">Skip this one</button>
          <button type="button" disabled={disabled} onClick={() => setSpeakingOff(0)} className="min-h-11 rounded-xl border-2 border-line px-4 font-semibold hover:border-brand">Turn speaking back on</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!step.speaker && <Prompt>{step.type === "dictation" ? "Type what you hear" : step.prompt}</Prompt>}
      {step.type === "dictation" && <div className="flex justify-center"><SpeakButton text={step.audio!} autoPlay size="lg" onSpeaking={onSpeaking} label="Play the German again" /></div>}
      {step.type === "repeat" && (
        <div className="flex items-center gap-4 rounded-3xl bg-surface p-5 shadow-[var(--shadow-card)]">
          <SpeakButton text={step.audio!} autoPlay onSpeaking={onSpeaking} label="Hear it again" />
          <div className="min-w-0">
            <p lang="de" className="font-display text-2xl font-semibold leading-snug">{step.text}</p>
            {step.translation && <p className="text-sm text-ink-soft">{step.translation}</p>}
          </div>
        </div>
      )}
      {(step.type === "type" || step.type === "speak") && step.text && (
        <div className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-2xl font-medium text-ink">{step.text}</p>
        </div>
      )}
      {step.type === "fill_gap" && step.gap && (
        <p lang="de" className="text-2xl">{step.gap.before}<span className="mx-1 inline-block min-w-16 border-b-4 border-line" />{step.gap.after}</p>
      )}
      {spoken && !canListen && (
        <div role="note" className="rounded-2xl bg-gold-soft p-4 text-sm text-ink">
          <p className="font-semibold">This browser can&apos;t listen to you</p>
          <p className="mt-1">Firefox doesn&apos;t support speech recognition. Say the sentence out loud anyway, then {step.type === "repeat" ? "type it below or tap “I said it aloud”" : "type it below"}. To use the microphone, open Sprechen in Chrome, Edge or Safari.</p>
          {step.type === "repeat" && (
            <button type="button" disabled={disabled} onClick={() => onSubmit(SKIP_SPEAKING)} className="mt-3 min-h-11 rounded-xl bg-brand px-4 font-semibold text-on-brand">I said it aloud</button>
          )}
        </div>
      )}
      {spoken && canListen && (
        <div className="flex flex-col items-center gap-3">
          <button type="button" disabled={disabled} onClick={toggleMic}
            className={`grid h-24 w-24 place-items-center rounded-full text-white shadow-[var(--shadow-lift)] transition ${voice.listening ? "bg-danger animate-pulse" : "bg-brand"}`}
            aria-label={voice.listening ? "Stop recording" : voice.starting ? "Cancel microphone" : "Tap and speak"}>
            {voice.listening || voice.starting ? <Square size={34} aria-hidden="true" /> : <Mic size={38} aria-hidden="true" />}
          </button>
          <span role="status" className="text-sm text-ink-soft">{voice.starting ? "Starting microphone…" : voice.listening ? "Listening… tap to stop" : "Tap the microphone and say it in German"}</span>
        </div>
      )}
      <label className="block">
        <span className="sr-only">Your answer in German</span>
        <textarea ref={input} lang="de" rows={2} value={value} disabled={disabled} autoCapitalize="sentences" autoCorrect="off" spellCheck={false}
          onChange={(event) => change(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); input.current?.form?.requestSubmit(); } }}
          placeholder={spoken ? (canListen ? "What you said appears here — or type it" : "Type what you said…") : step.type === "dictation" ? "Type the German you hear…" : "Type in German…"}
          className="w-full resize-none rounded-2xl border-2 border-line bg-surface px-4 py-3 text-xl text-ink shadow-inner outline-none transition focus:border-brand disabled:opacity-70" />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {SPECIAL.map((char) => (
          <button key={char} type="button" disabled={disabled} onClick={() => insert(char)} className="h-10 w-10 rounded-lg border-2 border-line bg-surface text-lg font-semibold hover:border-brand" aria-label={`Insert ${char}`}>{char}</button>
        ))}
        {canSpeak && !spoken && canListen && (
          <button type="button" disabled={disabled} onClick={toggleMic}
            className={`ml-auto inline-flex h-10 items-center gap-1.5 rounded-lg border-2 px-3 text-sm font-semibold ${voice.listening ? "border-danger text-danger" : "border-line text-ink-soft hover:border-brand hover:text-brand"}`}>
            {voice.listening || voice.starting ? <Square size={15} aria-hidden="true" /> : <Mic size={15} aria-hidden="true" />}
            {voice.starting ? "Cancel" : voice.listening ? "Stop" : "Speak"}
          </button>
        )}
        {spoken && canListen && (
          <button type="button" disabled={disabled} onClick={() => { voice.stop(); setSpeakingOff(15); onSubmit(SKIP_SPEAKING); }}
            className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-ink-soft hover:bg-surface-2 hover:text-ink">
            <MicOff size={15} aria-hidden="true" />Can&apos;t speak now
          </button>
        )}
      </div>
      {voice.error && <p role="alert" className="text-sm text-danger">{voice.error}</p>}
    </div>
  );
}
