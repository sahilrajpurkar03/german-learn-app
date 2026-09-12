import assert from "node:assert/strict";
import test from "node:test";
import { createChapterAI } from "./chapter-ai.ts";
import { sampleChapter, sampleInput } from "./personal-chapter-demo.ts";

test("generation requests bounded strict JSON and validates the returned chapter", async () => {
  let calls = 0;
  const transport: typeof fetch = async (_url, options) => {
    calls += 1;
    const request = JSON.parse(String(options?.body));
    assert.equal(request.model, "openai/gpt-oss-120b");
    assert.equal(request.response_format.json_schema.strict, true);
    assert.equal(request.max_completion_tokens, 4000);
    assert.equal(JSON.parse(request.messages[1].content).transcript, sampleInput.transcript);
    return Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(sampleChapter()) } }], usage: { total_tokens: 2100 } });
  };
  const result = await createChapterAI("test-key-not-a-credential", transport).generate(sampleInput);
  assert.equal(result.blueprint.original.turns.length, 4);
  assert.equal(result.metrics.tokens, 2100);
  assert.equal(calls, 1);
});

test("quota errors are not retried automatically", async () => {
  let calls = 0;
  const transport: typeof fetch = async () => {
    calls += 1;
    return Response.json({ error: { message: "Limit", type: "rate_limit_error" } }, { status: 429 });
  };
  await assert.rejects(() => createChapterAI("test-key-not-a-credential", transport).generate(sampleInput));
  assert.equal(calls, 1);
});

test("truncated or structurally invalid output never becomes a chapter", async () => {
  for (const response of [
    { choices: [{ finish_reason: "length", message: { content: "{}" } }] },
    { choices: [{ finish_reason: "stop", message: { content: "{}" } }] },
  ]) {
    const transport: typeof fetch = async () => Response.json(response);
    await assert.rejects(() => createChapterAI("test-key-not-a-credential", transport).generate(sampleInput));
  }
});

test("audio uses transcription rather than English-only translation", async () => {
  const transport: typeof fetch = async (url, options) => {
    assert.ok(String(url).endsWith("/audio/transcriptions"));
    assert.ok(options?.body instanceof FormData);
    assert.equal(options.body.get("language"), "en");
    return Response.json({ text: sampleInput.transcript, duration: 12 });
  };
  const result = await createChapterAI("test-key-not-a-credential", transport).transcribe(new File(["fixture"], "sample.wav", { type: "audio/wav" }), "en");
  assert.equal(result.transcript, sampleInput.transcript);
});

test("unsupported and oversized uploads never reach the provider", async () => {
  const transport: typeof fetch = async () => { throw new Error("Must not be called"); };
  const provider = createChapterAI("test-key-not-a-credential", transport);
  await assert.rejects(() => provider.transcribe(new File(["x"], "bad.exe", { type: "application/octet-stream" }), "en"), /supported audio/);
  await assert.rejects(() => provider.transcribe(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.mp3", { type: "audio/mpeg" }), "en"), /supported audio/);
});