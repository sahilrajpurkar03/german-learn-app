import { test, expect, type Page } from "@playwright/test";
import { MISSIONS } from "../src/lib/learning-content";
import { normalizeAnswer } from "../src/lib/learning-engine";

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
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await openLibrary(page);
    await page.getByLabel("Find a chapter").fill(mission.title);
    await page.locator(".mission-card").filter({ has: page.getByRole("heading", { name: mission.title, exact: true }) }).click();
    for (const turn of mission.turns) {
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