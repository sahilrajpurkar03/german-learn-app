"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { completeWelcome } from "@/lib/learning/actions";
import { DAILY_GOALS, GOAL_NAMES, type DailyGoal } from "@/lib/course/activity";
import { Button } from "@/ui/button";
import { ProgressBar } from "@/ui/progress";
import { Logo } from "@/ui/logo";

const REASONS = [
  { value: "Life in Germany", emoji: "🏠", detail: "Offices, shops, neighbours" },
  { value: "Work", emoji: "💼", detail: "Colleagues and meetings" },
  { value: "Study", emoji: "🎓", detail: "Classes and campus life" },
  { value: "Family & friends", emoji: "❤️", detail: "People who matter" },
  { value: "Travel", emoji: "✈️", detail: "Trains, hotels, food" },
];
const MINUTES: Record<DailyGoal, string> = { 30: "about 5–10 min a day", 50: "about 15 min a day", 80: "about 25 min a day" };

export function WelcomeFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState<string | null>(null);
  const [goal, setGoal] = useState<DailyGoal>(30);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function finish(start: "beginner" | "placement") {
    setError(null);
    startTransition(async () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin";
        const { next } = await completeWelcome({ goal, motivation: reason ?? "", timezone, start });
        router.push(next);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "That didn't save. Please try again.");
      }
    });
  }

  const choice = (active: boolean) => `flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${active ? "border-brand bg-brand-soft shadow-[0_3px_0_var(--v2-brand)]" : "border-line bg-surface shadow-[0_3px_0_var(--v2-line)] hover:bg-surface-2"}`;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-8 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <div className="flex items-center gap-3">
        {step > 0 ? <button type="button" onClick={() => setStep(step - 1)} className="grid h-10 w-10 place-items-center rounded-xl text-ink-soft hover:bg-surface-2" aria-label="Back"><ArrowLeft size={22} aria-hidden="true" /></button> : <Logo size={32} withName={false} />}
        <ProgressBar value={step + 1} max={3} label={`Step ${step + 1} of 3`} />
      </div>
      <AnimatePresence mode="wait">
        <m.section key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="mt-8 flex flex-1 flex-col gap-5">
          {step === 0 && (
            <>
              <h1 className="font-display text-3xl font-semibold">Why are you learning German?</h1>
              <p className="-mt-2 text-ink-soft">We&apos;ll pick examples that fit your life.</p>
              <div className="grid gap-3" role="radiogroup" aria-label="Reason">
                {REASONS.map((entry) => (
                  <button key={entry.value} type="button" role="radio" aria-checked={reason === entry.value} className={choice(reason === entry.value)} onClick={() => { setReason(entry.value); setTimeout(() => setStep(1), 180); }}>
                    <span className="text-3xl" aria-hidden="true">{entry.emoji}</span>
                    <span><span className="block font-semibold">{entry.value}</span><span className="block text-sm text-ink-soft">{entry.detail}</span></span>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h1 className="font-display text-3xl font-semibold">Pick a daily goal</h1>
              <p className="-mt-2 text-ink-soft">A small daily habit beats long, rare sessions. You can change it any time.</p>
              <div className="grid gap-3" role="radiogroup" aria-label="Daily goal">
                {DAILY_GOALS.map((value) => (
                  <button key={value} type="button" role="radio" aria-checked={goal === value} className={choice(goal === value)} onClick={() => setGoal(value)}>
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold-soft font-bold text-gold tabular">{value}</span>
                    <span className="flex-1"><span className="block font-semibold">{GOAL_NAMES[value]}</span><span className="block text-sm text-ink-soft">{value} XP · {MINUTES[value]}</span></span>
                  </button>
                ))}
              </div>
              <div className="mt-auto"><Button size="lg" onClick={() => setStep(2)}>Continue</Button></div>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="font-display text-3xl font-semibold">Where should we start?</h1>
              <div className="grid gap-3">
                <button type="button" disabled={pending} className={choice(false)} onClick={() => finish("beginner")}>
                  <span className="text-3xl" aria-hidden="true">🌱</span>
                  <span><span className="block font-semibold">I&apos;m new to German</span><span className="block text-sm text-ink-soft">Start with Unit 1: greetings and introductions.</span></span>
                </button>
                <button type="button" disabled={pending} className={choice(false)} onClick={() => finish("placement")}>
                  <span className="text-3xl" aria-hidden="true">🧭</span>
                  <span><span className="block font-semibold">I know some German</span><span className="block text-sm text-ink-soft">Take a 5-minute level check and skip what you know.</span></span>
                </button>
              </div>
              {pending && <p role="status" className="text-center text-ink-soft">Setting things up…</p>}
              {error && <p role="alert" className="text-center text-danger">{error}</p>}
            </>
          )}
        </m.section>
      </AnimatePresence>
    </main>
  );
}
