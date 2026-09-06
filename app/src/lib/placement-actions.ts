"use server";

import { createClient } from "@/lib/supabase/server";
import type { Level } from "@/lib/supabase/database.types";

export async function submitPlacement(level: Level) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("profiles")
    .update({ current_level: level, placement_completed: true })
    .eq("id", user.id);
}
