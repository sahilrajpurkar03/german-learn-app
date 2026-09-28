import assert from "node:assert/strict";
import test from "node:test";
import { isAppIcon, isHashedStaticAsset, isNetworkOnly, shouldPurgeOnActivate } from "./sw-rules.ts";

test("app icons and the manifest are never cached, so a new logo shows up immediately", () => {
  for (const path of ["/icon-192.png", "/icon-512.png", "/icon-maskable-192.png", "/icon-maskable-512.png", "/apple-touch-icon.png", "/favicon.ico", "/logo.png", "/manifest.json"]) {
    assert.equal(isAppIcon(path), true, path);
    assert.equal(isNetworkOnly(path), true, `${path} must be NetworkOnly`);
    assert.equal(shouldPurgeOnActivate(path), true, `${path} must be purged from any old cache`);
  }
});

test("hashed build assets and mission photos are cacheable; everything else is network-only", () => {
  // `pathname` never includes the query string (URL parsing strips it before these rules see it).
  for (const path of ["/_next/static/chunks/app/page.js", "/_next/image", "/images/cafe.jpg"]) {
    assert.equal(isHashedStaticAsset(path), true, path);
    assert.equal(isNetworkOnly(path), false, path);
    assert.equal(shouldPurgeOnActivate(path), false, path);
  }
  for (const path of ["/today", "/api/learning/attempts", "/audio/004e4e5c.mp3", "/privacy"]) {
    assert.equal(isNetworkOnly(path), true, path);
  }
});
