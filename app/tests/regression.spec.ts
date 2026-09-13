import { test, expect, type Page } from "@playwright/test";
import { MISSIONS } from "../src/lib/learning-content";
import { normalizeAnswer } from "../src/lib/learning-engine";
import { planPractice, practiceTargets, recordRecall } from "../src/lib/adaptive-practice";
import { variationTargets } from "../src/lib/practice-variations";
import { reviewMission, reviewPreviewItems } from "../src/lib/review-mission";
import type { MissionTurn } from "../src/lib/learning-content";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => [], cancel: () => {},
        speak: (utterance: SpeechSynthesisUtterance) => {
          queueMicrotask(() => {
            utterance.dispatchEvent(new Event("start"));
            utterance.dispatchEvent(new Event("end"));
          });
        },
      },
    });
  });
});

async function openLibrary(page: Page) {
  await page.goto("/preview");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Real-life practice", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your chapter library." })).toBeVisible();
}

for (const mission of MISSIONS) {
  test(`complete chapter ${mission.id}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await openLibrary(page);
    await page.getByLabel("Find a chapter").fill(mission.title);
    await page.locator(".mission-card").filter({ has: page.getByRole("heading", { name: mission.title, exact: true }) }).click();
    for (const turn of mission.turns) {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const clipped = await page.locator(".conversation h2, .conversation h3, .conversation p, .conversation button").evaluateAll((elements) => elements.filter((element) => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 2).map((element) => element.textContent));
      expect(clipped).toEqual([]);
      if (turn.options) {
        await page.locator(".dialogue-options").getByRole("button", { name: turn.accepted[0], exact: true }).click();
      } else if (turn.words) {
        const available = [...turn.words];
        for (const token of turn.accepted[0].split(" ")) {
          const wordIndex = available.findIndex((word) => normalizeAnswer(word) === normalizeAnswer(token));
          expect(wordIndex).toBeGreaterThanOrEqual(0);
          const word = available.splice(wordIndex, 1)[0];
          await page.locator(".word-tiles button:enabled").filter({ hasText: new RegExp(`^${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }).first().click();
        }
      } else {
        await page.getByRole("textbox", { name: "Your reply" }).fill(turn.accepted[0]);
      }
      await page.getByRole("button", { name: "Check reply", exact: true }).click();
      await expect(page.locator(".conversation-feedback")).toHaveClass(/correct/);
      await page.getByRole("button", { name: "Continue", exact: true }).click();
    }
    await expect(page.locator(".mission-finished")).toContainText(`${mission.turns.length} of ${mission.turns.length} responses without help`);
    const completion = await page.evaluate((id) => JSON.parse(localStorage.getItem("sprechen-studio-v1:preview")!).completed[id], mission.id);
    expect(completion.correct).toBe(mission.turns.length);
    expect(errors).toEqual([]);
  });
}

test("library filtering, pagination, mobile layout, and empty results", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLibrary(page);
  await expect(page.locator(".mission-card")).toHaveCount(12);
  await page.getByRole("button", { name: "Show more chapters" }).click();
  await expect(page.locator(".mission-card")).toHaveCount(24);
  await page.getByLabel("Topic", { exact: true }).selectOption("Home");
  await expect(page.locator(".mission-card")).toHaveCount(8);
  await page.getByLabel("Find a chapter").fill("heating");
  await expect(page.locator(".mission-card")).toHaveCount(1);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`chapters-${width}.png`), fullPage: true });
  }
  await page.getByLabel("Progress", { exact: true }).selectOption("Completed");
  await expect(page.getByText("No chapters match these filters.")).toBeVisible();
});

test("assessment resumes with preferences and saves a complete report", async ({ page }) => {
  await page.goto("/preview");
  await page.locator(".assessment-banner").click();
  await page.getByRole("button", { name: "20 min", exact: true }).click();
  await page.getByRole("button", { name: "Meeting people", exact: true }).click();
  await page.getByRole("button", { name: "Find my starting point", exact: true }).click();
  for (let index = 0; index < 4; index++) await page.getByRole("button", { name: "Not sure yet" }).click();
  await page.getByRole("button", { name: "Save & leave" }).click();
  await page.reload();
  await page.locator(".assessment-banner").click();
  await expect(page.locator(".question-count")).toContainText("5 / 16");
  for (let index = 0; index < 12; index++) await page.getByRole("button", { name: "Not sure yet" }).click();
  await page.getByRole("button", { name: "Build my practice plan" }).click();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("sprechen-studio-v1:preview")!));
  expect(state.goal).toBe(20);
  expect(state.interest).toBe("Meeting people");
  expect(state.answers).toHaveLength(16);
  expect(state.assessedAt).toBeTruthy();
});

test("recovery link, mocked email request, and unauthenticated reset guard", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await page.waitForURL("**/auth/forgot-password");
  await page.waitForLoadState("networkidle");
  await page.context().route("**/auth/v1/recover**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.getByLabel("Email", { exact: true }).fill("regression@example.invalid");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText("If an account exists");
  await page.goto("/auth/reset-password");
  await expect(page.locator("main [role=alert]")).toContainText("invalid or expired");
});

test("repeated chapter navigation keeps DOM and listeners bounded", async ({ page }) => {
  test.setTimeout(120000);
  await openLibrary(page);
  const client = await page.context().newCDPSession(page);
  const samples: { documents: number; nodes: number; jsEventListeners: number }[] = [];
  for (let cycle = 0; cycle < 60; cycle++) {
    await page.getByLabel("Find a chapter").fill("bakery");
    await page.locator(".mission-card").first().click();
    await page.getByRole("button", { name: "My plan", exact: true }).click();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Real-life practice", exact: true }).click();
    if (cycle === 9 || cycle === 59) {
      await client.send("HeapProfiler.collectGarbage");
      samples.push(await client.send("Memory.getDOMCounters"));
    }
  }
  console.log("Navigation endurance samples:", JSON.stringify(samples));
  expect(samples[1].nodes - samples[0].nodes).toBeLessThan(1000);
  expect(samples[1].jsEventListeners - samples[0].jsEventListeners).toBeLessThan(100);
});

test("browser rendering and chapter search performance baseline", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    new PerformanceObserver((list) => {
      const latest = list.getEntries().at(-1);
      if (latest) document.documentElement.dataset.testLcp = String(latest.startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  await page.goto("/preview", { waitUntil: "networkidle" });
  await page.locator(".hero-photo img, .feature-photo img, main img").first().evaluate((image: HTMLImageElement) => image.decode());
  const navigation = await page.evaluate(() => {
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return {
      ttfbMs: entry.responseStart - entry.requestStart,
      domContentLoadedMs: entry.domContentLoadedEventEnd,
      lcpMs: Number(document.documentElement.dataset.testLcp),
      jsBytes: performance.getEntriesByType("resource").filter((resource) => resource.name.includes(".js")).reduce((sum, resource) => sum + (resource as PerformanceResourceTiming).encodedBodySize, 0),
    };
  });
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Real-life practice", exact: true }).click();
  const searchMs: number[] = [];
  for (const query of ["heating", "bank", "", "library", "hotel", "", "exam", "bakery", "rent", ""]) {
    const started = performance.now();
    await page.getByLabel("Find a chapter").fill(query);
    await expect(page.locator(".mission-card").first()).toBeVisible();
    searchMs.push(performance.now() - started);
  }
  const sorted = [...searchMs].sort((left, right) => left - right);
  const result = { ...navigation, searchP95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1], scope: "Unthrottled local Chromium, cold browser context; automation timings include driver overhead." };
  console.log("Browser performance:", JSON.stringify(result));
  await testInfo.attach("browser-performance", { body: JSON.stringify(result, null, 2), contentType: "application/json" });
  expect(result.searchP95Ms).toBeLessThan(2000);
  expect(result.domContentLoadedMs).toBeLessThan(5000);
  await page.screenshot({ path: testInfo.outputPath("chapter-library-desktop.png"), fullPage: true });
});

async function answerPracticeTurn(page: Page, turn: MissionTurn) {
  if (turn.options) await page.locator(".dialogue-options").getByRole("button", { name: turn.accepted[0], exact: true }).click();
  else if (turn.words) {
    for (const word of turn.accepted[0].split(/\s+/)) await page.locator(".word-tiles button:enabled").filter({ hasText: new RegExp(`^${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }).first().click();
  } else await page.getByRole("textbox", { name: "Your reply" }).fill(turn.accepted[0]);
  await page.getByRole("button", { name: "Check reply", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}

test("adaptive daily practice remains available after all chapters and preserves old completion", async ({ page }) => {
  await page.addInitScript((ids) => {
    if (localStorage.getItem("sprechen-studio-v1:preview")) return;
    localStorage.setItem("sprechen-studio-v1:preview", JSON.stringify({ version: 1, goal: 10, interest: "Everyday life", answers: [], assessedAt: null, draft: null, completed: Object.fromEntries(ids.map((id) => [id, { at: new Date().toISOString(), correct: 1, total: 4 }])), phrases: [] }));
  }, MISSIONS.map((mission) => mission.id));
  await page.goto("/preview");
  await page.getByRole("button", { name: "Daily practice", exact: true }).click();
  await expect(page.getByText("No response-level recall evidence yet.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Start daily practice" }).click();
  const queue = planPractice(practiceTargets(MISSIONS), {}, new Date(), 3);
  for (const target of queue) await answerPracticeTurn(page, target.turn);
  await expect(page.getByRole("heading", { name: "Today's practice, carried forward." })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("sprechen-studio-v1:preview")!));
  expect(Object.keys(stored.completed)).toHaveLength(50);
  expect(Object.keys(stored.recall)).toHaveLength(3);
  expect(Object.values(stored.recall).every((entry: unknown) => (entry as { delayed: number }).delayed === 0)).toBe(true);
  await page.getByRole("button", { name: "Done for today" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Daily practice", exact: true }).click();
  await expect(page.getByText("3 responses practised on this device.", { exact: false })).toBeVisible();
});

test("adaptive priority and retry support are recorded without a mastery claim", async ({ page }) => {
  const targets = practiceTargets(MISSIONS);
  const now = new Date();
  const future = new Date(now.getTime() + 86400000);
  const record = Object.fromEntries(targets.map((target) => [target.id, recordRecall(undefined, true, future)]));
  const target = targets.find((entry) => entry.id === "supermarket:0")!;
  record[target.id] = recordRecall(undefined, false, new Date(now.getTime() - 3 * 86400000));
  await page.addInitScript((recall) => localStorage.setItem("sprechen-studio-v1:preview", JSON.stringify({ version: 1, goal: 10, interest: "Everyday life", answers: [], assessedAt: null, draft: null, completed: {}, phrases: [], recall })), record);
  await page.goto("/preview");
  await page.getByRole("button", { name: "Daily practice", exact: true }).click();
  await page.getByRole("button", { name: "Start daily practice" }).click();
  await expect(page.getByRole("heading", { name: target.turn.task })).toBeVisible();
  await page.getByRole("button", { name: "Translation", exact: true }).click();
  await answerPracticeTurn(page, target.turn);
  const saved = await page.evaluate((id) => JSON.parse(localStorage.getItem("sprechen-studio-v1:preview")!).recall[id], target.id);
  expect(saved.lastIndependent).toBe(false);
  expect(saved.supported).toBe(2);
  expect(saved.delayed).toBe(0);
});

test("adaptive new-context follow-up unlocks after delayed recall", async ({ page }) => {
  const variation = variationTargets(MISSIONS)[0];
  const first = recordRecall(undefined, true, new Date(Date.now() - 4 * 86400000));
  const recalled = recordRecall(first, true, new Date(Date.now() - 2 * 86400000));
  await page.addInitScript(({ id, evidence }) => localStorage.setItem("sprechen-studio-v1:preview", JSON.stringify({ version: 1, goal: 10, interest: "Everyday life", answers: [], assessedAt: null, draft: null, completed: {}, phrases: [], recall: { [id]: evidence } })), { id: variation.prerequisite!, evidence: recalled });
  await page.goto("/preview");
  await page.getByRole("button", { name: "Daily practice", exact: true }).click();
  await page.getByRole("button", { name: "Start daily practice" }).click();
  const queue = planPractice([...practiceTargets(MISSIONS), ...variationTargets(MISSIONS)], { [variation.prerequisite!]: recalled }, new Date(), 3);
  for (const target of queue) {
    await expect(page.getByRole("heading", { name: target.turn.task })).toBeVisible();
    await answerPracticeTurn(page, target.turn);
  }
  const saved = await page.evaluate((id) => JSON.parse(localStorage.getItem("sprechen-studio-v1:preview")!).recall[id], variation.id);
  expect(saved.independent).toBe(1);
  expect(saved.delayed).toBe(0);
});

test("redesigned review preview supports every exercise and responsive character", async ({ page }, testInfo) => {
  await page.goto("/preview?mode=review");
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator(".conversation-character")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator(".scene-image").evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`review-character-${width}.png`), fullPage: true });
  }
  for (const turn of reviewMission(reviewPreviewItems).turns) await answerPracticeTurn(page, turn);
  await expect(page.getByRole("heading", { name: "Keep it with you." })).toBeVisible();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("sprechen-studio-v1:preview")!));
  expect(state.reviewPreview.index).toBe(4);
  expect(state.reviewPreview.completedAt).toBeTruthy();
  expect(state.recall).toEqual({});
});

test("microphone shows live dictation, keeps text on stop, and recovers from errors", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    class Recognition {
      onstart: (() => void) | null = null;
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      listener = (event: Event) => {
        const { type, text, error } = (event as CustomEvent).detail;
        if (type === "start") this.onstart?.();
        if (type === "result") this.onresult?.({ results: [Object.assign([{ transcript: text }], { isFinal: false })] });
        if (type === "error") this.onerror?.({ error });
      };
      start() { window.addEventListener("test-speech", this.listener); }
      stop() { window.removeEventListener("test-speech", this.listener); this.onend?.(); }
      abort() { window.removeEventListener("test-speech", this.listener); }
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: Recognition });
  });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/preview?mode=review");
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await answerPracticeTurn(page, reviewMission(reviewPreviewItems).turns[0]);
  const speak = page.getByRole("button", { name: "Speak my reply", exact: true });
  const reply = page.getByRole("textbox", { name: "Your reply" });
  await speak.click();
  await expect(page.getByText("Starting microphone...", { exact: true })).toBeVisible();
  await expect(page.locator(".conversation-character")).not.toHaveAttribute("data-state", "listening");
  await page.getByRole("button", { name: "Cancel microphone", exact: true }).click();
  await expect(speak).toBeVisible();
  await speak.click();
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("test-speech", { detail: { type: "start" } })));
  await expect(page.locator(".conversation-character")).toHaveAttribute("data-state", "listening");
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("test-speech", { detail: { type: "result", text: "Der Zug kommt später." } })));
  await expect(reply).toHaveValue("Der Zug kommt später.");
  await expect(page.getByRole("button", { name: "Check reply", exact: true })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("mobile-live-dictation.png"), fullPage: true });
  await page.getByRole("button", { name: "Stop recording", exact: true }).click();
  await expect(reply).toHaveValue("Der Zug kommt später.");
  await expect(page.getByRole("button", { name: "Check reply", exact: true })).toBeEnabled();
  for (const [error, message] of [["not-allowed", "permission was denied"], ["network", "speech service could not connect"], ["audio-capture", "No microphone audio"], ["no-speech", "No speech was detected"]]) {
    await speak.click();
    await page.evaluate((error) => window.dispatchEvent(new CustomEvent("test-speech", { detail: { type: "error", error } })), error);
    await expect(page.locator(".error-note")).toContainText(message);
    await expect(speak).toBeVisible();
    await expect(reply).toHaveValue("Der Zug kommt später.");
  }
  await speak.click();
  await page.getByRole("button", { name: "My day", exact: true }).click();
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("test-speech", { detail: { type: "result", text: "Late transcript" } })));
  await expect(page.getByRole("heading", { name: "Your roadmap", exact: true })).toBeVisible();
});

test("mobile main views and conversation controls stay aligned", async ({ page }, testInfo) => {
  await page.goto("/preview");
  for (const width of [320, 390, 844, 1440]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
    for (const name of ["My day", "Real-life practice", "My chapters", "My phrases", "My progress"]) {
      await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} at ${width}px`).toBe(true);
      if (width < 700) {
        const icons = await page.locator(".studio-sidebar nav button svg").evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().top));
        expect(Math.max(...icons) - Math.min(...icons)).toBeLessThan(1);
        const labels = await page.locator(".nav-mobile-label").evaluateAll((elements) => elements.map((element) => {
          const label = element.getBoundingClientRect();
          const button = element.parentElement!.getBoundingClientRect();
          return { top: label.top, height: label.height, fits: label.left >= button.left && label.right <= button.right && element.scrollWidth <= element.clientWidth + 1 };
        }));
        expect(labels).toHaveLength(5);
        expect(labels.every((label) => label.fits && label.height === 16)).toBe(true);
        expect(Math.max(...labels.map((label) => label.top)) - Math.min(...labels.map((label) => label.top))).toBeLessThan(1);
        if (name === "My day") {
          const copy = await page.locator(".assessment-banner > span:nth-child(2)").boundingBox();
          const action = await page.locator(".assessment-banner .banner-link").boundingBox();
          expect(action!.y).toBeGreaterThanOrEqual(copy!.y + copy!.height);
          expect(Math.abs(action!.x - copy!.x)).toBeLessThan(1);
        }
      }
      await page.screenshot({ path: testInfo.outputPath(`${name.replaceAll(" ", "-")}-${width}.png`), fullPage: true });
    }
  }
  await page.goto("/preview?mode=review");
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await answerPracticeTurn(page, reviewMission(reviewPreviewItems).turns[0]);
  for (const width of [320, 390, 844, 1440]) {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const tools = await page.locator(".speech-tools > button").evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
    if (width < 700) expect(Math.min(...tools)).toBeGreaterThanOrEqual(44);
    const form = await page.locator(".conversation-submit").boundingBox();
    const submit = await page.getByRole("button", { name: "Check reply", exact: true }).boundingBox();
    if (width <= 400) expect(Math.abs(form!.width - submit!.width)).toBeLessThan(1);
    await page.screenshot({ path: testInfo.outputPath(`reply-controls-${width}.png`), fullPage: true });
  }
});

test("mobile public pages and learning flows do not clip text", async ({ page }, testInfo) => {
  async function checkText(name: string, width: number) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name).toBe(true);
    const clipped = await page.locator("h1, h2, h3, p, button, a, label, summary, span, small").evaluateAll((elements) => elements.filter((element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 2 && getComputedStyle(element).overflowX !== "auto";
    }).map((element) => ({ tag: element.tagName, className: element.className, text: element.textContent?.slice(0, 80) })));
    expect(clipped, name).toEqual([]);
    if (await page.locator(".auth-page").count()) {
      for (const colorScheme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme });
        const contrast = await page.locator(".auth-page h1, .auth-page label, .auth-page p, .auth-page a").evaluateAll((elements) => {
          const luminance = (color: string) => {
            const channels = color.match(/[\d.]+/g)!.slice(0, 3).map((value) => {
              const channel = Number(value) / 255;
              return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            });
            return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
          };
          const background = luminance(getComputedStyle(document.querySelector(".auth-page")!).backgroundColor);
          return elements.filter((element) => element.getBoundingClientRect().width > 0).map((element) => {
            const foreground = luminance(getComputedStyle(element).color);
            return (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05);
          });
        });
        expect(Math.min(...contrast), `${name} ${colorScheme} contrast`).toBeGreaterThanOrEqual(4.5);
      }
      await page.emulateMedia({ colorScheme: "light" });
    }
    await page.screenshot({ path: testInfo.outputPath(`${name}-${width}.png`), fullPage: true });
  }
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ["/", "/login", "/signup", "/auth/forgot-password", "/auth/reset-password", "/imprint", "/privacy", "/data-sharing", "/security"]) {
      await page.goto(path);
      await checkText(path.replaceAll("/", "-") || "home", width);
    }
    await page.goto("/preview");
    await page.locator(".assessment-banner").click();
    await checkText("assessment-setup", width);
    await page.getByRole("button", { name: "Find my starting point", exact: true }).click();
    for (let index = 0; index < 16; index++) {
      await checkText(`assessment-question-${index}`, width);
      await page.getByRole("button", { name: "Not sure yet" }).click();
    }
    await checkText("assessment-report", width);
    await page.getByRole("button", { name: "Build my practice plan" }).click();
    await page.getByRole("button", { name: "Daily practice", exact: true }).click();
    await checkText("daily-round", width);
    await page.goto("/preview");
    await page.getByRole("button", { name: /Play listening challenge/ }).click();
    await checkText("listening-challenge", width);
    await page.getByRole("button", { name: "Enter the station", exact: true }).click();
    for (let round = 0; round < 6; round++) {
      await page.getByRole("button", { name: "Transcript support", exact: true }).click();
      await checkText(`listening-board-${round}`, width);
      await page.getByRole("button", { name: "Choose my train", exact: true }).click();
      await page.locator(".departure-row").first().click();
      await checkText(`listening-feedback-${round}`, width);
      await page.getByRole("button", { name: "Next connection", exact: true }).click();
    }
    await checkText("listening-result", width);
    await page.evaluate(() => localStorage.removeItem("sprechen-studio-v1:preview"));
  }
});

test("character movement follows speech playback and respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/preview?mode=review");
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await page.evaluate(() => { speechSynthesis.speak = (utterance) => utterance.dispatchEvent(new Event("start")); });
  await page.getByRole("button", { name: "Replay German audio", exact: true }).click();
  await expect(page.locator(".conversation-character")).toHaveAttribute("data-state", "speaking");
  const motion = await page.locator(".character-mouth").evaluate((element) => element.getAnimations().map((animation) => animation.playState));
  expect(motion).toContain("running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => page.locator(".character-mouth").evaluate((element) => element.getAnimations().length)).toBe(0);
});

test("review preview resumes after reload and completed review stays completed", async ({ page }) => {
  await page.goto("/preview?mode=review");
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  const turns = reviewMission(reviewPreviewItems).turns;
  await answerPracticeTurn(page, turns[0]);
  await page.reload();
  await expect(page.getByText("1 of 4 responses completed. Next: response 2.")).toBeVisible();
  await page.getByRole("button", { name: "Resume review", exact: true }).click();
  await expect(page.getByRole("heading", { name: turns[1].task })).toBeVisible();
  for (const turn of turns.slice(1)) await answerPracticeTurn(page, turn);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Keep it with you." })).toBeVisible();
  await expect(page.getByText("4 of 4 responses without support.")).toBeVisible();
  await page.getByRole("link", { name: "Back to my day" }).click();
  await expect(page.locator(".practice-roadmap")).toContainText("Review preview completed");
  await page.getByRole("link", { name: "View completed review" }).click();
  await page.getByRole("button", { name: "Replay review", exact: true }).click();
  await page.getByRole("button", { name: "Start review", exact: true }).click();
  await expect(page.getByRole("heading", { name: turns[0].task })).toBeVisible();
});

test("daily round resumes exact next response and roadmap retains completion", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("sprechen-studio-v1:preview")) localStorage.setItem("sprechen-studio-v1:preview", JSON.stringify({ version: 1, goal: 10, interest: "Everyday life", answers: [], assessedAt: null, draft: null, completed: {}, phrases: [] }));
  });
  await page.goto("/preview");
  await page.getByRole("button", { name: "Open daily round", exact: true }).click();
  await page.getByRole("button", { name: "Start daily practice", exact: true }).click();
  const queue = planPractice(practiceTargets(MISSIONS), {}, new Date(), 3);
  await answerPracticeTurn(page, queue[0].turn);
  await page.getByRole("button", { name: "My plan", exact: true }).click();
  await page.reload();
  await expect(page.locator(".practice-roadmap")).toContainText("Daily round in progress: 1 of 3 responses");
  await expect(page.locator(".roadmap-active")).toContainText("1 of 5 responses tracked");
  await page.getByRole("button", { name: "Resume daily round", exact: true }).click();
  await page.getByRole("button", { name: "Resume daily practice", exact: true }).click();
  await expect(page.getByRole("heading", { name: queue[1].turn.task })).toBeVisible();
  for (const target of queue.slice(1)) await answerPracticeTurn(page, target.turn);
  await page.getByRole("button", { name: "Done for today", exact: true }).click();
  await page.reload();
  await expect(page.locator(".practice-roadmap")).toContainText("Daily round complete: 3 of 3 responses");
  await expect(page.locator(".practice-roadmap")).toContainText("1 daily round completed");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("sprechen-studio-v1:preview")!));
  expect(stored.recall[queue[0].id].attempts).toBe(1);
  expect(stored.dailyRound.correct).toBe(3);
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`roadmap-${width}.png`), fullPage: true });
  }
  await page.locator(".roadmap-active").getByRole("button", { name: "Open situation" }).click();
  await expect(page.getByRole("heading", { name: MISSIONS[0].turns[3].task })).toBeVisible();
  await page.getByRole("button", { name: "My plan", exact: true }).click();
  await page.getByRole("button", { name: "View round & next steps", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today's practice, carried forward." })).toBeVisible();
  await page.getByRole("button", { name: "Practise another round", exact: true }).click();
  await expect(page.getByRole("heading", { name: MISSIONS[0].turns[3].task })).toBeVisible();
});

test("roadmap advances after chapter completion and keeps the next position on reload", async ({ page }) => {
  await page.goto("/preview");
  await page.locator(".roadmap-active").getByRole("button", { name: "Open situation" }).click();
  for (const turn of MISSIONS[0].turns) await answerPracticeTurn(page, turn);
  await page.getByRole("button", { name: "Back to my plan", exact: true }).click();
  await page.reload();
  await expect(page.locator(".practice-roadmap")).toContainText("1 of 50 situations explored");
  await expect(page.locator(".roadmap-active")).toContainText(MISSIONS[1].title);
  await expect(page.locator(".roadmap-complete")).toContainText(MISSIONS[0].title);
});