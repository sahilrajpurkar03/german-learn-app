import assert from "node:assert/strict";
import test from "node:test";
import { privateJson, readChapterRequest } from "./chapter-http.ts";

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