import type { Attempt } from "./progress.ts";

// Answer queue with sync status. Storage and network are injected so the logic can be
// tested without a browser: features/player/outbox.ts supplies IndexedDB and fetch.

export type ServerSummary = { todayXp: number; goalXp: number; streak: number; xpTotal: number };

export type SendResult =
  | { ok: true; summary: ServerSummary }
  | { ok: false; status: number; message: string; detail?: string; retry: boolean };

export type SyncStatus =
  | { state: "idle"; pending: number }
  | { state: "saving"; pending: number }
  | { state: "error"; pending: number; status: number; message: string; detail?: string };

export type OutboxStorage = {
  read(): Promise<Attempt[]>;
  update(change: (queue: Attempt[]) => Attempt[]): Promise<void>;
};

export function createOutbox(storage: OutboxStorage, post: (batch: Attempt[]) => Promise<SendResult>) {
  let running: Promise<ServerSummary | null> | null = null;
  let again = false;
  let status: SyncStatus = { state: "idle", pending: 0 };
  const statusListeners = new Set<(next: SyncStatus) => void>();
  const summaryListeners = new Set<(summary: ServerSummary) => void>();

  function setStatus(next: SyncStatus) {
    status = next;
    for (const listener of statusListeners) listener(next);
  }

  async function drain(): Promise<ServerSummary | null> {
    let latest: ServerSummary | null = null;
    let dropped: SyncStatus | null = null;
    for (let round = 0; round < 20; round++) {
      const queue = await storage.read();
      if (!queue.length) {
        // A dropped batch keeps its explanation on screen until something is saved successfully.
        setStatus(dropped ?? { state: "idle", pending: 0 });
        break;
      }
      setStatus({ state: "saving", pending: queue.length });
      const batch = queue.slice(0, 50);
      const result = await post(batch);
      const sent = new Set(batch.map((attempt) => attempt.attemptId));
      if (result.ok) {
        await storage.update((current) => current.filter((attempt) => !sent.has(attempt.attemptId)));
        latest = result.summary;
        dropped = null;
        for (const listener of summaryListeners) listener(result.summary);
        continue;
      }
      if (!result.retry) {
        // The server will never accept this batch: drop it so it can't block newer answers, but say so.
        await storage.update((current) => current.filter((attempt) => !sent.has(attempt.attemptId)));
        dropped = { state: "error", pending: Math.max(0, queue.length - batch.length), status: result.status, message: result.message, detail: result.detail };
        setStatus(dropped);
        continue;
      }
      setStatus({ state: "error", pending: queue.length, status: result.status, message: result.message, detail: result.detail });
      return latest;
    }
    return latest;
  }

  /**
   * Send everything queued. A call made while a send is in progress asks for one more pass
   * (so an answer queued a moment ago is never left behind) and resolves with the final result.
   */
  function flush(): Promise<ServerSummary | null> {
    if (running) {
      again = true;
      return running;
    }
    running = (async () => {
      let latest: ServerSummary | null = null;
      try {
        do {
          again = false;
          latest = (await drain()) ?? latest;
        } while (again);
      } finally {
        running = null;
      }
      return latest;
    })();
    return running;
  }

  return {
    flush,
    async enqueue(attempts: Attempt[]) {
      await storage.update((queue) => [...queue, ...attempts].slice(-500));
    },
    async pending() {
      return (await storage.read()).length;
    },
    async clear() {
      await storage.update(() => []);
      setStatus({ state: "idle", pending: 0 });
    },
    getStatus: () => status,
    onStatus(listener: (next: SyncStatus) => void) {
      statusListeners.add(listener);
      return () => { statusListeners.delete(listener); };
    },
    onSummary(listener: (summary: ServerSummary) => void) {
      summaryListeners.add(listener);
      return () => { summaryListeners.delete(listener); };
    },
  };
}
