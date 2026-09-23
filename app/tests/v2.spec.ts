import { expect, test, type Page } from "@playwright/test";
import { getLesson } from "../src/lib/course/catalog.ts";
import { audioFile } from "../src/lib/course/speech-text.ts";
import type { Step } from "../src/lib/course/types.ts";

const lesson = getLesson("a1-u01-l1")!;

function exact(text: string) {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
}

/** Answers one player step through the UI, like a learner would. */
async function answer(page: Page, step: Step, { wrong = false } = {}) {
  if (step.type === "intro" || step.type === "pattern") {
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    return;
  }
  if (step.type === "match") {
    for (const [de, en] of step.pairs!) {
      await page.getByRole("button", { name: de, exact: true }).click();
      await page.getByRole("button", { name: en, exact: true }).click();
    }
  } else if (step.options) {
    const choice = wrong ? step.options.find((option) => !step.accepted.includes(option))! : step.accepted[0];
    await page.getByRole("radio", { name: exact(choice) }).click();
    await page.getByRole("button", { name: "Check", exact: true }).click();
  } else if (step.tiles) {
    const bank = page.getByLabel("Word bank");
    for (const word of step.accepted[0].replace(/[.,!?]/g, "").split(/\s+/)) await bank.getByRole("button", { name: word, exact: true }).first().click();
    await page.getByRole("button", { name: "Check", exact: true }).click();
  } else {
    await page.getByLabel("Your answer in German").fill(wrong ? "falsch" : step.accepted[0]);
    await page.getByRole("button", { name: "Check", exact: true }).click();
  }
  const sheet = page.getByRole("status").filter({ has: page.getByRole("button", { name: "Continue" }) });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: "Continue" }).click();
}

test("demo: the first lesson teaches, checks, retries a mistake, and celebrates", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.getByRole("progressbar", { name: /Lesson progress/ })).toBeVisible();
  const firstChoice = lesson.steps.findIndex((step) => step.type === "choose");
  for (const [index, step] of lesson.steps.entries()) {
    if (step.type === "intro") await expect(page.getByText(step.card!.en, { exact: true })).toBeVisible();
    await answer(page, step, { wrong: index === firstChoice });
    if (index === firstChoice) continue;
  }
  // The mistake comes back once at the end.
  await expect(page.getByText(lesson.steps[firstChoice].prompt).first()).toBeVisible();
  await answer(page, lesson.steps[firstChoice]);
  await expect(page.getByRole("heading", { name: "Lesson complete!" })).toBeVisible();
  await expect(page.getByText("XP earned")).toBeVisible();
  await expect(page.getByRole("heading", { name: "You learned" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create a free account to keep going" })).toBeVisible();
});

test("feedback explains mistakes with the correct German", async ({ page }) => {
  await page.goto("/demo");
  for (const step of lesson.steps) {
    if (step.type === "type" || step.type === "respond") {
      await page.getByLabel("Your answer in German").fill("Ich weiß nicht");
      await page.getByRole("button", { name: "Check", exact: true }).click();
      await expect(page.getByText("Not quite")).toBeVisible();
      await expect(page.getByText("Correct answer:")).toBeVisible();
      await expect(page.getByText("You'll get another go at the end.")).toBeVisible();
      return;
    }
    await answer(page, step);
  }
  throw new Error("lesson has no typed step");
});

test("demo fits a 320px phone and follows dark mode", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 640 }, colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("/demo");
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const background = await page.locator(".v2").evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(background).toBe("rgb(11, 19, 33)");
  await context.close();
});

test("voice clips are public static files, and private v2 pages need an account", async ({ page, request }) => {
  const clip = await request.get(`/audio/${audioFile(lesson.steps[0].audio!)}`, { maxRedirects: 0 });
  expect(clip.status()).toBe(200);
  expect(clip.headers()["content-type"]).toContain("audio");
  for (const path of ["/today?v2=1", "/course", "/lesson/a1-u01-l1", "/review/session"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login(\?|$)/);
  }
  const api = await request.post("/api/learning/attempts", { data: { attempts: [] }, headers: { Origin: "http://127.0.0.1:3200" } });
  expect(api.status()).toBe(401);
});
