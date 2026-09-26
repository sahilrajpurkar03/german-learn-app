import assert from "node:assert/strict";
import test from "node:test";
import { createOutbox, type OutboxStorage, type SendResult, type ServerSummary } from "./outbox-core.ts";
import type { Attempt } from "./progress.ts";

const attempt = (id: number): Attempt => ({ attemptId: `00000000-0000-4000-8000-${String(id).padStart(12, "0")}`, runId: "11111111-1111-4111-8111-111111111111", lessonId: "l", stepId: "l~s", kind: "answer", answer: "x", responseMs: 1, occurredAt: "2026-09-26T10:00:00.000Z", stepIndex: 0 });
const summary = (xp: number): ServerSummary => ({ todayXp: xp, goalXp: 30, streak: 1, xpTotal: xp });
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function memory(): OutboxStorage & { queue: Attempt[] } {
  const box = { queue: [] as Attempt[] };
  return {
    get queue() { return box.queue; },
    async read() { await tick(); return [...box.queue]; },
    async update(change) { await tick(); box.queue = change([...box.queue]); },
  } as OutboxStorage & { queue: Attempt[] };
}

test("queued answers are sent and removed, and the summary is announced", async () => {
  const storage = memory();
  const posted: number[] = [];
  const outbox = createOutbox(storage, async (batch) => { posted.push(batch.length); return { ok: true, summary: summary(batch.length * 2) }; });
  const seen: number[] = [];
  outbox.onSummary((value) => seen.push(value.todayXp));
  await outbox.enqueue([attempt(1), attempt(2), attempt(3)]);
  assert.equal((await outbox.flush())?.todayXp, 6);
  assert.deepEqual(posted, [3]);
  assert.deepEqual(seen, [6]);
  assert.equal(storage.queue.length, 0);
  assert.equal(outbox.getStatus().state, "idle");
});

test("an answer queued while a send is running is never left behind", async () => {
  const storage = memory();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const posted: string[][] = [];
  const outbox = createOutbox(storage, async (batch) => {
    posted.push(batch.map((entry) => entry.attemptId.slice(-2)));
    if (posted.length === 1) await gate;
    return { ok: true, summary: summary(posted.flat().length) };
  });
  await outbox.enqueue([attempt(1)]);
  const first = outbox.flush();
  await tick(); await tick();
  // The learner answers again (and the lesson completes) while the first request is still in flight.
  await outbox.enqueue([attempt(2)]);
  const second = outbox.flush();
  await outbox.enqueue([attempt(3)]);
  const third = outbox.flush();
  release();
  const [, , last] = await Promise.all([first, second, third]);
  assert.deepEqual(posted.flat().sort(), ["01", "02", "03"]);
  assert.equal(storage.queue.length, 0);
  assert.equal(last?.todayXp, 3);
});

test("server failures keep the answers, show why, and recover on the next try", async () => {
  const storage = memory();
  let failing = true;
  const outbox = createOutbox(storage, async (): Promise<SendResult> => failing
    ? { ok: false, status: 503, message: "Progress storage is unavailable.", detail: "503 · memory-write · 42501", retry: true }
    : { ok: true, summary: summary(10) });
  const statuses: string[] = [];
  outbox.onStatus((status) => statuses.push(status.state));
  await outbox.enqueue([attempt(1), attempt(2)]);
  assert.equal(await outbox.flush(), null);
  assert.equal(storage.queue.length, 2, "nothing is lost");
  const status = outbox.getStatus();
  assert.equal(status.state, "error");
  assert.equal(status.state === "error" && status.detail, "503 · memory-write · 42501");
  failing = false;
  assert.equal((await outbox.flush())?.todayXp, 10);
  assert.equal(storage.queue.length, 0);
  assert.equal(outbox.getStatus().state, "idle");
  assert.deepEqual(statuses.filter((state, index) => state !== statuses[index - 1]), ["saving", "error", "saving", "idle"]);
});

test("a batch the server can never accept is dropped, reported, and does not block newer answers", async () => {
  const storage = memory();
  const outbox = createOutbox(storage, async (batch) => batch.some((entry) => entry.answer === "bad")
    ? { ok: false, status: 400, message: "The answers could not be read.", retry: false }
    : { ok: true, summary: summary(5) });
  await outbox.enqueue([{ ...attempt(1), answer: "bad" }]);
  await outbox.flush();
  assert.equal(storage.queue.length, 0);
  assert.equal(outbox.getStatus().state, "error");
  await outbox.enqueue([attempt(2)]);
  assert.equal((await outbox.flush())?.todayXp, 5);
  assert.equal(outbox.getStatus().state, "idle");
});

test("more than fifty queued answers go out in batches", async () => {
  const storage = memory();
  const sizes: number[] = [];
  const outbox = createOutbox(storage, async (batch) => { sizes.push(batch.length); return { ok: true, summary: summary(1) }; });
  await outbox.enqueue(Array.from({ length: 120 }, (_, index) => attempt(index + 1)));
  await outbox.flush();
  assert.deepEqual(sizes, [50, 50, 20]);
  assert.equal(await outbox.pending(), 0);
});
