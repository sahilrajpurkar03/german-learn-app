import type { CheckResult } from "../../lib/course/answer-check.ts";
import { xpFor } from "../../lib/course/activity.ts";
import { GRADED_TYPES } from "../../lib/course/types.ts";
import type { Step } from "../../lib/course/types.ts";

// The lesson player as a pure reducer: answering → feedback → next, wrong answers come
// back once at the end of the lesson (no hearts, no game over), then complete.

export type Outcome = { stepId: string; verdict: CheckResult["verdict"]; retry: boolean; xp: number; answer: string };

export type PlayerState = {
  steps: Step[];
  queue: number[];
  retried: number[];
  phase: "answering" | "feedback" | "complete";
  result: (CheckResult & { retry: boolean; answer: string }) | null;
  done: number;
  xp: number;
  streak: number;
  bestStreak: number;
  outcomes: Outcome[];
};

export type PlayerAction =
  | { type: "answer"; result: CheckResult; answer: string }
  | { type: "continue" };

export function startPlayer(steps: Step[], startIndex = 0): PlayerState {
  const from = Math.max(0, Math.min(startIndex, Math.max(0, steps.length - 1)));
  return { steps, queue: steps.map((_, index) => index).slice(from), retried: [], phase: steps.length ? "answering" : "complete", result: null, done: from, xp: 0, streak: 0, bestStreak: 0, outcomes: [] };
}

export function currentStep(state: PlayerState): Step | null {
  return state.queue.length ? state.steps[state.queue[0]] : null;
}

export function currentIsRetry(state: PlayerState): boolean {
  return state.queue.length > 0 && state.retried.includes(state.queue[0]) && state.outcomes.some((outcome) => outcome.stepId === state.steps[state.queue[0]].id);
}

/** Progress for the bar: steps finished out of steps planned (retries extend the lesson a little). */
export function progressOf(state: PlayerState): { done: number; total: number } {
  return { done: state.done, total: state.steps.length + state.retried.length };
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  if (action.type === "answer") {
    if (state.phase !== "answering" || !state.queue.length) return state;
    const index = state.queue[0];
    const step = state.steps[index];
    const retry = currentIsRetry(state);
    const verdict = action.result.verdict;
    // Self-checked replies (custom lessons) still show the model answer, but don't count for or against the streak.
    const graded = GRADED_TYPES.has(step.type) && (verdict !== "seen" || Boolean(step.selfCheck));
    const good = verdict === "correct" || verdict === "close";
    const xp = xpFor(verdict, retry);
    const streak = graded && verdict !== "seen" ? (good ? state.streak + 1 : 0) : state.streak;
    const next: PlayerState = {
      ...state,
      xp: state.xp + xp,
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      outcomes: [...state.outcomes, { stepId: step.id, verdict, retry, xp, answer: action.answer }],
      result: { ...action.result, retry, answer: action.answer },
    };
    // Information cards and self-checked replies move on straight away.
    if (!graded) return advance({ ...next, result: null });
    const requeue = verdict === "wrong" && !state.retried.includes(index);
    return { ...next, phase: "feedback", retried: requeue ? [...state.retried, index] : state.retried };
  }
  if (state.phase !== "feedback") return state;
  return advance(state);
}

function advance(state: PlayerState): PlayerState {
  const [index, ...rest] = state.queue;
  const wrongOnce = state.result?.verdict === "wrong" && state.retried.includes(index) && !state.result.retry;
  const queue = wrongOnce ? [...rest, index] : rest;
  const done = wrongOnce ? state.done : state.done + 1;
  return { ...state, queue, done, result: null, phase: queue.length ? "answering" : "complete" };
}

export function summary(state: PlayerState) {
  const firstTries = state.outcomes.filter((outcome) => !outcome.retry && outcome.verdict !== "seen");
  const right = firstTries.filter((outcome) => outcome.verdict === "correct" || outcome.verdict === "close").length;
  return { xp: state.xp, accuracy: firstTries.length ? Math.round((right / firstTries.length) * 100) : 100, bestStreak: state.bestStreak, answered: firstTries.length };
}
