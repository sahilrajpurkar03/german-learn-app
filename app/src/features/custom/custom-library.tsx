"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { m } from "motion/react";
import { Check, Plus, Play, Shuffle, Trash2 } from "lucide-react";
import { ChapterApiError, chapterRequest, getPersonalLibrary, type PersonalLibrary } from "@/components/studio/personal-chapter-client";
import { customLessonId } from "@/lib/course/custom";
import { ButtonLink } from "@/ui/button";

export function CustomLibrary({ inReview }: { inReview: string[] }) {
  const [library, setLibrary] = useState<PersonalLibrary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set(inReview));
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try { setLibrary(await getPersonalLibrary(false)); setError(null); }
    catch (cause) { setError(cause instanceof ChapterApiError ? cause.message : "Your custom lessons could not be loaded."); }
  }
  useEffect(() => {
    let active = true;
    getPersonalLibrary(false)
      .then((next) => { if (active) setLibrary(next); })
      .catch((cause) => { if (active) setError(cause instanceof ChapterApiError ? cause.message : "Your custom lessons could not be loaded."); });
    return () => { active = false; };
  }, []);

  async function addToReview(chapterId: string, index: number) {
    const key = `c.${chapterId}.${index}`;
    setBusy(key);
    const response = await fetch("/api/learning/custom-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chapterId, index }) });
    setBusy(null);
    if (response.ok) setAdded(new Set([...added, key]));
    else setError((await response.json().catch(() => null))?.error ?? "Could not add it to review.");
  }

  async function remove(chapterId: string, title: string) {
    if (!window.confirm(`Delete "${title}" and its progress? This can't be undone.`)) return;
    setBusy(chapterId);
    try { await chapterRequest({ op: "delete", id: chapterId }); await load(); }
    catch (cause) { setError(cause instanceof ChapterApiError ? cause.message : "Could not delete."); }
    finally { setBusy(null); }
  }

  if (!library && !error) return <div className="space-y-3" aria-busy="true"><div className="v2-skeleton h-40 rounded-3xl" /><div className="v2-skeleton h-40 rounded-3xl" /></div>;

  return (
    <div className="space-y-5">
      {library?.message && <p role="status" className="rounded-2xl bg-gold-soft p-4 text-sm">{library.message}</p>}
      {error && <p role="alert" className="rounded-2xl bg-danger-soft p-4 text-sm text-danger">{error}</p>}
      {library?.available && <ButtonLink href="/custom/new" size="lg"><Plus size={20} aria-hidden="true" />Create a lesson from my day</ButtonLink>}
      {library && library.chapters.length === 0 && (
        <div className="rounded-3xl bg-surface p-6 text-center shadow-[var(--shadow-card)]">
          <p className="text-4xl" aria-hidden="true">📝</p>
          <p className="mt-2 font-semibold">No custom lessons yet</p>
          <p className="mt-1 text-sm text-ink-soft">Write a short recap of a real situation (a call, an appointment, a chat) and Sprechen turns it into a lesson at your level.</p>
        </div>
      )}
      <ul className="space-y-4">
        {library?.chapters.map((chapter, index) => {
          const blueprint = chapter.blueprint;
          return (
            <m.li key={chapter.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{blueprint.level.toUpperCase()} · {blueprint.register === "formal" ? "Sie" : "du"} · {new Date(chapter.created_at).toLocaleDateString()}</p>
                  <h2 className="font-display text-xl font-semibold">{blueprint.title}</h2>
                  <p className="mt-1 text-sm text-ink-soft">{blueprint.summary}</p>
                </div>
                <button type="button" disabled={busy === chapter.id} onClick={() => void remove(chapter.id, blueprint.title)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-soft hover:bg-danger-soft hover:text-danger" aria-label={`Delete ${blueprint.title}`}><Trash2 size={18} aria-hidden="true" /></button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <ButtonLink href={`/lesson/${customLessonId(chapter.id, "original")}`} size="md"><Play size={16} fill="currentColor" aria-hidden="true" />{chapter.progress.original?.completed ? "Replay" : "Play"}</ButtonLink>
                <ButtonLink href={`/lesson/${customLessonId(chapter.id, "variation")}`} size="md" variant="secondary"><Shuffle size={16} aria-hidden="true" />Variation</ButtonLink>
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-brand">Phrases to keep ({blueprint.targets.length})</summary>
                <ul className="mt-3 space-y-2">
                  {blueprint.targets.map((target, targetIndex) => {
                    const key = `c.${chapter.id}.${targetIndex}`;
                    return (
                      <li key={key} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-3 py-2">
                        <span><span lang="de" className="block font-semibold">{target.text}</span><span className="block text-sm text-ink-soft">{target.meaning}</span></span>
                        {added.has(key)
                          ? <span className="inline-flex items-center gap-1 text-xs font-bold text-success"><Check size={14} aria-hidden="true" />In review</span>
                          : <button type="button" disabled={busy === key} onClick={() => void addToReview(chapter.id, targetIndex)} className="shrink-0 rounded-lg border-2 border-line bg-surface px-2.5 py-1 text-xs font-bold hover:border-brand">Add to review</button>}
                      </li>
                    );
                  })}
                </ul>
              </details>
            </m.li>
          );
        })}
      </ul>
      <p className="text-xs text-ink-soft">Custom lessons are AI-generated practice and can contain mistakes. <Link href="/data-sharing" className="underline">How your text is processed</Link>.</p>
    </div>
  );
}
