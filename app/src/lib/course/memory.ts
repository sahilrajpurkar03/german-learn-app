import { initialSrsState, schedule } from "../srs.ts";
import { RECOGNITION_TYPES } from "./types.ts";
import type { ExerciseType, Verdict } from "./types.ts";

export type MemoryState = {
  key: string;
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string;
  strength: number;
  lapses: number;
  seen: number;
  correct: number;
  introducedAt: string;
  lastSeenAt: string;
};

export function gradeFor(verdict: Verdict, type: ExerciseType, retry: boolean): 0 | 1 | 2 | 3 | 4 | 5 | null {
  if (verdict === "seen") return null;
  if (verdict === "wrong") return 1;
  if (verdict === "close" || retry) return 3;
  return RECOGNITION_TYPES.has(type) ? 3 : 4;
}

/** 0 → just met, 1 → remembered for about two months. Shown as a strength bar. */
export function strengthOf(intervalDays: number, repetitions: number, seen: number): number {
  if (!seen) return 0;
  const base = Math.log2(1 + Math.max(0, intervalDays)) / Math.log2(61);
  return Math.round(Math.min(1, Math.max(repetitions > 0 ? 0.1 : 0.04, base)) * 100) / 100;
}

export function introduce(key: string, now: Date, previous?: MemoryState): MemoryState {
  if (previous) return previous;
  const at = now.toISOString();
  return { key, ...fromSrs(initialSrsState()), dueAt: new Date(now.getTime() + 10 * 60000).toISOString(), strength: 0.04, lapses: 0, seen: 1, correct: 0, introducedAt: at, lastSeenAt: at };
}

function fromSrs(state: { easeFactor: number; intervalDays: number; repetitions: number }) {
  return { ease: state.easeFactor, intervalDays: state.intervalDays, repetitions: state.repetitions };
}

/** Practising an item before it is due never postpones its next check; a mistake always brings it back. */
export function applyGrade(previous: MemoryState | undefined, key: string, grade: 0 | 1 | 2 | 3 | 4 | 5, now: Date): MemoryState {
  const at = now.toISOString();
  const due = !previous || previous.repetitions === 0 || new Date(previous.dueAt) <= now;
  const scheduled = due || grade < 3
    ? schedule(previous ? { easeFactor: previous.ease, intervalDays: previous.intervalDays, repetitions: previous.repetitions } : initialSrsState(), grade, now)
    : null;
  const ease = scheduled?.easeFactor ?? previous!.ease;
  const intervalDays = scheduled?.intervalDays ?? previous!.intervalDays;
  const repetitions = scheduled?.repetitions ?? previous!.repetitions;
  const seen = (previous?.seen ?? 0) + 1;
  return {
    key,
    ease: Math.round(ease * 1000) / 1000,
    intervalDays,
    repetitions,
    dueAt: scheduled ? scheduled.dueAt.toISOString() : previous!.dueAt,
    strength: strengthOf(intervalDays, repetitions, seen),
    lapses: (previous?.lapses ?? 0) + Number(grade < 3 && (previous?.repetitions ?? 0) > 0),
    seen,
    correct: (previous?.correct ?? 0) + Number(grade >= 3),
    introducedAt: previous?.introducedAt ?? at,
    lastSeenAt: at,
  };
}

export function isDue(state: MemoryState, now: Date): boolean {
  return new Date(state.dueAt) <= now;
}
