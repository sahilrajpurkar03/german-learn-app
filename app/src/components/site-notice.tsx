"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, Info } from "lucide-react";

const storageKey = "sprechen-beta-notice";
const noticeVersion = "1";
const changeEvent = "sprechen-beta-notice-change";
let visitAcknowledgment: boolean | null = null;

function subscribe(callback: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === storageKey || event.key === null) {
      visitAcknowledgment = null;
      callback();
    }
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, callback);
  };
}

function isAcknowledged() {
  if (visitAcknowledgment !== null) return visitAcknowledgment;
  try { return window.localStorage.getItem(storageKey) === noticeVersion; }
  catch { return false; }
}

function acknowledge(value: boolean) {
  try {
    if (value) window.localStorage.setItem(storageKey, noticeVersion);
    else window.localStorage.removeItem(storageKey);
    visitAcknowledgment = null;
  } catch { visitAcknowledgment = value; }
  window.dispatchEvent(new Event(changeEvent));
}

export function SiteNotice() {
  const acknowledged = useSyncExternalStore(subscribe, isAcknowledged, () => false);
  if (acknowledged) return null;
  return (
    <aside id="beta-testing-notice" tabIndex={-1} aria-label="Beta testing notice" className="site-notice">
      <div>
        <p><strong>Beta testing</strong> Sprechen is under active testing. Features may change, errors may occur, and progress may be reset. Do not enter sensitive personal information in practice replies.</p>
        <small id="beta-acknowledgment-meaning">Acknowledgment only, not consent to data sharing.</small>
      </div>
      <button type="button" aria-describedby="beta-acknowledgment-meaning" onClick={() => acknowledge(true)}><Check size={16} aria-hidden="true" />Accept</button>
    </aside>
  );
}

export function SiteFooter() {
  function reopen() {
    acknowledge(false);
    requestAnimationFrame(() => {
      const notice = document.getElementById("beta-testing-notice");
      notice?.focus();
      notice?.scrollIntoView({ block: "start" });
    });
  }
  return (
    <footer className="site-footer" aria-label="Site information">
      <nav aria-label="Legal information">
        <Link href="/imprint">Imprint</Link>
        <Link href="/privacy">Privacy policy</Link>
        <Link href="/data-sharing">Data sharing</Link>
        <Link href="/security">Security</Link>
      </nav>
      <button type="button" onClick={reopen}><Info size={14} aria-hidden="true" />Beta notice</button>
    </footer>
  );
}