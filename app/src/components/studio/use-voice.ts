"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { listenOnce, speakGerman } from "@/lib/speech";

export function useVoice(autoText?: string, onStarted?: () => void) {
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playback = useRef<(() => void) | null>(null);
  const recording = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const notifyStarted = useEffectEvent(() => {
    if (mounted.current) {
      setSpeaking(true);
      onStarted?.();
    }
  });

  useEffect(() => {
    mounted.current = true;
    if (autoText)
      playback.current = speakGerman(autoText, {
        onStart: () => notifyStarted(),
        onEnd: () => {
          if (mounted.current) setSpeaking(false);
        },
        onError: () => {
          if (mounted.current)
            setError(
              "Audio could not play automatically. Use replay to try again.",
            );
        },
      });
    return () => {
      mounted.current = false;
      playback.current?.();
      recording.current?.abort();
    };
  }, [autoText]);

  function stop() {
    playback.current?.();
    recording.current?.abort();
  }

  function play(text: string, slow = false) {
    recording.current?.abort();
    setError(null);
    playback.current = speakGerman(text, {
      rate: slow ? 0.65 : 0.9,
      onStart: () => {
        if (mounted.current) setSpeaking(true);
      },
      onEnd: () => {
        if (mounted.current) setSpeaking(false);
      },
      onError: () => {
        if (mounted.current)
          setError(
            "Audio could not play. Try replaying, or check your browser's German voice settings.",
          );
      },
    });
  }

  async function record(onTranscript: (text: string) => void) {
    stop();
    const controller = new AbortController();
    recording.current = controller;
    setListening(true);
    setError(null);
    try {
      const transcript = await listenOnce("de-DE", controller.signal);
      if (mounted.current && !controller.signal.aborted)
        onTranscript(transcript);
    } catch (cause) {
      if (mounted.current && !controller.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not record. You can type your reply instead.",
        );
    } finally {
      if (mounted.current && recording.current === controller)
        setListening(false);
    }
  }

  return { speaking, listening, error, play, record, stop };
}
