import type { Metadata } from "next";
import { displayName, requireSnapshot } from "@/lib/learning/guard";
import { catalog, coursePath, getOutline } from "@/lib/course/catalog";
import { nextAction, nextLesson, type CourseState } from "@/lib/course/next-action";
import { localHour, visibleStreak, weekStrip } from "@/lib/course/activity";
import { TodayView, type TodayHero } from "@/features/today/today-view";

export const metadata: Metadata = { title: "Today · Sprechen" };

export default async function TodayPage() {
  const { client, user, snapshot } = await requireSnapshot();
  const now = new Date();
  const name = await displayName(client, user.id);
  const due = snapshot.memory.filter((state) => new Date(state.dueAt) <= now).length;
  const { units } = catalog();
  const path = coursePath();
  const state: CourseState = {
    placed: Boolean(snapshot.settings.placed_at) || Object.keys(snapshot.lessons).length > 0,
    startUnit: snapshot.settings.start_unit,
    lessons: snapshot.lessons,
    dueCount: due,
  };
  const action = nextAction(path, units, state);
  let hero: TodayHero;
  if (action.kind === "lesson") {
    const outline = getOutline(action.unit.id)!;
    const unitLessons = [...outline.core, outline.checkpoint];
    hero = {
      kind: "lesson", href: action.href, eyebrow: action.detail, title: action.lesson.title, detail: action.lesson.goal,
      emoji: action.lesson.kind === "checkpoint" ? "🏆" : action.lesson.kind === "conversation" ? "💬" : action.unit.emoji,
      button: action.resume ? "Continue lesson" : action.lesson.kind === "checkpoint" ? "Take the checkpoint" : "Start lesson",
      unitProgress: { done: unitLessons.filter((lesson) => snapshot.lessons[lesson.id]?.status === "completed").length, total: unitLessons.length },
      resume: action.resume,
    };
  } else if (action.kind === "review") {
    hero = { kind: "review", href: action.href, eyebrow: "Review first", title: action.title, detail: action.detail, emoji: "🧠", button: "Start review" };
  } else if (action.kind === "placement") {
    hero = { kind: "placement", href: action.href, eyebrow: "Welcome to Sprechen", title: action.title, detail: action.detail, emoji: "👋", button: "Let's go" };
  } else {
    hero = { kind: "done", href: action.href, eyebrow: "Course", title: action.title, detail: action.detail, emoji: "🏅", button: "Open the course" };
  }

  let secondary: { href: string; label: string; detail: string } | null = null;
  if (action.kind === "lesson" && due > 0) secondary = { href: "/review/session", label: `Review ${Math.min(due, 15)} due ${due === 1 ? "word" : "words"}`, detail: "Short and sweet — keeps them from fading." };
  else if (action.kind === "review") {
    const upcoming = nextLesson(path, units, state);
    if (upcoming) secondary = { href: `/lesson/${upcoming.id}`, label: `Next: ${upcoming.title}`, detail: "Your next lesson is ready after the review." };
  }

  const hour = localHour(now, snapshot.settings.timezone);
  const greeting = hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
  const todayXp = snapshot.days.find((day) => day.date === snapshot.today)?.xp ?? 0;
  return (
    <TodayView
      name={name} greeting={greeting}
      streak={visibleStreak(snapshot.stats, snapshot.today)} freezes={snapshot.stats.freezes}
      todayXp={todayXp} goalXp={snapshot.settings.daily_goal_xp}
      hero={hero} secondary={secondary} week={weekStrip(snapshot.days, snapshot.today)}
      notice={snapshot.available ? null : "Progress storage isn't set up on this server yet (database migration 0006). Lessons work, but progress won't be saved."}
    />
  );
}
