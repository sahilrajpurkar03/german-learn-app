"use client";

import { useEffect, useState } from "react";
import { m } from "motion/react";
import { Turtle, Volume2 } from "lucide-react";
import { playGerman } from "../audio";
import type { Gender, Step } from "@/lib/course/types";

export type ExerciseProps = {
  step: Step;
  disabled: boolean;
  /** the answer that the Check button will submit, or null while incomplete */
  onReady: (answer: string | null) => void;
  /** submit immediately (cards, matching) */
  onSubmit: (answer: string) => void;
  onSpeaking?: (speaking: boolean) => void;
  /** after checking: show which option was right */
  revealed?: boolean;
};

const GENDER_CLASS: Record<Gender, string> = { m: "text-der", f: "text-die", n: "text-das" };
const GENDER_LABEL: Record<Gender, string> = { m: "masculine", f: "feminine", n: "neuter" };

/** German with its article coloured by gender: der (blue), die (red), das (green). */
export function GermanWord({ de, gender, className = "" }: { de: string; gender?: Gender; className?: string }) {
  if (!gender) return <span lang="de" className={className}>{de}</span>;
  const [article, ...rest] = de.split(" ");
  return (
    <span lang="de" className={className}>
      <span className={`${GENDER_CLASS[gender]} font-bold`} title={GENDER_LABEL[gender]}>{article}</span> {rest.join(" ")}
    </span>
  );
}

/** Renders **bold** markup from pattern rules and examples. */
export function Marked({ text, lang }: { text: string; lang?: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return <span lang={lang}>{parts.map((part, index) => (index % 2 ? <mark key={index} className="rounded bg-gold-soft px-0.5 font-bold text-ink">{part}</mark> : part))}</span>;
}

export function SpeakButton({ text, autoPlay = false, size = "md", onSpeaking, label = "Play German audio" }: { text: string; autoPlay?: boolean; size?: "md" | "lg"; onSpeaking?: (speaking: boolean) => void; label?: string }) {
  const [playing, setPlaying] = useState(false);
  function play(slow = false) {
    playGerman(text, { slow, onStart: () => { setPlaying(true); onSpeaking?.(true); }, onEnd: () => { setPlaying(false); onSpeaking?.(false); } });
  }
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setTimeout(() => play(), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, autoPlay]);
  const big = size === "lg";
  return (
    <span className="inline-flex items-center gap-2">
      <m.button type="button" whileTap={{ scale: 0.92 }} onClick={() => play()} aria-label={label}
        className={`grid place-items-center rounded-2xl bg-brand text-on-brand shadow-[0_4px_0_var(--v2-brand-strong)] active:translate-y-1 active:shadow-none ${big ? "h-20 w-20" : "h-11 w-11"}`}>
        <m.span animate={playing ? { scale: [1, 1.15, 1] } : { scale: 1 }} transition={{ duration: 0.6, repeat: playing ? Infinity : 0 }}>
          <Volume2 size={big ? 36 : 20} aria-hidden="true" />
        </m.span>
      </m.button>
      <button type="button" onClick={() => play(true)} aria-label="Play slowly" title="Play slowly"
        className={`grid place-items-center rounded-xl border-2 border-line bg-surface text-ink-soft hover:text-brand ${big ? "h-14 w-14" : "h-11 w-11"}`}>
        <Turtle size={big ? 24 : 18} aria-hidden="true" />
      </button>
    </span>
  );
}

export function Prompt({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl font-semibold leading-tight text-ink sm:text-[1.75rem]">{children}</h2>;
}
