"use client";

import Link from "next/link";
import { m } from "motion/react";
import { ArrowRight, Brain, Check, Play, Snowflake } from "lucide-react";
import type { WeekDay } from "@/lib/course/activity";
import { ButtonLink } from "@/ui/button";
import { ProgressBar, ProgressRing } from "@/ui/progress";
import { StreakBadge } from "@/ui/stats";
import { Logo } from "@/ui/logo";

export type TodayHero = {
  kind: "placement" | "review" | "lesson" | "done";
  href: string;
  eyebrow: string;
  title: string;
  detail: string;
  emoji: string;
  button: string;
  unitProgress?: { done: number; total: number };
  resume?: boolean;
};

export function TodayView({ name, greeting, streak, freezes, todayXp, goalXp, hero, secondary, week, notice }: {
  name: string;
  greeting: string;
  streak: number;
  freezes: number;
  todayXp: number;
  goalXp: number;
  hero: TodayHero;
  secondary: { href: string; label: string; detail: string } | null;
  week: WeekDay[];
  notice?: string | null;
}) {
  const goalMet = todayXp >= goalXp;
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-[max(env(safe-area-inset-top),1rem)] md:pt-10">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="md:hidden"><Logo size={34} withName={false} /></span>
          <div>
            <p className="text-sm font-semibold text-ink-soft">{greeting},</p>
            <h1 className="font-display text-2xl font-semibold leading-tight">{name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StreakBadge days={streak} />
          {freezes > 0 && <span className="inline-flex items-center gap-0.5 text-sm font-bold text-brand" title={`${freezes} streak ${freezes === 1 ? "freeze" : "freezes"}: a missed day won't break your streak`} aria-label={`${freezes} streak freezes`}><Snowflake size={18} aria-hidden="true" />{freezes}</span>}
          <Link href="/me/progress" aria-label={`Daily goal: ${todayXp} of ${goalXp} XP`}>
            <ProgressRing value={todayXp} max={goalXp} size={48} stroke={5} label={`Daily goal: ${todayXp} of ${goalXp} XP`} tone={goalMet ? "success" : "gold"}>
              {goalMet ? <Check size={20} className="text-success" strokeWidth={3} aria-hidden="true" /> : <span className="text-[11px] font-bold tabular">{todayXp}</span>}
            </ProgressRing>
          </Link>
        </div>
      </header>

      {notice && <p role="status" className="rounded-2xl bg-gold-soft px-4 py-3 text-sm text-ink">{notice}</p>}

      <m.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} aria-labelledby="next-step"
        className="relative overflow-hidden rounded-[2rem] bg-brand p-6 text-on-brand shadow-[var(--shadow-lift)] sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 right-16 h-40 w-40 rounded-full bg-gold/25" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide opacity-80">{hero.eyebrow}</p>
            <h2 id="next-step" className="mt-1 font-display text-3xl font-semibold leading-tight sm:text-4xl">{hero.title}</h2>
            <p className="mt-2 opacity-85">{hero.detail}</p>
          </div>
          <m.span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white/15 text-5xl" animate={{ rotate: [0, -6, 6, 0] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3 }} aria-hidden="true">{hero.emoji}</m.span>
        </div>
        {hero.unitProgress && (
          <div className="relative mt-5 flex items-center gap-3">
            <div className="flex-1 [&_[role=progressbar]]:bg-white/20 [&_[role=progressbar]>div]:bg-gold"><ProgressBar value={hero.unitProgress.done} max={hero.unitProgress.total} label="Unit progress" tone="gold" /></div>
            <span className="text-sm font-semibold tabular opacity-85">{hero.unitProgress.done}/{hero.unitProgress.total}</span>
          </div>
        )}
        <m.div className="relative mt-6" whileHover={{ scale: 1.01 }}>
          <Link href={hero.href} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-lg font-bold text-[#163a69] shadow-[0_4px_0_rgb(0_0_0/0.18)] transition active:translate-y-1 active:shadow-none">
            <Play size={20} fill="currentColor" aria-hidden="true" />{hero.button}
          </Link>
        </m.div>
      </m.section>

      {secondary && (
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Link href={secondary.href} className="flex items-center gap-4 rounded-3xl border-2 border-line bg-surface p-4 transition hover:border-brand">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand"><Brain size={24} aria-hidden="true" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">After that</span>
              <span className="block font-semibold text-ink">{secondary.label}</span>
              <span className="block text-sm text-ink-soft">{secondary.detail}</span>
            </span>
            <ArrowRight size={20} className="text-ink-soft" aria-hidden="true" />
          </Link>
        </m.div>
      )}

      <m.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} aria-labelledby="week-heading" className="rounded-3xl bg-surface p-4 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="week-heading" className="font-semibold">This week</h2>
          <span className="text-sm text-ink-soft">{goalMet ? "Today's goal reached 🎉" : `${goalXp - todayXp} XP to today's goal`}</span>
        </div>
        <ol className="grid grid-cols-7 gap-1.5 text-center">
          {week.map((day, index) => (
            <li key={day.date} className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-semibold text-ink-soft">{day.label}</span>
              <m.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25 + index * 0.04, type: "spring", stiffness: 400, damping: 18 }}
                aria-label={`${day.date}: ${day.state === "met" ? "goal reached" : day.state === "freeze" ? "streak freeze used" : day.state === "partial" ? "practised" : day.state === "today" ? "today" : "no practice"}`}
                className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${day.state === "met" ? "bg-gold text-white" : day.state === "freeze" ? "bg-brand-soft text-brand" : day.state === "partial" ? "border-2 border-gold text-gold" : day.state === "today" ? "border-2 border-dashed border-brand text-brand" : "bg-surface-2 text-ink-soft"}`}>
                {day.state === "met" ? "✓" : day.state === "freeze" ? <Snowflake size={15} aria-hidden="true" /> : day.state === "today" ? "•" : ""}
              </m.span>
            </li>
          ))}
        </ol>
      </m.section>

      {hero.kind === "done" && <ButtonLink href="/course" variant="secondary" size="lg">Explore the course</ButtonLink>}
    </main>
  );
}
