import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dueForCheckin,
  isAccepted,
  nextAssessmentItem,
  scoreAssessment,
  SKILLS,
} from "./learning-engine.ts";
import type { AssessmentItem } from "./learning-engine.ts";

const bank: AssessmentItem[] = SKILLS.flatMap((skill) =>
  ["a2", "b1", "a1", "b1"].map((band, index) => ({
    id: `${skill}-${index}`,
    skill,
    band: band as AssessmentItem["band"],
    prompt: "Test",
    accepted: ["Guten Tag"],
    explanation: "Test",
  })),
);

test("assessment starts at A2 and adapts to evidence", () => {
  assert.equal(nextAssessmentItem(bank, [])?.id, "reading-0");
  assert.equal(
    nextAssessmentItem(bank, [{ id: "reading-0", value: "Guten Tag" }])?.band,
    "b1",
  );
  assert.equal(
    nextAssessmentItem(bank, [{ id: "reading-0", value: "wrong" }])?.band,
    "a1",
  );
});
test("recognition alone cannot imply an advanced overall level", () => {
  const result = scoreAssessment(
    bank,
    bank
      .filter((item) => item.skill === "reading")
      .map((item) => ({ id: item.id, value: "Guten Tag" })),
  );
  assert.equal(result.band, "a1");
  assert.equal(result.complete, false);
  assert.equal(result.skills[1].accuracy, null);
});
test("full strong evidence earns B1 without duplicate answer inflation", () => {
  const answers = bank.map((item) => ({ id: item.id, value: "Guten Tag!" }));
  const result = scoreAssessment(bank, [...answers, ...answers]);
  assert.equal(result.band, "b1");
  assert.equal(result.skills[0].total, 4);
  assert.equal(nextAssessmentItem(bank, answers), null);
});
test("skipping does not count as mastery; spelling and punctuation are normalized conservatively", () => {
  assert.equal(
    isAccepted({ accepted: ["Guten Tag"] }, "  guten   Tag! "),
    true,
  );
  assert.equal(isAccepted({ accepted: ["schon"] }, "schön"), false);
  assert.equal(
    scoreAssessment(bank, [
      { id: "reading-0", value: "Guten Tag", skipped: true },
    ]).skills[0].correct,
    0,
  );
});
test("weekly check-in is due exactly seven days later", () => {
  assert.equal(
    dueForCheckin("2026-09-01T12:00:00Z", new Date("2026-09-08T11:59:59Z")),
    false,
  );
  assert.equal(
    dueForCheckin("2026-09-01T12:00:00Z", new Date("2026-09-08T12:00:00Z")),
    true,
  );
  assert.equal(dueForCheckin("invalid"), false);
});
