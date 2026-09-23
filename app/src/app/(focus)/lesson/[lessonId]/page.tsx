import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSnapshot } from "@/lib/learning/guard";
import { coursePath, getItem, getLesson, reviewSubject } from "@/lib/course/catalog";
import { customLesson, parseCustomLessonId } from "@/lib/course/custom";
import { chapterBlueprintSchema } from "@/lib/personal-chapters";
import { planReview, reviewStepFor } from "@/lib/course/review";
import { customResolver } from "@/lib/learning/items";
import type { Lesson } from "@/lib/course/types";
import { visibleStreak } from "@/lib/course/activity";
import { Player } from "@/features/player/player";

export const metadata: Metadata = { title: "Lesson · Sprechen" };

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const { client, user, snapshot } = await requireSnapshot();
  let lesson: Lesson | undefined = getLesson(lessonId);
  const custom = parseCustomLessonId(lessonId);
  if (!lesson && custom) {
    const { data } = await client.from("personal_chapters").select("blueprint").eq("id", custom.chapterId).eq("user_id", user.id).maybeSingle();
    const blueprint = chapterBlueprintSchema.safeParse(data?.blueprint);
    if (blueprint.success) lesson = customLesson(custom.chapterId, blueprint.data, custom.variant);
  }
  if (!lesson) notFound();

  const progress = snapshot.lessons[lesson.id];
  const resuming = progress?.status === "started" && progress.stepIndex > 0 && progress.stepIndex < lesson.steps.length && Boolean(progress.lastRunId);
  const now = new Date();
  // A short warm-up of due reviews before new material (not before checkpoints, not when resuming).
  const warmStates = lesson.kind === "core" && !resuming ? planReview(snapshot.memory, now, 2) : [];
  const resolveCustom = await customResolver(client, user.id, warmStates.map((state) => state.key));
  const warmup = warmStates.flatMap((state) => {
    const subject = reviewSubject(state.key, resolveCustom);
    return subject ? [reviewStepFor(subject, state)] : [];
  });

  const path = coursePath();
  const position = path.findIndex((entry) => entry.id === lesson.id);
  const next = position >= 0 ? path[position + 1] : undefined;
  const exitHref = custom ? "/custom" : lesson.unitId.startsWith("a1-") ? `/course/${lesson.unitId}` : "/course";
  const todayXp = snapshot.days.find((day) => day.date === snapshot.today)?.xp ?? 0;

  return (
    <Player
      mode="online"
      lessonId={lesson.id}
      runId={resuming ? progress!.lastRunId! : crypto.randomUUID()}
      kind={lesson.kind}
      title={lesson.title}
      goal={lesson.goal}
      steps={[...warmup, ...lesson.steps]}
      warmupCount={warmup.length}
      startIndex={resuming ? progress!.stepIndex : 0}
      exitHref={exitHref}
      nextHref={next && !custom ? "/today" : exitHref}
      nextLabel={next && !custom ? "Continue" : "Back"}
      learned={lesson.introduces.flatMap((key) => { const item = getItem(key); return item ? [{ de: item.de, en: item.en }] : []; })}
      daily={snapshot.available ? { todayXp, goalXp: snapshot.settings.daily_goal_xp, streak: visibleStreak(snapshot.stats, snapshot.today), xpTotal: snapshot.stats.xpTotal } : null}
    />
  );
}
