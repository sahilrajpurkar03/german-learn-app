import { test, expect } from "@playwright/test";

for (const [path, title] of Object.entries({
  "/imprint": "Imprint / Impressum",
  "/privacy": "Privacy policy",
  "/data-sharing": "Data sharing policy",
  "/security": "Security and beta status",
})) {
  test(`public legal page ${path}`, async ({ page }, testInfo) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Beta testing notice" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Legal information" }).getByRole("link")).toHaveCount(4);
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`legal-${width}.png`) });
    }
  });
}

test("beta status is visible before login and during practice", async ({ page }, testInfo) => {
  for (const path of ["/login", "/signup", "/auth/forgot-password", "/preview"]) {
    await page.goto(path);
    await expect(page.getByRole("complementary", { name: "Beta testing notice" })).toContainText("progress may be reset");
  }
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Real-life practice", exact: true }).click();
  await expect(page.getByRole("complementary", { name: "Beta testing notice" })).toBeVisible();
  await page.getByLabel("Find a chapter").fill("Breakfast to go");
  await page.locator(".mission-card").click();
  await expect(page.getByRole("complementary", { name: "Beta testing notice" })).toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`beta-practice-${width}.png`) });
  }
});

test("browser headers and unauthenticated private responses are hardened", async ({ request }) => {
  const publicResponse = await request.get("/privacy");
  const headers = publicResponse.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("microphone=(self)");
  for (const path of ["/learn", "/learn/progress", "/auth/reset-password", "/auth/callback?next=https://example.invalid"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["location"]).not.toContain("example.invalid");
  }
});

test("service worker purges legacy private data and does not cache private requests", async ({ page }) => {
  await page.goto("/preview");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    for (const registration of await navigator.serviceWorker.getRegistrations()) await registration.unregister();
    const cache = await caches.open("security-test-legacy");
    await cache.put("/learn/progress", new Response("private-test-marker"));
    await cache.put("https://example.invalid/auth/user", new Response("private-test-marker"));
  });
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect.poll(async () => page.evaluate(async () => {
    const cache = await caches.open("security-test-legacy");
    return (await cache.keys()).length;
  })).toBe(0);
  await page.evaluate(async () => {
    await fetch("/learn/progress");
    await fetch("/auth/reset-password");
  });
  const privateEntries = await page.evaluate(async () => {
    const result: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        const url = new URL(request.url);
        if (/^\/(learn|auth)(\/|$)/.test(url.pathname)) result.push(url.pathname);
      }
    }
    return result;
  });
  expect(privateEntries).toEqual([]);
});