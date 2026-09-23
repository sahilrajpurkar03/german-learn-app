import { checkAnswer, type CheckResult } from "./answer-check.ts";
import { applyGrade, gradeFor, introduce, type MemoryState } from "./memory.ts";
import { LESSON_BONUS, REVIEW_BONUS, localDate, meetGoal, xpFor, type DayActivity, type StreakStats } from "./activity.ts";
import { CHECKPOINT_PASS } from "./build-lesson.ts";
import { GRADED_TYPES } from "./types.ts";
import type { Lesson, Step, Verdict } from "./types.ts";

export const REVIEW_LESSON_ID = "review";

export type Attempt = {
  attemptId: string;
  runId: string;
  lessonId: string;
  stepId: string;
  kind: "answer" | "complete";
  answer: string;
  responseMs: number;
  occurredAt: string;
  stepIndex: number;
};

export type ScoredAttempt = Attempt & { step: Step | null; result: CheckResult; retry: boolean; xp: number; verdict: Verdict | "complete" };

/** Clamp client clocks: events can arrive late (offline queue) but never from the future or the distant past. */
export function clampTime(occurredAt: string, now: Date): Date {
  const time = Date.parse(occurredAt);
  if (!Number.isFinite(time)) return now;
  return new Date(Math.min(now.getTime(), Math.max(now.getTime() - 48 * 3600000, time)));
}

/** Score answers against the rebuilt step. A step counts as a retry if the same run already got it wrong. */
export function scoreAttempts(attempts: Attempt[], findStep: (stepId: string) => Step | null, earlierWrong: Set<string>): ScoredAttempt[] {
  const wrong = new Set(earlierWrong);
  const scored: ScoredAttempt[] = [];
  for (const attempt of attempts) {
    if (attempt.kind === "complete") {
      scored.push({ ...attempt, step: null, result: { verdict: "seen", expected: "" }, retry: false, xp: 0, verdict: "complete" });
      continue;
    }
    const step = findStep(attempt.stepId);
    const belongs = step && (attempt.stepId.startsWith(`${attempt.lessonId}~`) || attempt.stepId.startsWith("R~"));
    if (!step || !belongs) continue;
    const result = checkAnswer(step, attempt.answer);
    const key = `${attempt.runId}|${attempt.stepId}`;
    const retry = wrong.has(key);
    if (result.verdict === "wrong") wrong.add(key);
    scored.push({ ...attempt, step, result, retry, xp: xpFor(result.verdict, retry), verdict: result.verdict });
  }
  return scored;
}

/** Update memory for every item a scored answer touched. Returns the changed states. */
export function applyToMemory(states: Map<string, MemoryState>, scored: ScoredAttempt[], now: Date): MemoryState[] {
  const changed = new Map<string, MemoryState>();
  for (const attempt of scored) {
    if (!attempt.step) continue;
    const at = clampTime(attempt.occurredAt, now);
    const grade = gradeFor(attempt.result.verdict, attempt.step.type, attempt.retry);
    for (const key of attempt.step.itemKeys) {
      const previous = changed.get(key) ?? states.get(key);
      const next = grade === null ? introduce(key, at, previous) : applyGrade(previous, key, grade, at);
      if (next !== previous) changed.set(key, next);
    }
  }
  for (const [key, state] of changed) states.set(key, state);
  return [...changed.values()];
}

export type RunEvent = { stepId: string; verdict: Verdict | "complete"; retry: boolean };

/** Decide whether a finished run counts: most graded steps answered; checkpoints need 80% right first time. */
export function completionOutcome(lesson: Lesson | null, lessonId: string, events: RunEvent[]): { counted: boolean; passed: boolean; score: number; bonus: number } {
  const firstTries = new Map<string, Verdict | "complete">();
  for (const event of events) if (event.verdict !== "complete" && event.verdict !== "seen" && !event.retry && !firstTries.has(event.stepId)) firstTries.set(event.stepId, event.verdict);
  const answered = firstTries.size;
  const right = [...firstTries.values()].filter((verdict) => verdict === "correct" || verdict === "close").length;
  const score = answered ? Math.round((right / answered) * 100) / 100 : 0;
  if (lessonId === REVIEW_LESSON_ID) {
    const counted = answered >= 3;
    return { counted, passed: counted, score, bonus: counted ? REVIEW_BONUS : 0 };
  }
  const graded = lesson ? lesson.steps.filter((step) => GRADED_TYPES.has(step.type) && !step.selfCheck).length : 0;
  const counted = lesson !== null && answered >= Math.max(1, Math.floor(graded * 0.7));
  const passed = counted && (lesson.kind !== "checkpoint" || score >= CHECKPOINT_PASS);
  return { counted, passed, score, bonus: passed ? LESSON_BONUS : 0 };
}

export type DayChange = { days: Map<string, DayActivity & { gradedSteps: number; lessons: number; reviews: number }>; stats: StreakStats; xpTotal: number };

/** Add XP to the right local day, and extend the streak the moment a day's goal is first met. */
export function applyActivity(change: DayChange, at: Date, timeZone: string, goalXp: number, xp: number, counts: { graded?: number; lessons?: number; reviews?: number }) {
  const date = localDate(at, timeZone);
  const day = change.days.get(date) ?? { date, xp: 0, goalXp, goalMet: false, freezeUsed: false, gradedSteps: 0, lessons: 0, reviews: 0 };
  day.xp += xp;
  day.gradedSteps += counts.graded ?? 0;
  day.lessons += counts.lessons ?? 0;
  day.reviews += counts.reviews ?? 0;
  change.xpTotal += xp;
  if (!day.goalMet && day.xp >= day.goalXp) {
    day.goalMet = true;
    const { stats, frozenDates } = meetGoal(change.stats, date);
    change.stats = stats;
    for (const frozen of frozenDates) {
      const existing = change.days.get(frozen) ?? { date: frozen, xp: 0, goalXp, goalMet: false, freezeUsed: false, gradedSteps: 0, lessons: 0, reviews: 0 };
      change.days.set(frozen, { ...existing, freezeUsed: true });
    }
  }
  change.days.set(date, day);
}
