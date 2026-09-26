"use client";

import { createStore, get, update } from "idb-keyval";
import { useSyncExternalStore } from "react";
import type { Attempt } from "@/lib/course/progress";
import { createOutbox, type OutboxStorage, type SendResult, type ServerSummary, type SyncStatus } from "@/lib/course/outbox-core";

// Answers are queued in IndexedDB and sent in batches, so a lesson works on a train with
// patchy signal. Attempt ids make re-sending harmless: the server counts each one once.

export type { ServerSummary, SyncStatus };

const KEY = "attempts";
const store = typeof indexedDB === "undefined" ? null : createStore("sprechen", "outbox");

const storage: OutboxStorage = {
  async read() {
    return store ? ((await get<Attempt[]>(KEY, store)) ?? []) : [];
  },
  async update(change) {
    if (store) await update<Attempt[]>(KEY, (queue = []) => change(queue), store);
  },
};

async function post(batch: Attempt[]): Promise<SendResult> {
  let response: Response;
  try {
    response = await fetch("/api/learning/attempts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attempts: batch }), cache: "no-store" });
  } catch {
    return { ok: false, status: 0, message: "No connection. Your answers are kept on this device and will be sent when you're back online.", retry: true };
  }
  if (response.ok) {
    const summary = await response.json().catch(() => null) as ServerSummary | null;
    if (summary && typeof summary.todayXp === "number") return { ok: true, summary };
    return { ok: false, status: response.status, message: "The server's reply could not be read.", retry: true };
  }
  const body = await response.json().catch(() => null) as { error?: string; stage?: string; code?: string } | null;
  const detail = [response.status, body?.stage, body?.code].filter(Boolean).join(" · ");
  const message = body?.error ?? (response.status === 401 ? "Please sign in again." : "Your answers could not be saved yet.");
  // 400/413: the batch itself is unusable and will never succeed. Everything else can be retried.
  return { ok: false, status: response.status, message, detail, retry: response.status !== 400 && response.status !== 413 };
}

const outbox = typeof window === "undefined" ? null : createOutbox(storage, post);
const idle: SyncStatus = { state: "idle", pending: 0 };

export const enqueue = (attempts: Attempt[]) => outbox?.enqueue(attempts) ?? Promise.resolve();
export const flush = () => outbox?.flush() ?? Promise.resolve(null);
export const clearOutbox = () => outbox?.clear() ?? Promise.resolve();
export const pendingCount = () => outbox?.pending() ?? Promise.resolve(0);
export const onServerSummary = (listener: (summary: ServerSummary) => void) => outbox?.onSummary(listener) ?? (() => {});

/** Live sync status for the UI ("Saving…", "Not saved yet"). */
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (callback) => outbox?.onStatus(callback) ?? (() => {}),
    () => outbox?.getStatus() ?? idle,
    () => idle,
  );
}

let installed = false;
export function installOutboxSync() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("online", () => void flush());
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") void flush(); });
  void flush();
}

