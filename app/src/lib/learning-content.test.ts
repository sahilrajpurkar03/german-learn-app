import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { MISSIONS } from "./learning-content.ts";
import { isAccepted, normalizeAnswer } from "./learning-engine.ts";
import { chapterTopic, filterChapters, orderChapters } from "./chapter-library.ts";

test("chapters have unique identities and usable assets", () => {
  assert.equal(MISSIONS.length, 50);
  assert.equal(new Set(MISSIONS.map((mission) => mission.id)).size, MISSIONS.length);
  for (const mission of MISSIONS) {
    assert.ok(existsSync(new URL(`../../public${mission.image}`, import.meta.url)), mission.id);
    assert.ok(mission.title && mission.place && mission.subtitle);
    assert.ok(mission.turns.length >= 4, mission.id);
    assert.ok(mission.turns.some((turn) => turn.kind === "listen"));
    assert.ok(mission.turns.some((turn) => turn.kind === "respond"));
  }
});

test("every chapter answer is reachable and choices are unambiguous", () => {
  for (const mission of MISSIONS) for (const turn of mission.turns) {
    assert.ok(turn.line && turn.translation && turn.task && turn.note, mission.id);
    assert.ok(turn.accepted.length > 0);
    for (const answer of turn.accepted) assert.ok(isAccepted(turn, answer), mission.id);
    if (turn.options) {
      assert.equal(turn.options.filter((option) => isAccepted(turn, option)).length, 1, mission.id);
      assert.equal(new Set(turn.options.map(normalizeAnswer)).size, turn.options.length);
    }
    if (turn.kind === "build") {
      const tokens = (text: string) => normalizeAnswer(text).split(" ").sort();
      assert.deepEqual(tokens(turn.words!.join(" ")), tokens(turn.accepted[0]), mission.id);
    }
  }
});

test("chapter search combines topics, text, and completion without losing chapters", () => {
  const completed = { cafe: {} };
  assert.equal(filterChapters(MISSIONS, "All topics", "", "All chapters", completed).length, 50);
  assert.equal(filterChapters(MISSIONS, "Food", "", "Completed", completed)[0].id, "cafe");
  assert.equal(filterChapters(MISSIONS, "All topics", "HEATING", "Not completed", completed)[0].id, "heating");
  assert.equal(filterChapters(MISSIONS, "Travel", "", "Completed", completed).length, 0);
  assert.equal(filterChapters(MISSIONS, "All topics", "no-such-chapter", "All chapters", completed).length, 0);
  assert.equal(new Set(MISSIONS.map(chapterTopic)).size, 9);
});

test("daily recommendations move past completed chapters without mutating the library", () => {
  const ordered = orderChapters(MISSIONS, { cafe: {} }, "production", "cafe");
  assert.notEqual(ordered[0].id, "cafe");
  assert.equal(ordered.at(-1)?.id, "cafe");
  assert.equal(MISSIONS[0].id, "cafe");
});