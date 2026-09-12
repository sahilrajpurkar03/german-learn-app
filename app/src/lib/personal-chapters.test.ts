import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { z } from "zod";
import { chapterBlueprintSchema, chapterInputSchema, personalMission, progressSchema, validateChapter } from "./personal-chapters.ts";
import { sampleChapter, sampleInput } from "./personal-chapter-demo.ts";

test("personal chapters adapt to both existing guided conversation variants", () => {
  const blueprint = validateChapter(sampleChapter(), sampleInput);
  const record = { id: "private-1", created_at: new Date(0).toISOString(), blueprint, progress: {} };
  for (const variant of ["original", "variation"] as const) {
    const mission = personalMission(record, variant);
    assert.equal(mission.turns.length, 4);
    assert.equal(mission.partner, "Mila");
    assert.ok(existsSync(new URL(`../../public${mission.image}`, import.meta.url)));
    assert.equal(mission.turns[3].options, undefined);
    assert.equal(mission.id, `private-1:${variant}`);
  }
});

test("AI schema is exportable as a closed JSON structure", () => {
  const schema = z.toJSONSchema(chapterBlueprintSchema);
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.type, "object");
});

test("generation requires reviewed text, a bounded input, and affirmative permission", () => {
  assert.ok(chapterInputSchema.safeParse(sampleInput).success);
  for (const change of [{ consent: false }, { transcript: "short" }, { transcript: "a".repeat(3001) }, { level: "c2" }, { extra: true }])
    assert.equal(chapterInputSchema.safeParse({ ...sampleInput, ...change }).success, false);
});

test("broken choices, impossible word banks, and fabricated source quotes are rejected", () => {
  for (const breakChapter of [
    (chapter: ReturnType<typeof sampleChapter>) => { chapter.original.turns[0].options = ["At ten", "At ten"]; },
    (chapter: ReturnType<typeof sampleChapter>) => { chapter.original.turns[1].words = ["Ich", "bin"]; },
    (chapter: ReturnType<typeof sampleChapter>) => { chapter.targets[0].sourceQuote = "invented private fact"; },
    (chapter: ReturnType<typeof sampleChapter>) => { chapter.variation.turns = chapter.original.turns; },
    (chapter: ReturnType<typeof sampleChapter>) => { chapter.level = "b1"; },
  ]) {
    const chapter = sampleChapter();
    breakChapter(chapter);
    assert.throws(() => validateChapter(chapter, sampleInput));
  }
});

test("progress cannot claim more independent answers than completed turns", () => {
  assert.ok(progressSchema.safeParse({ index: 2, correct: 1, completed: false }).success);
  assert.equal(progressSchema.safeParse({ index: 1, correct: 2, completed: false }).success, false);
});