"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  Eye,
  Headphones,
  Mic,
  RotateCcw,
  Square,
  Volume2,
  X,
} from "lucide-react";
import type { Mission, MissionTurn } from "@/lib/learning-content";
import { isAccepted } from "@/lib/learning-engine";
import { useVoice } from "./use-voice";
import { ConversationCharacter } from "./conversation-character";

interface Props {
  mission: Mission;
  selfCheckReplies?: boolean;
  showBookmarks?: boolean;
  exitLabel?: string;
  turnContexts?: Mission[];
  initialIndex: number;
  initialCorrect: number;
  savedTexts: string[];
  onSave: (id: string, text: string, meaning: string) => void;
  onProgress: (index: number, correct: number) => void;
  onTurnResult?: (index: number, independent: boolean) => void | Promise<void>;
  onComplete: (correct: number) => void;
  onExit: () => void;
}

export function ConversationRoom({
  mission,
  selfCheckReplies = false,
  showBookmarks = true,
  exitLabel = "My plan",
  turnContexts,
  initialIndex,
  initialCorrect,
  savedTexts,
  onSave,
  onProgress,
  onTurnResult,
  onComplete,
  onExit,
}: Props) {
  const [index, setIndex] = useState(
    Math.min(initialIndex, mission.turns.length - 1),
  );
  const [correct, setCorrect] = useState(initialCorrect);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const turn = mission.turns[index];

  async function advance(independent: boolean) {
    if (saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      await onTurnResult?.(index, independent);
    } catch {
      setSaveError(true);
      setSaving(false);
      return;
    }
    const nextCorrect = correct + (independent ? 1 : 0);
    setCorrect(nextCorrect);
    if (index + 1 === mission.turns.length) {
      onComplete(nextCorrect);
      setFinished(true);
    } else {
      setIndex(index + 1);
      onProgress(index + 1, nextCorrect);
    }
    setSaving(false);
  }

  if (finished)
    return (
      <section className="mission-finished studio-panel-entry">
        <span className="completion-mark">
          <Check size={32} />
        </span>
        <span className="eyebrow">CONVERSATION COMPLETE</span>
        <h1>Take it into the real world.</h1>
        <p className="lede">
          {correct} of {mission.turns.length} responses without help.{" "}
          {correct < mission.turns.length
            ? "The supported responses are worth another look."
            : "Next time, try without reading the translations."}
        </p>
        <div className="takeaway-list">
          {mission.turns
            .filter((entry) => entry.kind !== "listen")
            .map((entry, turnIndex) => (
              <div key={entry.task}>
                <span>
                  <strong lang="de">{entry.accepted[0]}</strong>
                  <small>{entry.task}</small>
                </span>
                {showBookmarks && <button
                  className="icon-button"
                  title="Save phrase"
                  aria-label={`Save phrase ${entry.accepted[0]}`}
                  onClick={() =>
                    onSave(
                      `${mission.id}-takeaway-${turnIndex}`,
                      entry.accepted[0],
                      entry.task,
                    )
                  }
                >
                  {savedTexts.includes(entry.accepted[0]) ? (
                    <Check size={19} />
                  ) : (
                    <Bookmark size={19} />
                  )}
                </button>}
              </div>
            ))}
        </div>
        <div className="real-world-challenge">
          <span className="eyebrow">ONE SMALL CHALLENGE</span>
          <p>
            {mission.challenge ?? (mission.id === "cafe"
              ? "Order your next drink in German, including one change to the order."
              : mission.id === "station"
                ? "Listen for the platform and time in your next station announcement."
                : mission.id === "appointment"
                  ? "Rehearse an appointment call without looking at the screen."
                  : "Start a short conversation with someone in your neighborhood.")}
          </p>
        </div>
        <button className="primary" onClick={onExit}>
          Back to {exitLabel.toLowerCase()} <ArrowRight size={18} />
        </button>
      </section>
    );

  return (
    <section className="conversation studio-panel-entry">
      <div className="conversation-top">
        <button className="text-button" onClick={onExit}>
          <ArrowLeft size={17} /> {exitLabel}
        </button>
        <span>
          {mission.place}{" "}
          <span className="muted">
            / {index + 1} of {mission.turns.length}
          </span>
        </span>
      </div>
      <progress max={mission.turns.length} value={index} />
      {saveError && <p role="alert" className="error-note">Your response could not be saved. Continue to retry.</p>}
      <fieldset disabled={saving} className="conversation-turn-fieldset">
      <ConversationTurn
        key={`${mission.id}-${index}`}
        mission={turnContexts?.[index] ?? mission}
        turn={turn}
        selfCheckReplies={selfCheckReplies}
        showBookmarks={showBookmarks}
        onAdvance={advance}
        onSave={() =>
          onSave(`${mission.id}-${index}`, turn.accepted[0], turn.task)
        }
        saved={savedTexts.includes(turn.accepted[0])}
      />
      </fieldset>
    </section>
  );
}

function ConversationTurn({
  mission,
  turn,
  selfCheckReplies,
  showBookmarks,
  onAdvance,
  onSave,
  saved,
}: {
  mission: Mission;
  turn: MissionTurn;
  selfCheckReplies: boolean;
  showBookmarks: boolean;
  onAdvance: (independent: boolean) => void;
  onSave: () => void;
  saved: boolean;
}) {
  const [value, setValue] = useState("");
  const [tokens, setTokens] = useState<number[]>([]);
  const [translation, setTranslation] = useState(false);
  const [transcript, setTranscript] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  const [selfCheck, setSelfCheck] = useState(false);
  const [assisted, setAssisted] = useState(false);
  const [played, setPlayed] = useState(false);
  const voice = useVoice(turn.line, () => setPlayed(true));
  const response =
    turn.kind === "build"
      ? tokens.map((index) => turn.words![index]).join(" ")
      : value;

  function check() {
    if (!response.trim() || result !== null) return;
    voice.stop();
    if (selfCheckReplies && turn.kind === "respond" && !isAccepted(turn, response)) {
      setSelfCheck(true);
      setAssisted(true);
      return;
    }
    setResult(isAccepted(turn, response));
  }

  return (
    <div className="conversation-layout">
      <aside className="partner-scene">
        <Image
          src={mission.image}
          alt={mission.place}
          fill
          sizes="(max-width: 800px) 100vw, 360px"
          className="scene-image"
        />
        <div className="scene-shade" />
        <div className="partner-details">
          <span className="scene-tag">GUIDED CONVERSATION</span>
          <ConversationCharacter speaking={voice.speaking} listening={voice.listening} response={result} name={mission.partner} />
          <h2>{mission.partner}</h2>
          <p>{mission.role}</p>
          <p>{mission.place}</p>
          <span className="partner-status" aria-live="polite">
            {voice.speaking
              ? "Speaking..."
              : voice.listening
                ? "Listening to you..."
                : result === true
                  ? "That works. Let's keep going."
                  : result === false
                    ? "Let's work through this together."
                    : "Your turn. Take your time."}
          </span>
        </div>
      </aside>
      <div className="conversation-work">
        <div className="partner-message">
          <span className="eyebrow">{mission.partner.toUpperCase()} SAYS</span>
          {turn.kind === "listen" && !transcript && result === null ? (
            <div className="listen-placeholder">
              <Headphones size={26} />
              <h3>A question for you...</h3>
            </div>
          ) : (
            <h3 lang="de">{turn.line}</h3>
          )}
          <div className="speech-tools">
            <button
              className="icon-button"
              title={voice.speaking ? "Stop audio" : "Replay German audio"}
              aria-label={voice.speaking ? "Stop audio" : "Replay German audio"}
              onClick={() => {
                if (voice.speaking) voice.stop();
                else {
                  voice.play(turn.line);
                  setPlayed(true);
                }
              }}
            >
              {voice.speaking ? <Square size={18} /> : <Volume2 size={20} />}
            </button>
            <button
              className="text-button"
              onClick={() => {
                voice.play(turn.line, true);
                setPlayed(true);
              }}
            >
              0.7x
            </button>
            {turn.kind === "listen" && !transcript && (
              <button
                className="text-button"
                onClick={() => {
                  setTranscript(true);
                  setAssisted(true);
                }}
              >
                <Eye size={16} /> Transcript
              </button>
            )}
            <button
              className="text-button"
              aria-expanded={translation}
              onClick={() => {
                setTranslation(!translation);
                if (!translation) setAssisted(true);
              }}
            >
              Translation
            </button>
          </div>
          {translation && <p className="translation">{turn.translation}</p>}
        </div>
        <div className="your-turn">
          <span className="eyebrow">YOUR TURN</span>
          <h2>{turn.task}</h2>
          {turn.options ? (
            <div className="dialogue-options">
              {turn.options.map((option) => (
                <button
                  disabled={
                    result !== null || (turn.kind === "listen" && !played)
                  }
                  key={option}
                  className={`answer-option ${value === option ? "selected" : ""}`}
                  onClick={() => setValue(option)}
                >
                  {option}
                  {value === option && <Check size={18} />}
                </button>
              ))}
            </div>
          ) : turn.words ? (
            <>
              <div className="sentence-tray" aria-label="Your sentence">
                {tokens.length === 0 && (
                  <span className="muted">Your sentence</span>
                )}
                {tokens.map((token, position) => (
                  <button
                    disabled={result !== null}
                    key={token}
                    onClick={() =>
                      setTokens(tokens.filter((_, index) => index !== position))
                    }
                  >
                    {turn.words![token]} <X size={12} />
                  </button>
                ))}
              </div>
              <div className="word-tiles">
                {turn.words.map((word, index) => (
                  <button
                    key={index}
                    disabled={tokens.includes(index) || result !== null}
                    onClick={() => setTokens([...tokens, index])}
                  >
                    {word}
                  </button>
                ))}
                <button
                  className="icon-button"
                  disabled={result !== null}
                  title="Reset sentence"
                  aria-label="Reset sentence"
                  onClick={() => setTokens([])}
                >
                  <RotateCcw size={17} />
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="response-label">
                Your reply
                <textarea
                  lang="de"
                  placeholder="Write a reply in German..."
                  value={value}
                  disabled={result !== null}
                  onChange={(event) => setValue(event.target.value)}
                />
              </label>
              <div className="response-tools">
                <button
                  disabled={result !== null}
                  className={`secondary ${voice.listening ? "recording" : ""}`}
                  onClick={() => {
                    if (voice.starting) voice.stop();
                    else if (voice.listening) voice.finish();
                    else void voice.record(setValue);
                  }}
                >
                  {voice.listening || voice.starting ? <Square size={17} /> : <Mic size={17} />}
                  {voice.starting ? "Cancel microphone" : voice.listening ? "Stop recording" : "Speak my reply"}
                </button>
                {(voice.starting || voice.listening) && <span role="status">{voice.starting ? "Starting microphone..." : "Listening..."}</span>}
                <small>Speech-to-text, not a pronunciation score.</small>
              </div>
            </>
          )}
          {voice.error && (
            <p role="alert" className="error-note">
              {voice.error}
            </p>
          )}
        </div>
        {selfCheck ? (
          <div className="conversation-feedback support" role="status">
            <strong>Compare your reply</strong>
            <p lang="de">{turn.accepted[0]}</p>
            <p>{turn.note}</p>
            <small>Your wording was not automatically graded. A different reply can be valid. Self-checked replies do not count as independently verified answers.</small>
            <div className="feedback-actions">
              <button className="text-button" onClick={() => { setSelfCheck(false); setValue(""); }}>Try the model reply</button>
              <button className="primary" onClick={() => { voice.stop(); onAdvance(false); }}>I checked the meaning <ArrowRight size={17} /></button>
            </div>
          </div>
        ) : result !== null ? (
          <div
            className={`conversation-feedback ${result ? "correct" : "support"}`}
            role="status"
          >
            <div className="feedback-heading">
              {result ? <CheckCircle2 size={21} /> : <RotateCcw size={21} />}
              <strong>
                {result
                  ? assisted
                    ? "Got it, with a little support."
                    : "That's a natural response."
                  : turn.kind === "respond"
                    ? "A useful way to say it"
                    : "Let's try that together"}
              </strong>
            </div>
            <p lang="de">{turn.accepted[0]}</p>
            <p className="feedback-explanation">{turn.note}</p>
            {turn.kind === "respond" && !result && (
              <small>
                Other phrasing may also be valid. This guided exercise checks a
                limited set of responses.
              </small>
            )}
            <div className="feedback-actions">
              {!result && (
                <button
                  className="text-button"
                  onClick={() => {
                    setResult(null);
                    setAssisted(true);
                    setValue("");
                    setTokens([]);
                  }}
                >
                  Try again
                </button>
              )}
              {showBookmarks && turn.kind !== "listen" && (
                <button
                  className="icon-button"
                  aria-label={saved ? "Phrase saved" : "Save phrase"}
                  title="Save phrase"
                  onClick={onSave}
                >
                  {saved ? <Check size={18} /> : <Bookmark size={18} />}
                </button>
              )}
              <button
                className="primary"
                onClick={() => {
                  voice.stop();
                  onAdvance(result && !assisted);
                }}
              >
                Continue <ArrowRight size={17} />
              </button>
            </div>
          </div>
        ) : (
          <div className="conversation-submit">
            <span className="muted">No timer. No lost lives.</span>
            <button
              className="primary"
              disabled={!response.trim() || voice.listening || voice.starting}
              onClick={check}
            >
              Check reply <ArrowRight size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
