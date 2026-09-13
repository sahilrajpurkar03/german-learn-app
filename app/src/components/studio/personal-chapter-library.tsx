"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Bookmark, Check, Download, Eye, LoaderCircle, Plus, RotateCcw, Trash2, Volume2, X } from "lucide-react";
import type { ChapterProgress, ChapterVariant, PersonalChapter } from "@/lib/personal-chapters";
import { personalMission } from "@/lib/personal-chapters";
import { ChapterCreator } from "./chapter-creator";
import { chapterRequest, getPersonalLibrary } from "./personal-chapter-client";
import type { PersonalLibrary } from "./personal-chapter-client";
import { ConversationRoom } from "./conversation-room";
import { useVoice } from "./use-voice";
import { useStudioStore } from "./studio-store";
import { recordRecall } from "@/lib/adaptive-practice";
import "./personal-chapters.css";

export function PersonalChapterLibrary({ preview, userId }: { preview: boolean; userId: string }) {
  const { update } = useStudioStore(userId);
  const [library, setLibrary] = useState<PersonalLibrary>({ chapters: [], reviews: [], available: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [active, setActive] = useState<{ chapter: PersonalChapter; variant: ChapterVariant; progress: ChapterProgress } | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const now = library.loadedAt ?? 0;
  const progressQueue = useRef(Promise.resolve());
  const [failedProgress, setFailedProgress] = useState<unknown>(null);
  const voice = useVoice();

  useEffect(() => {
    const controller = new AbortController();
    getPersonalLibrary(preview, controller.signal).then((data) => { setLibrary(data); setLoading(false); }).catch((failure: Error) => { if (!controller.signal.aborted) { setError(failure.message); setLoading(false); } });
    return () => controller.abort();
  }, [preview]);

  async function reload() {
    const data = await getPersonalLibrary(preview);
    setLibrary(data);
  }
  async function mutate(operation: unknown) {
    setBusy(true);
    setError(null);
    try { await chapterRequest(operation); await reload(); return true; }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Your change could not be saved."); return false; }
    finally { setBusy(false); }
  }
  function progress(operation: unknown) {
    if (library.demo) return;
    setSaving(true);
    progressQueue.current = progressQueue.current.then(async () => {
      try { await chapterRequest(operation); setFailedProgress(null); }
      catch (failure) { setFailedProgress(operation); setError(failure instanceof Error ? failure.message : "Progress did not save."); }
    }).finally(() => setSaving(false));
  }
  function exportChapter(chapter: PersonalChapter) {
    const contents = { format: "sprechen-personal-chapter", version: 1, chapter, reviews: library.reviews.filter((review) => review.chapter_id === chapter.id) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(contents, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sprechen-chapter-${chapter.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  const chapter = library.chapters.find((entry) => entry.id === selected);
  const dueReview = library.reviews.find((review) => new Date(review.due_at).getTime() <= now && library.chapters.some((entry) => entry.id === review.chapter_id));
  const reviewChapter = library.chapters.find((entry) => entry.id === dueReview?.chapter_id);
  const reviewTarget = dueReview && reviewChapter?.blueprint.targets[dueReview.target_index];

  if (creating) return <ChapterCreator available={library.available} onExit={() => setCreating(false)} onCreated={async (id) => { await reload(); setSelected(id); setCreating(false); }} />;

  return <section className="personal-library studio-panel-entry">
    {error && <div role="alert" className="error-note personal-error"><p>{error}</p>{failedProgress !== null && <button className="text-button" disabled={saving} onClick={() => { setError(null); progress(failedProgress); }}><RotateCcw size={16} />Retry saving progress</button>}<button className="text-button" onClick={() => { setError(null); void reload().catch((failure: Error) => setError(failure.message)); }}><RotateCcw size={16} />Refresh library</button></div>}
    {library.message && <p className="personal-notice" role="status">{library.message}</p>}
    {active ? <>
      <div className="personal-save-status" role="status">{library.demo ? "Sample practice; progress is not saved" : saving ? "Saving progress..." : "Private chapter practice"}</div>
      <ConversationRoom key={`${active.chapter.id}:${active.variant}`} mission={personalMission(active.chapter, active.variant)} initialIndex={active.progress.index} initialCorrect={active.progress.correct} savedTexts={[]} onSave={() => {}} showBookmarks={false} selfCheckReplies exitLabel="My chapters"
        onTurnResult={(index, independent) => {
          if (library.demo) return;
          const id = `personal:${active.chapter.id}:${active.variant}:${index}`;
          if (!update((current) => ({ ...current, recall: { ...current.recall, [id]: recordRecall(current.recall[id], independent, new Date()) } }))) throw new Error("Local evidence could not save");
        }}
        onProgress={(index, correct) => progress({ op: "progress", id: active.chapter.id, variant: active.variant, progress: { index, correct, completed: false } })} onComplete={(correct) => progress({ op: "progress", id: active.chapter.id, variant: active.variant, progress: { index: active.chapter.blueprint[active.variant].turns.length, correct, completed: true } })} onExit={() => { void progressQueue.current.then(async () => { setActive(null); if (!library.demo) await reload(); }).catch((failure: Error) => setError(failure.message)); }} />
    </> : chapter ? <>
      <div className="personal-detail-toolbar"><button className="text-button" onClick={() => { voice.stop(); setSelected(null); }}><ArrowLeft size={17} />All my chapters</button><div><button className="icon-button" title="Export chapter" aria-label="Export chapter" onClick={() => exportChapter(chapter)}><Download size={19} /></button>{!library.demo && <button className="icon-button" title="Delete chapter" aria-label="Delete chapter" onClick={() => setRemoving(chapter.id)}><Trash2 size={19} /></button>}</div></div>
      <div className="page-heading"><div><span className="eyebrow">{library.demo ? "SAMPLE" : "PRIVATE AI DRAFT"} / {chapter.blueprint.level.toUpperCase()} / {chapter.blueprint.register === "formal" ? "SIE" : "DU"}</span><h1>{chapter.blueprint.title}</h1><p>{chapter.blueprint.summary}</p></div></div>
      <p className="personal-provenance">These are practice scenarios inspired by the reviewed text, not a verbatim record or verified professional advice. AI language may need correction.</p>
      <div className="personal-scenarios">{(["original", "variation"] as const).map((variant) => {
        const checkpoint = chapter.progress[variant];
        return <article key={variant}><span className="eyebrow">{variant === "original" ? "YOUR SITUATION" : "A NEW CONSTRAINT"}</span><h2>{chapter.blueprint[variant].title}</h2><p>{checkpoint?.completed ? `${checkpoint.correct} of ${checkpoint.index} replies without help` : checkpoint ? `Resume at turn ${checkpoint.index + 1}` : `${chapter.blueprint[variant].turns.length} turns`}</p><button className="primary" onClick={() => { voice.stop(); setError(null); setActive({ chapter, variant, progress: checkpoint && !checkpoint.completed ? checkpoint : { index: 0, correct: 0, completed: false } }); }} >{checkpoint?.completed ? <RotateCcw size={18} /> : <ArrowRight size={18} />}{checkpoint?.completed ? "Practise again" : checkpoint ? "Resume practice" : variant === "original" ? "Practise my situation" : "Try the variation"}</button></article>;
      })}</div>
      <h2 className="personal-section-title">Language worth keeping</h2>
      <div className="personal-targets">{chapter.blueprint.targets.map((target, index) => {
        const saved = library.reviews.some((review) => review.chapter_id === chapter.id && review.target_index === index);
        return <div className="personal-target" key={index}><div><small>{target.kind}</small><h3 lang="de">{target.text}</h3><p>{target.meaning}</p><p className="muted">{target.note}</p><details><summary>From your reviewed text</summary><p>{target.sourceQuote}</p></details></div><div className="personal-target-actions"><button className="icon-button" title="Hear German phrase" aria-label={`Hear ${target.text}`} onClick={() => voice.play(target.text)}><Volume2 size={18} /></button><button className="icon-button" title={saved ? "In review queue" : "Save for review"} aria-label={saved ? `Saved ${target.text}` : `Save ${target.text} for review`} disabled={busy || saved || library.demo} onClick={() => void mutate({ op: "addReview", id: chapter.id, index })}>{saved ? <Check size={18} /> : <Bookmark size={18} />}</button></div></div>;
      })}</div>
    </> : <>
      <div className="page-heading"><div><span className="eyebrow">YOUR LIFE, IN GERMAN</span><h1>My chapters.</h1><p>{library.chapters.length} {library.demo ? "sample chapter" : library.chapters.length === 1 ? "private chapter" : "private chapters"}</p></div><button className="primary" onClick={() => { voice.stop(); setCreating(true); }}><Plus size={18} />Create a chapter</button></div>
      {loading ? <p role="status"><LoaderCircle size={18} className="personal-spin" /> Loading your chapters...</p> : <>
        {reviewTarget && dueReview && <section className="personal-review"><div><span className="eyebrow">DUE FOR REVIEW / SELF-RATED</span><h2>{reviewTarget.meaning}</h2>{revealed && <p lang="de">{reviewTarget.text}</p>}</div>{revealed ? <div className="personal-review-actions"><button className="secondary" disabled={busy} onClick={() => voice.play(reviewTarget.text)}><Volume2 size={17} />Listen</button>{([{ grade: 0, label: "Again" }, { grade: 3, label: "Good" }, { grade: 5, label: "Easy" }] as const).map(({ grade, label }) => <button className="secondary" disabled={busy} key={grade} onClick={() => { void mutate({ op: "rateReview", id: dueReview.chapter_id, index: dueReview.target_index, grade, revision: dueReview.updated_at }).then((saved) => { if (saved) setRevealed(false); }); }}>{label}</button>)}</div> : <button className="secondary" onClick={() => setRevealed(true)}><Eye size={18} />Reveal German</button>}</section>}
        <label className="personal-search">Find my chapter<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="personal-grid">{library.chapters.filter((entry) => `${entry.blueprint.title} ${entry.blueprint.summary}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())).map((entry) => <article className="personal-card" key={entry.id}><div className="personal-card-image"><Image src="/images/personal-chapter.jpg" alt="A pen writing in a notebook" fill sizes="(max-width: 700px) 100vw, 360px" /></div><div><small>{library.demo ? "Sample" : "Private"} / {entry.blueprint.level.toUpperCase()}</small><h2>{entry.blueprint.title}</h2><p>{entry.blueprint.summary}</p><button className="text-button" onClick={() => { setSelected(entry.id); setError(null); }}>Open chapter <ArrowRight size={18} /></button></div></article>)}</div>
        {library.chapters.length === 0 && <p className="personal-empty">No personal chapters yet.</p>}
        {query && !library.chapters.some((entry) => `${entry.blueprint.title} ${entry.blueprint.summary}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) && <p>No chapters match your search.</p>}
      </>}
    </>}
    {removing && <DeleteChapterDialog busy={busy} onCancel={() => setRemoving(null)} onDelete={() => { void mutate({ op: "delete", id: removing }).then((saved) => { if (saved) { if (!update((current) => ({ ...current, recall: Object.fromEntries(Object.entries(current.recall).filter(([id]) => !id.startsWith(`personal:${removing}:`))) }))) setError("Chapter deleted from your account, but local recall evidence could not be cleared. Clear site data to remove it from this browser."); setRemoving(null); setSelected(null); } }); }} />}
    {voice.error && <p role="alert" className="error-note">{voice.error}</p>}
  </section>;
}

function DeleteChapterDialog({ busy, onCancel, onDelete }: { busy: boolean; onCancel: () => void; onDelete: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} role="alertdialog" aria-labelledby="delete-chapter-title" aria-describedby="delete-chapter-description" className="personal-modal" onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}>
    <button className="icon-button personal-modal-close" disabled={busy} aria-label="Cancel deletion" title="Cancel deletion" onClick={onCancel}><X size={18} /></button>
    <h2 id="delete-chapter-title">Delete this chapter?</h2>
    <p id="delete-chapter-description">Its scenarios, checkpoints, and phrase reviews will be deleted from your account. Export it first to keep your own copy.</p>
    <div className="personal-review-actions"><button className="secondary" disabled={busy} onClick={onCancel}>Cancel</button><button className="primary" disabled={busy} onClick={onDelete}><Trash2 size={18} />Delete chapter</button></div>
  </dialog>;
}