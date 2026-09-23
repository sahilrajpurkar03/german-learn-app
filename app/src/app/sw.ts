/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Voice clips never change (content-hashed names): keep them for offline lessons.
      matcher: ({ url }) => url.origin === self.location.origin && /^\/audio\/[0-9a-f]{8}\.mp3$/.test(url.pathname),
      handler: new CacheFirst({ cacheName: "sprechen-audio", plugins: [new ExpirationPlugin({ maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 180 })] }),
    },
    {
      matcher: ({ url }) => url.origin !== self.location.origin ||
        !/^\/(?:_next\/(?:static|image)(?:\/|$)|images\/|icon-[^/]+\.png$)/.test(url.pathname),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        const url = new URL(request.url);
        if (url.origin !== self.location.origin || /^\/(?:learn|auth|today|course|review|me|lesson|custom|welcome|placement|api)(?:\/|$)/.test(url.pathname)) {
          await cache.delete(request);
        }
      }
    }
  })());
});

// Daily reminders and the weekly recap (sent by /api/push/dispatch).
self.addEventListener("push", (event) => {
  let payload: { title?: string; body?: string; url?: string } = {};
  try { payload = event.data?.json() ?? {}; } catch { payload = { body: event.data?.text() }; }
  event.waitUntil(self.registration.showNotification(payload.title ?? "Sprechen", {
    body: payload.body ?? "A few minutes of German today?",
    icon: "/icon-192.png",
    badge: "/icon-maskable-192.png",
    tag: "sprechen-reminder",
    data: { url: typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "/today" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data as { url?: string } | null)?.url ?? "/today", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const open = windows.find((client) => client.url.startsWith(self.location.origin));
    if (open) { await open.focus(); return open.navigate(target); }
    return self.clients.openWindow(target);
  })());
});
