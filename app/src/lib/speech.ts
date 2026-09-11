"use client";

let stopActiveSpeech: (() => void) | null = null;

export function speakGerman(text: string, callbacks?: { onStart?: () => void; onEnd?: () => void; onError?: () => void; rate?: number }) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    callbacks?.onError?.();
    callbacks?.onEnd?.();
    return () => {};
  }
  stopActiveSpeech?.();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = callbacks?.rate ?? 0.9;
  const voice = window.speechSynthesis.getVoices().find((entry) => entry.lang.startsWith("de"));
  if (voice) utterance.voice = voice;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    callbacks?.onEnd?.();
    if (stopActiveSpeech === stop) stopActiveSpeech = null;
  };
  const stop = () => {
    if (done) return;
    finish();
    window.speechSynthesis.cancel();
  };
  utterance.onstart = () => { if (!done) callbacks?.onStart?.(); };
  utterance.onend = finish;
  utterance.onerror = () => {
    if (!done) callbacks?.onError?.();
    finish();
  };
  stopActiveSpeech = stop;
  window.speechSynthesis.speak(utterance);
  return stop;
}

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}

export interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function listenOnce(lang = "de-DE", signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      reject(new Error("Speech recognition is not supported in this browser."));
      return;
    }
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    let settled = false;
    const finish = (error?: Error, transcript = "") => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      recognition.stop();
      if (error) reject(error);
      else resolve(transcript);
    };
    const abort = () => finish(new Error("Recording stopped."));
    const timer = setTimeout(() => finish(new Error("No speech received. Try again or type your reply.")), 15000);
    signal?.addEventListener("abort", abort, { once: true });
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      finish(transcript ? undefined : new Error("No speech received. Try again."), transcript);
    };
    recognition.onerror = () => finish(new Error("Microphone unavailable. Check permission, or type your reply."));
    recognition.onend = () => finish(new Error("No speech received. Try again or type your reply."));
    if (signal?.aborted) { abort(); return; }
    try { recognition.start(); } catch { finish(new Error("Could not start the microphone.")); }
  });
}
