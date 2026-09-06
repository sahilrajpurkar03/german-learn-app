"use server";

import { createClient } from "@/lib/supabase/server";
import { schedule, initialSrsState } from "@/lib/srs";
import { nextCheckinDate } from "@/lib/content";
import type { Level } from "@/lib/supabase/database.types";

export async function submitPlacement(level: Level) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("profiles")
    .update({ current_level: level, placement_completed: true, next_checkin_at: nextCheckinDate() })
    .eq("id", user.id);
}

export async function submitCheckin(level: Level) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("profiles")
    .update({ current_level: level, next_checkin_at: nextCheckinDate() })
    .eq("id", user.id);
}

// updates SRS scheduling for an item answered during a check-in, so items the
// learner has clearly mastered get pushed out (repeat less), and shaky ones stay in rotation
export async function recordCheckinAnswer(itemId: string, correct: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("item_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("item_type", "vocab")
    .eq("item_id", itemId)
    .maybeSingle();

  const state = existing
    ? { easeFactor: existing.ease_factor, intervalDays: existing.interval_days, repetitions: existing.repetitions }
    : initialSrsState();

  const result = schedule(state, correct ? 4 : 0);

  await supabase.from("item_progress").upsert(
    {
      user_id: user.id,
      item_type: "vocab",
      item_id: itemId,
      ease_factor: result.easeFactor,
      interval_days: result.intervalDays,
      repetitions: result.repetitions,
      due_at: result.dueAt.toISOString(),
      correct_count: (existing?.correct_count ?? 0) + (correct ? 1 : 0),
      wrong_count: (existing?.wrong_count ?? 0) + (correct ? 0 : 1),
      last_result: correct ? "correct" : "wrong",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,item_type,item_id" },
  );
}
