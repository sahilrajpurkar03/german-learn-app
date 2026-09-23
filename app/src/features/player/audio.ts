"use client";

import { speakGerman } from "@/lib/speech";
import { audioFile, speechText } from "@/lib/course/speech-text";

// Pre-generated neural voice clips in /audio (see scripts/tts-build.py); the browser's own
// German voice is the fallback when a clip is missing or can't play.

let active: { stop: () => void } | null = null;
const missing = new Set<string>();

export function stopAudio() {
  active?.stop();
  active = null;
}

export function playGerman(text: string, options: { slow?: boolean; onStart?: () => void; onEnd?: () => void } = {}): () => void {
  stopAudio();
  const clean = speechText(text);
  let ended = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    options.onEnd?.();
  };
  const fallback = () => {
    const stop = speakGerman(clean, { rate: options.slow ? 0.65 : 0.9, onStart: options.onStart, onEnd: finish, onError: finish });
    active = { stop: () => { stop(); finish(); } };
  };
  const file = audioFile(clean);
  if (typeof Audio === "undefined" || missing.has(file)) {
    fallback();
    return () => stopAudio();
  }
  const audio = new Audio(`/audio/${file}`);
  audio.playbackRate = options.slow ? 0.72 : 1;
  audio.onplaying = () => options.onStart?.();
  audio.onended = finish;
  audio.onerror = () => {
    missing.add(file);
    if (!ended && active?.stop === stop) fallback();
  };
  const stop = () => { audio.pause(); finish(); };
  active = { stop };
  audio.play().catch((error: unknown) => {
    // Autoplay blocked before any user gesture: the replay button still works. A missing file is handled by onerror.
    if ((error as { name?: string })?.name === "NotAllowedError") finish();
  });
  return () => stopAudio();
}

/** Warm the cache for the next steps' clips so playback starts instantly. */
export function preloadGerman(texts: string[]) {
  if (typeof window === "undefined") return;
  for (const text of texts.slice(0, 6)) {
    const file = audioFile(speechText(text));
    if (missing.has(file)) continue;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = `/audio/${file}`;
    link.as = "audio";
    document.head.appendChild(link);
    setTimeout(() => link.remove(), 30000);
  }
}
