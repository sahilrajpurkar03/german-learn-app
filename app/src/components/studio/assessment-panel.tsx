"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Headphones,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { ASSESSMENT_BANK } from "@/lib/learning-content";
import {
  nextAssessmentItem,
  scoreAssessment,
  SKILL_NAMES,
  SKILLS,
} from "@/lib/learning-engine";
import type { AssessmentAnswer } from "@/lib/learning-engine";
import { useVoice } from "./use-voice";

interface Props {
  initialAnswers: AssessmentAnswer[];
  initialGoal: number;
  initialInterest: string;
  onProgress: (answers: AssessmentAnswer[], goal: number, interest: string) => void;
  onComplete: (
    answers: AssessmentAnswer[],
    goal: number,
    interest: string,
  ) => Promise<void>;
  onExit: () => void;
}

export function AssessmentPanel({
  initialAnswers,
  initialGoal,
  initialInterest,
  onProgress,
  onComplete,
  onExit,
}: Props) {
  const [phase, setPhase] = useState<"intro" | "questions" | "report">(
    initialAnswers.length
      ? nextAssessmentItem(ASSESSMENT_BANK, initialAnswers)
        ? "questions"
        : "report"
      : "intro",
  );
  const [answers, setAnswers] = useState<AssessmentAnswer[]>(initialAnswers);
  const [goal, setGoal] = useState(initialGoal);
  const [interest, setInterest] = useState(initialInterest);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const item = nextAssessmentItem(ASSESSMENT_BANK, answers);
  const report = scoreAssessment(ASSESSMENT_BANK, answers);

  function answer(value: string, skipped = false) {
    if (!item) return;
    const next = [...answers, { id: item.id, value, skipped }];
    setAnswers(next);
    onProgress(next, goal, interest);
    if (!nextAssessmentItem(ASSESSMENT_BANK, next)) setPhase("report");
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await onComplete(answers, goal, interest);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (phase === "intro")
    return (
      <section className="assessment-intro studio-panel-entry">
        <span className="eyebrow">YOUR STARTING POINT</span>
        <h1>What can you already do?</h1>
        <p className="lede">
          A few real situations. Four different skills. A starting point built
          from your answers.
        </p>
        <div className="assessment-skills">
          {SKILLS.map((skill, index) => (
            <div key={skill}>
              <span>0{index + 1}</span>
              <strong>{SKILL_NAMES[skill]}</strong>
              <small>
                {
                  [
                    "Messages and everyday meaning",
                    "German audio, without subtitles",
                    "Useful patterns in context",
                    "Writing without answer choices",
                  ][index]
                }
              </small>
            </div>
          ))}
        </div>
        <fieldset>
          <legend>Where do you want German to take you?</legend>
          <div className="choice-row">
            {["Everyday life", "Work & study", "Meeting people"].map(
              (value) => (
                <button
                  type="button"
                  className={interest === value ? "choice selected" : "choice"}
                  aria-pressed={interest === value}
                  key={value}
                  onClick={() => setInterest(value)}
                >
                  {value}
                </button>
              ),
            )}
          </div>
        </fieldset>
        <fieldset>
          <legend>Your daily time</legend>
          <div className="choice-row">
            {[10, 20, 30, 45].map((value) => (
              <button
                type="button"
                className={goal === value ? "choice selected" : "choice"}
                aria-pressed={goal === value}
                key={value}
                onClick={() => setGoal(value)}
              >
                {value} min
              </button>
            ))}
          </div>
        </fieldset>
        <div className="assessment-note">
          <Headphones size={20} />
          <span>
            16 adaptive questions · about 8 minutes
            <br />
            <small>
              A practice estimate, not a CEFR certificate. Spoken fluency is not
              assessed here.
            </small>
          </span>
        </div>
        <button
          className="primary"
          onClick={() => {
            if (!item) {
              setAnswers([]);
            }
            onProgress(item ? answers : [], goal, interest);
            setPhase("questions");
          }}
        >
          Find my starting point <ArrowRight size={18} />
        </button>
      </section>
    );

  if (phase === "report" || !item)
    return (
      <section className="assessment-report studio-panel-entry">
        <span className="eyebrow">YOUR SKILL SNAPSHOT</span>
        <h1>A clearer place to start.</h1>
        <p className="lede">
          Your next focus:{" "}
          <strong>{SKILL_NAMES[report.focus].toLowerCase()}</strong>. Your
          practice starting band is {report.band.toUpperCase()}.
        </p>
        <div className="report-bars">
          {report.skills.map((entry) => (
            <div key={entry.skill}>
              <div>
                <strong>{SKILL_NAMES[entry.skill]}</strong>
                <span>
                  {entry.accuracy === null
                    ? "Not measured"
                    : `${entry.correct} of ${entry.total}`}
                </span>
              </div>
              <progress max={100} value={entry.accuracy ?? 0} />
              <small>
                {entry.attempted === 0
                  ? "No attempted answers yet"
                  : entry.accuracy! >= 75
                    ? "A foundation to build on"
                    : "Let's give this more time"}
              </small>
            </div>
          ))}
        </div>
        <p className="muted">
          This short sample cannot establish fluency. Listening uses your
          browser&apos;s voice; speaking needs separate practice.
        </p>
        <details className="answer-review">
          <summary>Review your answers</summary>
          {answers.map((entry) => {
            const question = ASSESSMENT_BANK.find(
              (candidate) => candidate.id === entry.id,
            );
            return (
              question && (
                <div key={entry.id}>
                  <strong>{question.prompt}</strong>
                  <p>Your answer: {entry.skipped ? "Not sure" : entry.value}</p>
                  <p>{question.accepted[0]}</p>
                  <small>{question.explanation}</small>
                </div>
              )
            );
          })}
        </details>
        {error && (
          <p role="alert" className="error-note">
            {error}
          </p>
        )}
        <button
          disabled={saving}
          className="primary"
          onClick={() => void save()}
        >
          {saving ? "Saving your plan..." : "Build my practice plan"}
          <ArrowRight size={18} />
        </button>
      </section>
    );

  return (
    <section className="assessment-questions">
      <div className="assessment-progress">
        {SKILLS.map((skill) => (
          <span key={skill} className={skill === item.skill ? "active" : ""}>
            {SKILL_NAMES[skill]}
          </span>
        ))}
      </div>
      <div className="question-count">
        <span>{answers.length + 1} / 16</span>
        <button className="text-button" onClick={onExit}>
          Save & leave
        </button>
      </div>
      <progress max={16} value={answers.length} />
      <AssessmentQuestion key={item.id} item={item} onAnswer={answer} />
    </section>
  );
}

function AssessmentQuestion({
  item,
  onAnswer,
}: {
  item: (typeof ASSESSMENT_BANK)[number];
  onAnswer: (value: string, skipped?: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const [played, setPlayed] = useState(false);
  const voice = useVoice();
  return (
    <div className="assessment-question studio-panel-entry">
      <span className="eyebrow">{SKILL_NAMES[item.skill]}</span>
      <h2>{item.prompt}</h2>
      {item.context && <blockquote lang="de">{item.context}</blockquote>}
      {item.audio && (
        <div className="audio-prompt">
          <Headphones size={34} />
          <span>Listen to the message</span>
          <button
            className="icon-button"
            aria-label={voice.speaking ? "Stop audio" : "Play German audio"}
            title="Play German audio"
            onClick={() => {
              if (voice.speaking) voice.stop();
              else {
                setPlayed(true);
                voice.play(item.audio!);
              }
            }}
          >
            <Volume2 size={23} />
          </button>
          <button
            className="text-button"
            onClick={() => {
              setPlayed(true);
              voice.play(item.audio!, true);
            }}
          >
            Slower
          </button>
        </div>
      )}
      {voice.error && (
        <p className="error-note" role="alert">
          {voice.error} You can mark this question as not sure.
        </p>
      )}
      {item.options ? (
        <div className="assessment-options">
          {item.options.map((option, index) => (
            <button
              key={option}
              disabled={!!item.audio && !played}
              className={
                value === option ? "answer-option selected" : "answer-option"
              }
              onClick={() => setValue(option)}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              {option}
              {value === option && <Check size={18} />}
            </button>
          ))}
        </div>
      ) : (
        <label className="response-label">
          Your German answer
          <input
            lang="de"
            autoComplete="off"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && value.trim()) {
                voice.stop();
                onAnswer(value);
              }
            }}
            placeholder="Write your answer"
          />
        </label>
      )}
      <div className="question-actions">
        <button
          className="text-button"
          onClick={() => {
            voice.stop();
            onAnswer("", true);
          }}
        >
          <RotateCcw size={15} /> Not sure yet
        </button>
        <button
          className="primary"
          disabled={!value.trim()}
          onClick={() => {
            voice.stop();
            onAnswer(value);
          }}
        >
          Continue <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
