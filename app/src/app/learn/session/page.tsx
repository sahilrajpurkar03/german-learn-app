import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildSession } from "@/lib/content";
import { startSession } from "@/lib/session-actions";
import { SessionRunner } from "@/components/session-runner";
import type { Level } from "@/lib/supabase/database.types";

export default async function SessionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_level, placement_completed")
    .eq("id", user.id)
    .single();
  if (!profile?.placement_completed) redirect("/learn/placement");
  const level = (profile?.current_level as Level) ?? "a1";

  const [items, sessionId] = await Promise.all([buildSession(user.id, level), startSession("mixed")]);

  return (
    <SessionRunner sessionId={sessionId} items={items} userId={user.id} />
  );
}
