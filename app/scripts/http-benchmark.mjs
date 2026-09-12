import { performance } from "node:perf_hooks";

const mode = process.argv[2] ?? "performance";
if (!["performance", "endurance"].includes(mode)) throw new Error("Use performance or endurance");
const base = new URL(process.env.TEST_BASE_URL ?? "http://127.0.0.1:3100");
if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)) throw new Error("Load tests are restricted to localhost");
const seconds = Number(process.env.SOAK_SECONDS ?? 120);
if (!Number.isFinite(seconds) || seconds < 1 || seconds > 14400) throw new Error("SOAK_SECONDS must be 1..14400");
const concurrency = mode === "endurance" ? 2 : 4;
const paths = ["/preview", "/login", "/images/cafe.jpg"];
const samples = [];
let failures = 0;
let requests = 0;
let bytes = 0;
let completed = 0;
const start = performance.now();
const deadline = start + seconds * 1000;

await Promise.all(Array.from({ length: concurrency }, async () => {
  while (mode === "endurance" ? performance.now() < deadline : requests < 120) {
    const index = requests++;
    const requestStart = performance.now();
    try {
      const response = await fetch(new URL(paths[index % paths.length], base), { signal: AbortSignal.timeout(10000) });
      const body = await response.arrayBuffer();
      bytes += body.byteLength;
      if (!response.ok) failures++;
    } catch {
      failures++;
    }
    const latency = performance.now() - requestStart;
    const sample = { latency, elapsed: performance.now() - start };
    if (samples.length < 10000) samples.push(sample);
    else {
      const replacement = Math.floor(Math.random() * (completed + 1));
      if (replacement < samples.length) samples[replacement] = sample;
    }
    completed++;
  }
}));

function percentile(entries, fraction) {
  const sorted = entries.map((entry) => entry.latency).sort((left, right) => left - right);
  return sorted.length ? Math.round(sorted[Math.ceil(sorted.length * fraction) - 1] * 100) / 100 : null;
}
const duration = performance.now() - start;
const p95 = percentile(samples, 0.95);
const result = {
  mode, base: base.origin, concurrency, requests: completed, failures,
  durationSeconds: Math.round(duration / 10) / 100,
  requestsPerSecond: Math.round(completed / duration * 100000) / 100,
  transferredMB: Math.round(bytes / 10485.76) / 100,
  sampleCount: samples.length,
  p50Ms: percentile(samples, 0.5), p95Ms: p95, p99Ms: percentile(samples, 0.99),
  firstQuarterP95Ms: percentile(samples.filter((entry) => entry.elapsed < duration / 4), 0.95),
  lastQuarterP95Ms: percentile(samples.filter((entry) => entry.elapsed > duration * 0.75), 0.95),
  passed: failures === 0 && p95 < 2000,
  scope: "Local public-route HTTP only; excludes database mutations, real users, voice services, and production infrastructure.",
};
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;