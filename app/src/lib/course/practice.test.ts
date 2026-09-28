import assert from "node:assert/strict";
import test from "node:test";
import { masteryLabel, masteryPercent, pickPracticeKey, practiceWeight } from "./practice.ts";

function sequence(values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length];
}

test("an empty pool has nothing to draw, and a single item is still returned", () => {
  assert.equal(pickPracticeKey([], []), null);
  assert.deepEqual(pickPracticeKey([{ key: "a", strength: 0 }], []), { key: "a", strength: 0 });
});

test("the last item (and, with 3+ items, the one before it) is never drawn again immediately", () => {
  const pool = [{ key: "a", strength: 0.5 }, { key: "b", strength: 0.5 }, { key: "c", strength: 0.5 }];
  for (let trial = 0; trial < 40; trial++) {
    const picked = pickPracticeKey(pool, ["a", "b"], () => trial / 40);
    assert.notEqual(picked!.key, "a");
    assert.notEqual(picked!.key, "b");
  }
  // With only two items in the pool, avoiding both recents would leave nothing: the most recent still wins over repeating.
  const two = [{ key: "a", strength: 0.5 }, { key: "b", strength: 0.5 }];
  assert.notEqual(pickPracticeKey(two, ["a", "b"], () => 0.5)!.key, "b");
});

test("weaker items are drawn far more often than strong ones, over many draws", () => {
  const pool = [{ key: "weak", strength: 0 }, { key: "strong", strength: 0.95 }];
  const counts = { weak: 0, strong: 0 };
  const random = sequence(Array.from({ length: 997 }, (_, index) => (index * 0.6180339887) % 1));
  for (let draw = 0; draw < 1000; draw++) counts[pickPracticeKey(pool, [], random)!.key as "weak" | "strong"] += 1;
  assert.ok(counts.weak > counts.strong * 5, JSON.stringify(counts));
  assert.ok(counts.strong > 0, "a mastered word still turns up sometimes");
});

test("weight and mastery are readable numbers for the UI", () => {
  assert.equal(practiceWeight(0), 1);
  assert.equal(practiceWeight(1), 0.08, "never fully stops showing an item, however well known");
  assert.equal(masteryPercent(0.618), 62);
  assert.equal(masteryPercent(-1), 0);
  assert.equal(masteryPercent(2), 100);
  assert.equal(masteryLabel(0), "New");
  assert.equal(masteryLabel(0.3), "Getting there");
  assert.equal(masteryLabel(0.6), "Strong");
  assert.equal(masteryLabel(0.9), "Mastered");
});
