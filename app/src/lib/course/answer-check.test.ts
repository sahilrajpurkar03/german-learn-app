import assert from "node:assert/strict";
import test from "node:test";
import { checkAnswer, normalize } from "./answer-check.ts";
import type { Step } from "./types.ts";

test("spoken numbers and typed digits are the same answer", () => {
  assert.equal(normalize("Es ist zehn Uhr."), normalize("Es ist 10:00 Uhr."));
  assert.equal(normalize("Es ist zehn Uhr."), normalize("Es ist 10 Uhr."));
  assert.equal(normalize("Um acht Uhr"), normalize("um 8 Uhr"));
  assert.equal(normalize("Zwölf Uhr"), normalize("12:00 Uhr"));
  assert.equal(normalize("einundzwanzig"), "21");
});

test("a typed reply with a written-out number is accepted against a spoken-style prompt", () => {
  const step = { id: "s1", type: "type", prompt: "", accepted: ["Es ist zehn Uhr."] } as unknown as Step;
  assert.equal(checkAnswer(step, "Es ist 10:00 Uhr").verdict, "correct");
  assert.equal(checkAnswer(step, "es ist 10 uhr").verdict, "correct");
});
