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

test("account & privacy: signed-out access is refused and login explains outcomes", async ({ page, request }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login(\?|$)/);
  expect((await request.get("/api/account/export")).status()).toBe(401);
  const origin = { Origin: "http://127.0.0.1:3200" };
  expect((await request.post("/api/account/delete", { data: { confirm: "DELETE" }, headers: origin })).status()).toBe(401);
  await page.goto("/login?deleted=1");
  await expect(page.getByRole("status").filter({ hasText: "account and its learning data have been deleted" })).toBeVisible();
  await page.goto("/login?error=google");
  await expect(page.getByRole("alert").filter({ hasText: "Google sign-in didn't complete" })).toBeVisible();
  // The Google button only appears once it is configured (NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true).
  await expect(page.getByRole("button", { name: /Google/ })).toHaveCount(0);
  const callback = await request.get("/auth/callback?next=//evil.example&error=access_denied", { maxRedirects: 0 });
  expect(callback.headers().location).not.toContain("evil.example");
});

test("password reset links work while signed out and reject bad tokens clearly", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=not-a-real-token&type=recovery");
  await expect(page).toHaveURL(/\/auth\/forgot-password\?error=invalid-link/);
  await expect(page.getByRole("alert").filter({ hasText: "invalid or expired" })).toBeVisible();
  await page.goto("/auth/confirm?token_hash=x&type=recovery&next=//evil.example");
  await expect(page).not.toHaveURL(/evil\.example/);
});

test("placed words can be dragged or moved with the keyboard, and speaking can be skipped", async ({ page }) => {
  await page.goto("/demo");
  for (const step of lesson.steps) {
    if (step.type === "build") {
      const bank = page.getByLabel("Word bank");
      const words = step.accepted[0].replace(/[.,!?]/g, "").split(/\s+/);
      // Place the words in the wrong order: last word first.
      for (const word of [...words.slice(1), words[0]]) await bank.getByRole("button", { name: word, exact: true }).first().click();
      const sentence = page.getByRole("list", { name: "Your sentence" });
      const first = sentence.getByRole("listitem").filter({ hasText: words[0] });
      const target = sentence.getByRole("listitem").first();
      const from = (await first.boundingBox())!;
      const to = (await target.boundingBox())!;
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(to.x + 6, to.y + to.height / 2, { steps: 12 });
      await page.mouse.up();
      await expect(sentence.getByRole("listitem").first()).toContainText(words[0]);
      // Keyboard: move the first word one to the right and back.
      await sentence.getByRole("listitem").first().focus();
      await page.keyboard.press("ArrowRight");
      await expect(sentence.getByRole("listitem").nth(1)).toContainText(words[0]);
      await page.keyboard.press("ArrowLeft");
      await expect(sentence.getByRole("listitem").first()).toContainText(words[0]);
      await page.getByRole("button", { name: "Check", exact: true }).click();
      await expect(page.getByText(/Richtig|Super|Genau|Sehr gut|Toll|Perfekt|Klasse|Prima/).first()).toBeVisible();
      await page.getByRole("status").filter({ has: page.getByRole("button", { name: "Continue" }) }).getByRole("button", { name: "Continue" }).click();
      continue;
    }
    if (step.type === "repeat") {
      await expect(page.getByRole("button", { name: "Tap and speak" })).toBeVisible();
      await page.getByRole("button", { name: /Can.t speak now/ }).click();
      continue;
    }
    if (step.type === "speak") {
      // Speaking stays off for a while after "Can't speak now".
      await expect(page.getByText("Speaking is off for now")).toBeVisible();
      return;
    }
    await answer(page, step);
  }
  throw new Error("lesson has no speak step");
});

test("reset links from the default email work in any browser and leave no tokens in the address bar", async ({ page }) => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: "00000000-0000-4000-8000-000000000001", exp: Math.floor(Date.now() / 1000) + 3600, aud: "authenticated", role: "authenticated" })}.sig`;
  await page.context().route("**/auth/v1/user**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", email: "reset@example.invalid" }) }));
  await page.goto(`/auth/reset-password#access_token=${token}&refresh_token=refresh&expires_in=3600&token_type=bearer&type=recovery`);
  await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
  expect(new URL(page.url()).hash).toBe("");
  await page.goto("/auth/forgot-password");
  await page.goto("/auth/reset-password#error=access_denied&error_description=Email+link+is+invalid+or+has+expired");
  await expect(page.getByRole("alert").filter({ hasText: "invalid or expired" })).toBeVisible();
});
