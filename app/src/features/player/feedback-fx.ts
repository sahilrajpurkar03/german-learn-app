"use client";

// Tiny synthesised sound effects (no audio files) plus haptics and confetti.

const SOUND_KEY = "sprechen-sound";
let context: AudioContext | null = null;

export function soundEnabled(): boolean {
  try { return window.localStorage.getItem(SOUND_KEY) !== "off"; } catch { return true; }
}

export function setSoundEnabled(on: boolean) {
  try { window.localStorage.setItem(SOUND_KEY, on ? "on" : "off"); } catch { /* storage unavailable */ }
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  if (context.state === "suspended") void context.resume();
  return context;
}

function tone(ctx: AudioContext, frequency: number, start: number, duration: number, type: OscillatorType, volume: number, glideTo?: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + start);
  if (glideTo) oscillator.frequency.exponentialRampToValueAtTime(glideTo, ctx.currentTime + start + duration);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(ctx.currentTime + start);
  oscillator.stop(ctx.currentTime + start + duration + 0.02);
}

export type Effect = "correct" | "close" | "wrong" | "complete" | "tap";

export function playEffect(effect: Effect) {
  if (effect !== "tap") vibrate(effect);
  if (!soundEnabled()) return;
  const ctx = audio();
  if (!ctx) return;
  if (effect === "correct") { tone(ctx, 784, 0, 0.12, "sine", 0.18); tone(ctx, 1175, 0.09, 0.22, "sine", 0.16); }
  else if (effect === "close") { tone(ctx, 659, 0, 0.14, "sine", 0.15); tone(ctx, 880, 0.1, 0.2, "sine", 0.12); }
  else if (effect === "wrong") { tone(ctx, 247, 0, 0.18, "triangle", 0.16, 196); tone(ctx, 196, 0.14, 0.24, "triangle", 0.12, 165); }
  else if (effect === "complete") [523, 659, 784, 1047].forEach((frequency, index) => tone(ctx, frequency, index * 0.11, 0.35, "sine", 0.16));
  else tone(ctx, 1400, 0, 0.03, "square", 0.03);
}

function vibrate(effect: Effect) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  const pattern = effect === "wrong" ? [40, 60, 40] : effect === "complete" ? [30, 40, 30, 40, 60] : [20];
  try { navigator.vibrate(pattern); } catch { /* unsupported */ }
}

export async function celebrate(intensity: "lesson" | "big" = "lesson") {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  const colors = ["#1f4e8c", "#e6be6c", "#c9973f", "#5fcf98", "#79a8ea"];
  confetti({ particleCount: intensity === "big" ? 160 : 90, spread: 75, startVelocity: 42, origin: { y: 0.65 }, colors, disableForReducedMotion: true });
  if (intensity === "big") setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, disableForReducedMotion: true }), 250);
}
