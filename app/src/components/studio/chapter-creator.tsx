"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileAudio, LoaderCircle, Mic, Pencil, Square, Trash2 } from "lucide-react";
import { z } from "zod";
import { chapterInputSchema, PERSONAL_LIMITS } from "@/lib/personal-chapters";
import type { ChapterInput } from "@/lib/personal-chapters";
import { createClient } from "@/lib/supabase/client";
import { ChapterApiError, chapterRequest } from "./personal-chapter-client";
import { useAudioCapture } from "./use-audio-capture";

export function ChapterCreator({ available, onCreated, onExit }: { available: boolean; onCreated: (id: string) => Promise<void>; onExit: () => void }) {
  const [mode, setMode] = useState<"text" | "upload" | "record">("text");
  const [transcript, setTranscript] = useState("");
  const [focus, setFocus] = useState("Everyday conversation");
  const [level, setLevel] = useState<ChapterInput["level"]>("a2");
  const [register, setRegister] = useState<ChapterInput["register"]>("formal");
  const [language, setLanguage] = useState<"en" | "de">("en");
  const [consent, setConsent] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const generationId = useRef<string | null>(null);
  const audio = useAudioCapture();

  async function discardAudio(requestId = uploadId) {
    if (requestId) {
      await chapterRequest({ op: "discardUpload", requestId });
      setUploadId(null);
    }
    audio.clear();
  }
  async function transcribe() {
    if (!audio.selection || busy || !consent || !available) return;
    setError(null);
    setBusy("Uploading recording");
    const requestId = uploadId ?? crypto.randomUUID();
    setUploadId(requestId);
    try {
      const { file, seconds } = audio.selection;
      const destination = z.object({ path: z.string(), bucket: z.literal("personal-chapter-audio") }).parse(await chapterRequest({ op: "createUpload", requestId, mime: file.type, bytes: file.size, seconds, language, consent }));
      const uploaded = await createClient().storage.from(destination.bucket).upload(destination.path, file, { contentType: file.type, upsert: false });
      if (uploaded.error) throw new Error("Upload did not complete. Remove the recording and select it again to retry.");
      setBusy("Transcribing recording");
      const response = z.object({ transcript: z.string(), seconds: z.number() }).parse(await chapterRequest({ op: "transcribe", requestId }));
      setTranscript(response.transcript);
      setReviewed(false);
      generationId.current = null;
      await discardAudio(requestId);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The recording could not be transcribed.");
    } finally { setBusy(null); }
  }
  async function generate(event: React.FormEvent) {
    event.preventDefault();
    const parsed = chapterInputSchema.safeParse({ transcript, focus, level, register, consent });
    if (!parsed.success || !reviewed || busy || !available) return;
    setError(null);
    setBusy("Creating and checking your chapter");
    generationId.current ??= crypto.randomUUID();
    try {
      const response = await chapterRequest<{ id: string }>({ op: "generate", requestId: generationId.current, input: parsed.data, ...(uploadId ? { uploadId } : {}) });
      await onCreated(response.id);
    } catch (failure) {
      if (failure instanceof ChapterApiError && [400, 422, 429].includes(failure.status)) generationId.current = null;
      setError(failure instanceof Error ? failure.message : "Could not create a chapter. Your text is still here.");
    } finally { setBusy(null); }
  }
  function changed() { generationId.current = null; }

  return (
    <section className="personal-creator studio-panel-entry">
      <button className="text-button" disabled={!!busy} onClick={() => { void discardAudio().then(onExit).catch((failure: Error) => setError(failure.message)); }}><ArrowLeft size={17} /> My chapters</button>
      <div className="page-heading"><div><span className="eyebrow">FROM YOUR DAY</span><h1>Create your chapter.</h1></div></div>
      {!available && <p className="personal-notice" role="status">New chapter creation needs sign-in and enabled AI configuration. No audio or text will be uploaded while creation is unavailable.</p>}
      <div className="personal-modes" role="group" aria-label="Chapter source">
        {([{ id: "text", label: "Write a recap", icon: Pencil }, { id: "upload", label: "Upload audio", icon: FileAudio }, { id: "record", label: "Record a recap", icon: Mic }] as const).map(({ id, label, icon: Icon }) => <button key={id} className={mode === id ? "active" : ""} aria-pressed={mode === id} disabled={!!busy || audio.recording} onClick={() => { setMode(id); setError(null); }}><Icon size={18} />{label}</button>)}
      </div>
      <form onSubmit={(event) => void generate(event)}>
        {mode !== "text" && <div className="personal-audio">
          <div className="personal-fields">
            <label>Recording language<select value={language} disabled={!!busy} onChange={(event) => setLanguage(event.target.value as "en" | "de")}><option value="en">English</option><option value="de">German</option></select></label>
            {mode === "upload" ? <label>Audio file<input type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/webm,audio/ogg,audio/flac,.mp3,.m4a,.wav,.webm,.ogg,.flac" disabled={!!busy || audio.pending || !!uploadId} onChange={(event) => { const file = event.target.files?.[0]; if (file) void audio.select(file); event.target.value = ""; }} /></label> : <div className="personal-record-controls"><button type="button" className="secondary" disabled={!!busy || audio.pending || !available} onClick={() => audio.recording ? audio.stop() : void audio.start()}>{audio.recording ? <Square size={18} /> : <Mic size={18} />}{audio.recording ? "Stop recording" : "Record my recap"}</button><span role="status">{audio.recording ? `${audio.elapsed}s / 180s` : "Up to 3 minutes"}</span></div>}
          </div>
          <small>MP3, M4A, WAV, WebM, Ogg or FLAC. Up to 3 minutes and 10 MB.</small>
          {audio.pending && <p role="status">Checking audio...</p>}
          {audio.error && <p role="alert" className="error-note">{audio.error}</p>}
          {audio.selection && <div className="personal-audio-preview"><audio controls src={audio.selection.url} /><span>{Math.ceil(audio.selection.seconds)} seconds</span><button type="button" className="icon-button" aria-label="Remove recording" title="Remove recording" disabled={!!busy} onClick={() => void discardAudio().catch((failure: Error) => setError(failure.message))}><Trash2 size={18} /></button></div>}
        </div>}
        <div className="personal-permission">
          <label><input type="checkbox" checked={consent} disabled={!!busy} onChange={(event) => { setConsent(event.target.checked); changed(); }} />I have permission from everyone whose words I submit, and agree to send this audio/text to Groq for transcription and chapter creation.</label>
          <p>Do not include names, addresses, confidential work, or sensitive information. Audio is temporary; generated chapter text is saved privately. <Link href="/privacy" target="_blank" rel="noreferrer">Privacy details</Link></p>
        </div>
        {mode !== "text" && audio.selection && <button type="button" className="secondary" disabled={!available || !consent || !!busy} onClick={() => void transcribe()}><FileAudio size={18} /> Transcribe recording</button>}
        <label className="personal-transcript">{mode === "text" ? "Your recap or conversation" : "Review transcript"}<textarea rows={6} maxLength={PERSONAL_LIMITS.transcriptCharacters} minLength={30} required value={transcript} disabled={!!busy || audio.recording} onChange={(event) => { setTranscript(event.target.value); setReviewed(false); changed(); }} placeholder="What happened, or what did you want to say?" /></label>
        <div className="personal-counter">{transcript.length} / {PERSONAL_LIMITS.transcriptCharacters}</div>
        <label className="personal-review-confirm"><input type="checkbox" checked={reviewed} disabled={!!busy || transcript.trim().length < 30} onChange={(event) => setReviewed(event.target.checked)} />I checked the text, removed private details, and kept only the passage I want to practise.</label>
        <label>My communication goal<input value={focus} required maxLength={160} disabled={!!busy} onChange={(event) => { setFocus(event.target.value); changed(); }} /></label>
        <div className="personal-fields"><label>German level<select value={level} disabled={!!busy} onChange={(event) => { setLevel(event.target.value as ChapterInput["level"]); changed(); }}><option value="a1">A1</option><option value="a2">A2</option><option value="b1">B1</option></select></label><label>Address the other person<select value={register} disabled={!!busy} onChange={(event) => { setRegister(event.target.value as ChapterInput["register"]); changed(); }}><option value="formal">Formal: Sie</option><option value="informal">Informal: du</option></select></label></div>
        {error && <p role="alert" className="error-note">{error}</p>}
        <div className="personal-create-footer"><span>Free beta: 2 attempts per day, subject to shared capacity.</span><button className="primary" type="submit" disabled={!available || !reviewed || !consent || transcript.trim().length < 30 || !focus.trim() || !!busy || audio.recording}>{busy ? <LoaderCircle size={18} className="personal-spin" /> : <ArrowRight size={18} />}{busy ?? "Create chapter"}</button></div>
        <p className="personal-draft-note">Unsaved text stays in this page and is lost when you leave or reload.</p>
      </form>
    </section>
  );
}