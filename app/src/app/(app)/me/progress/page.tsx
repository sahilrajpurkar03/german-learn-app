import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { requireSnapshot } from "@/lib/learning/guard";
import { addDays } from "@/lib/course/activity";
import { catalog } from "@/lib/course/catalog";

export const metadata: Metadata = { title: "Progress · Sprechen" };

export default async function ProgressPage() {
  const { snapshot } = await requireSnapshot();
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = addDays(snapshot.today, index - 13);
    const day = snapshot.days.find((entry) => entry.date === date);
    return { date, xp: day?.xp ?? 0, met: day?.goalMet ?? false, freeze: day?.freezeUsed ?? false };
  });
  const top = Math.max(snapshot.settings.daily_goal_xp, ...days.map((day) => day.xp));
  const passedUnits = catalog().outlines.filter((outline) => snapshot.lessons[outline.checkpoint.id]?.status === "completed");
  const total = days.reduce((sum, day) => sum + day.xp, 0);
  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 px-4 pt-[max(env(safe-area-inset-top),1rem)] md:pt-10">
      <div>
        <Link href="/me" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-brand"><ArrowLeft size={16} aria-hidden="true" />Me</Link>
        <h1 className="mt-3 font-display text-3xl font-semibold">Progress</h1>
      </div>

      <section aria-labelledby="xp-heading" className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-baseline justify-between">
          <h2 id="xp-heading" className="font-semibold">Last 14 days</h2>
          <span className="text-sm text-ink-soft"><strong className="tabular text-ink">{total}</strong> XP</span>
        </div>
        <ol className="mt-4 flex h-40 items-end gap-1.5" aria-label="XP per day">
          {days.map((day) => (
            <li key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1" aria-label={`${day.date}: ${day.xp} XP${day.met ? ", goal reached" : day.freeze ? ", freeze used" : ""}`}>
              <span className={`w-full rounded-t-md ${day.met ? "bg-gold" : day.freeze ? "bg-brand-soft" : "bg-brand/40"}`} style={{ height: `${Math.max(day.xp ? 6 : 2, (day.xp / top) * 100)}%` }} />
              <span className="text-[10px] text-ink-soft">{new Date(`${day.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "narrow", timeZone: "UTC" })}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-ink-soft">Gold = daily goal reached ({snapshot.settings.daily_goal_xp} XP).</p>
      </section>

      <section aria-labelledby="can-do-heading">
        <h2 id="can-do-heading" className="mb-3 font-semibold">What you can do</h2>
        {passedUnits.length === 0 ? (
          <p className="rounded-2xl bg-surface p-5 text-ink-soft">Pass a unit checkpoint and its goals appear here.</p>
        ) : (
          <ul className="space-y-3">
            {passedUnits.map((outline) => (
              <li key={outline.unit.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]">
                <p className="font-semibold">{outline.unit.emoji} {outline.unit.title}</p>
                <ul className="mt-2 space-y-1">
                  {outline.unit.canDo.map((goal) => <li key={goal} className="flex items-start gap-2 text-sm"><Check size={16} className="mt-0.5 text-success" aria-hidden="true" />{goal}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="pb-4 text-xs text-ink-soft">Progress measures your practice in this app. It&apos;s a learning guide, not a certified language level.</p>
    </main>
  );
}
