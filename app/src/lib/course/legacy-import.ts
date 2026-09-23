import { z } from "zod";
import { strengthOf, type MemoryState } from "./memory.ts";
import { conversationLessonId, turnItemKey } from "./conversations.ts";
import type { Item } from "./types.ts";

// One-time import of the v1 device-local studio record (`sprechen-studio-v1:<userId>`).
// v1 tracked whole conversation responses; each becomes the matching `t.` phrase item.

const evidence = z.object({
  attempts: z.number().int().nonnegative(),
  independent: z.number().int().nonnegative(),
  lastAt: z.string(),
  dueAt: z.string(),
  easeFactor: z.number().min(1.3).max(5),
  intervalDays: z.number().min(0).max(3650),
  repetitions: z.number().int().min(0).max(1000),
}).passthrough();

export const legacyImportSchema = z.object({
  goal: z.number().min(10).max(45).optional(),
  recall: z.record(z.string().max(80), evidence).optional(),
  completed: z.record(z.string().max(80), z.object({ at: z.string() }).passthrough()).optional(),
  phrases: z.array(z.object({ text: z.string().max(200), due: z.string() }).passthrough()).max(500).optional(),
}).strip();
export type LegacyImport = z.infer<typeof legacyImportSchema>;

const validDate = (value: string, fallback: string) => (Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : fallback);

export function goalFromMinutes(minutes: number | undefined): 30 | 50 | 80 | undefined {
  if (!minutes) return undefined;
  return minutes >= 45 ? 80 : minutes >= 30 ? 50 : 30;
}

export function mapLegacy(input: LegacyImport, lookup: (key: string) => Item | undefined, turnItems: Item[], now: Date): { items: MemoryState[]; completedLessons: { lessonId: string; at: string }[]; goalXp?: 30 | 50 | 80 } {
  const nowIso = now.toISOString();
  const items = new Map<string, MemoryState>();
  for (const [id, entry] of Object.entries(input.recall ?? {}).slice(0, 2000)) {
    const match = /^([a-z0-9-]+):(\d+)$/.exec(id);
    if (!match) continue;
    const key = turnItemKey(match[1], Number(match[2]));
    if (!lookup(key)) continue;
    items.set(key, {
      key, ease: entry.easeFactor, intervalDays: entry.intervalDays, repetitions: entry.repetitions,
      dueAt: validDate(entry.dueAt, nowIso), strength: strengthOf(entry.intervalDays, entry.repetitions, entry.attempts),
      lapses: 0, seen: entry.attempts, correct: entry.independent, introducedAt: validDate(entry.lastAt, nowIso), lastSeenAt: validDate(entry.lastAt, nowIso),
    });
  }
  const turnByText = new Map<string, string>();
  for (const item of turnItems) turnByText.set(item.de.toLocaleLowerCase("de").replace(/[.!?]$/, ""), item.id);
  for (const phrase of input.phrases ?? []) {
    const key = turnByText.get(phrase.text.toLocaleLowerCase("de").replace(/[.!?]$/, ""));
    if (!key || items.has(key)) continue;
    items.set(key, { key, ease: 2.5, intervalDays: 0, repetitions: 0, dueAt: validDate(phrase.due, nowIso), strength: 0.04, lapses: 0, seen: 1, correct: 0, introducedAt: nowIso, lastSeenAt: nowIso });
  }
  const completedLessons = Object.entries(input.completed ?? {}).filter(([missionId]) => /^[a-z0-9-]+$/.test(missionId)).map(([missionId, entry]) => ({ lessonId: conversationLessonId(missionId), at: validDate(entry.at, nowIso) }));
  return { items: [...items.values()], completedLessons, goalXp: goalFromMinutes(input.goal) };
}

