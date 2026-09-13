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
