import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient } from "../supabase/server";
import { describeServiceKey } from "../supabase/keys";
import type { Database } from "../supabase/database.types";
import { EMPTY_STATS, addDays, localDate, type DayActivity, type StreakStats } from "../course/activity";
import type { LessonState } from "../course/next-action";
import type { LearnerSettingsRow } from "./tables";
import { DEFAULT_SETTINGS, LearningError, missingTable, fail, processBatch as processWithClient, toMemory, type BatchResult, type Client } from "./process";
import type { Attempt } from "../course/progress";
import type { MemoryState } from "../course/memory";

export function learningAdmin(): Client {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new LearningError(503, "Progress storage is not configured on this server yet (missing service key).", "config", "no-service-key");
  const problem = describeServiceKey(key).problem;
  if (problem) throw new LearningError(503, `The server's SUPABASE_SERVICE_ROLE_KEY is wrong: ${problem} Replace it in Vercel with the secret (service_role) key and redeploy.`, "config", "wrong-service-key");
  return createSupabaseClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function currentLearner() {
  const client = await createClient();
  const { data } = await client.auth.getUser();
  return data.user ? { client, user: data.user } : null;
}

function settingsOf(row: Partial<LearnerSettingsRow>): LearnerSnapshot["settings"] {
  return {
    daily_goal_xp: row.daily_goal_xp ?? DEFAULT_SETTINGS.daily_goal_xp, timezone: row.timezone ?? DEFAULT_SETTINGS.timezone,
    reminder_hour: row.reminder_hour ?? null, sound_on: row.sound_on ?? true, motivation: row.motivation ?? null,
    start_unit: row.start_unit ?? 1, placed_at: row.placed_at ?? null, legacy_imported_at: row.legacy_imported_at ?? null,
  };
}

export type LearnerSnapshot = {
  available: boolean;
  settings: Omit<LearnerSettingsRow, "user_id" | "updated_at">;
  hasSettings: boolean;
  stats: StreakStats & { xpTotal: number };
  days: DayActivity[];
  lessons: Record<string, LessonState & { bestScore: number | null; completedCount: number; lastRunId: string | null }>;
  memory: MemoryState[];
  today: string;
};

/** Everything the app shell needs, read with the learner's own (RLS-restricted) session. */
export async function loadSnapshot(client: Client, userId: string, now = new Date()): Promise<LearnerSnapshot> {
  const [settings, stats, progress, items] = await Promise.all([
    client.from("learner_settings").select("*").eq("user_id", userId).maybeSingle(),
    client.from("learner_stats").select("*").eq("user_id", userId).maybeSingle(),
    client.from("lesson_progress").select("*").eq("user_id", userId),
    client.from("learner_items").select("*").eq("user_id", userId).limit(5000),
  ]);
  const unavailable = [settings.error, stats.error, progress.error, items.error].some((error) => missingTable(error));
  const base = settings.data ?? { ...DEFAULT_SETTINGS };
  const today = localDate(now, base.timezone);
  if (unavailable) return { available: false, settings: settingsOf(base), hasSettings: false, stats: { ...EMPTY_STATS, xpTotal: 0 }, days: [], lessons: {}, memory: [], today };
  fail(settings.error || stats.error || progress.error || items.error);
  const days = await client.from("daily_activity").select("*").eq("user_id", userId).gte("local_date", addDays(today, -13)).order("local_date");
  fail(days.error);
  return {
    available: true,
    settings: settingsOf(base),
    hasSettings: Boolean(settings.data),
    stats: stats.data
      ? { current: stats.data.streak_current, longest: stats.data.streak_longest, lastDate: stats.data.streak_last_date, freezes: stats.data.freezes, freezeProgress: stats.data.freeze_progress, xpTotal: stats.data.xp_total }
      : { ...EMPTY_STATS, xpTotal: 0 },
    days: (days.data ?? []).map((day) => ({ date: day.local_date, xp: day.xp, goalXp: day.goal_xp, goalMet: day.goal_met, freezeUsed: day.freeze_used, reviews: day.reviews })),
    lessons: Object.fromEntries((progress.data ?? []).map((row) => [row.lesson_id, { status: row.status, stepIndex: row.step_index, bestScore: row.best_score, completedCount: row.completed_count, lastRunId: row.last_run_id }])),
    memory: (items.data ?? []).map(toMemory),
    today,
  };
}

export const attemptSchema = z.object({
  attemptId: z.string().uuid(),
  runId: z.string().uuid(),
  lessonId: z.string().min(1).max(120),
  stepId: z.string().min(1).max(240),
  kind: z.enum(["answer", "complete"]),
  answer: z.string().max(500),
  responseMs: z.number().int().min(0).max(3600000),
  occurredAt: z.string().datetime({ offset: true }),
  stepIndex: z.number().int().min(0).max(200),
}).strict();
export const batchSchema = z.object({ attempts: z.array(attemptSchema).min(1).max(60) }).strict();


export { DEFAULT_SETTINGS, LearningError, toMemory };
export type { BatchResult };

export function processBatch(userId: string, attempts: Attempt[], now = new Date()): Promise<BatchResult> {
  return processWithClient(learningAdmin(), userId, attempts, now);
}
