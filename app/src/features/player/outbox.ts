"use client";

import { createStore, get, set, update } from "idb-keyval";
import type { Attempt } from "@/lib/course/progress";

// Answers are queued in IndexedDB and sent in batches, so a lesson works on a train with
// patchy signal. Attempt ids make re-sending harmless: the server counts each one once.

export type ServerSummary = { todayXp: number; goalXp: number; streak: number; xpTotal: number };

const store = typeof indexedDB === "undefined" ? null : createStore("sprechen", "outbox");
const KEY = "attempts";
let flushing: Promise<ServerSummary | null> | null = null;
const listeners = new Set<(summary: ServerSummary) => void>();

export function onServerSummary(listener: (summary: ServerSummary) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export async function enqueue(attempts: Attempt[]) {
  if (!store) return;
  await update<Attempt[]>(KEY, (queue = []) => [...queue, ...attempts].slice(-500), store);
}

export async function pendingCount(): Promise<number> {
  if (!store) return 0;
  return ((await get<Attempt[]>(KEY, store)) ?? []).length;
}

export function flush(options: { keepalive?: boolean } = {}): Promise<ServerSummary | null> {
  flushing ??= send(options).finally(() => { flushing = null; });
  return flushing;
}

async function send({ keepalive = false }: { keepalive?: boolean }): Promise<ServerSummary | null> {
  if (!store || (typeof navigator !== "undefined" && navigator.onLine === false)) return null;
  let latest: ServerSummary | null = null;
  for (let round = 0; round < 10; round++) {
    const queue = (await get<Attempt[]>(KEY, store)) ?? [];
    if (!queue.length) break;
    const batch = queue.slice(0, 50);
    let response: Response;
    try {
      response = await fetch("/api/learning/attempts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attempts: batch }), keepalive, cache: "no-store" });
    } catch {
      return latest;
    }
    // 2xx: saved. 400: malformed and will never succeed. Anything else (401, 5xx): keep and retry later.
    if (!response.ok && response.status !== 400 && response.status !== 413) return latest;
    const sent = new Set(batch.map((attempt) => attempt.attemptId));
    await update<Attempt[]>(KEY, (current = []) => current.filter((attempt) => !sent.has(attempt.attemptId)), store);
    if (response.ok) {
      latest = await response.json().catch(() => null);
      if (latest) for (const listener of listeners) listener(latest);
    }
  }
  return latest;
}

export async function clearOutbox() {
  if (store) await set(KEY, [], store);
}

let installed = false;
export function installOutboxSync() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("online", () => void flush());
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") void flush({ keepalive: true }); });
  void flush();
}
