import { test, expect } from "@playwright/test";

for (const path of ["/login", "/signup"]) {
  test(`password visibility on ${path} preserves input without submitting`, async ({ page }, testInfo) => {
    await page.addInitScript(() => localStorage.setItem("sprechen-beta-notice", "1"));
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const form = page.locator("form");
      await form.evaluate((element) => {
        element.dataset.submissions = "0";
        element.addEventListener("submit", (event) => {
          event.preventDefault();
          element.dataset.submissions = String(Number(element.dataset.submissions) + 1);
        });
      });
      await page.getByLabel("Email", { exact: true }).fill("visibility-test@example.invalid");
      const password = page.getByLabel("Password", { exact: true });
      const sample = "Synthetic-only-password-42!";
      await password.fill(sample);
      await expect(password).toHaveAttribute("type", "password");
      await expect(password).toHaveAttribute("autocomplete", path === "/login" ? "current-password" : "new-password");
      const toggle = page.getByRole("button", { name: "Show password", exact: true });
      await expect(toggle).toHaveAttribute("type", "button");
      await expect(toggle).toHaveAttribute("aria-controls", "password");
      const bounds = await toggle.boundingBox();
      expect(bounds?.width).toBeGreaterThanOrEqual(44);
      expect(bounds?.height).toBeGreaterThanOrEqual(44);
      await toggle.click();
      await expect(password).toHaveAttribute("type", "text");
      await expect(password).toHaveValue(sample);
      const hide = page.getByRole("button", { name: "Hide password", exact: true });
      await expect(hide).toBeFocused();
      await expect(hide).toHaveAttribute("title", "Hide password");
      const layout = await password.evaluate((element) => {
        const input = element as HTMLInputElement;
        const bounds = input.getBoundingClientRect();
        const button = input.parentElement!.querySelector("button")!.getBoundingClientRect();
        return {
          paddedTextRight: bounds.right - parseFloat(getComputedStyle(input).paddingRight),
          buttonLeft: button.left,
          buttonRight: button.right,
          inputRight: bounds.right,
          submittedValue: new FormData(input.form!).get("password"),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      expect(layout.paddedTextRight).toBeLessThanOrEqual(layout.buttonLeft);
      expect(layout.buttonRight).toBeLessThanOrEqual(layout.inputRight);
      expect(layout.submittedValue).toBe(sample);
      expect(layout.overflow).toBe(false);
      await page.screenshot({ path: testInfo.outputPath(`password-${width}-visible.png`) });
      await hide.press("Space");
      await expect(password).toHaveAttribute("type", "password");
      await page.getByRole("button", { name: "Show password", exact: true }).press("Enter");
      await expect(password).toHaveAttribute("type", "text");
      await page.getByRole("button", { name: "Hide password", exact: true }).click();
      await expect(password).toHaveAttribute("type", "password");
      await expect(password).toHaveValue(sample);
      await expect(form).toHaveAttribute("data-submissions", "0");
      await page.reload();
      await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");
    }
  });
}

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

test("operator contact includes the supplied full postal address", async ({ page }) => {
  for (const path of ["/imprint", "/privacy"]) {
    await page.goto(path);
    const document = page.locator(".legal-page");
    await expect(document).toContainText("Sahil Rajpurkar");
    await expect(document).toContainText("Postal address: Emil-Figge-Str. 21");
    await expect(document).toContainText("44227 Dortmund");
    await expect(document.getByRole("link", { name: "sahilrajpurkar1998@gmail.com", exact: true })).toHaveAttribute("href", "mailto:sahilrajpurkar1998@gmail.com");
    await expect(document.getByRole("note")).toHaveCount(0);
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
  for (const path of ["/learn", "/learn/progress", "/auth/callback?next=https://example.invalid"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["location"]).not.toContain("example.invalid");
  }
  // The reset page must load signed-out (it reads the one-time token from the email link in the
  // browser), but it is never cached and contains no account data until that token is accepted.
  const reset = await request.get("/auth/reset-password", { maxRedirects: 0 });
  expect(reset.status()).toBe(200);
  expect(reset.headers()["cache-control"]).toContain("no-store");
  const html = await reset.text();
  expect(html).not.toContain("access_token");
  expect(html).toContain("Checking your reset link");
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