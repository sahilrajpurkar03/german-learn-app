import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Sparkles, Check, ArrowRight } from "lucide-react";
import { requireSnapshot } from "@/lib/learning/guard";
import { LEVELS, catalog } from "@/lib/course/catalog";
import { nextLesson, unitUnlocked } from "@/lib/course/next-action";
import { coursePath } from "@/lib/course/catalog";
import { ProgressRing } from "@/ui/progress";

export const metadata: Metadata = { title: "Course · Sprechen" };

export default async function CoursePage() {
  const { snapshot } = await requireSnapshot();
  const { units, outlines } = catalog();
  const completed = (id: string) => snapshot.lessons[id]?.status === "completed";
  const checkpoints = Object.fromEntries(outlines.map((outline) => [outline.checkpoint.id, completed(outline.checkpoint.id)]));
  const next = nextLesson(coursePath(), units, { placed: true, startUnit: snapshot.settings.start_unit, lessons: snapshot.lessons, dueCount: 0 });
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-[max(env(safe-area-inset-top),1rem)] md:pt-10">
      <h1 className="font-display text-3xl font-semibold">Your course</h1>
      <p className="mt-1 text-ink-soft">Everyday German for life in Germany, one unit at a time.</p>
      <nav aria-label="Levels" className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {LEVELS.map((level) => (
          <span key={level.id} aria-current={level.available ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${level.available ? "bg-brand text-on-brand" : "bg-surface-2 text-ink-soft"}`}>
            {level.title}{!level.available && " · soon"}
          </span>
        ))}
      </nav>

      <ol className="relative mt-6 space-y-4 before:absolute before:bottom-6 before:left-[2.1rem] before:top-6 before:w-1 before:rounded-full before:bg-line" aria-label="A1 units">
        {outlines.map((outline) => {
          const unit = outline.unit;
          const lessons = [...outline.core, outline.checkpoint];
          const done = lessons.filter((lesson) => completed(lesson.id)).length;
          const unlocked = unitUnlocked(unit, units, checkpoints, snapshot.settings.start_unit);
          const current = next?.unitId === unit.id;
          const finished = completed(outline.checkpoint.id);
          return (
            <li key={unit.id} className="relative">
              <Link href={`/course/${unit.id}`} aria-current={current ? "step" : undefined}
                className={`flex items-center gap-4 rounded-3xl border-2 p-4 transition ${current ? "border-brand bg-surface shadow-[var(--shadow-lift)]" : "border-line bg-surface hover:border-brand/50"} ${unlocked ? "" : "opacity-70"}`}>
                <ProgressRing value={done} max={lessons.length} size={60} stroke={5} label={`${done} of ${lessons.length} lessons done`} tone={finished ? "success" : "gold"}>
                  <span className="text-2xl" aria-hidden="true">{unlocked ? unit.emoji : "🔒"}</span>
                </ProgressRing>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold uppercase tracking-wide text-ink-soft">Unit {unit.order}{finished && " · done"}</span>
                  <span className="block font-display text-xl font-semibold leading-tight">{unit.title}</span>
                  <span lang="de" className="block text-sm text-ink-soft">{unit.titleDe} · {done}/{lessons.length} lessons</span>
                </span>
                {finished ? <Check className="text-success" size={24} aria-label="Completed" /> : !unlocked ? <Lock className="text-ink-soft" size={20} aria-label="Locked: pass the previous checkpoint or test out" /> : current ? <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-on-brand">Up next</span> : <ArrowRight className="text-ink-soft" size={20} aria-hidden="true" />}
              </Link>
            </li>
          );
        })}
      </ol>

      <Link href="/custom" className="mt-8 flex items-center gap-4 rounded-3xl bg-gold-soft p-5 transition hover:brightness-95">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold text-white"><Sparkles size={24} aria-hidden="true" /></span>
        <span className="flex-1">
          <span className="block font-semibold">Custom lessons <span className="ml-1 rounded-full bg-white/70 px-2 py-0.5 text-xs">beta</span></span>
          <span className="block text-sm text-ink-soft">Turn a situation from your own day into a lesson.</span>
        </span>
        <ArrowRight size={20} className="text-ink-soft" aria-hidden="true" />
      </Link>
      <p className="mt-6 text-center text-sm text-ink-soft">A2 and B1 are being written. Until then, every unit has extra conversations to practise.</p>
    </main>
  );
}
