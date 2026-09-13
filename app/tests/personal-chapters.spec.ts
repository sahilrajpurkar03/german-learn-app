import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { sampleChapter, sampleInput, demoPersonalChapter } from "../src/lib/personal-chapter-demo";
import type { PersonalChapter } from "../src/lib/personal-chapters";
import { parseBuffer } from "music-metadata";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => [], cancel() {}, speak(utterance: SpeechSynthesisUtterance) { queueMicrotask(() => { utterance.dispatchEvent(new Event("start")); utterance.dispatchEvent(new Event("end")); }); } } });
  });
});

async function openLibrary(page: Page) {
  await page.goto("/preview");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "My chapters", exact: true }).click();
  await expect(page.getByRole("heading", { name: "My chapters.", exact: true })).toBeVisible();
  await expect(page.getByText("Loading your chapters...", { exact: true })).toHaveCount(0);
}

async function mockServices(page: Page, existing = false, failGeneration = false) {
  const state = { chapters: existing ? [demoPersonalChapter()] : [] as PersonalChapter[], reviews: [] as { chapter_id: string; target_index: number; due_at: string; updated_at: string; repetitions: number }[], calls: [] as Record<string, unknown>[], uploaded: null as Uint8Array | null, failGeneration };
  await page.context().route("**/api/personal-chapters", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { chapters: state.chapters, reviews: state.reviews, available: true, message: null } });
    const operation = route.request().postDataJSON();
    state.calls.push(operation);
    if (operation.op === "generate") {
      if (state.failGeneration) { state.failGeneration = false; return route.fulfill({ status: 429, json: { error: "The free creation capacity is busy. Keep your text and try again later." } }); }
      const blueprint = sampleChapter();
      blueprint.level = operation.input.level;
      blueprint.register = operation.input.register;
      state.chapters.push({ id: operation.requestId, created_at: new Date().toISOString(), blueprint, progress: {} });
      return route.fulfill({ json: { id: operation.requestId } });
    }
    if (operation.op === "createUpload") return route.fulfill({ json: { bucket: "personal-chapter-audio", path: `test-user/${operation.requestId}.wav` } });
    if (operation.op === "transcribe") return route.fulfill({ json: { transcript: sampleInput.transcript, seconds: 1 } });
    if (operation.op === "progress") state.chapters.find((chapter) => chapter.id === operation.id)!.progress[operation.variant as "original" | "variation"] = operation.progress;
    if (operation.op === "addReview") state.reviews.push({ chapter_id: operation.id, target_index: operation.index, due_at: new Date(0).toISOString(), updated_at: new Date().toISOString(), repetitions: 0 });
    if (operation.op === "rateReview") {
      const item = state.reviews.find((review) => review.chapter_id === operation.id && review.target_index === operation.index)!;
      item.due_at = new Date(Date.now() + 86400000).toISOString();
      item.repetitions += 1;
    }
    if (operation.op === "delete") { state.chapters = state.chapters.filter((chapter) => chapter.id !== operation.id); state.reviews = state.reviews.filter((review) => review.chapter_id !== operation.id); }
    return route.fulfill({ json: { ok: true } });
  });
  await page.context().route("**/storage/v1/object/personal-chapter-audio/**", async (route) => {
    const body = route.request().postDataBuffer();
    if (body) {
      const request = new Request("https://fixture.invalid/upload", { method: "POST", headers: await route.request().allHeaders(), body: new Uint8Array(body) });
      const form = await request.formData();
      for (const entry of form.values()) if (entry instanceof File) state.uploaded = new Uint8Array(await entry.arrayBuffer());
    }
    await route.fulfill({ json: { Key: "fixture-upload" } });
  });
  return state;
}

async function fillCreator(page: Page) {
  await page.getByRole("button", { name: "Create a chapter", exact: true }).click();
  await page.getByLabel("Your recap or conversation").fill(sampleInput.transcript);
  await page.getByLabel("My communication goal").fill(sampleInput.focus);
  await page.getByLabel(/^I have permission/).check();
  await page.getByLabel(/^I checked the text/).check();
}

async function completeScenario(page: Page, variation = false, selfCheck = false) {
  const scenario = sampleChapter()[variation ? "variation" : "original"];
  for (const turn of scenario.turns) {
    if (turn.kind === "listen") await page.getByRole("button", { name: "Replay German audio", exact: true }).click();
    if (turn.options) await page.locator(".dialogue-options").getByRole("button", { name: turn.accepted[0], exact: true }).click();
    else if (turn.words) for (const word of turn.accepted[0].split(" ")) await page.locator(".word-tiles").getByRole("button", { name: word, exact: true }).click();
    else await page.getByLabel("Your reply", { exact: true }).fill(selfCheck ? "Das ist wirklich sehr nett von Ihnen." : turn.accepted[0]);
    await page.getByRole("button", { name: "Check reply", exact: true }).click();
    if (turn.kind === "respond" && selfCheck) {
      await expect(page.getByText("Compare your reply", { exact: true })).toBeVisible();
      await expect(page.getByText(/Your wording was not automatically graded/)).toBeVisible();
      await page.getByRole("button", { name: "I checked the meaning" }).click();
    } else await page.getByRole("button", { name: "Continue", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Take it into the real world." })).toBeVisible();
  await page.getByRole("button", { name: "Back to my chapters", exact: true }).click();
}

function wav(seconds: number) {
  const samples = seconds * 16000;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write("RIFF", 0); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write("WAVEfmt ", 8); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(16000, 24); buffer.writeUInt32LE(32000, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write("data", 36); buffer.writeUInt32LE(samples * 2, 40);
  return buffer;
}

test("personal chapter text creation, both scenarios, self-check, review and deletion (mock services)", async ({ page }) => {
  const state = await mockServices(page);
  await openLibrary(page);
  await fillCreator(page);
  await page.getByRole("button", { name: "Create chapter", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: sampleChapter().title })).toBeVisible();
  await page.getByRole("button", { name: "Practise my situation", exact: true }).click();
  await completeScenario(page, false, true);
  await expect(page.getByText("3 of 4 replies without help", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Try the variation", exact: true }).click();
  await completeScenario(page, true);
  await expect(page.getByText("4 of 4 replies without help", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: `Save ${sampleChapter().targets[0].text} for review`, exact: true }).click();
  await expect(page.getByRole("button", { name: `Saved ${sampleChapter().targets[0].text}`, exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "All my chapters", exact: true }).click();
  await page.getByRole("button", { name: "Reveal German", exact: true }).click();
  await page.getByRole("button", { name: "Good", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reveal German", exact: true })).toHaveCount(0);
  await openLibrary(page);
  await page.getByRole("button", { name: "Open chapter", exact: true }).click();
  await expect(page.getByText("3 of 4 replies without help", { exact: true })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export chapter", exact: true }).click();
  expect((await download).suggestedFilename()).toContain(state.chapters[0].id);
  await page.getByRole("button", { name: "Delete chapter", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete chapter", exact: true }).click();
  await expect(page.getByText("No personal chapters yet.")).toBeVisible();
  expect(state.calls.filter((call) => call.op === "generate")).toHaveLength(1);
  expect(state.chapters).toHaveLength(0);
});

test("personal chapter audio upload and transcript review (mock transcription)", async ({ page }) => {
  const state = await mockServices(page);
  await openLibrary(page);
  await page.getByRole("button", { name: "Create a chapter", exact: true }).click();
  await page.getByRole("button", { name: "Upload audio", exact: true }).click();
  await page.getByLabel("Audio file", { exact: true }).setInputFiles({ name: "synthetic.wav", mimeType: "audio/wav", buffer: wav(1) });
  await page.getByLabel(/^I have permission/).check();
  await page.getByRole("button", { name: "Transcribe recording", exact: true }).click();
  await expect(page.getByLabel("Review transcript")).toHaveValue(sampleInput.transcript);
  await expect(page.getByRole("button", { name: "Create chapter", exact: true })).toBeDisabled();
  const edited = `${sampleInput.transcript} I want a polite reply.`;
  await page.getByLabel("Review transcript").fill(edited);
  await page.getByLabel(/^I checked the text/).check();
  await page.getByRole("button", { name: "Create chapter", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: sampleChapter().title })).toBeVisible();
  const generation = state.calls.find((call) => call.op === "generate")!;
  expect((generation.input as { transcript: string }).transcript).toBe(edited);
  expect(state.calls.filter((call) => call.op === "discardUpload")).toHaveLength(1);
});

test("personal chapter quota failure preserves editable draft", async ({ page }) => {
  const state = await mockServices(page, false, true);
  await openLibrary(page);
  await fillCreator(page);
  await page.getByRole("button", { name: "Create chapter", exact: true }).click();
  await expect(page.locator(".personal-creator").getByRole("alert")).toContainText("free creation capacity");
  await expect(page.getByLabel("Your recap or conversation")).toHaveValue(sampleInput.transcript);
  await expect(page.getByRole("button", { name: "Create chapter", exact: true })).toBeEnabled();
  expect(state.chapters).toHaveLength(0);
});

test("personal chapter rejects oversized and long audio before upload", async ({ page }) => {
  const state = await mockServices(page);
  await openLibrary(page);
  await page.getByRole("button", { name: "Create a chapter", exact: true }).click();
  await page.getByRole("button", { name: "Upload audio", exact: true }).click();
  await page.getByLabel("Audio file", { exact: true }).setInputFiles({ name: "long.wav", mimeType: "audio/wav", buffer: wav(181) });
  await expect(page.locator(".personal-creator").getByRole("alert")).toContainText("three minutes");
  await page.getByLabel("Audio file", { exact: true }).setInputFiles({ name: "large.mp3", mimeType: "audio/mpeg", buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
  await expect(page.locator(".personal-creator").getByRole("alert")).toContainText("10 MB");
  expect(state.calls).toHaveLength(0);
});

test("personal chapter layouts fit mobile and desktop (mock private library)", async ({ page }, testInfo) => {
  async function checkText() {
    const clipped = await page.locator("main h1, main h2, main h3, main p, main button, main label, main summary").evaluateAll((elements) => elements.filter((element) => element.clientWidth > 0 && element.getBoundingClientRect().height > 0 && element.scrollWidth > element.clientWidth + 2).map((element) => element.textContent?.slice(0, 80)));
    expect(clipped).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await mockServices(page, true);
  await openLibrary(page);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await checkText();
    await page.screenshot({ path: testInfo.outputPath(`library-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page.getByRole("button", { name: "Open chapter", exact: true }).click();
  await checkText();
  await page.getByRole("button", { name: "Delete chapter", exact: true }).click();
  await checkText();
  await page.screenshot({ path: testInfo.outputPath("delete-dialog-320.png"), fullPage: true });
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Practise my situation", exact: true }).click();
  await expect(page.locator(".conversation-top")).toBeVisible();
  await page.locator(".conversation-top").getByRole("button", { name: "My chapters", exact: true }).click();
  await page.getByRole("button", { name: "All my chapters", exact: true }).click();
  await page.getByRole("button", { name: "Create a chapter", exact: true }).click();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const mode of ["Write a recap", "Record a recap", "Upload audio"]) {
      await page.getByRole("button", { name: mode, exact: true }).click();
      await checkText();
      await page.screenshot({ path: testInfo.outputPath(`creator-${mode.replaceAll(" ", "-")}-${width}.png`), fullPage: true });
    }
  }
});

test("personal chapter preview is clearly labelled and API denies anonymous writes", async ({ page, request }) => {
  await openLibrary(page);
  await expect(page.getByText(/Sample chapter, not AI-generated/)).toBeVisible();
  const unauthenticated = await request.get("/api/personal-chapters");
  expect(unauthenticated.status()).toBe(401);
  expect(unauthenticated.headers()["cache-control"]).toContain("no-store");
  const forbidden = await request.post("/api/personal-chapters", { data: { op: "delete", id: demoPersonalChapter().id }, headers: { origin: "https://untrusted.invalid" } });
  expect(forbidden.status()).toBe(403);
  const denied = await request.post("/api/personal-chapters", { data: { op: "generate", requestId: crypto.randomUUID(), input: sampleInput }, headers: { origin: "http://127.0.0.1:3200" } });
  expect(denied.status()).toBe(401);
  expect((await request.get("/api/personal-chapters/cleanup")).status()).toBe(401);
});

test("personal chapter recorder produces readable audio and releases microphone (virtual device)", async ({ playwright }) => {
  const browser = await playwright.chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  try {
    const context = await browser.newContext({ baseURL: "http://127.0.0.1:3200", permissions: ["microphone"] });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const tracks: MediaStreamTrack[] = [];
      Object.defineProperty(window, "testCaptureTracks", { value: tracks });
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (constraints) => { const stream = await original(constraints); tracks.push(...stream.getTracks()); return stream; };
    });
    const state = await mockServices(page);
    await openLibrary(page);
    await page.getByRole("button", { name: "Create a chapter", exact: true }).click();
    await page.getByRole("button", { name: "Record a recap", exact: true }).click();
    await page.getByRole("button", { name: "Record my recap", exact: true }).click();
    await expect(page.getByText("1s / 180s", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Stop recording", exact: true }).click();
    await expect(page.locator(".personal-audio-preview")).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { testCaptureTracks: MediaStreamTrack[] }).testCaptureTracks.every((track) => track.readyState === "ended"))).toBe(true);
    await page.getByLabel(/^I have permission/).check();
    await page.getByRole("button", { name: "Transcribe recording", exact: true }).click();
    await expect(page.getByLabel("Review transcript")).toHaveValue(sampleInput.transcript);
    expect(state.uploaded).not.toBeNull();
    const metadata = await parseBuffer(state.uploaded!, { mimeType: "audio/webm" }, { duration: true });
    expect(metadata.format.duration).toBeGreaterThan(0);
    expect(metadata.format.duration).toBeLessThan(4);
    await page.getByRole("button", { name: "Record my recap", exact: true }).click();
    await expect(page.getByRole("button", { name: "Stop recording", exact: true })).toBeVisible();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "My day", exact: true }).click();
    expect(await page.evaluate(() => (window as unknown as { testCaptureTracks: MediaStreamTrack[] }).testCaptureTracks.every((track) => track.readyState === "ended"))).toBe(true);
  } finally { await browser.close(); }
});

test("personal chapter replay uses no generation calls and remains bounded (mock services)", async ({ page }, testInfo) => {
  const state = await mockServices(page, true);
  await openLibrary(page);
  await page.getByRole("button", { name: "Open chapter", exact: true }).click();
  const timings: number[] = [];
  const session = await page.context().newCDPSession(page);
  const samples = [];
  for (let iteration = 0; iteration < 30; iteration += 1) {
    const started = performance.now();
    await page.getByRole("button", { name: "Practise my situation", exact: true }).click();
    await expect(page.getByRole("button", { name: "Replay German audio", exact: true })).toBeVisible();
    timings.push(performance.now() - started);
    await page.locator(".conversation-top").getByRole("button", { name: "My chapters", exact: true }).click();
    if (iteration === 4 || iteration === 29) {
      await expect(page.getByRole("button", { name: "Practise my situation", exact: true })).toBeVisible();
      await session.send("HeapProfiler.collectGarbage");
      samples.push(await session.send("Memory.getDOMCounters"));
    }
  }
  expect(state.calls.filter((call) => call.op === "generate")).toHaveLength(0);
  expect(samples[1].nodes).toBeLessThanOrEqual(samples[0].nodes + 20);
  expect(samples[1].jsEventListeners).toBeLessThanOrEqual(samples[0].jsEventListeners + 10);
  const report = { scope: "Local Chromium UI with mocked private API, not AI latency", cycles: 30, openP95Ms: timings.sort((first, second) => first - second)[28], samples, generationCalls: 0 };
  console.log("Personal chapter replay benchmark:", JSON.stringify(report));
  await testInfo.attach("personal-replay-benchmark", { body: JSON.stringify(report, null, 2), contentType: "application/json" });
});