"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BookOpen,
  Bookmark,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  Clock3,
  Coffee,
  Compass,
  Headphones,
  House,
  LogOut,
  MessageCircle,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Volume2,
} from "lucide-react";
import type { DashboardStats } from "@/lib/content";
import { ASSESSMENT_BANK, MISSIONS } from "@/lib/learning-content";
import { chapterTopic, filterChapters, orderChapters } from "@/lib/chapter-library";
import {
  dueForCheckin,
  scoreAssessment,
  SKILL_NAMES,
} from "@/lib/learning-engine";
import type { AssessmentAnswer } from "@/lib/learning-engine";
import { AssessmentPanel } from "./assessment-panel";
import { ConversationRoom } from "./conversation-room";
import { PersonalChapterLibrary } from "./personal-chapter-library";
import { StationChallenge } from "./station-challenge";
import { useStudioStore } from "./studio-store";
import { useVoice } from "./use-voice";
import { DailyPractice, RecallOverview, PracticeRoadmap } from "./daily-practice";
import { recordRecall } from "@/lib/adaptive-practice";
import "./studio.css";

type View =
  | "today"
  | "situations"
  | "personal"
  | "notebook"
  | "profile"
  | "assessment"
  | "conversation"
  | "game";
type PracticeView = View | "practice";
interface Props {
  userId: string;
  stats?: DashboardStats;
  preview?: boolean;
  initialAssessment?: boolean;
  nextCheckinAt?: string | null;
  saveAssessment?: (answers: AssessmentAnswer[], goal: number) => Promise<void>;
  logoutAction?: () => Promise<void>;
}

export function LearningStudio({
  userId,
  stats,
  preview = false,
  initialAssessment = false,
  nextCheckinAt,
  saveAssessment,
  logoutAction,
}: Props) {
  const { state, update } = useStudioStore(userId);
  const [view, setView] = useState<PracticeView>(
    initialAssessment ? "assessment" : "today",
  );
  const [missionId, setMissionId] = useState(MISSIONS[0].id);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState("All topics");
  const [chapterQuery, setChapterQuery] = useState("");
  const [chapterProgress, setChapterProgress] = useState("All chapters");
  const [chapterLimit, setChapterLimit] = useState(12);
  const [notebookQuery, setNotebookQuery] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);
  const [now] = useState(() => new Date());
  const voice = useVoice();
  const report = state.assessedAt
    ? scoreAssessment(ASSESSMENT_BANK, state.answers)
    : null;
  const weeklyDue = nextCheckinAt
    ? new Date(nextCheckinAt) <= now
    : state.assessedAt
      ? dueForCheckin(state.assessedAt, now)
      : false;
  const accountCheckinDue = !!stats && !state.assessedAt;
  const mission = MISSIONS.find((entry) => entry.id === missionId)!;
  const preferred =
    state.interest === "Work & study"
      ? "appointment"
      : state.interest === "Meeting people"
        ? "neighbors"
        : "cafe";
  const ordered = orderChapters(MISSIONS, state.completed, report?.focus, preferred);
  const topics = [...new Set(MISSIONS.map(chapterTopic))].sort();
  const chapters = filterChapters(MISSIONS, filter, chapterQuery, chapterProgress, state.completed);
  const recommended =
    ordered.find((entry) => !state.completed[entry.id] && !entry.turns.every((_, index) => state.recall[`${entry.id}:${index}`])) ?? ordered[0];
  const plan = ordered.slice(
    0,
    Math.min(4, Math.max(1, Math.round(state.goal / 8))),
  );
  const completed = Object.keys(state.completed).length;
  const duePhrases = state.phrases.filter(
    (phrase) => new Date(phrase.due) <= now,
  );
  const nav = [
    { id: "today", title: "My day", mobileTitle: "My day", icon: House },
    { id: "situations", title: "Real-life practice", mobileTitle: "Practice", icon: MessageCircle },
    { id: "personal", title: "My chapters", mobileTitle: "Chapters", icon: Plus },
    { id: "notebook", title: "My phrases", mobileTitle: "Phrases", icon: BookOpen },
    { id: "profile", title: "My progress", mobileTitle: "Progress", icon: ChartNoAxesCombined },
  ] as const;

  function persist(transform: Parameters<typeof update>[0]) {
    if (!update(transform))
      setNotice(
        "Browser storage is unavailable. This activity will not be saved on this device.",
      );
  }
  function navigate(next: PracticeView) {
    voice.stop();
    setView(next);
    setNotice(null);
  }
  function startMission(id: string) {
    if (state.draft && state.draft.missionId !== id) {
      setNotice(
        "Your unfinished conversation is saved. Resume it or finish it before starting another.",
      );
      return;
    }
    setNotice(null);
    setMissionId(id);
    if (!state.draft) {
      const selected = MISSIONS.find((entry) => entry.id === id)!;
      const firstUntracked = selected.turns.findIndex((_, index) => !state.recall[`${id}:${index}`]);
      const index = !state.completed[id] && firstUntracked > 0 ? firstUntracked : 0;
      const correct = selected.turns.slice(0, index).filter((_, turnIndex) => state.recall[`${id}:${turnIndex}`]?.lastIndependent).length;
      persist((current) => ({
        ...current,
        draft: { missionId: id, index, correct },
      }));
    }
    navigate("conversation");
  }
  function bookmark(id: string, text: string, meaning: string) {
    persist((current) =>
      current.phrases.some((phrase) => phrase.text === text)
        ? current
        : {
            ...current,
            phrases: [
              ...current.phrases,
              {
                id,
                text,
                meaning,
                due: new Date().toISOString(),
                repetitions: 0,
              },
            ],
          },
    );
  }
  async function finishAssessment(
    answers: AssessmentAnswer[],
    goal: number,
    interest: string,
  ) {
    if (!scoreAssessment(ASSESSMENT_BANK, answers).complete)
      throw new Error("Please finish all four skill sections first.");
    if (saveAssessment) await saveAssessment(answers, goal);
    persist((current) => ({
      ...current,
      answers,
      goal,
      interest,
      assessedAt: new Date().toISOString(),
    }));
    setView("today");
  }
  function startAssessment() {
    if (state.assessedAt)
      persist((current) => ({ ...current, answers: [], assessedAt: null }));
    navigate("assessment");
  }
  function reviewPhrase(id: string, known: boolean) {
    persist((current) => ({
      ...current,
      phrases: current.phrases.map((phrase) => {
        if (phrase.id !== id) return phrase;
        const repetitions = known ? phrase.repetitions + 1 : 0;
        const days = known ? Math.min(30, 2 ** Math.min(repetitions, 5)) : 1;
        return {
          ...phrase,
          repetitions,
          due: new Date(Date.now() + days * 86400000).toISOString(),
        };
      }),
    }));
    setRevealed(null);
  }

  return (
    <div className="studio-shell">
      <aside className="studio-sidebar">
        <Link className="studio-brand" href={preview ? "/preview" : "/learn"}>
          <span>
            <AudioLines size={24} />
          </span>
          sprechen<span className="brand-dot">.</span>
        </Link>
        <span className="brand-caption">GERMAN FOR YOUR REAL LIFE</span>
        <nav aria-label="Main navigation">
          {nav.map(({ id, title, mobileTitle, icon: Icon }) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              aria-label={title}
              aria-current={view === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={20} />
              <span className="nav-desktop-label" aria-hidden="true">{title}</span>
              <span className="nav-mobile-label" aria-hidden="true">{mobileTitle}</span>
              {id === "notebook" && state.phrases.length > 0 && (
                <small>{state.phrases.length}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="small-goal">
            <Target size={19} />
            <span>
              Your daily intention
              <strong>{state.goal} minutes of German</strong>
            </span>
          </div>
          {preview ? (
            <Link className="sidebar-account" href="/signup">
              <Plus size={18} /> Create an account
            </Link>
          ) : logoutAction ? (
            <form action={logoutAction}>
              <button className="sidebar-account">
                <LogOut size={17} /> Sign out
              </button>
            </form>
          ) : null}
          <small>Made for progress, not perfection.</small>
        </div>
      </aside>
      <div className="studio-body">
        <header className="studio-topbar">
          <span className="breadcrumb">
            Your everyday German <ChevronRight size={14} />
            <strong>
              {view === "conversation"
                ? mission.place
                : view === "assessment"
                  ? "Skill assessment"
                  : view === "game"
                    ? "Platform Switch"
                  : view === "practice"
                    ? "Daily practice"
                  : nav.find((entry) => entry.id === view)?.title}
            </strong>
          </span>
          <div className="topbar-right">
            {preview && (
              <span className="preview-tag">Interactive preview</span>
            )}
            <span className="language-tag">DE</span>
            <button
              className="account-avatar"
              title="My progress"
              aria-label="My progress"
              onClick={() => navigate("profile")}
            >
              {(stats?.displayName || "You").slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <main className="studio-main" id="main-content">
          {view === "today" && <PracticeRoadmap state={state} preview={preview} onPractice={() => navigate("practice")} onChapter={startMission} />}
          {view === "practice" && <DailyPractice userId={userId} onExit={() => navigate("today")} />}
          {(view === "today" || view === "profile" || view === "situations") && <section className="adaptive-launch">
            <div><span className="eyebrow">RECALL, THEN SOMETHING NEW</span><h2>Your next practice is ready.</h2></div>
            <button className="primary" onClick={() => navigate("practice")}><RotateCcw size={18} /> Daily practice <ArrowRight size={18} /></button>
          </section>}
          {view === "profile" && <RecallOverview record={state.recall} />}
          {view === "game" && (
            <StationChallenge
              best={state.gameBest}
              onComplete={(score) =>
                persist((current) => ({
                  ...current,
                  gameBest: Math.max(current.gameBest, score),
                }))
              }
              onExit={() => navigate("today")}
            />
          )}
          {(view === "today" || view === "situations") && (
            <button className="game-launch" onClick={() => navigate("game")}>
              <Headphones size={22} />
              <span>
                <strong>Platform Switch</strong>
                <small>
                  Catch the announcement. Find your train. Beat your last
                  journey.
                </small>
              </span>
              <span className="game-launch-action">
                Play listening challenge <ArrowRight size={18} />
              </span>
            </button>
          )}
          {notice && (
            <div className="studio-notice" role="status">
              {notice}
              {state.draft && (
                <button
                  onClick={() => {
                    setMissionId(state.draft!.missionId);
                    navigate("conversation");
                  }}
                >
                  Resume conversation <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
          {view === "today" && (
            <div className="studio-panel-entry">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    A LITTLE PRACTICE. A LITTLE MORE CONFIDENCE.
                  </span>
                  <h1>
                    German for the life you live
                    <span className="green-dot">.</span>
                  </h1>
                  <p>
                    {stats
                      ? `Good to see you, ${stats.displayName}. `
                      : "Hallo. Make yourself at home. "}
                    Let&apos;s make today a little easier to say.
                  </p>
                </div>
                <div className="day-goal">
                  <span>
                    {state.goal}
                    <small>min</small>
                  </span>
                  <p>your daily intention</p>
                </div>
              </div>
              {(!report || weeklyDue) && (
                <button className="assessment-banner" onClick={startAssessment}>
                  <span className="assessment-banner-icon">
                    <Compass size={23} />
                  </span>
                  <span>
                    <strong>
                      {weeklyDue
                        ? "Time for a fresh skill check."
                        : "Let's find your actual starting point."}
                    </strong>
                    <small>
                      {weeklyDue
                        ? "See what's getting easier, and adjust your next practice."
                        : "Listening, understanding, sentence patterns, and finding your own words."}
                    </small>
                  </span>
                  <span className="banner-link">
                    {weeklyDue
                      ? "Check my progress"
                      : state.answers.length && !state.assessedAt
                        ? "Resume assessment"
                        : "Find my starting point"}
                    <ArrowRight size={17} />
                  </span>
                </button>
              )}
              <div className="daily-layout">
                <section className="today-mission">
                  <div className="section-title">
                    <h2>
                      {state.draft
                        ? "Pick up where you left off"
                        : "Your next conversation"}
                    </h2>
                    <span className="subtle-tag">
                      {report
                        ? `FOCUS: ${SKILL_NAMES[report.focus].toUpperCase()}`
                        : "START HERE"}
                    </span>
                  </div>
                  <div className="featured-scene">
                    <Image
                      src={
                        (state.draft
                          ? MISSIONS.find(
                              (entry) => entry.id === state.draft!.missionId,
                            )
                          : recommended)!.image
                      }
                      alt={
                        (state.draft
                          ? MISSIONS.find(
                              (entry) => entry.id === state.draft!.missionId,
                            )
                          : recommended)!.place
                      }
                      fill
                      sizes="(max-width: 800px) 100vw, 700px"
                      priority
                      className="scene-image"
                    />
                    <div className="featured-shade" />
                    <div className="featured-content">
                      <span className="scene-tag">
                        <Coffee size={15} />{" "}
                        {
                          (state.draft
                            ? MISSIONS.find(
                                (entry) => entry.id === state.draft!.missionId,
                              )
                            : recommended)!.place
                        }
                      </span>
                      <h2>
                        {
                          (state.draft
                            ? MISSIONS.find(
                                (entry) => entry.id === state.draft!.missionId,
                              )
                            : recommended)!.title
                        }
                      </h2>
                      <p>
                        {
                          (state.draft
                            ? MISSIONS.find(
                                (entry) => entry.id === state.draft!.missionId,
                              )
                            : recommended)!.subtitle
                        }
                      </p>
                      <div>
                        <button
                          className="primary light"
                          onClick={() =>
                            startMission(
                              state.draft?.missionId ?? recommended.id,
                            )
                          }
                        >
                          <Play size={17} fill="currentColor" />
                          {state.draft
                            ? "Continue conversation"
                            : "Step into the conversation"}
                        </button>
                        <span className="scene-duration">
                          <Clock3 size={15} /> About {recommended.minutes} min
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mission-footnote">
                    <span>
                      <Headphones size={16} /> Listen
                    </span>
                    <span>
                      <MessageCircle size={16} /> Respond
                    </span>
                    <span>
                      <Bookmark size={16} /> Make it yours
                    </span>
                  </div>
                </section>
                <aside className="day-plan">
                  <div className="section-title">
                    <h2>Your practice mix</h2>
                    <span className="plan-time">
                      ~{plan.reduce((sum, entry) => sum + entry.minutes, 0)} min
                    </span>
                  </div>
                  <p>A suggested pace. Take the time you need.</p>
                  <ol>
                    {plan.map((entry, index) => (
                      <li key={entry.id}>
                        <button onClick={() => startMission(entry.id)}>
                          <span
                            className={`plan-step ${state.completed[entry.id] ? "done" : ""}`}
                          >
                            {state.completed[entry.id] ? (
                              <Check size={16} />
                            ) : (
                              `0${index + 1}`
                            )}
                          </span>
                          <span>
                            <strong>{entry.place}</strong>
                            <small>
                              {SKILL_NAMES[entry.skill]} · {entry.minutes} min
                            </small>
                          </span>
                          <ChevronRight size={17} />
                        </button>
                      </li>
                    ))}
                  </ol>
                  <button
                    className="plan-review"
                    onClick={() => navigate("notebook")}
                  >
                    <RotateCcw size={17} />
                    <span>
                      {duePhrases.length
                        ? `${duePhrases.length} saved phrases to revisit`
                        : "Keep the phrases that matter"}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                </aside>
              </div>
              <section className="situation-section">
                <div className="section-title">
                  <div>
                    <span className="eyebrow">
                      OUT OF THE TEXTBOOK. INTO YOUR DAY.
                    </span>
                    <h2>Where shall we go next?</h2>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("situations")}
                  >
                    All situations <ArrowRight size={17} />
                  </button>
                </div>
                <div className="mission-grid">
                  {ordered.filter((entry) => entry.id !== recommended.id).slice(0, 3).map(
                    (entry) => (
                      <button
                        className="mission-card"
                        key={entry.id}
                        onClick={() => startMission(entry.id)}
                      >
                        <div className="mission-photo">
                          <Image
                            src={entry.image}
                            alt={entry.place}
                            fill
                            sizes="(max-width: 700px) 90vw, 300px"
                          />
                          <span>{entry.turns.length} TURNS</span>
                          {state.completed[entry.id] && (
                            <i>
                              <Check size={17} />
                            </i>
                          )}
                        </div>
                        <div>
                          <small>{entry.place}</small>
                          <h3>{entry.title}</h3>
                          <p>{entry.subtitle}</p>
                          <span className="card-arrow">
                            <ArrowRight size={18} />
                          </span>
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </section>
              <div className="studio-bottom-strip">
                <span>
                  <Sparkles size={18} />
                  Small conversations count.
                </span>
                <span>
                  {completed} conversations completed · {state.phrases.length}{" "}
                  phrases collected
                </span>
              </div>
            </div>
          )}
          {view === "situations" && (
            <section className="studio-panel-entry">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">PRACTICE WITH A PURPOSE</span>
                  <h1>Your chapter library.</h1>
                  <p>
                    {MISSIONS.length} chapters · {completed} completed
                  </p>
                </div>
              </div>
              <div className="chapter-filters">
                <label>Find a chapter
                  <input type="search" value={chapterQuery} onChange={(event) => { setChapterQuery(event.target.value); setChapterLimit(12); }} />
                </label>
                <label>Topic
                  <select aria-label="Topic" value={filter} onChange={(event) => { setFilter(event.target.value); setChapterLimit(12); }}>
                    {["All topics", ...topics].map((topic) => <option key={topic}>{topic}</option>)}
                  </select>
                </label>
                <label>Progress
                  <select aria-label="Progress" value={chapterProgress} onChange={(event) => { setChapterProgress(event.target.value); setChapterLimit(12); }}>
                    {["All chapters", "Not completed", "Completed"].map((progress) => <option key={progress}>{progress}</option>)}
                  </select>
                </label>
              </div>
              <p role="status" className="chapter-count">{chapters.length} chapters found</p>
              <div className="mission-grid expanded">
                {chapters.slice(0, chapterLimit).map((entry) => (
                  <button
                    className="mission-card"
                    key={entry.id}
                    onClick={() => startMission(entry.id)}
                  >
                    <div className="mission-photo">
                      <Image
                        src={entry.image}
                        alt={entry.place}
                        fill
                        sizes="(max-width: 700px) 95vw, 500px"
                      />
                      <span>{entry.turns.length} TURNS</span>
                    </div>
                    <div>
                      <small>
                        Chapter {MISSIONS.indexOf(entry) + 1} · {chapterTopic(entry)}{state.completed[entry.id] ? " · Completed" : ""}
                      </small>
                      <h3>{entry.title}</h3>
                      <p>{entry.subtitle}</p>
                      <span className="card-arrow">
                        <ArrowRight size={18} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {chapters.length === 0 && <p>No chapters match these filters.</p>}
              {chapters.length > chapterLimit && (
                <button className="text-button chapter-more" onClick={() => setChapterLimit((limit) => limit + 12)}>
                  <Plus size={18} /> Show more chapters
                </button>
              )}
              {(
                <Link className="review-link" href={preview ? "/preview?mode=review" : "/learn/session"}>
                  <RotateCcw size={20} />
                  <span>
                    Recall studio
                    <strong>
                      {preview ? "Try the redesigned review" : `${stats?.dueCount ?? 0} items due from your learning history`}
                    </strong>
                  </span>
                  <ArrowRight size={18} />
                </Link>
              )}
            </section>
          )}
          {view === "personal" && <PersonalChapterLibrary preview={preview} userId={userId} />}
          {view === "assessment" && (
            <>
              <button
                className="text-button back-link"
                onClick={() => navigate("today")}
              >
                <ArrowLeft size={17} /> My day
              </button>
              <AssessmentPanel
                initialAnswers={state.assessedAt ? [] : state.answers}
                initialGoal={state.goal}
                initialInterest={state.interest}
                onProgress={(answers, goal, interest) =>
                  persist((current) => ({ ...current, answers, goal, interest, assessedAt: null }))
                }
                onComplete={finishAssessment}
                onExit={() => navigate("today")}
              />
            </>
          )}
          {view === "conversation" && (
            <ConversationRoom
              key={missionId}
              mission={mission}
              initialIndex={
                state.draft?.missionId === missionId ? state.draft.index : 0
              }
              initialCorrect={
                state.draft?.missionId === missionId ? state.draft.correct : 0
              }
              savedTexts={state.phrases.map((phrase) => phrase.text)}
              onSave={bookmark}
              onTurnResult={(index, independent) => {
                const id = `${missionId}:${index}`;
                if (!update((current) => ({ ...current, recall: { ...current.recall, [id]: recordRecall(current.recall[id], independent, new Date()) } }))) throw new Error("Storage unavailable");
              }}
              onProgress={(index, correct) =>
                persist((current) => ({
                  ...current,
                  draft: { missionId, index, correct },
                }))
              }
              onComplete={(correct) =>
                persist((current) => ({
                  ...current,
                  draft: null,
                  completed: {
                    ...current.completed,
                    [missionId]: {
                      at: new Date().toISOString(),
                      correct,
                      total: mission.turns.length,
                    },
                  },
                }))
              }
              onExit={() => navigate("today")}
            />
          )}
          {view === "notebook" && (
            <section className="studio-panel-entry">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">WORDS WORTH KEEPING</span>
                  <h1>Your pocket German.</h1>
                  <p>
                    {state.phrases.length} saved phrases · {duePhrases.length}{" "}
                    ready to revisit
                  </p>
                </div>
                <BookOpen size={40} strokeWidth={1.2} />
              </div>
              {state.phrases.length === 0 ? (
                <div className="empty-notebook">
                  <Bookmark size={44} strokeWidth={1} />
                  <h2>A little collection of your own.</h2>
                  <p>No saved phrases yet.</p>
                  <button
                    className="primary"
                    onClick={() => navigate("situations")}
                  >
                    Find my first phrase <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <label className="notebook-search">
                    Find a phrase
                    <input
                      type="search"
                      value={notebookQuery}
                      onChange={(event) => setNotebookQuery(event.target.value)}
                      placeholder="Search your German or English phrases"
                    />
                  </label>
                  <div className="phrase-list">
                    {state.phrases
                      .filter((phrase) =>
                        `${phrase.text} ${phrase.meaning}`
                          .toLowerCase()
                          .includes(notebookQuery.toLowerCase()),
                      )
                      .map((phrase) => (
                        <article key={phrase.id}>
                          <div className="phrase-label">
                            <span>
                              {new Date(phrase.due) <= now
                                ? "READY TO REVISIT"
                                : `NEXT REVIEW: ${new Date(phrase.due).toLocaleDateString()}`}
                            </span>
                            <button
                              className="icon-button"
                              title="Hear phrase"
                              aria-label={`Hear ${phrase.text}`}
                              onClick={() => voice.play(phrase.text)}
                            >
                              <Volume2 size={19} />
                            </button>
                          </div>
                          <p>{phrase.meaning}</p>
                          {revealed === phrase.id ? (
                            <>
                              <h3 lang="de">{phrase.text}</h3>
                              <div className="phrase-actions">
                                <button
                                  className="secondary"
                                  onClick={() => reviewPhrase(phrase.id, false)}
                                >
                                  Needs practice
                                </button>
                                <button
                                  className="primary"
                                  onClick={() => reviewPhrase(phrase.id, true)}
                                >
                                  <Check size={16} /> Remembered it
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              className="text-button"
                              onClick={() => setRevealed(phrase.id)}
                            >
                              Reveal German <ArrowDown size={16} />
                            </button>
                          )}
                        </article>
                      ))}
                  </div>
                  {!state.phrases.some((phrase) =>
                    `${phrase.text} ${phrase.meaning}`
                      .toLowerCase()
                      .includes(notebookQuery.toLowerCase()),
                  ) && <p>No matching phrases.</p>}
                </>
              )}
              <p className="storage-note">
                Saved in this browser
                {preview ? " for this preview" : " for your account"}. Phrase
                reviews do not yet sync across devices.
              </p>
              {voice.error && (
                <p className="error-note" role="alert">
                  {voice.error}
                </p>
              )}
            </section>
          )}
          {view === "profile" && (
            <section className="studio-panel-entry">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">EVIDENCE, NOT JUST POINTS</span>
                  <h1>See what&apos;s getting easier.</h1>
                  <p>
                    Your skill snapshot and the conversations you&apos;ve put
                    into practice.
                  </p>
                </div>
              </div>
              <div className="profile-stats">
                <div>
                  <strong>{completed}</strong>
                  <span>Conversations completed</span>
                </div>
                <div>
                  <strong>{state.phrases.length}</strong>
                  <span>Phrases saved</span>
                </div>
                <div>
                  <strong>{stats?.streakCurrent ?? 0}</strong>
                  <span>Account review streak</span>
                </div>
              </div>
              {report ? (
                <>
                  <div className="section-title">
                    <h2>Your skill snapshot</h2>
                    <button className="text-button" onClick={startAssessment}>
                      Reassess <RotateCcw size={16} />
                    </button>
                  </div>
                  <div className="report-bars">
                    {report.skills.map((entry) => (
                      <div key={entry.skill}>
                        <div>
                          <strong>{SKILL_NAMES[entry.skill]}</strong>
                          <span>{entry.accuracy ?? 0}%</span>
                        </div>
                        <progress max={100} value={entry.accuracy ?? 0} />
                        <small>
                          {entry.correct} of {entry.total} sampled questions
                        </small>
                      </div>
                    ))}
                  </div>
                  <p className="muted">
                    Practice estimate: {report.band.toUpperCase()}. Spoken
                    fluency not measured. Next check-in seven days after your
                    last assessment.
                  </p>
                </>
              ) : (
                <div className="empty-profile">
                  <Compass size={34} />
                  <h2>Let&apos;s replace guessing with a starting point.</h2>
                  <button className="primary" onClick={startAssessment}>
                    {accountCheckinDue
                      ? "Take the new skills assessment"
                      : "Find my starting point"}
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
              <div className="section-title">
                <h2>Your daily intention</h2>
              </div>
              <div className="choice-row">
                {[10, 20, 30, 45].map((goal) => (
                  <button
                    key={goal}
                    className={`choice ${state.goal === goal ? "selected" : ""}`}
                    aria-pressed={state.goal === goal}
                    onClick={() => persist((current) => ({ ...current, goal }))}
                  >
                    {goal} min
                  </button>
                ))}
              </div>
              <p className="storage-note">
                Studio goals and skill details stay in this browser. Completing
                an assessment also saves your starting level and goal to your
                account.
              </p>
              <div className="completion-history">
                {Object.entries(state.completed).map(([id, entry]) => (
                  <div key={id}>
                    <Check size={18} />
                    <span>
                      <strong>
                        {
                          MISSIONS.find((candidate) => candidate.id === id)
                            ?.title
                        }
                      </strong>
                      <small>
                        {entry.correct}/{entry.total} without help ·{" "}
                        {new Date(entry.at).toLocaleDateString()}
                      </small>
                    </span>
                  </div>
                ))}
              </div>
              {!preview && (
                <Link className="review-link" href="/learn/progress">
                  Account review history <ArrowRight size={18} />
                </Link>
              )}
            </section>
          )}
        </main>
        <footer className="studio-footer">
          <span>
            sprechen. <span>One conversation closer.</span>
          </span>
          <span>
            {preview
              ? "Preview progress stays on this device"
              : "Your existing review history is preserved"}
          </span>
        </footer>
      </div>
    </div>
  );
}
