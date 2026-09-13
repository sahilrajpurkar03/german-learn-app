"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarCheck, RotateCcw } from "lucide-react";
import { MISSIONS } from "@/lib/learning-content";
import { planPractice, practiceTargets, recallStatus, recallTurn, recordRecall, type LearningRecord } from "@/lib/adaptive-practice";
import { ConversationRoom } from "./conversation-room";
import { useStudioStore, type StudioState } from "./studio-store";
import { variationTargets } from "@/lib/practice-variations";

const targets = [...practiceTargets(MISSIONS), ...variationTargets(MISSIONS)];

export function PracticeRoadmap({ state, preview, onPractice, onChapter }: {
  state: StudioState; preview: boolean; onPractice: () => void; onChapter: (id: string) => void;
}) {
  const steps = MISSIONS.map((mission) => {
    const observed = mission.turns.filter((_, index) => state.recall[`${mission.id}:${index}`]).length;
    return { mission, observed, complete: Boolean(state.completed[mission.id]) || observed === mission.turns.length };
  });
  const current = steps.find((step) => step.mission.id === state.draft?.missionId) ?? steps.find((step) => !step.complete);
  const currentIndex = current ? steps.indexOf(current) : steps.length;
  const visible = steps.slice(Math.max(0, currentIndex - 1), Math.min(steps.length, currentIndex + 4));
  const round = state.dailyRound;
  return <section className="practice-roadmap" aria-labelledby="roadmap-title">
    <div className="roadmap-heading"><div><span className="eyebrow">YOUR POSITION / THIS DEVICE</span><h2 id="roadmap-title">Your roadmap</h2></div><span>{steps.filter((step) => step.complete).length} of {steps.length} situations explored</span></div>
    <div className="roadmap-current">
      <div><strong>{round && !round.completedAt ? `Daily round in progress: ${round.index} of ${round.targetIds.length} responses` : round?.completedAt ? `Daily round complete: ${round.index} of ${round.targetIds.length} responses` : "Your first daily round is ready"}</strong><p>{state.dailyRoundsCompleted} daily {state.dailyRoundsCompleted === 1 ? "round" : "rounds"} completed{preview && state.reviewPreview?.completedAt ? " · Review preview completed" : preview && state.reviewPreview?.index ? ` · Review preview: ${state.reviewPreview.index} responses completed` : ""}</p></div>
      <button className="primary" onClick={onPractice}>{round && !round.completedAt ? "Resume daily round" : round?.completedAt ? "View round & next steps" : "Open daily round"}<ArrowRight size={18} /></button>
    </div>
    <ol className="roadmap-steps">{visible.map((step) => <li key={step.mission.id} aria-current={step === current ? "step" : undefined} className={step.complete ? "roadmap-complete" : step === current ? "roadmap-active" : ""}>
      <span className="roadmap-marker">{step.complete ? <CalendarCheck size={18} /> : steps.indexOf(step) + 1}</span>
      <div><small>{step === current ? "YOU ARE HERE" : step.complete ? "EXPLORED" : "UP NEXT"}</small><h3>{step.mission.title}</h3><p>{step.observed} of {step.mission.turns.length} responses tracked{state.completed[step.mission.id] && !step.observed ? " · Earlier chapter completed" : ""}</p>
      {step === current && <button className="text-button" onClick={() => onChapter(step.mission.id)}>{state.draft?.missionId === step.mission.id ? `Resume at response ${state.draft.index + 1}` : "Open situation"}<ArrowRight size={16} /></button>}</div>
    </li>)}</ol>
    {!current && <p>All built-in situations explored. Continue recall checks and unlocked follow-up situations in daily practice.</p>}
    <p className="muted">Explored is not mastered. Delayed recall is tracked separately in My progress.</p>
    {preview && state.reviewPreview && <Link className="text-button" href="/preview?mode=review">{state.reviewPreview.completedAt ? "View completed review" : "Resume review preview"}<ArrowRight size={16} /></Link>}
  </section>;
}

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
  const [queue, setQueue] = useState<ReturnType<typeof planPractice>>([]);
  const [initialRecord, setInitialRecord] = useState<LearningRecord>({});
  const [startPosition, setStartPosition] = useState({ index: 0, correct: 0 });
  const [roundId, setRoundId] = useState("");
  const [storageError, setStorageError] = useState(false);
  const saved = state.dailyRound;
  const validRound = saved && saved.targetIds.every((id) => targets.some((target) => target.id === id));
  const finished = Boolean(validRound && saved.completedAt);
  function start(forceNew = false) {
    const resume = !forceNew && validRound && !saved.completedAt ? saved : null;
    const nextQueue = resume ? resume.targetIds.map((id) => targets.find((target) => target.id === id)!) : planPractice(targets, state.recall, new Date(), Math.round(state.goal / 3));
    if (!nextQueue.length) return;
    const snapshot = resume?.initialRecall ?? Object.fromEntries(nextQueue.filter((target) => state.recall[target.id]).map((target) => [target.id, state.recall[target.id]]));
    const round = resume ?? { id: crypto.randomUUID(), targetIds: nextQueue.map((target) => target.id), initialRecall: snapshot, index: 0, correct: 0, completedAt: null };
    if (!update((current) => ({ ...current, dailyRound: round }))) { setStorageError(true); return; }
    setStorageError(false);
    setQueue(nextQueue);
    setInitialRecord(snapshot);
    setStartPosition({ index: round.index, correct: round.correct });
    setRoundId(round.id);
    setStarted(true);
  }
  if (!started || finished) return <section className="daily-practice studio-panel-entry">
    <button className="text-button" onClick={onExit}><ArrowLeft size={18} /> My day</button>
    <span className="eyebrow">YOUR CONTINUING PRACTICE</span>
    <h1>{finished ? "Today's practice, carried forward." : "Pick up where memory needs you."}</h1>
    {storageError && <p role="alert">Your place could not be saved. Please enable site storage and retry.</p>}
    {finished && saved && <p className="lede">{saved.correct} of {saved.targetIds.length} responses without support. Your next recall checks are scheduled.</p>}
    {!finished && validRound && saved.index > 0 && <p>{saved.index} of {saved.targetIds.length} responses completed. Next: response {saved.index + 1}.</p>}
    <RecallOverview key={finished ? "finished" : "start"} record={state.recall} />
    {finished ? <>
      <p>More practice today is optional. A later recall check gives better evidence than an immediate replay.</p>
      <button className="primary" onClick={onExit}><CalendarCheck size={18} /> Done for today</button>
      <button className="text-button" onClick={() => start(true)}><RotateCcw size={17} /> Practise another round</button>
    </> : <button className="primary" onClick={() => start()}>{validRound ? "Resume daily practice" : "Start daily practice"} <ArrowRight size={18} /></button>}
  </section>;
  const mission = {
    ...queue[0].mission,
    id: "daily-practice",
    title: "Daily recall",
    place: "Daily practice",
    turns: queue.map((target) => recallTurn(target, initialRecord[target.id])),
  };
  return <ConversationRoom key={roundId} mission={mission}
    turnContexts={queue.map((target) => target.mission)}
    initialIndex={startPosition.index} initialCorrect={startPosition.correct} savedTexts={[]} showBookmarks={false}
    onSave={() => {}} onProgress={() => {}} onExit={onExit}
    onTurnResult={(index, independent) => {
      const id = queue[index].id;
      if (!update((current) => {
        const round = current.dailyRound;
        if (!round || round.id !== roundId) throw new Error("Round changed in another tab");
        if (round.index > index) return current;
        const complete = index + 1 === queue.length;
        return { ...current,
          recall: { ...current.recall, [id]: recordRecall(current.recall[id], independent, new Date()) },
          dailyRound: { ...round, index: index + 1, correct: round.correct + Number(independent), completedAt: complete ? new Date().toISOString() : null },
          dailyRoundsCompleted: current.dailyRoundsCompleted + Number(complete),
        };
      })) throw new Error("Storage unavailable");
    }}
    onComplete={() => setStarted(false)} />;
}