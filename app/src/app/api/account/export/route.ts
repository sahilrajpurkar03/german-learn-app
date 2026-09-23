import type { SupabaseClient } from "@supabase/supabase-js";
import { privateJson } from "@/lib/chapter-http";
import { currentLearner } from "@/lib/learning/server";

// Everything stored about the signed-in learner, as one JSON file. Read with the learner's own
// session, so row-level security guarantees it contains only their rows.
const TABLES = [
  "profiles", "learner_settings", "learner_stats", "daily_activity", "lesson_progress", "learner_items", "learning_events",
  "personal_chapters", "personal_chapter_progress", "personal_chapter_reviews",
  "item_progress", "practice_sessions", "session_events",
] as const;

export async function GET() {
  const learner = await currentLearner();
  if (!learner) return privateJson({ error: "Sign in first." }, 401);
  const { user } = learner;
  // Loops over table names, so use the untyped client; RLS still limits every read to this user.
  const client = learner.client as unknown as SupabaseClient;
  const data: Record<string, unknown> = {};
  for (const table of TABLES) {
    const column = table === "profiles" ? "id" : "user_id";
    const { data: rows, error } = await client.from(table).select("*").eq(column, user.id).limit(10000);
    data[table] = error ? null : rows;
  }
  const push = await client.from("push_subscriptions").select("created_at, last_sent_on, last_recap_on").eq("user_id", user.id);
  data.push_subscriptions = push.error ? null : push.data;
  const body = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at, sign_in_methods: user.app_metadata?.providers ?? [] },
    note: "Tables shown as null do not exist on this server yet. Progress kept only in a browser (older app version) is not included; it stays on that device.",
    data,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="sprechen-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
