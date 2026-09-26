import type { Band } from "../learning-engine.ts";
import type { Lesson, Unit } from "./types.ts";

export const REVIEW_FIRST_THRESHOLD = 12;

export type LessonState = { status: "started" | "completed"; stepIndex: number };
export type CourseState = {
  placed: boolean;
  startUnit: number;
  lessons: Record<string, LessonState>;
  dueCount: number;
  /** A review session was finished today: leftover due words are offered, not forced. */
  reviewedToday?: boolean;
};

export type NextAction =
  | { kind: "placement"; href: string; title: string; detail: string }
  | { kind: "review"; href: string; title: string; detail: string; count: number }
  | { kind: "lesson"; href: string; title: string; detail: string; lesson: Lesson; unit: Unit; resume: boolean; stepIndex: number }
  | { kind: "done"; href: string; title: string; detail: string };

export function unitUnlocked(unit: Unit, units: Unit[], checkpoints: Record<string, boolean>, startUnit: number): boolean {
  if (unit.order <= startUnit) return true;
  const previous = units.find((other) => other.level === unit.level && other.order === unit.order - 1);
  return !previous || Boolean(checkpoints[`${previous.id}-check`]);
}

export function nextLesson(path: Lesson[], units: Unit[], state: CourseState): Lesson | null {
  const orderOf = new Map(units.map((unit) => [unit.id, unit.order]));
  return path.find((lesson) => (orderOf.get(lesson.unitId) ?? 0) >= state.startUnit && state.lessons[lesson.id]?.status !== "completed") ?? null;
}

export function nextAction(path: Lesson[], units: Unit[], state: CourseState): NextAction {
  if (!state.placed) return { kind: "placement", href: "/welcome", title: "Find your starting point", detail: "Two quick questions, then your first lesson." };
  const review = { kind: "review" as const, href: "/review/session", title: `Review ${Math.min(state.dueCount, 15)} ${state.dueCount === 1 ? "word" : "words"}`, detail: `About ${Math.max(2, Math.round(Math.min(state.dueCount, 15) / 4))} minutes · keeps them in your memory`, count: state.dueCount };
  if (state.dueCount >= REVIEW_FIRST_THRESHOLD && !state.reviewedToday) return review;
  const lesson = nextLesson(path, units, state);
  if (lesson) {
    const unit = units.find((entry) => entry.id === lesson.unitId)!;
    const progress = state.lessons[lesson.id];
    const resume = progress?.status === "started" && progress.stepIndex > 0;
    const kind = lesson.kind === "checkpoint" ? "Checkpoint" : lesson.kind === "conversation" ? "Conversation" : `Lesson ${unit.lessons.findIndex((spec) => spec.id === lesson.id) + 1}`;
    return {
      kind: "lesson", href: `/lesson/${lesson.id}`, title: lesson.title, detail: `Unit ${unit.order} · ${unit.title} · ${kind}`,
      lesson, unit, resume, stepIndex: progress?.stepIndex ?? 0,
    };
  }
  if (state.dueCount > 0) return review;
  return { kind: "done", href: "/course", title: "A1 complete!", detail: "Practise the extra conversations while A2 is being written." };
}

/** Where the course should start after the placement check. */
export function placementToUnit(band: Band, accuracy: number): number {
  if (band === "b1") return 9;
  if (band === "a2") return 6;
  return accuracy >= 50 ? 3 : 1;
}
