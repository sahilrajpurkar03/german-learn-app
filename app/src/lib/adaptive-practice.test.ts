import assert from "node:assert/strict";
import test from "node:test";
import { recordRecall, recallStatus, planPractice, recallTurn, type PracticeTarget } from "./adaptive-practice.ts";
import { variationTargets } from "./practice-variations.ts";
import { MISSIONS } from "./learning-content.ts";
import { adaptiveReviewItems, reviewMission, reviewPreviewItems } from "./review-mission.ts";

const today = new Date("2026-09-13T12:00:00Z");
const tomorrow = new Date("2026-09-14T12:00:00Z");

test("immediate replay does not count as delayed recall or postpone a review", () => {
  const first = recordRecall(undefined, true, today);
  const replay = recordRecall(first, true, new Date("2026-09-13T13:00:00Z"));
  assert.equal(replay.delayed, 0);
  assert.equal(replay.dueAt, first.dueAt);
  assert.equal(replay.repetitions, 1);
  assert.equal(recallStatus(replay, tomorrow), "Recall check due");
});

test("support resets spacing and later unaided recall builds evidence", () => {
  const first = recordRecall(undefined, false, today);
  assert.equal(recallStatus(first, today), "Needs support");
  const recalled = recordRecall(first, true, tomorrow);
  assert.equal(recalled.delayed, 1);
  assert.equal(recalled.supported, 1);
  assert.equal(recalled.independent, 1);
  const supported = recordRecall(recalled, false, new Date("2026-09-20T12:00:00Z"));
  assert.equal(supported.repetitions, 0);
  assert.equal(supported.intervalDays, 1);
});

test("planner mixes overdue and new targets without duplicates and remains reusable", () => {
  const targets = ["due", "new", "later"].map((id) => ({ id })) as PracticeTarget[];
  const record = { due: recordRecall(undefined, false, today), later: recordRecall(undefined, true, tomorrow) };
  assert.deepEqual(planPractice(targets, record, tomorrow, 3).map((target) => target.id), ["due", "new", "later"]);
  const allKnown = Object.fromEntries(targets.map((target) => [target.id, recordRecall(undefined, true, tomorrow)]));
  assert.equal(planPractice(targets, allKnown, today, 3).length, 3);
  assert.deepEqual(planPractice([], {}, today), []);
});

test("word-bank support fades only after delayed independent recall", () => {
  const target = { turn: { kind: "build", words: ["Hallo"], accepted: ["Hallo"] } } as PracticeTarget;
  assert.equal(recallTurn(target, recordRecall(undefined, true, today)).kind, "build");
  const delayed = recordRecall(recordRecall(undefined, true, today), true, tomorrow);
  assert.equal(recallTurn(target, delayed).kind, "respond");
  assert.equal(recallTurn(target, delayed).words, undefined);
});

test("new-context challenges unlock only after delayed recall and keep their own evidence", () => {
  const variations = variationTargets(MISSIONS);
  assert.equal(variations.length, 8);
  assert.equal(planPractice(variations, {}, today).length, 0);
  const target = variations[0];
  const first = recordRecall(undefined, true, today);
  assert.equal(planPractice(variations, { [target.prerequisite!]: first }, today).length, 0);
  const later = recordRecall(first, true, tomorrow);
  assert.deepEqual(planPractice(variations, { [target.prerequisite!]: later }, tomorrow).map((entry) => entry.id), [target.id]);
  for (const variation of variations) {
    assert.ok(variation.turn.accepted[0]);
    assert.equal(variation.turn.words, undefined);
    assert.notEqual(variation.turn.line, MISSIONS.find((mission) => variation.prerequisite!.startsWith(`${mission.id}:`))!.turns[Number(variation.prerequisite!.split(":")[1])].line);
  }
});

test("cloud review uses supported exercise evidence and keeps all exercise contracts", () => {
  const record = { "cloud:phrase:preview-speak:listen_type": recordRecall(undefined, false, today) };
  const adapted = adaptiveReviewItems(reviewPreviewItems, record);
  assert.equal(adapted[3].exercise, "listen_type");
  const mission = reviewMission(reviewPreviewItems);
  assert.deepEqual(mission.turns.map((turn) => turn.kind), ["choose", "listen", "build", "respond"]);
  assert.deepEqual(mission.turns[0].accepted, ["the receipt"]);
  assert.equal(mission.turns[1].line, mission.turns[1].accepted[0]);
  assert.ok(mission.turns[2].words?.length);
});