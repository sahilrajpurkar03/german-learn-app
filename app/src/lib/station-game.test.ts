import { test } from "node:test";
import assert from "node:assert/strict";
import { createStationRounds, stationPoints } from "./station-game.ts";

test("every generated board has one unambiguous target and plausible distractors", () => {
  for (let iteration = 0; iteration < 100; iteration++) {
    const rounds = createStationRounds();
    assert.equal(rounds.length, 6);
    for (const round of rounds) {
      assert.equal(round.board.length, 4);
      const target = round.board.find((entry) => entry.id === round.targetId)!;
      assert.ok(target);
      assert.equal(
        new Set(
          round.board.map(
            (entry) => `${entry.destination}-${entry.time}-${entry.platform}`,
          ),
        ).size,
        4,
      );
      assert.ok(round.announcement.includes(target.destination));
      assert.equal(
        round.board.filter((entry) => entry.id === round.targetId).length,
        1,
      );
    }
  }
});
test("supported answers do not receive streak bonuses", () => {
  assert.equal(stationPoints(false, false, 4), 0);
  assert.equal(stationPoints(true, true, 4), 5);
  assert.equal(stationPoints(true, false, 0), 10);
  assert.equal(stationPoints(true, false, 100), 20);
});
