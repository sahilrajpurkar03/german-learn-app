"use client";

import { m } from "motion/react";
import { BookOpen, Sparkles } from "lucide-react";
import { GermanWord, Marked, SpeakButton, type ExerciseProps } from "./shared";
import { playGerman } from "../audio";

export function IntroCard({ step, onSpeaking }: ExerciseProps) {
  const card = step.card!;
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-sm font-semibold text-gold"><Sparkles size={15} aria-hidden="true" />{step.prompt}</span>
      <m.div initial={{ scale: 0.6, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}
        className="grid h-28 w-28 place-items-center rounded-[2rem] bg-surface text-6xl shadow-[var(--shadow-card)]" aria-hidden="true">
        {card.emoji ?? "💬"}
      </m.div>
      <div className="space-y-2">
        <p className="font-display text-4xl font-semibold leading-tight sm:text-5xl"><GermanWord de={card.de} gender={card.gender} /></p>
        <p className="text-lg text-ink-soft">{card.en}</p>
        {card.plural && <p className="text-sm text-ink-soft">Plural: <span lang="de" className="font-semibold text-ink">{card.plural}</span></p>}
      </div>
      <SpeakButton text={card.de} autoPlay onSpeaking={onSpeaking} label={`Hear ${card.de}`} />
      {card.example && (
        <button type="button" onClick={() => playGerman(card.example!.de)} className="w-full max-w-md rounded-2xl border-2 border-line bg-surface p-4 text-left transition hover:border-brand">
          <span lang="de" className="block text-lg font-medium text-ink">{card.example.de}</span>
          <span className="block text-sm text-ink-soft">{card.example.en}</span>
        </button>
      )}
      {card.note && <p className="max-w-md text-sm text-ink-soft">💡 {card.note}</p>}
      {card.gender && <p className="text-xs text-ink-soft"><span className="font-bold text-der">der</span> · <span className="font-bold text-die">die</span> · <span className="font-bold text-das">das</span> — the colour shows the article.</p>}
    </div>
  );
}

export function PatternCard({ step }: ExerciseProps) {
  const card = step.patternCard!;
  return (
    <div className="flex flex-col gap-5">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand"><BookOpen size={15} aria-hidden="true" />Grammar in a nutshell</span>
      <h2 className="font-display text-3xl font-semibold leading-tight">{card.title}</h2>
      <p className="text-lg leading-relaxed text-ink"><Marked text={card.rule} /></p>
      <ul className="space-y-2.5">
        {card.examples.map((example, index) => (
          <m.li key={example.de} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + index * 0.12 }}>
            <button type="button" onClick={() => playGerman(example.de)} className="w-full rounded-2xl border-2 border-line bg-surface p-4 text-left transition hover:border-brand">
              <span className="block text-lg font-medium"><Marked text={example.de} lang="de" /></span>
              <span className="block text-sm text-ink-soft">{example.en}</span>
            </button>
          </m.li>
        ))}
      </ul>
    </div>
  );
}
