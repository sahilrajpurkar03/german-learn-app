import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createChapterAI, CHAPTER_MODEL } from "../src/lib/chapter-ai.ts";
import { sampleChapter, sampleInput } from "../src/lib/personal-chapter-demo.ts";
import { validateChapter, personalMission } from "../src/lib/personal-chapters.ts";

const live = process.argv.includes("--live");
const report = { date: new Date().toISOString(), mode: live ? "live" : "contract", scope: "Synthetic non-personal meeting scenario", status: "not-run" };
if (live) {
  const { default: nextEnvironment } = await import("@next/env");
  nextEnvironment.loadEnvConfig(fileURLToPath(new URL("../", import.meta.url)));
  if (!process.env.GROQ_API_KEY || process.env.GROQ_BENCHMARK_FREE_PLAN_CONFIRMED !== "true") {
    report.status = "blocked";
    report.reason = "Requires a privately configured GROQ_API_KEY and GROQ_BENCHMARK_FREE_PLAN_CONFIRMED=true. No provider calls were made.";
    process.exitCode = 2;
  } else {
    const model = process.argv.includes("--20b") ? "openai/gpt-oss-20b" : CHAPTER_MODEL;
    try {
      const result = await createChapterAI(process.env.GROQ_API_KEY).generate(sampleInput, model);
      report.status = "passed-structural-checks";
      report.metrics = result.metrics;
      report.chapter = result.blueprint;
      report.qualityReview = "Required: German accuracy, register, level, source fidelity, distractors, and transfer value. One sample is not a statistical latency or quality benchmark.";
    } catch (error) {
      report.status = "failed";
      report.reason = "Provider or chapter validation failed. No automatic retries; no raw provider error logged.";
      report.httpStatus = typeof error === "object" && error && "status" in error ? error.status : null;
      process.exitCode = 1;
    }
  }
} else {
  const fixture = sampleChapter();
  const milliseconds = [];
  for (let iteration = 0; iteration < 1000; iteration += 1) {
    const started = performance.now();
    const blueprint = validateChapter(fixture, sampleInput);
    const chapter = { id: "fixture", blueprint, progress: {}, created_at: "2026-09-12T00:00:00.000Z" };
    personalMission(chapter, "original");
    personalMission(chapter, "variation");
    milliseconds.push(performance.now() - started);
  }
  milliseconds.sort((first, second) => first - second);
  report.status = "passed";
  report.iterations = milliseconds.length;
  report.validationP50Ms = milliseconds[499];
  report.validationP95Ms = milliseconds[949];
  report.blueprintBytes = Buffer.byteLength(JSON.stringify(fixture));
  report.providerCalls = 0;
  report.caveat = "Measures local validation and adaptation only. No speech recognition, generation latency, or German quality has been benchmarked.";
}
const directory = new URL("../test-results/", import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL(`personal-${live ? "live" : "contract"}-benchmark.json`, directory), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));