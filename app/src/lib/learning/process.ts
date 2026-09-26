import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types.ts";
import { chapterBlueprintSchema } from "../personal-chapters.ts";
import { findStep, getLesson, type ExternalContent } from "../course/catalog.ts";
import { customItems, customLesson, parseCustomItemKey, parseCustomLessonId } from "../course/custom.ts";
import { parseReviewStepId } from "../course/review.ts";
import { applyActivity, applyToMemory, clampTime, completionOutcome, REVIEW_LESSON_ID, scoreAttempts, type Attempt, type DayChange, type RunEvent } from "../course/progress.ts";
import { EMPTY_STATS, addDays, localDate, visibleStreak } from "../course/activity.ts";
import { GRADED_TYPES } from "../course/types.ts";
import type { MemoryState } from "../course/memory.ts";
import type { LearnerItemRow, LearnerSettingsRow } from "./tables.ts";

// Scores a batch of answers and stores the result. Kept free of Next.js imports so it can be
// tested against a real Postgres (process.test.ts). server.ts supplies the service-role client.

export type Client = SupabaseClient<Database>;

export class LearningError extends Error {
  status: number;
  stage?: string;
  code?: string;
  reason?: string;
  constructor(status: number, message: string, stage?: string, code?: string, reason?: string) {
    super(message);
    this.status = status;
    this.stage = stage;
    this.code = code;
    this.reason = reason;
  }
}

export function missingTable(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

/** `stage` names the step that failed; the database error code is passed on (never row data) so a failed save can be traced. */
export function fail(error: unknown, stage = "storage") {
  if (!error) return;
  const { code, message } = error as { code?: string; message?: string };
  console.error("[learning]", stage, code ?? "", message ?? "");
  // The database's wording (e.g. "permission denied for table x") is safe to show the signed-in learner; cap its length.
  const reason = (message ?? "").replace(/\s+/g, " ").replace(/\(.*?\)/g, "").trim().slice(0, 140) || undefined;
  throw new LearningError(503, "Progress storage is unavailable. Your answers are kept on this device and will be sent again.", stage, code, reason);
}

export const DEFAULT_SETTINGS: Omit<LearnerSettingsRow, "user_id" | "updated_at"> = {
  daily_goal_xp: 30, timezone: "Europe/Berlin", reminder_hour: null, sound_on: true, motivation: null, start_unit: 1, placed_at: null, legacy_imported_at: null,
};

export function toMemory(row: LearnerItemRow): MemoryState {
  return {
    key: row.item_key, ease: Number(row.ease), intervalDays: Number(row.interval_days), repetitions: row.repetitions, dueAt: row.due_at,
    strength: row.strength, lapses: row.lapses, seen: row.seen_count, correct: row.correct_count, introducedAt: row.introduced_at, lastSeenAt: row.last_seen_at,
  };
}

export function fromMemory(userId: string, state: MemoryState): LearnerItemRow {
  return {
    user_id: userId, item_key: state.key, ease: state.ease, interval_days: state.intervalDays, repetitions: state.repetitions, due_at: state.dueAt,
    strength: state.strength, lapses: state.lapses, seen_count: state.seen, correct_count: state.correct, introduced_at: state.introducedAt, last_seen_at: state.lastSeenAt,
    source: state.key.startsWith("c.") ? "custom" : state.key.startsWith("t.") ? "conversation" : "course",
  };
}

async function customContent(db: Client, userId: string, attempts: Attempt[]): Promise<ExternalContent> {
  const ids = new Set<string>();
  for (const attempt of attempts) {
    const lesson = parseCustomLessonId(attempt.lessonId);
    if (lesson) ids.add(lesson.chapterId);
    const review = parseReviewStepId(attempt.stepId);
    const item = review && parseCustomItemKey(review.key);
    if (item) ids.add(item.chapterId);
  }
  if (!ids.size) return {};
  const { data, error } = await db.from("personal_chapters").select("id, blueprint").eq("user_id", userId).in("id", [...ids]);
  fail(error);
  const blueprints = new Map((data ?? []).flatMap((row) => {
    const parsed = chapterBlueprintSchema.safeParse(row.blueprint);
    return parsed.success ? [[row.id, parsed.data] as const] : [];
  }));
  return {
    lesson: (lessonId) => {
      const parsed = parseCustomLessonId(lessonId);
      const blueprint = parsed && blueprints.get(parsed.chapterId);
      return parsed && blueprint ? customLesson(parsed.chapterId, blueprint, parsed.variant) : undefined;
    },
    item: (key) => {
      const parsed = parseCustomItemKey(key);
      const blueprint = parsed && blueprints.get(parsed.chapterId);
      if (!parsed || !blueprint) return null;
      const pool = customItems(parsed.chapterId, blueprint);
      const item = pool[parsed.index];
      return item ? { item, pool } : null;
    },
  };
}

export type BatchResult = {
  results: { attemptId: string; verdict: string; xp: number }[];
  todayXp: number;
  goalXp: number;
  streak: number;
  xpTotal: number;
};

/** Score a batch of answers on the server and update memory, lesson progress, XP and streak. Idempotent per attempt id. */
export async function processBatch(db: Client, userId: string, attempts: Attempt[], now = new Date()): Promise<BatchResult> {
  const settingsResult = await db.from("learner_settings").select("*").eq("user_id", userId).maybeSingle();
  if (missingTable(settingsResult.error)) throw new LearningError(503, "Progress storage is not set up yet (migration 0006).", "settings", settingsResult.error?.code);
  fail(settingsResult.error, "settings");
  const settings = settingsResult.data ?? { ...DEFAULT_SETTINGS, user_id: userId, updated_at: now.toISOString() };

  const runIds = [...new Set(attempts.map((attempt) => attempt.runId))];
  const prior = await db.from("learning_events").select("attempt_id, run_id, step_id, verdict, retry").eq("user_id", userId).in("run_id", runIds);
  fail(prior.error, "history");
  const seenIds = new Set((prior.data ?? []).map((row) => row.attempt_id));
  const fresh = attempts.filter((attempt) => !seenIds.has(attempt.attemptId));
  const earlierWrong = new Set((prior.data ?? []).filter((row) => row.verdict === "wrong").map((row) => `${row.run_id}|${row.step_id}`));
  const external = await customContent(db, userId, fresh);
  const scored = scoreAttempts(fresh, (stepId) => findStep(stepId, external), earlierWrong);

  // Completion bonuses need the whole run: earlier batches plus this one.
  const outcomes = new Map<string, ReturnType<typeof completionOutcome>>();
  for (const attempt of scored.filter((entry) => entry.kind === "complete")) {
    const runEvents: RunEvent[] = [
      ...(prior.data ?? []).filter((row) => row.run_id === attempt.runId).map((row) => ({ stepId: row.step_id, verdict: row.verdict, retry: row.retry })),
      ...scored.filter((entry) => entry.runId === attempt.runId && entry.kind === "answer").map((entry) => ({ stepId: entry.stepId, verdict: entry.verdict, retry: entry.retry })),
    ];
    const lesson = attempt.lessonId === REVIEW_LESSON_ID ? null : getLesson(attempt.lessonId) ?? external.lesson?.(attempt.lessonId) ?? null;
    const outcome = completionOutcome(lesson, attempt.lessonId, runEvents);
    outcomes.set(attempt.attemptId, outcome);
    attempt.xp = outcome.bonus;
  }

  const rows = scored.map((attempt) => ({
    attempt_id: attempt.attemptId, user_id: userId, run_id: attempt.runId, lesson_id: attempt.lessonId, step_id: attempt.stepId,
    item_keys: attempt.step?.itemKeys ?? [], exercise_type: attempt.step?.type ?? "complete", verdict: attempt.verdict, retry: attempt.retry, xp: attempt.xp,
    answer: attempt.kind === "answer" ? attempt.answer.slice(0, 500) : null, response_ms: attempt.responseMs, occurred_at: clampTime(attempt.occurredAt, now).toISOString(),
  }));
  const inserted = rows.length
    ? await db.from("learning_events").upsert(rows, { onConflict: "attempt_id", ignoreDuplicates: true }).select("attempt_id")
    : { data: [], error: null };
  fail(inserted.error, "events");
  const insertedIds = new Set((inserted.data ?? []).map((row) => row.attempt_id));
  const applied = scored.filter((attempt) => insertedIds.has(attempt.attemptId));

  // Memory
  const keys = [...new Set(applied.flatMap((attempt) => attempt.step?.itemKeys ?? []))];
  if (keys.length) {
    const existing = await db.from("learner_items").select("*").eq("user_id", userId).in("item_key", keys);
    fail(existing.error, "memory-read");
    const states = new Map((existing.data ?? []).map((row) => [row.item_key, toMemory(row)]));
    const changed = applyToMemory(states, applied, now);
    if (changed.length) fail((await db.from("learner_items").upsert(changed.map((state) => fromMemory(userId, state)), { onConflict: "user_id,item_key" })).error, "memory-write");
  }

  // Activity, XP, streak
  const today = localDate(now, settings.timezone);
  const [daysResult, statsResult] = await Promise.all([
    db.from("daily_activity").select("*").eq("user_id", userId).gte("local_date", addDays(today, -10)),
    db.from("learner_stats").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  fail(daysResult.error || statsResult.error, "activity-read");
  const stats = statsResult.data;
  const change: DayChange = {
    days: new Map((daysResult.data ?? []).map((day) => [day.local_date, { date: day.local_date, xp: day.xp, goalXp: day.goal_xp, goalMet: day.goal_met, freezeUsed: day.freeze_used, gradedSteps: day.graded_steps, lessons: day.lessons, reviews: day.reviews }])),
    stats: stats ? { current: stats.streak_current, longest: stats.streak_longest, lastDate: stats.streak_last_date, freezes: stats.freezes, freezeProgress: stats.freeze_progress } : EMPTY_STATS,
    xpTotal: stats?.xp_total ?? 0,
  };
  const touched = new Set<string>();
  for (const attempt of applied) {
    const outcome = outcomes.get(attempt.attemptId);
    const graded = attempt.step && GRADED_TYPES.has(attempt.step.type) ? 1 : 0;
    const counts = attempt.kind === "complete"
      ? { lessons: outcome?.passed && attempt.lessonId !== REVIEW_LESSON_ID ? 1 : 0, reviews: outcome?.passed && attempt.lessonId === REVIEW_LESSON_ID ? 1 : 0 }
      : { graded };
    applyActivity(change, clampTime(attempt.occurredAt, now), settings.timezone, settings.daily_goal_xp, attempt.xp, counts);
  }
  for (const date of change.days.keys()) touched.add(date);
  if (applied.length) {
    const dayRows = [...change.days.values()].filter((day) => touched.has(day.date)).map((day) => ({
      user_id: userId, local_date: day.date, xp: day.xp, graded_steps: day.gradedSteps, lessons: day.lessons, reviews: day.reviews, goal_xp: day.goalXp, goal_met: day.goalMet, freeze_used: day.freezeUsed,
    }));
    const statsRow = {
      user_id: userId, xp_total: change.xpTotal, streak_current: change.stats.current, streak_longest: change.stats.longest, streak_last_date: change.stats.lastDate,
      freezes: change.stats.freezes, freeze_progress: change.stats.freezeProgress, updated_at: now.toISOString(),
    };
    const [dayWrite, statsWrite] = await Promise.all([
      db.from("daily_activity").upsert(dayRows, { onConflict: "user_id,local_date" }),
      db.from("learner_stats").upsert(statsRow, { onConflict: "user_id" }),
    ]);
    fail(dayWrite.error || statsWrite.error, "activity-write");
  }

  // Lesson progress
  const lessonIds = [...new Set(applied.map((attempt) => attempt.lessonId).filter((id) => id !== REVIEW_LESSON_ID))];
  if (lessonIds.length) {
    const current = await db.from("lesson_progress").select("*").eq("user_id", userId).in("lesson_id", lessonIds);
    fail(current.error, "progress-read");
    const byId = new Map((current.data ?? []).map((row) => [row.lesson_id, row]));
    const updates = lessonIds.map((lessonId) => {
      const row = byId.get(lessonId);
      const ofLesson = applied.filter((attempt) => attempt.lessonId === lessonId);
      const completion = ofLesson.map((attempt) => outcomes.get(attempt.attemptId)).find((outcome) => outcome?.counted);
      const stepIndex = Math.max(row?.step_index ?? 0, ...ofLesson.map((attempt) => attempt.stepIndex));
      const passed = Boolean(completion?.passed);
      return {
        user_id: userId, lesson_id: lessonId,
        status: (row?.status === "completed" || passed ? "completed" : "started") as "completed" | "started",
        step_index: passed ? 0 : stepIndex,
        best_score: completion ? Math.max(row?.best_score ?? 0, completion.score) : row?.best_score ?? null,
        completed_count: (row?.completed_count ?? 0) + Number(passed),
        last_run_id: ofLesson.at(-1)!.runId,
        updated_at: now.toISOString(),
        completed_at: passed ? now.toISOString() : row?.completed_at ?? null,
      };
    });
    fail((await db.from("lesson_progress").upsert(updates, { onConflict: "user_id,lesson_id" })).error, "progress-write");
  }

  const todayRow = change.days.get(today);
  return {
    results: scored.map((attempt) => ({ attemptId: attempt.attemptId, verdict: attempt.verdict, xp: insertedIds.has(attempt.attemptId) ? attempt.xp : 0 })),
    todayXp: todayRow?.xp ?? 0,
    goalXp: settings.daily_goal_xp,
    streak: visibleStreak(change.stats, today),
    xpTotal: change.xpTotal,
  };
}
