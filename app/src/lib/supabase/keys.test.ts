import assert from "node:assert/strict";
import test from "node:test";
import { describeServiceKey } from "./keys.ts";

const jwt = (role: string) => `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ iss: "supabase", role })).toString("base64url")}.signature`;

test("the configured Supabase key is classified without exposing it", () => {
  assert.deepEqual(describeServiceKey(undefined), { kind: "missing", problem: "It is not set." });
  assert.equal(describeServiceKey(jwt("service_role")).problem, null);
  assert.equal(describeServiceKey(jwt("service_role")).kind, "jwt-service_role");
  assert.match(describeServiceKey(jwt("anon")).problem ?? "", /"anon" \(public\) key/);
  assert.equal(describeServiceKey(jwt("anon")).kind, "jwt-anon");
  assert.equal(describeServiceKey("sb_secret_abc123").problem, null);
  assert.match(describeServiceKey("sb_publishable_abc123").problem ?? "", /public/);
  assert.match(describeServiceKey(`${jwt("service_role")}\n`).problem ?? "", /line break/);
  assert.equal(describeServiceKey("not-a-known-format").problem, null, "unknown formats are not blocked");
  for (const info of [describeServiceKey(jwt("anon")), describeServiceKey("sb_secret_abc123")]) assert.ok(!JSON.stringify(info).includes("signature") && !JSON.stringify(info).includes("abc123"));
});
