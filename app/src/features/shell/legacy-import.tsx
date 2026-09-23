"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";

/** Once per account: send the progress v1 kept in this browser to the new cloud model. The old record stays untouched. */
export function LegacyImport({ userId, imported }: { userId: string; imported: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (imported) return;
    let raw: string | null = null;
    try { raw = window.localStorage.getItem(`sprechen-studio-v1:${userId}`); } catch { return; }
    if (!raw) return;
    const doneKey = `sprechen-v2-imported:${userId}`;
    try { if (window.localStorage.getItem(doneKey)) return; } catch { /* ignore */ }
    let data: unknown;
    try { data = JSON.parse(raw); } catch { return; }
    void fetch("/api/learning/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      .then((response) => response.ok ? response.json() : null)
      .then((result: { imported?: number; lessons?: number } | null) => {
        if (!result) return;
        try { window.localStorage.setItem(doneKey, new Date().toISOString()); } catch { /* ignore */ }
        const count = (result.imported ?? 0) + (result.lessons ?? 0);
        if (count) { setMessage(`Your earlier progress is now saved to your account (${result.imported ?? 0} phrases, ${result.lessons ?? 0} conversations).`); setTimeout(() => setMessage(null), 6000); }
      })
      .catch(() => {});
  }, [userId, imported]);
  return (
    <AnimatePresence>
      {message && (
        <m.div role="status" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
          className="fixed left-1/2 top-3 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-canvas shadow-[var(--shadow-lift)]">
          ✅ {message}
        </m.div>
      )}
    </AnimatePresence>
  );
}
