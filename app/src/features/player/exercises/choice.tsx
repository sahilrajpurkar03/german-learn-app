"use client";

import { useEffect, useState } from "react";
import { m } from "motion/react";
import { GermanWord, Prompt, SpeakButton, type ExerciseProps } from "./shared";

const ARTICLE_STYLE: Record<string, string> = {
  der: "border-der text-der",
  die: "border-die text-die",
  das: "border-das text-das",
};

export function ChoiceExercise({ step, disabled, onReady, onSpeaking, revealed = false }: ExerciseProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const options = step.options ?? [];
  const german = step.type === "listen_tap" || step.type === "article" || (step.type === "fill_gap");

  function choose(option: string) {
    if (disabled) return;
    setSelected(option);
    onReady(option);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (disabled || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < options.length) choose(options[index]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, options]);

  return (
    <div className="flex flex-col gap-6">
      {!step.speaker && <Prompt>{step.prompt}</Prompt>}
      {step.type === "listen_tap" && (
        <div className="flex justify-center py-2"><SpeakButton text={step.audio!} autoPlay size="lg" onSpeaking={onSpeaking} label="Play the German again" /></div>
      )}
      {step.type === "choose" && !step.speaker && step.text && (
        <div className="flex items-center gap-4 rounded-3xl bg-surface p-5 shadow-[var(--shadow-card)]">
          <SpeakButton text={step.audio ?? step.text} autoPlay onSpeaking={onSpeaking} />
          <p lang="de" className="font-display text-2xl font-semibold sm:text-3xl">{step.text}</p>
        </div>
      )}
      {step.type === "article" && (
        <div className="flex items-center justify-center gap-4 py-2">
          <p lang="de" className="font-display text-4xl font-semibold">___ {step.text}</p>
          <SpeakButton text={step.text!} onSpeaking={onSpeaking} label={`Hear ${step.text}`} />
        </div>
      )}
      {step.type === "fill_gap" && step.gap && (
        <div className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-card)]">
          <p lang="de" className="text-2xl leading-relaxed sm:text-[1.7rem]">
            {step.gap.before}
            <m.span key={selected ?? "empty"} initial={{ scale: 0.8, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }}
              className={`mx-1 inline-block min-w-20 rounded-lg border-b-4 px-2 text-center font-semibold ${selected ? "border-brand bg-brand-soft text-brand" : "border-line text-transparent"}`}>
              {selected ?? "___"}
            </m.span>
            {step.gap.after}
          </p>
          {step.text && <p className="mt-2 text-ink-soft">{step.text}</p>}
        </div>
      )}
      <div role="radiogroup" aria-label="Answer options" className={step.type === "article" ? "grid grid-cols-3 gap-3" : "grid gap-3"}>
        {options.map((option, index) => {
          const active = selected === option;
          const article = step.type === "article" && !revealed ? ARTICLE_STYLE[option] : "";
          const right = revealed && step.accepted.includes(option);
          const missed = revealed && active && !right;
          const tone = right ? "border-success bg-success-soft text-success shadow-[0_3px_0_var(--v2-success)]"
            : missed ? "border-danger bg-danger-soft text-danger shadow-[0_3px_0_var(--v2-danger)]"
            : active ? "border-brand bg-brand-soft shadow-[0_3px_0_var(--v2-brand)]"
            : `border-line bg-surface shadow-[0_3px_0_var(--v2-line)] ${revealed ? "opacity-60" : "hover:bg-surface-2"}`;
          return (
            <m.button key={option} type="button" role="radio" aria-checked={active} disabled={disabled} onClick={() => choose(option)}
              initial={{ opacity: 0, y: 10 }} animate={missed ? { opacity: 1, y: 0, x: [0, -8, 8, -5, 5, 0] } : right && active ? { opacity: 1, y: 0, scale: [1, 1.04, 1] } : { opacity: 1, y: 0 }}
              transition={{ delay: revealed ? 0 : index * 0.05 }} whileTap={{ scale: 0.97 }}
              className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-lg font-medium transition-colors ${tone}
                ${article} ${step.type === "article" ? "justify-center text-2xl font-bold" : ""}`}>
              {step.type !== "article" && <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 border-line text-xs font-bold text-ink-soft" aria-hidden="true">{index + 1}</span>}
              {german || (step.type === "choose" && step.speaker) ? <GermanWord de={option} /> : <span>{option}</span>}
            </m.button>
          );
        })}
      </div>
    </div>
  );
}
