"use server";

import { createClient } from "@/lib/supabase/server";
import { schedule, initialSrsState } from "@/lib/srs";
import type { ExerciseType, ItemType } from "@/lib/supabase/database.types";

export interface RecordAnswerInput {
  sessionId: string;
  itemType: ItemType;
  itemId: string;
  exerciseType: ExerciseType;
  correct: boolean;
  responseMs: number;
}

function gradeFromCorrectness(correct: boolean): 0 | 4 {
  return correct ? 4 : 0;
}

export async function startSession(mode: "mixed" | "speaking" | "listening" | "vocab") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("practice_sessions")
    .insert({ user_id: user.id, mode })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not start session");
  return data.id as string;
}

export async function recordAnswer(input: RecordAnswerInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("item_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("item_type", input.itemType)
    .eq("item_id", input.itemId)
    .maybeSingle();

  const state = existing
    ? { easeFactor: existing.ease_factor, intervalDays: existing.interval_days, repetitions: existing.repetitions }
    : initialSrsState();

  const grade = gradeFromCorrectness(input.correct);
  const result = schedule(state, grade);

  await supabase.from("item_progress").upsert(
    {
      user_id: user.id,
      item_type: input.itemType,
      item_id: input.itemId,
      ease_factor: result.easeFactor,
      interval_days: result.intervalDays,
      repetitions: result.repetitions,
      due_at: result.dueAt.toISOString(),
      correct_count: (existing?.correct_count ?? 0) + (input.correct ? 1 : 0),
      wrong_count: (existing?.wrong_count ?? 0) + (input.correct ? 0 : 1),
      last_result: input.correct ? "correct" : "wrong",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,item_type,item_id" },
  );

  await supabase.from("session_events").insert({
    session_id: input.sessionId,
    user_id: user.id,
    item_type: input.itemType,
    item_id: input.itemId,
    exercise_type: input.exerciseType,
    correct: input.correct,
    response_ms: input.responseMs,
  });
}

export async function completeSession(sessionId: string, xpEarned: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("practice_sessions")
    .update({ ended_at: new Date().toISOString(), xp_earned: xpEarned })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, streak_current, streak_longest, last_active_date")
    .eq("id", user.id)
    .single();

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  let streakCurrent = profile?.streak_current ?? 0;
  if (profile?.last_active_date === today) {
    // already practiced today, streak unchanged
  } else if (profile?.last_active_date === yesterday) {
    streakCurrent += 1;
  } else {
    streakCurrent = 1;
  }
  const streakLongest = Math.max(profile?.streak_longest ?? 0, streakCurrent);

  await supabase
    .from("profiles")
    .update({
      xp: (profile?.xp ?? 0) + xpEarned,
      streak_current: streakCurrent,
      streak_longest: streakLongest,
      last_active_date: today,
    })
    .eq("id", user.id);

  return { streakCurrent, streakLongest };
}
