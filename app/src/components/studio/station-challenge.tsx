"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Headphones,
  Play,
  RotateCcw,
  TrainFront,
  Trophy,
  Volume2,
} from "lucide-react";
import { createStationRounds, stationPoints } from "@/lib/station-game";
import type { StationRound } from "@/lib/station-game";
import { useVoice } from "./use-voice";

export function StationChallenge({
  best,
  onComplete,
  onExit,
}: {
  best: number;
  onComplete: (score: number) => void;
  onExit: () => void;
}) {
  const [rounds, setRounds] = useState<StationRound[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [missed, setMissed] = useState<StationRound[]>([]);
  const [phase, setPhase] = useState<"intro" | "play" | "finished">("intro");
  const [timed, setTimed] = useState(false);
  const [rematch, setRematch] = useState(false);

  function start(retry = false) {
    setRounds(retry ? missed : createStationRounds());
    setIndex(0);
    setScore(0);
    setStreak(0);
    setMissed([]);
    setRematch(retry);
    setPhase("play");
  }
  function finishRound(correct: boolean, supported: boolean) {
    const nextScore = score + stationPoints(correct, supported, streak);
    setScore(nextScore);
    setStreak(correct && !supported ? streak + 1 : 0);
    if (!correct) setMissed([...missed, rounds[index]]);
    if (index + 1 === rounds.length) {
      if (!rematch) onComplete(nextScore);
      setPhase("finished");
    } else setIndex(index + 1);
  }

  return (
    <section className="station-game studio-panel-entry">
      <button className="text-button back-link" onClick={onExit}>
        <ArrowLeft size={17} /> My day
      </button>
      {phase === "intro" ? (
        <div className="station-intro">
          <div className="station-intro-photo">
            <Image
              src="/images/station.jpg"
              alt="Railway station and trains"
              fill
              sizes="(max-width:700px) 100vw, 1000px"
            />
            <div className="featured-shade" />
            <span className="scene-tag">
              <TrainFront size={18} /> LISTENING CHALLENGE
            </span>
          </div>
          <span className="eyebrow">THE PLATFORM HAS CHANGED.</span>
          <h1>Did you catch that?</h1>
          <p className="lede">
            Six announcements. Four departures. One train that matches what you
            heard.
          </p>
          <div className="game-facts">
            <span>
              <Headphones size={20} /> German audio
            </span>
            <span>
              <RotateCcw size={20} /> New departures every game
            </span>
            <span>
              <Trophy size={20} /> Best: {best} points
            </span>
          </div>
          <label className="game-timer-toggle">
            <input
              type="checkbox"
              checked={timed}
              onChange={(event) => setTimed(event.target.checked)}
            />
            <span>
              20-second decision challenge
              <small>
                The clock starts after listening, when you choose to begin.
              </small>
            </span>
          </label>
          <button className="primary" onClick={() => start()}>
            <Play size={18} /> Enter the station
          </button>
        </div>
      ) : phase === "finished" ? (
        <div className="game-results">
          <Trophy size={46} strokeWidth={1.3} />
          <span className="eyebrow">
            {rematch ? "REMATCH COMPLETE" : "JOURNEY COMPLETE"}
          </span>
          <h1>
            {missed.length
              ? "A few details to catch next time."
              : "You caught every connection."}
          </h1>
          <div className="game-score">
            {score}
            <small>points</small>
          </div>
          <p>
            {rounds.length - missed.length} / {rounds.length} correct ·{" "}
            {rematch
              ? "Practice rematch"
              : `Best full game: ${Math.max(best, score)}`}
          </p>
          <div className="game-result-actions">
            {missed.length > 0 && (
              <button className="primary" onClick={() => start(true)}>
                <RotateCcw size={17} /> Rematch {missed.length} missed
              </button>
            )}
            <button className="secondary" onClick={() => start()}>
              New departures <ArrowRight size={18} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="game-toolbar">
            <span>
              <TrainFront size={21} /> Platform Switch
            </span>
            <span>
              {index + 1} / {rounds.length}
            </span>
            <span>
              {score} pts <small>{streak ? `${streak} in a row` : ""}</small>
            </span>
          </div>
          <progress max={rounds.length} value={index} />
          <StationPuzzle
            key={`${rounds[index].id}-${rematch}`}
            round={rounds[index]}
            timed={timed}
            streak={streak}
            onContinue={finishRound}
          />
        </>
      )}
    </section>
  );
}

function StationPuzzle({
  round,
  timed,
  streak,
  onContinue,
}: {
  round: StationRound;
  timed: boolean;
  streak: number;
  onContinue: (correct: boolean, supported: boolean) => void;
}) {
  const voice = useVoice();
  const [played, setPlayed] = useState(false);
  const [transcript, setTranscript] = useState(false);
  const [supported, setSupported] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(20);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const expired = timed && ready && seconds === 0;
  const revealed = selected !== null || expired;
  const correct = selected === round.targetId;

  useEffect(() => {
    if (!running || revealed) return;
    const interval = setInterval(
      () => setSeconds((previous) => Math.max(0, previous - 1)),
      1000,
    );
    return () => clearInterval(interval);
  }, [running, revealed]);

  return (
    <div className="station-puzzle">
      <div className="announcement-controls">
        <div>
          <span className="eyebrow">DURCHSAGE</span>
          <h2>
            {voice.speaking
              ? "Listen for the details..."
              : "Which departure matches?"}
          </h2>
        </div>
        <button
          className="secondary"
          disabled={ready && !revealed}
          onClick={() => {
            voice.play(round.announcement);
            setPlayed(true);
          }}
        >
          <Volume2 size={18} />
          {played ? "Replay" : "Hear announcement"}
        </button>
        <button
          className="text-button"
          disabled={ready && !revealed}
          onClick={() => {
            voice.play(round.announcement, true);
            setPlayed(true);
          }}
        >
          Slower
        </button>
      </div>
      {voice.error && (
        <p className="error-note" role="alert">
          {voice.error}
        </p>
      )}
      {!ready && (
        <div className="announcement-ready">
          <button
            className="text-button"
            onClick={() => {
              setTranscript(!transcript);
              setSupported(true);
            }}
            aria-expanded={transcript}
          >
            Transcript support
          </button>
          <button
            className="primary"
            disabled={!played && !transcript}
            onClick={() => {
              voice.stop();
              setReady(true);
              setRunning(timed);
            }}
          >
            {timed ? "Start 20-second clock" : "Choose my train"}
            <ArrowRight size={17} />
          </button>
        </div>
      )}
      {transcript && (
        <blockquote className="game-transcript" lang="de">
          {round.announcement}
        </blockquote>
      )}
      <div className="departure-board">
        <div className="board-heading">
          <strong>ABFAHRTEN</strong>
          <span>
            {timed && ready && !revealed ? `${seconds}s` : "DEPARTURES"}
          </span>
        </div>
        <div className="board-columns">
          <span>ZEIT</span>
          <span>ZIEL</span>
          <span>GLEIS</span>
          <span />
        </div>
        {round.board.map((departure) => (
          <button
            disabled={!ready || revealed}
            key={departure.id}
            className={`departure-row ${revealed && departure.id === round.targetId ? "right-train" : ""} ${selected === departure.id && !correct ? "wrong-train" : ""}`}
            aria-label={`${departure.time} to ${departure.destination}, platform ${departure.platform}`}
            onClick={() => {
              voice.stop();
              setSelected(departure.id);
              setRunning(false);
            }}
          >
            <span>{departure.time}</span>
            <strong>{departure.destination}</strong>
            <span>{departure.platform}</span>
            {revealed && departure.id === round.targetId ? (
              <Check size={20} />
            ) : (
              <ArrowRight size={18} />
            )}
          </button>
        ))}
      </div>
      {revealed && (
        <div
          className={`conversation-feedback ${correct ? "correct" : "support"}`}
          role="status"
        >
          <div className="feedback-heading">
            <strong>
              {expired
                ? "Time's up. Let's unpack the announcement."
                : correct
                  ? `Connection made. +${stationPoints(true, supported, streak)} points`
                  : "That departure doesn't match."}
            </strong>
          </div>
          <p className="feedback-explanation">{round.explanation}</p>
          <p className="feedback-explanation" lang="de">
            {round.announcement}
          </p>
          <div className="feedback-actions">
            <button
              className="text-button"
              onClick={() => voice.play(round.announcement, true)}
            >
              <Headphones size={16} /> Hear it again
            </button>
            <button
              className="primary"
              onClick={() => {
                voice.stop();
                onContinue(correct, supported);
              }}
            >
              Next connection <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
