import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCheckinQuestions } from "@/lib/content";
import { submitCheckin, recordCheckinAnswer } from "@/lib/placement-actions";
import { PlacementQuiz } from "@/components/placement-quiz";
import type { Level } from "@/lib/supabase/database.types";

export default async function CheckinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_level, next_checkin_at")
    .eq("id", user.id)
    .single();

  const dueNow = !profile?.next_checkin_at || new Date(profile.next_checkin_at) <= new Date();
  if (!dueNow) redirect("/learn");

  const level = (profile?.current_level as Level) ?? "a1";
  const questions = await getCheckinQuestions(user.id, level);

  if (questions.length === 0) {
    // nothing to re-test yet (e.g. brand new account) — just reschedule and continue
    await submitCheckin(level);
    redirect("/learn");
  }

  return (
    <main className="flex min-h-full flex-1 flex-col justify-center px-4 py-8">
      <PlacementQuiz
        questions={questions}
        heading="Progress check-in"
        onFinish={submitCheckin}
        onAnswer={async (q, correct) => {
          "use server";
          await recordCheckinAnswer(q.id, correct);
        }}
        showSkip={false}
      />
    </main>
  );
}
