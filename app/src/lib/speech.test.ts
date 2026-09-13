import assert from "node:assert/strict";
import test from "node:test";
import { listenOnce } from "./speech.ts";

test("dictation streams interim text and stop retains the final transcript", async () => {
  class MockRecognition {
    static active: MockRecognition;
    lang = ""; interimResults = false; maxAlternatives = 1;
    onstart: (() => void) | null = null;
    onresult: ((event: unknown) => void) | null = null;
    onend: (() => void) | null = null;
    onerror: ((event: unknown) => void) | null = null;
    constructor() { MockRecognition.active = this; }
    start() { this.onstart?.(); }
    stop() { this.onend?.(); }
  }
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { SpeechRecognition: MockRecognition, isSecureContext: true } });
  try {
    const stop = new AbortController();
    const transcripts: string[] = [];
    let started = false;
    const pending = listenOnce("de-DE", undefined, { stopSignal: stop.signal, onStarted: () => { started = true; }, onTranscript: (text) => transcripts.push(text) });
    assert.equal(started, true);
    assert.equal(MockRecognition.active.interimResults, true);
    MockRecognition.active.onresult?.({ results: [Object.assign([{ transcript: "Ich möchte" }], { isFinal: false })] });
    assert.deepEqual(transcripts, ["Ich möchte"]);
    stop.abort();
    assert.equal(await pending, "Ich möchte");
    assert.equal(MockRecognition.active.onresult, null);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});

test("recognition exposes permission errors and cancellation ignores late results", async () => {
  class MockRecognition {
    static active: MockRecognition;
    onresult: ((event: unknown) => void) | null = null;
    onend: (() => void) | null = null;
    onerror: ((event: unknown) => void) | null = null;
    constructor() { MockRecognition.active = this; }
    start() {}
    stop() {}
    abort() {}
  }
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { webkitSpeechRecognition: MockRecognition } });
  try {
    const denied = listenOnce();
    MockRecognition.active.onerror?.({ error: "not-allowed" });
    await assert.rejects(denied, /permission was denied/);
    const controller = new AbortController();
    const cancelled = listenOnce("de-DE", controller.signal);
    controller.abort();
    await assert.rejects(cancelled, /Recording stopped/);
    assert.equal(MockRecognition.active.onresult, null);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});