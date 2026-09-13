"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarCheck, RotateCcw } from "lucide-react";
import { MISSIONS } from "@/lib/learning-content";
import { planPractice, practiceTargets, recallStatus, recallTurn, recordRecall, type LearningRecord } from "@/lib/adaptive-practice";
import { ConversationRoom } from "./conversation-room";
import { useStudioStore } from "./studio-store";
import { variationTargets } from "@/lib/practice-variations";

const targets = [...practiceTargets(MISSIONS), ...variationTargets(MISSIONS)];

export function RecallOverview({ record }: { record: LearningRecord }) {
  const [now] = useState(() => new Date());
  const known = targets.filter((target) => record[target.id]);
  const due = known.filter((target) => new Date(record[target.id].dueAt) <= now);
  const evidence = Object.values(record);
  const supported = known.filter((target) => !record[target.id].lastIndependent);
  const retained = evidence.filter((entry) => entry.delayed >= 2 && entry.lastIndependent);
  const focus = [...due, ...supported.filter((target) => !due.includes(target))].slice(0, 4);
  return <section className="recall-overview" aria-label="Recall evidence">
    <div className="recall-counts">
      <div><strong>{evidence.filter((entry) => new Date(entry.dueAt) <= now).length}</strong><span>Recall checks due</span></div>
      <div><strong>{evidence.filter((entry) => !entry.lastIndependent).length}</strong><span>Need support</span></div>
      <div><strong>{retained.length}</strong><span>Remembered across days</span></div>
    </div>
    {evidence.length === 0 ? <p>No response-level recall evidence yet. Previous chapter completions are kept separately.</p> : <p>{evidence.length} responses practised on this device. {targets.length - known.length} built-in responses not yet checked.</p>}
    {Object.keys(record).some((id) => id.startsWith("cloud:")) && <a className="text-button" href="/learn/session">Continue cloud-history reviews <ArrowRight size={16} /></a>}
    {Object.keys(record).some((id) => id.startsWith("personal:")) && <p>Personal-chapter responses are included here. Revisit those situations in My chapters; its phrase queue remains self-rated.</p>}
    {focus.length > 0 && <ul className="recall-focus">{focus.map((target) => <li key={target.id}><div><strong>{target.turn.task}</strong><small>{target.mission.title}</small></div><span>{recallStatus(record[target.id], now)}</span></li>)}</ul>}
  </section>;
}

export function DailyPractice({ userId, onExit }: { userId: string; onExit: () => void }) {
  const { state, update } = useStudioStore(userId);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [queue, setQueue] = useState<ReturnType<typeof planPractice>>([]);
  const [initialRecord, setInitialRecord] = useState<LearningRecord>({});
  function start() {
    setQueue(planPractice(targets, state.recall, new Date(), Math.round(state.goal / 3)));
    setInitialRecord(state.recall);
    setStarted(true);
  }
  if (!started || finished) return <section className="daily-practice studio-panel-entry">
    <button className="text-button" onClick={onExit}><ArrowLeft size={18} /> My day</button>
    <span className="eyebrow">YOUR CONTINUING PRACTICE</span>
    <h1>{finished ? "Today's practice, carried forward." : "Pick up where memory needs you."}</h1>
    {finished && <p className="lede">{correct} of {queue.length} responses without support. Your next recall checks are scheduled.</p>}
    <RecallOverview key={finished ? "finished" : "start"} record={state.recall} />
    {finished ? <>
      <p>More practice today is optional. A later recall check gives better evidence than an immediate replay.</p>
      <button className="primary" onClick={onExit}><CalendarCheck size={18} /> Done for today</button>
      <button className="text-button" onClick={() => { setFinished(false); setStarted(false); }}><RotateCcw size={17} /> Practise another round</button>
    </> : <button className="primary" onClick={start}>Start daily practice <ArrowRight size={18} /></button>}
  </section>;
  const mission = {
    ...queue[0].mission,
    id: "daily-practice",
    title: "Daily recall",
    place: "Daily practice",
    turns: queue.map((target) => recallTurn(target, initialRecord[target.id])),
  };
  return <ConversationRoom key={queue.map((target) => target.id).join("-")} mission={mission}
    turnContexts={queue.map((target) => target.mission)}
    initialIndex={0} initialCorrect={0} savedTexts={[]} showBookmarks={false}
    onSave={() => {}} onProgress={() => {}} onExit={onExit}
    onTurnResult={(index, independent) => {
      const id = queue[index].id;
      if (!update((current) => ({ ...current, recall: { ...current.recall, [id]: recordRecall(current.recall[id], independent, new Date()) } }))) throw new Error("Storage unavailable");
    }}
    onComplete={(count) => { setCorrect(count); setFinished(true); }} />;
}