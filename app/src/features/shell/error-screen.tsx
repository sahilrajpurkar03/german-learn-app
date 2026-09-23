"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

/** Shown when a v2 screen can't load (usually storage being briefly unavailable). Answers already given stay queued on the device. */
export function ErrorScreen({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span className="text-5xl" aria-hidden="true">🛠️</span>
      <h1 className="font-display text-2xl font-semibold">That didn&apos;t load</h1>
      <p className="text-ink-soft">Your progress is safe — anything you answered offline is kept on this device and sent when the connection is back.</p>
      <button type="button" onClick={reset} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-on-brand"><RotateCcw size={18} aria-hidden="true" />Try again</button>
      <Link href="/today" className="text-sm font-semibold text-brand underline">Back to today</Link>
    </main>
  );
}
