import assert from "node:assert/strict";
import test from "node:test";
import { isV2Enabled, readV2Override } from "./feature-flags.ts";

test("query parameter turns the v2 override on, off, or leaves it alone", () => {
  assert.equal(readV2Override(new URLSearchParams("v2=1")), "on");
  assert.equal(readV2Override(new URLSearchParams("v2=true")), "on");
  assert.equal(readV2Override(new URLSearchParams("v2=0")), "off");
  assert.equal(readV2Override(new URLSearchParams("v2=false")), "off");
  assert.equal(readV2Override(new URLSearchParams("v2=maybe")), null);
  assert.equal(readV2Override(new URLSearchParams("")), null);
});

test("cookie choice wins over the deployment default", () => {
  assert.equal(isV2Enabled("1", undefined), true);
  assert.equal(isV2Enabled("0", "true"), false);
  assert.equal(isV2Enabled(undefined, "true"), true);
  assert.equal(isV2Enabled(undefined, undefined), false);
  assert.equal(isV2Enabled("junk", "false"), false);
});
