"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import type { SessionItem } from "@/lib/content";
import { recordAnswer, completeSession } from "@/lib/session-actions";
import { adaptiveReviewItems, reviewMission } from "@/lib/review-mission";
import { recordRecall } from "@/lib/adaptive-practice";
import { ConversationRoom } from "./studio/conversation-room";
import { useStudioStore } from "./studio/studio-store";
import "./studio/studio.css";

interface Props {
  sessionId: string;
  items: SessionItem[];
  userId: string;
  preview?: boolean;
}

export function SessionRunner({ sessionId, items, userId, preview = false }: Props) {
  const { state, update } = useStudioStore(userId);
  const [practiceItems, setPracticeItems] = useState<SessionItem[] | null>(null);
  const [startPosition, setStartPosition] = useState({ index: 0, correct: 0 });
  const [storageError, setStorageError] = useState(false);
  const signature = JSON.stringify(items);
  const checkpoint = preview && state.reviewPreview?.signature === signature && state.reviewPreview.index <= items.length
    ? state.reviewPreview : null;
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const cloudSaved = useRef(new Set<number>());
  const home = preview ? "/preview" : "/learn";
  async function finish(count: number) {
    setSaving(true);
    setSaveError(false);
    try { if (!preview) await completeSession(sessionId, count * 10); }
    catch { setSaveError(true); }
    finally { setSaving(false); }
  }
  return <div className="studio-shell review-studio-shell">
    <header className="review-studio-header"><Link href={home} className="review-wordmark">Sprechen<span>.</span></Link><Link href={home} className="text-button"><ArrowLeft size={17} /> My day</Link></header>
    <main className="studio-main review-studio-main">
      {preview && <p className="preview-tag">Review preview. Cloud history is not changed.</p>}
      {storageError && <p role="alert">Your place could not be saved in this browser. Please enable site storage and retry.</p>}
      {items.length === 0 ? <section className="daily-practice"><h1>You&apos;re up to date.</h1><p>No cloud review items are available right now. Your daily practice has more situations to explore.</p><Link className="primary" href={home}>Back to my day <ArrowRight size={18} /></Link></section>
        : finished || (!practiceItems && checkpoint?.completedAt) ? <section className="daily-practice studio-panel-entry"><span className="eyebrow">RECALL PRACTICE COMPLETE</span><h1>Keep it with you.</h1><p className="lede">{finished ? correct : checkpoint?.correct} of {items.length} responses without support.</p><p>{saving ? "Saving your session..." : saveError ? "Your session summary could not be saved." : preview ? "Preview complete. Your place is saved on this device." : "Your responses have been added to your learning history."}</p>{saveError && <button className="secondary" disabled={saving} onClick={() => void finish(correct)}><RotateCcw size={18} /> Retry saving summary</button>}<Link className="primary" href={home}>Back to my day <ArrowRight size={18} /></Link>{preview && <button className="text-button" onClick={() => {
          if (!update((current) => ({ ...current, reviewPreview: null }))) { setStorageError(true); return; }
          setPracticeItems(null); setFinished(false); setCorrect(0); setStartPosition({ index: 0, correct: 0 }); setStorageError(false);
        }}><RotateCcw size={18} /> Replay review</button>}</section>
          : !practiceItems ? <section className="daily-practice"><span className="eyebrow">FROM YOUR LEARNING HISTORY</span><h1>A fresh way to revisit.</h1><p>{checkpoint?.index ? `${checkpoint.index} of ${items.length} responses completed. Next: response ${checkpoint.index + 1}.` : `${items.length} responses ready for practice.`}</p><button className="primary" onClick={() => { setStartPosition({ index: checkpoint?.index ?? 0, correct: checkpoint?.correct ?? 0 }); setPracticeItems(adaptiveReviewItems(items, state.recall)); setStartedAt(Date.now()); }}>{checkpoint?.index ? "Resume review" : "Start review"} <ArrowRight size={18} /></button></section>
          : <ConversationRoom mission={reviewMission(practiceItems)} initialIndex={startPosition.index} initialCorrect={startPosition.correct} savedTexts={[]} onSave={() => {}} showBookmarks={false} exitLabel="My day"
            onExit={() => { window.location.assign(home); }} onProgress={() => {}}
            onTurnResult={async (index, independent) => {
              const item = practiceItems[index];
              if (preview && !update((current) => {
                const previous = current.reviewPreview?.signature === signature ? current.reviewPreview : null;
                if (previous && previous.index > index) return current;
                return { ...current, reviewPreview: { signature, index: index + 1, correct: (previous?.correct ?? 0) + Number(independent), completedAt: index + 1 === items.length ? new Date().toISOString() : null } };
              })) throw new Error("Preview checkpoint could not save");
              if (!preview && !cloudSaved.current.has(index)) {
                await recordAnswer({ sessionId, itemType: item.itemType, itemId: item.id, exerciseType: item.exercise, correct: independent, responseMs: Math.max(0, Date.now() - startedAt) });
                cloudSaved.current.add(index);
              }
              if (!preview) {
                const id = `cloud:${item.itemType}:${item.id}:${item.exercise}`;
                if (!update((current) => ({ ...current, recall: { ...current.recall, [id]: recordRecall(current.recall[id], independent, new Date()) } }))) throw new Error("Local evidence could not save");
              }
              setStartedAt(Date.now());
            }}
            onComplete={(count) => { setCorrect(count); setFinished(true); void finish(count); }} />}
    </main>
  </div>;
}
