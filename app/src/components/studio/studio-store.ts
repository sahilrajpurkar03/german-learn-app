"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import { evidenceSchema } from "@/lib/adaptive-practice";

const answerSchema = z.object({
  id: z.string(),
  value: z.string(),
  skipped: z.boolean().optional(),
});
const schema = z.object({
  version: z.literal(1),
  goal: z.number().min(10).max(45),
  interest: z.string(),
  answers: z.array(answerSchema),
  assessedAt: z.string().nullable(),
  gameBest: z.number().nonnegative().default(0),
  recall: z.record(z.string(), evidenceSchema).default({}),
  reviewPreview: z.object({
    signature: z.string(),
    index: z.number().int().nonnegative(),
    correct: z.number().int().nonnegative(),
    completedAt: z.string().datetime().nullable(),
  }).nullable().default(null),
  dailyRoundsCompleted: z.number().int().nonnegative().default(0),
  dailyRound: z.object({
    id: z.string(),
    targetIds: z.array(z.string()).min(1).max(12),
    initialRecall: z.record(z.string(), evidenceSchema),
    index: z.number().int().nonnegative(),
    correct: z.number().int().nonnegative(),
    completedAt: z.string().datetime().nullable(),
  }).refine((round) => round.index <= round.targetIds.length && round.correct <= round.index).nullable().default(null),
  draft: z
    .object({
      missionId: z.string(),
      index: z.number().int().nonnegative(),
      correct: z.number().int().nonnegative(),
    })
    .nullable(),
  completed: z.record(
    z.string(),
    z.object({ at: z.string(), correct: z.number(), total: z.number() }),
  ),
  phrases: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      meaning: z.string(),
      due: z.string(),
      repetitions: z.number().int().nonnegative(),
    }),
  ),
});

export type StudioState = z.infer<typeof schema>;
const initial: StudioState = {
  version: 1,
  goal: 30,
  interest: "Everyday life",
  answers: [],
  assessedAt: null,
  gameBest: 0,
  recall: {},
  reviewPreview: null,
  dailyRoundsCompleted: 0,
  dailyRound: null,
  draft: null,
  completed: {},
  phrases: [],
};
const signalName = "sprechen-studio-change";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(signalName, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(signalName, callback);
  };
}
function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function parse(raw: string | null): StudioState {
  try {
    const result = schema.safeParse(raw ? JSON.parse(raw) : null);
    return result.success ? result.data : initial;
  } catch {
    return initial;
  }
}

export function useStudioStore(userId: string) {
  const key = `sprechen-studio-v1:${userId}`;
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  function update(transform: (state: StudioState) => StudioState): boolean {
    try {
      window.localStorage.setItem(
        key,
        JSON.stringify(schema.parse(transform(parse(read(key))))),
      );
      window.dispatchEvent(new Event(signalName));
      return true;
    } catch {
      return false;
    }
  }
  return { state: parse(raw), update };
}
