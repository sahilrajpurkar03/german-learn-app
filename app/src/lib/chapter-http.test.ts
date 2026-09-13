import assert from "node:assert/strict";
import test from "node:test";
import { ChapterHttpError, privateJson, providerFailure, readChapterRequest } from "./chapter-http.ts";

test("provider failures distinguish configuration from invalid results without exposing payloads", () => {
  for (const [providerStatus, expectedStatus, message] of [
    [401, 503, /server access/],
    [403, 503, /server access/],
    [404, 503, /model is unavailable/],
    [429, 429, /free capacity/],
    [400, 502, /provider rejected the request/],
    [422, 502, /provider rejected the request/],
    [500, 503, /temporarily unavailable/],
    [503, 503, /temporarily unavailable/],
  ] as const) {
    assert.throws(() => providerFailure({ status: providerStatus, message: "PRIVATE_PROVIDER_PAYLOAD" }), (error: unknown) => {
      assert.ok(error instanceof ChapterHttpError);
      assert.equal(error.status, expectedStatus);
      assert.match(error.message, message);
      assert.ok(!error.message.includes("PRIVATE_PROVIDER_PAYLOAD"));
      return true;
    });
  }
  assert.throws(() => providerFailure(new Error("PRIVATE_GENERATED_CONTENT")), (error: unknown) => {
    assert.ok(error instanceof ChapterHttpError);
    assert.equal(error.status, 422);
    assert.ok(!error.message.includes("PRIVATE_GENERATED_CONTENT"));
    return true;
  });
  const storageFailure = new ChapterHttpError(503, "Private storage unavailable");
  assert.throws(() => providerFailure(storageFailure), (error: unknown) => error === storageFailure);
});

test("private mutations require a same-origin JSON request", async () => {
  const request = (origin: string, body = "{}", type = "application/json") => new Request("https://sprechen.example/api/personal-chapters", { method: "POST", headers: { origin, "content-type": type }, body });
  assert.deepEqual(await readChapterRequest(request("https://sprechen.example")), {});
  assert.deepEqual(await readChapterRequest(new Request("http://localhost:3200/api/personal-chapters", { method: "POST", headers: { host: "127.0.0.1:3200", origin: "http://127.0.0.1:3200", "content-type": "application/json" }, body: "{}" })), {});
  await assert.rejects(() => readChapterRequest(request("https://other.example")), /from Sprechen/);
  await assert.rejects(() => readChapterRequest(request("https://sprechen.example", "{}", "text/plain")), /JSON request/);
  await assert.rejects(() => readChapterRequest(request("https://sprechen.example", "{")), /not valid JSON/);
  await assert.rejects(() => readChapterRequest(request("https://sprechen.example", "x".repeat(18001))), /shorter transcript/);
});

test("API errors and quota responses never permit shared caching", () => {
  assert.ok(privateJson({ error: "Busy" }, 429).headers.get("cache-control")?.includes("no-store"));
  assert.equal(privateJson({}, 429).headers.get("retry-after"), "75");
});