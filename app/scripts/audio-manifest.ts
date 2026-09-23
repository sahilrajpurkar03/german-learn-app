// Lists every German line the app can play, with its content-hashed file name.
// Usage: node --experimental-strip-types scripts/audio-manifest.ts > audio-manifest.json
import { catalog } from "../src/lib/course/catalog.ts";
import { buildReviewStep, reviewTypeFor, type ReviewSubject } from "../src/lib/course/review.ts";
import { audioFile, speechText, stepSpeech } from "../src/lib/course/speech-text.ts";
import { ASSESSMENT_BANK } from "../src/lib/learning-content.ts";
import type { ExerciseType } from "../src/lib/course/types.ts";

const texts = new Set<string>();
const add = (text?: string) => { if (text && speechText(text)) texts.add(speechText(text)); };
const { lessons, items, patterns } = catalog();

for (const lesson of lessons.values()) for (const step of lesson.steps) stepSpeech(step).forEach(add);
for (const item of items.values()) { add(item.de); add(item.example?.de); item.alt?.forEach(add); }
for (const pattern of Object.values(patterns)) {
  pattern.examples.forEach((example) => add(example.de));
  pattern.drills.forEach((drill) => add(drill.sentence.replace("___", drill.answer)));
}
const types: ExerciseType[] = ["choose", "listen_tap", "article", "fill_gap", "type", "dictation", "speak", "build"];
for (const item of items.values()) {
  const subject: ReviewSubject = { kind: "item", item, pool: [] };
  for (const type of types) { const step = buildReviewStep(subject, type); if (step) stepSpeech(step).forEach(add); }
  void reviewTypeFor;
}
for (const entry of ASSESSMENT_BANK) {
  add(entry.audio);
  if (entry.skill === "listening" || entry.skill === "reading") add(entry.context);
}

const manifest = [...texts].sort().map((text) => ({ file: audioFile(text), text }));
const seen = new Map<string, string>();
for (const { file, text } of manifest) {
  if (seen.has(file) && seen.get(file) !== text) throw new Error(`Audio hash collision: "${text}" and "${seen.get(file)}"`);
  seen.set(file, text);
}
process.stdout.write(JSON.stringify(manifest, null, 1));
