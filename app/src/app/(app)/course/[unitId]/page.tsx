import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, MessageCircle, Play, Trophy, Lock } from "lucide-react";
import { requireSnapshot } from "@/lib/learning/guard";
import { catalog, getOutline } from "@/lib/course/catalog";
import { unitUnlocked } from "@/lib/course/next-action";
import { WordList } from "@/features/course/word-list";

export async function generateMetadata({ params }: { params: Promise<{ unitId: string }> }): Promise<Metadata> {
  const outline = getOutline((await params).unitId);
  return { title: outline ? `${outline.unit.title} · Sprechen` : "Unit · Sprechen" };
}

export default async function UnitPage({ params }: { params: Promise<{ unitId: string }> }) {
  const outline = getOutline((await params).unitId);
  if (!outline) notFound();
  const { snapshot } = await requireSnapshot();
  const { unit, core, conversations, checkpoint } = outline;
  const { units, outlines } = catalog();
  const status = (id: string) => snapshot.lessons[id]?.status;
  const checkpoints = Object.fromEntries(outlines.map((entry) => [entry.checkpoint.id, status(entry.checkpoint.id) === "completed"]));
  const unlocked = unitUnlocked(unit, units, checkpoints, snapshot.settings.start_unit);
  const passed = status(checkpoint.id) === "completed";
  const memory = new Map(snapshot.memory.map((state) => [state.key, state]));
  const firstOpen = core.find((lesson) => status(lesson.id) !== "completed");

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-[max(env(safe-area-inset-top),1rem)] md:pt-10">
      <Link href="/course" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-brand"><ArrowLeft size={16} aria-hidden="true" />Course</Link>
      <header className="mt-3 flex items-center gap-4">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-surface text-5xl shadow-[var(--shadow-card)]" aria-hidden="true">{unit.emoji}</span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">A1 · Unit {unit.order}</p>
          <h1 className="font-display text-3xl font-semibold leading-tight">{unit.title}</h1>
          <p lang="de" className="text-ink-soft">{unit.titleDe}</p>
        </div>
      </header>

      <section aria-labelledby="can-do" className="mt-6 rounded-3xl bg-surface p-5 shadow-[var(--shadow-card)]">
        <h2 id="can-do" className="font-semibold">After this unit you can…</h2>
        <ul className="mt-3 space-y-2">
          {unit.canDo.map((goal) => (
            <li key={goal} className="flex items-start gap-2.5">
              <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${passed ? "bg-success text-white" : "border-2 border-line"}`} aria-hidden="true">{passed && <Check size={13} strokeWidth={3} />}</span>
              <span>{goal}</span>
            </li>
          ))}
        </ul>
      </section>

      {!unlocked && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-surface-2 p-4 text-sm"><Lock size={18} className="mt-0.5 shrink-0" aria-hidden="true" />This unit opens when you pass the previous checkpoint. Already know this? Take this unit&apos;s checkpoint to test out.</p>
      )}

      <section aria-labelledby="lessons" className="mt-6">
        <h2 id="lessons" className="mb-3 font-semibold">Lessons</h2>
        <ol className="space-y-3">
          {core.map((lesson, index) => {
            const state = status(lesson.id);
            const current = lesson === firstOpen && unlocked;
            return (
              <li key={lesson.id}>
                <Link href={`/lesson/${lesson.id}`} className={`flex items-center gap-4 rounded-2xl border-2 p-4 transition ${current ? "border-brand bg-surface shadow-[var(--shadow-card)]" : "border-line bg-surface hover:border-brand/50"}`}>
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-bold ${state === "completed" ? "bg-success text-white" : current ? "bg-brand text-on-brand" : "bg-surface-2 text-ink-soft"}`}>
                    {state === "completed" ? <Check size={20} strokeWidth={3} aria-label="Completed" /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{lesson.title}</span>
                    <span className="block text-sm text-ink-soft">{lesson.goal} · ~{lesson.minutes} min</span>
                  </span>
                  {state === "started" ? <span className="text-xs font-bold text-brand">Resume</span> : current ? <Play size={18} className="text-brand" fill="currentColor" aria-hidden="true" /> : null}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {conversations.length > 0 && (
        <section aria-labelledby="conversations" className="mt-6">
          <h2 id="conversations" className="mb-1 font-semibold">Conversations</h2>
          <p className="mb-3 text-sm text-ink-soft">Real situations that use this unit&apos;s German. The first one is part of the path; the rest are extra practice.</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {conversations.map((lesson, index) => (
              <li key={lesson.id}>
                <Link href={`/lesson/${lesson.id}`} className="flex h-full items-center gap-3 rounded-2xl border-2 border-line bg-surface p-4 transition hover:border-brand/50">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${status(lesson.id) === "completed" ? "bg-success text-white" : "bg-brand-soft text-brand"}`}>
                    {status(lesson.id) === "completed" ? <Check size={18} strokeWidth={3} aria-label="Completed" /> : <MessageCircle size={18} aria-hidden="true" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold leading-tight">{lesson.title}</span>
                    <span className="block text-xs text-ink-soft">{index === 0 ? "Part of the path" : "Extra practice"} · {lesson.steps.length} turns</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href={`/lesson/${checkpoint.id}`} className={`mt-6 flex items-center gap-4 rounded-3xl p-5 transition ${passed ? "bg-success-soft" : "bg-gold-soft hover:brightness-95"}`}>
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white ${passed ? "bg-success" : "bg-gold"}`}><Trophy size={24} aria-hidden="true" /></span>
        <span className="flex-1">
          <span className="block font-semibold">{passed ? "Checkpoint passed" : unlocked ? "Unit checkpoint" : "Test out of this unit"}</span>
          <span className="block text-sm text-ink-soft">{passed ? `Best score ${Math.round((snapshot.lessons[checkpoint.id]?.bestScore ?? 0) * 100)}%. Retake any time.` : "Answer 80% right first time to complete the unit."}</span>
        </span>
      </Link>

      <section aria-labelledby="words" className="mt-8">
        <h2 id="words" className="mb-3 font-semibold">Words & phrases in this unit</h2>
        <WordList items={unit.items.map((item) => ({ key: item.id, de: item.de, en: item.en, gender: item.gender, strength: memory.get(item.id)?.strength ?? null }))} />
      </section>
    </main>
  );
}
