import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Brain, TriangleAlert } from "lucide-react";
import { requireSnapshot } from "@/lib/learning/guard";
import { customResolver, describe } from "@/lib/learning/items";
import { ButtonLink } from "@/ui/button";

export const metadata: Metadata = { title: "Review · Sprechen" };

export default async function ReviewPage() {
  const { client, user, snapshot } = await requireSnapshot();
  const now = new Date();
  const memory = snapshot.memory;
  const due = memory.filter((state) => new Date(state.dueAt) <= now);
  const tricky = memory.filter((state) => state.lapses >= 2).sort((left, right) => right.lapses - left.lapses).slice(0, 5);
  const custom = await customResolver(client, user.id, tricky.map((state) => state.key));
  const buckets = [
    { label: "New", count: memory.filter((state) => state.strength < 0.2).length, color: "bg-surface-2" },
    { label: "Getting there", count: memory.filter((state) => state.strength >= 0.2 && state.strength < 0.5).length, color: "bg-gold/50" },
    { label: "Strong", count: memory.filter((state) => state.strength >= 0.5 && state.strength < 0.8).length, color: "bg-gold" },
    { label: "Mastered", count: memory.filter((state) => state.strength >= 0.8).length, color: "bg-success" },
  ];
  const tomorrow = memory.filter((state) => { const time = Date.parse(state.dueAt); return time > now.getTime() && time <= now.getTime() + 86400000; }).length;
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-[max(env(safe-area-inset-top),1rem)] md:pt-10">
      <h1 className="font-display text-3xl font-semibold">Review</h1>
      <p className="mt-1 text-ink-soft">Everything you learn comes back just before you would forget it.</p>

      <section className="mt-6 rounded-[2rem] bg-surface p-6 text-center shadow-[var(--shadow-lift)]" aria-labelledby="due-heading">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-brand-soft text-brand"><Brain size={32} aria-hidden="true" /></span>
        <h2 id="due-heading" className="mt-3 font-display text-4xl font-bold tabular">{due.length}</h2>
        <p className="text-ink-soft">{due.length === 1 ? "item is due" : "items are due"} now{tomorrow ? ` · ${tomorrow} more tomorrow` : ""}</p>
        <div className="mt-5">
          {due.length > 0
            ? <ButtonLink href="/review/session" size="lg">Start review</ButtonLink>
            : memory.length > 0
              ? <ButtonLink href="/review/session?extra=1" size="lg" variant="secondary">All caught up — practise weak words anyway</ButtonLink>
              : <ButtonLink href="/today" size="lg">Learn your first words</ButtonLink>}
        </div>
      </section>

      {memory.length > 0 && (
        <section className="mt-6" aria-labelledby="strength-heading">
          <h2 id="strength-heading" className="mb-3 font-semibold">Your memory</h2>
          <div className="flex h-4 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
            {buckets.map((bucket) => bucket.count > 0 && <span key={bucket.label} className={bucket.color} style={{ width: `${(bucket.count / memory.length) * 100}%` }} />)}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {buckets.map((bucket) => (
              <li key={bucket.label} className="flex items-center gap-2 text-sm"><span className={`h-3 w-3 rounded-full ${bucket.color}`} aria-hidden="true" /><span className="font-bold tabular">{bucket.count}</span><span className="text-ink-soft">{bucket.label}</span></li>
            ))}
          </ul>
        </section>
      )}

      {tricky.length > 0 && (
        <section className="mt-6" aria-labelledby="tricky-heading">
          <h2 id="tricky-heading" className="mb-3 flex items-center gap-2 font-semibold"><TriangleAlert size={18} className="text-gold" aria-hidden="true" />Tricky for you</h2>
          <ul className="space-y-2">
            {tricky.map((state) => {
              const info = describe(state.key, custom);
              return info && (
                <li key={state.key} className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
                  <span><span lang="de" className="block font-semibold">{info.de}</span><span className="block text-sm text-ink-soft">{info.en}</span></span>
                  <span className="text-xs font-semibold text-ink-soft">{state.lapses}× slipped</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Link href="/review/words" className="mt-6 flex items-center justify-between rounded-2xl border-2 border-line bg-surface px-5 py-4 font-semibold transition hover:border-brand">
        My words ({memory.length})<ArrowRight size={20} className="text-ink-soft" aria-hidden="true" />
      </Link>
    </main>
  );
}
