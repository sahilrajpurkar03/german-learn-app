import assert from "node:assert/strict";
import test from "node:test";
import { currentStep, playerReducer, progressOf, startPlayer, summary } from "./engine.ts";
import type { Step } from "../../lib/course/types.ts";

const step = (id: string, type: Step["type"] = "choose"): Step => ({ id, type, itemKeys: [], prompt: "", accepted: ["a"] });
const right = { verdict: "correct" as const, expected: "a" };
const wrong = { verdict: "wrong" as const, expected: "a" };

test("intro cards advance immediately; graded steps wait for Continue", () => {
  let state = startPlayer([step("intro", "intro"), step("q1")]);
  state = playerReducer(state, { type: "answer", result: { verdict: "seen", expected: "" }, answer: "" });
  assert.equal(currentStep(state)?.id, "q1");
  assert.equal(state.phase, "answering");
  state = playerReducer(state, { type: "answer", result: right, answer: "a" });
  assert.equal(state.phase, "feedback");
  assert.equal(state.xp, 2);
  state = playerReducer(state, { type: "continue" });
  assert.equal(state.phase, "complete");
});

test("a wrong answer comes back once at the end, and the retry earns less XP", () => {
  let state = startPlayer([step("q1"), step("q2")]);
  state = playerReducer(state, { type: "answer", result: wrong, answer: "b" });
  state = playerReducer(state, { type: "continue" });
  assert.equal(currentStep(state)?.id, "q2");
  assert.deepEqual(progressOf(state), { done: 0, total: 3 });
  state = playerReducer(playerReducer(state, { type: "answer", result: right, answer: "a" }), { type: "continue" });
  assert.equal(currentStep(state)?.id, "q1");
  state = playerReducer(state, { type: "answer", result: right, answer: "a" });
  assert.equal(state.result?.retry, true);
  state = playerReducer(state, { type: "continue" });
  assert.equal(state.phase, "complete");
  assert.equal(state.xp, 3);
  assert.deepEqual(summary(state), { xp: 3, accuracy: 50, bestStreak: 2, answered: 2 });
});

test("a second mistake on the retry moves on instead of looping", () => {
  let state = startPlayer([step("q1")]);
  state = playerReducer(playerReducer(state, { type: "answer", result: wrong, answer: "b" }), { type: "continue" });
  state = playerReducer(playerReducer(state, { type: "answer", result: wrong, answer: "c" }), { type: "continue" });
  assert.equal(state.phase, "complete");
});

test("resuming starts at the saved step", () => {
  const state = startPlayer([step("q1"), step("q2"), step("q3")], 2);
  assert.equal(currentStep(state)?.id, "q3");
  assert.equal(progressOf(state).done, 2);
});
