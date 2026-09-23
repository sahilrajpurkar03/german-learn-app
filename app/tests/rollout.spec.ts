import { expect, test } from "@playwright/test";

test("v2 query parameter sets and clears the rollout cookie", async ({ page, context }) => {
  const v2Cookie = async () => (await context.cookies()).find((cookie) => cookie.name === "sprechen-v2");

  await page.goto("/preview");
  expect(await v2Cookie()).toBeUndefined();

  await page.goto("/preview?v2=1");
  const enabled = await v2Cookie();
  expect(enabled?.value).toBe("1");
  expect(enabled?.httpOnly).toBe(true);
  expect(enabled?.sameSite).toBe("Lax");

  await page.goto("/preview?v2=0");
  expect((await v2Cookie())?.value).toBe("0");
});
