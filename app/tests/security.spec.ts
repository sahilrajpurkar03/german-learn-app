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

test("operator contact is public even while the postal address is incomplete", async ({ page }) => {
  for (const path of ["/imprint", "/privacy"]) {
    await page.goto(path);
    const document = page.locator(".legal-page");
    await expect(document).toContainText("Sahil Rajpurkar");
    await expect(document).toContainText("M\u00f6nsheim, 71297, Germany");
    await expect(document.getByRole("link", { name: "sahilrajpurkar1998@gmail.com", exact: true })).toHaveAttribute("href", "mailto:sahilrajpurkar1998@gmail.com");
    await expect(document.getByRole("note")).toContainText("full postal address");
  }
});

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

test("beta acknowledgment survives navigation and reload while legal links remain", async ({ page }) => {
  await page.goto("/preview");
  const notice = page.getByRole("complementary", { name: "Beta testing notice" });
  await notice.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(notice).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("sprechen-beta-notice"))).toBe("1");
  const links = page.getByRole("navigation", { name: "Legal information" });
  await expect(links.getByRole("link")).toHaveCount(4);
  await links.getByRole("link", { name: "Privacy policy", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Privacy policy", exact: true })).toBeVisible();
  await expect(notice).toHaveCount(0);
  await page.reload();
  await expect(notice).toHaveCount(0);
  await page.goto("/login");
  await expect(notice).toHaveCount(0);
});

test("beta notice can be reopened from the footer on mobile and desktop", async ({ page }, testInfo) => {
  await page.goto("/preview");
  const notice = page.getByRole("complementary", { name: "Beta testing notice" });
  const footer = page.getByRole("contentinfo", { name: "Site information" });
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(notice).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`notice-expanded-${width}.png`) });
    await notice.getByRole("button", { name: "Accept", exact: true }).click();
    await expect(notice).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath(`notice-dismissed-${width}.png`) });
    await footer.getByRole("button", { name: "Beta notice", exact: true }).click();
    await expect(notice).toBeFocused();
    await expect(notice).toBeInViewport();
  }
});

test("a previous beta notice version does not hide the current warning", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("sprechen-beta-notice", "previous-version"));
  await page.goto("/privacy");
  const notice = page.getByRole("complementary", { name: "Beta testing notice" });
  await expect(notice).toBeVisible();
  await notice.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(notice).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("sprechen-beta-notice"))).toBe("1");
});

for (const blockRead of [false, true]) {
  test(`beta acknowledgment works when storage ${blockRead ? "access" : "writes"} is blocked`, async ({ page }) => {
    await page.addInitScript((denyRead) => {
      const originalGet = Storage.prototype.getItem;
      const originalSet = Storage.prototype.setItem;
      Storage.prototype.getItem = function (key) {
        if (denyRead && key === "sprechen-beta-notice") throw new DOMException("Blocked", "SecurityError");
        return originalGet.call(this, key);
      };
      Storage.prototype.setItem = function (key, value) {
        if (key === "sprechen-beta-notice") throw new DOMException("Blocked", "SecurityError");
        return originalSet.call(this, key, value);
      };
    }, blockRead);
    await page.goto("/privacy");
    const notice = page.getByRole("complementary", { name: "Beta testing notice" });
    await notice.getByRole("button", { name: "Accept", exact: true }).click();
    await expect(notice).toHaveCount(0);
    await page.getByRole("button", { name: "Beta notice", exact: true }).click();
    await expect(notice).toBeVisible();
    await notice.getByRole("button", { name: "Accept", exact: true }).click();
    await page.reload();
    await expect(notice).toBeVisible();
  });
}

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