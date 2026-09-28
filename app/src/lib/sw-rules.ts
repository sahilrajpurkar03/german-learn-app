// Pure rules for the service worker (src/app/sw.ts), pulled out so they can be unit-tested
// without a ServiceWorker/DOM environment.

/** Build assets Next.js content-hashes, plus mission photos: safe to cache indefinitely. */
export function isHashedStaticAsset(pathname: string): boolean {
  return /^\/(?:_next\/(?:static|image)(?:\/|$)|images\/)/.test(pathname);
}

/**
 * App icons, the manifest and the favicon are small, rarely fetched, and must reflect the
 * latest deploy the moment it ships (an "Add to Home Screen" prompt reads them live). They are
 * never worth caching, and caching them risks freezing a stale logo behind the service worker.
 */
export function isAppIcon(pathname: string): boolean {
  return /^\/(?:icon-[^/]+\.png|apple-touch-icon\.png|favicon\.ico|logo\.png|manifest\.json)$/.test(pathname);
}

/** Everything else (pages, API routes) must never be served from a cache. */
export function isNetworkOnly(pathname: string): boolean {
  return !isHashedStaticAsset(pathname) || isAppIcon(pathname);
}

/** Private routes and any previously cached icon are dropped when a new service worker takes over. */
export function shouldPurgeOnActivate(pathname: string): boolean {
  return isAppIcon(pathname) || /^\/(?:learn|auth|today|course|review|me|lesson|custom|welcome|placement|api)(?:\/|$)/.test(pathname);
}
