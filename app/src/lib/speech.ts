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
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike> & { isFinal?: boolean }>;
}

export interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort?(): void;
  onstart?: (() => void) | null;
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

export function listenOnce(lang = "de-DE", signal?: AbortSignal, options?: {
  onStarted?: () => void;
  onTranscript?: (text: string) => void;
  stopSignal?: AbortSignal;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      reject(new Error("Speech-to-text is unavailable in this browser. Open Sprechen in Chrome or Safari, or type your reply."));
      return;
    }
    if (window.isSecureContext === false) {
      reject(new Error("Microphone access requires HTTPS. Open the secure Sprechen website, or type your reply."));
      return;
    }
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    let settled = false;
    let latestTranscript = "";
    const finish = (error?: Error, transcript = "") => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      options?.stopSignal?.removeEventListener("abort", stop);
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
      try { if (error && recognition.abort) recognition.abort(); else recognition.stop(); } catch {}
      if (error) reject(error);
      else resolve(transcript);
    };
    const abort = () => finish(new Error("Recording stopped."));
    const stop = () => {
      try { recognition.stop(); } catch { finish(undefined, latestTranscript); }
    };
    const timer = setTimeout(() => finish(latestTranscript ? undefined : new Error("No speech received. Check your microphone and try again, or type your reply."), latestTranscript), 30000);
    signal?.addEventListener("abort", abort, { once: true });
    options?.stopSignal?.addEventListener("abort", stop, { once: true });
    recognition.onstart = () => { if (!settled) options?.onStarted?.(); };
    recognition.onresult = (event) => {
      latestTranscript = Array.from(event.results).map((result) => result[0]?.transcript ?? "").join(" ").trim();
      if (latestTranscript) options?.onTranscript?.(latestTranscript);
      if (Array.from(event.results).every((result) => result.isFinal !== false)) {
        finish(latestTranscript ? undefined : new Error("No speech received. Try again."), latestTranscript);
      }
    };
    recognition.onerror = (event) => {
      const code = (event as Event & { error?: string }).error;
      const messages: Record<string, string> = {
        "not-allowed": "Microphone permission was denied. Allow microphone access in your browser's site settings and your device settings, then try again.",
        "service-not-allowed": "Your browser's speech recognition service is disabled. Try Chrome or Safari with speech recognition enabled, or type your reply.",
        "audio-capture": "No microphone audio is available. Check your input device and whether another app is using it.",
        network: "The browser's speech service could not connect. Check your internet connection, or type your reply.",
        "no-speech": "No speech was detected. Move closer to the microphone and try again, or type your reply.",
        "language-not-supported": "German speech recognition is unavailable in this browser. Try another supported browser, or type your reply.",
        aborted: "Speech recognition was interrupted. Try again, or type your reply.",
      };
      finish(new Error(messages[code ?? ""] ?? "Speech recognition could not start. Check browser microphone settings, or type your reply."));
    };
    recognition.onend = () => finish(latestTranscript ? undefined : new Error("No speech received. Try again or type your reply."), latestTranscript);
    if (signal?.aborted || options?.stopSignal?.aborted) { abort(); return; }
    try { recognition.start(); } catch { finish(new Error("Could not start the microphone.")); }
  });
}
