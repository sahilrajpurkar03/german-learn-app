"use client";

import { useEffect, useRef, useState } from "react";
import { AUDIO_TYPES, PERSONAL_LIMITS } from "@/lib/personal-chapters";

type Selection = { file: File; seconds: number; url: string };
export function useAudioCapture() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [recording, setRecording] = useState(false);
  const [pending, setPending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const objectUrl = useRef<string | null>(null);
  const sequence = useRef(0);

  function release() {
    if (interval.current) clearInterval(interval.current);
    interval.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }
  function keep(file: File, seconds: number) {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    const url = URL.createObjectURL(file);
    objectUrl.current = url;
    setSelection({ file, seconds, url });
  }
  function clear() {
    sequence.current += 1;
    if (recorder.current) {
      recorder.current.onstop = null;
      if (recorder.current.state !== "inactive") recorder.current.stop();
    }
    release();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
    setSelection(null);
    setRecording(false);
    setPending(false);
    setError(null);
  }
  async function select(file: File) {
    clear();
    if (file.size === 0 || file.size > PERSONAL_LIMITS.audioBytes) { setError("Choose an audio file no larger than 10 MB."); return; }
    const mime = file.type.split(";")[0] || Object.keys(AUDIO_TYPES).find((type) => file.name.toLowerCase().endsWith(`.${AUDIO_TYPES[type]}`));
    if (!mime || !AUDIO_TYPES[mime]) { setError("Choose MP3, M4A, WAV, WebM, Ogg, or FLAC audio."); return; }
    const ticket = sequence.current;
    setPending(true);
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    try {
      const seconds = await new Promise<number>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Could not read this recording. Try WAV, MP3, or a typed recap.")), 10000);
        audio.onloadedmetadata = () => { clearTimeout(timer); resolve(audio.duration); };
        audio.onerror = () => { clearTimeout(timer); reject(new Error("This browser could not read the audio file.")); };
        audio.preload = "metadata";
        audio.src = url;
      });
      if (ticket !== sequence.current) return;
      if (!Number.isFinite(seconds) || seconds <= 0 || seconds > PERSONAL_LIMITS.audioSeconds) throw new Error("Choose a readable clip of up to three minutes. A shorter MP3 or WAV also works.");
      keep(new File([file], `recording.${AUDIO_TYPES[mime]}`, { type: mime }), seconds);
    } catch (failure) {
      if (ticket === sequence.current) setError(failure instanceof Error ? failure.message : "Could not read the recording.");
    } finally {
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(url);
      if (ticket === sequence.current) setPending(false);
    }
  }
  async function start() {
    clear();
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setError("Recording is unavailable in this browser. Upload audio or use text."); return; }
    const ticket = sequence.current;
    setPending(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (ticket !== sequence.current) { media.getTracks().forEach((track) => track.stop()); return; }
      stream.current = media;
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type));
      const capture = new MediaRecorder(media, mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : undefined);
      recorder.current = capture;
      const chunks: Blob[] = [];
      const started = Date.now();
      capture.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      capture.onerror = () => { clear(); setError("Recording failed. Try an audio upload or typed recap."); };
      capture.onstop = async () => {
        release();
        if (ticket !== sequence.current) return;
        setRecording(false);
        setPending(true);
        try {
          const duration = Date.now() - started;
          if (duration > (PERSONAL_LIMITS.audioSeconds + 1) * 1000) throw new Error("Recording exceeded three minutes. Record a shorter recap.");
          const type = capture.mimeType.split(";")[0];
          if (!AUDIO_TYPES[type]) throw new Error("The recorded format is unsupported. Try uploading MP3 or WAV.");
          let blob = new Blob(chunks, { type });
          if (!blob.size) throw new Error("No audio was captured. Please try again.");
          if (type === "audio/webm") {
            const { default: fixDuration } = await import("fix-webm-duration");
            blob = await fixDuration(blob, duration, { logger: false });
          }
          if (ticket === sequence.current) keep(new File([blob], `recording.${AUDIO_TYPES[type]}`, { type }), Math.min(PERSONAL_LIMITS.audioSeconds, Math.max(0.1, duration / 1000)));
        } catch (failure) {
          if (ticket === sequence.current) setError(failure instanceof Error ? failure.message : "Could not finish the recording.");
        } finally { if (ticket === sequence.current) setPending(false); }
      };
      capture.start(1000);
      setElapsed(0);
      setRecording(true);
      interval.current = setInterval(() => {
        const seconds = Math.floor((Date.now() - started) / 1000);
        setElapsed(seconds);
        if (seconds >= PERSONAL_LIMITS.audioSeconds && capture.state !== "inactive") capture.stop();
      }, 1000);
    } catch { release(); setError("Microphone access was not available. Upload audio or use text."); }
    finally { if (ticket === sequence.current) setPending(false); }
  }
  useEffect(() => () => {
    sequence.current += 1;
    if (interval.current) clearInterval(interval.current);
    if (recorder.current) {
      recorder.current.onstop = null;
      if (recorder.current.state !== "inactive") recorder.current.stop();
    }
    stream.current?.getTracks().forEach((track) => track.stop());
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);
  return { selection, recording, pending, elapsed, error, start, select, clear, stop: () => { if (recorder.current?.state === "recording") recorder.current.stop(); } };
}