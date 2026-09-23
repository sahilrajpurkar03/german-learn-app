import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSnapshot } from "@/lib/learning/guard";
import { reviewSubject } from "@/lib/course/catalog";
import { planReview, reviewStepFor } from "@/lib/course/review";
import { REVIEW_LESSON_ID } from "@/lib/course/progress";
import { customResolver } from "@/lib/learning/items";
import { visibleStreak } from "@/lib/course/activity";
import { Player } from "@/features/player/player";

export const metadata: Metadata = { title: "Review · Sprechen" };

export default async function ReviewSessionPage({ searchParams }: { searchParams: Promise<{ extra?: string }> }) {
  const extra = (await searchParams).extra === "1";
  const { client, user, snapshot } = await requireSnapshot();
  const states = planReview(snapshot.memory, new Date(), 12, extra);
  const custom = await customResolver(client, user.id, states.map((state) => state.key));
  const steps = states.flatMap((state) => {
    const subject = reviewSubject(state.key, custom);
    return subject ? [reviewStepFor(subject, state)] : [];
  });
  if (!steps.length) redirect("/review");
  const todayXp = snapshot.days.find((day) => day.date === snapshot.today)?.xp ?? 0;
  return (
    <Player
      mode="online" lessonId={REVIEW_LESSON_ID} runId={crypto.randomUUID()} kind="review"
      title="Review" goal="Everything you just practised is now scheduled for its next check."
      steps={steps} exitHref="/review" nextHref="/today" nextLabel="Back to today"
      daily={snapshot.available ? { todayXp, goalXp: snapshot.settings.daily_goal_xp, streak: visibleStreak(snapshot.stats, snapshot.today), xpTotal: snapshot.stats.xpTotal } : null}
    />
  );
}
