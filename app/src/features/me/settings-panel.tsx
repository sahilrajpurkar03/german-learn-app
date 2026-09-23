"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { Bell, BellOff, Moon, Sun, SunMoon, Volume2, VolumeX } from "lucide-react";
import { updateSettings } from "@/lib/learning/actions";
import { DAILY_GOALS, GOAL_NAMES, type DailyGoal } from "@/lib/course/activity";
import { setSoundEnabled, soundEnabled } from "@/features/player/feedback-fx";

type Theme = "system" | "light" | "dark";

const PREFERENCE_EVENT = "sprechen-preferences";
function subscribePreferences(callback: () => void) {
  window.addEventListener(PREFERENCE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(PREFERENCE_EVENT, callback); window.removeEventListener("storage", callback); };
}
function storedTheme(): Theme {
  try { const saved = window.localStorage.getItem("sprechen-theme"); return saved === "light" || saved === "dark" ? saved : "system"; } catch { return "system"; }
}

function base64ToBytes(value: string) {
  const padded = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

export function SettingsPanel({ goal, reminderHour, vapidKey }: { goal: number; reminderHour: number | null; vapidKey: string | null }) {
  const [dailyGoal, setDailyGoal] = useState(goal);
  const [hour, setHour] = useState<number | null>(reminderHour);
  const sound = useSyncExternalStore(subscribePreferences, soundEnabled, () => true);
  const theme = useSyncExternalStore(subscribePreferences, storedTheme, () => "system" as Theme);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [installHint, setInstallHint] = useState(false);

  function save(values: Parameters<typeof updateSettings>[0], done: string) {
    setMessage(null);
    startTransition(async () => {
      try { await updateSettings(values); setMessage(done); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Could not save."); }
    });
  }

  function applyTheme(next: Theme) {
    try {
      if (next === "system") { window.localStorage.removeItem("sprechen-theme"); delete document.documentElement.dataset.theme; }
      else { window.localStorage.setItem("sprechen-theme", next); document.documentElement.dataset.theme = next; }
    } catch { /* ignore */ }
    window.dispatchEvent(new Event(PREFERENCE_EVENT));
  }

  function applySound(on: boolean) {
    setSoundEnabled(on);
    window.dispatchEvent(new Event(PREFERENCE_EVENT));
  }

  async function enableReminders(nextHour: number) {
    setMessage(null);
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    if (ios && !standalone) { setInstallHint(true); return; }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !vapidKey) {
      setMessage("This browser can't show reminders. You'll still see your goal when you open Sprechen.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { setMessage("Notifications are blocked. Allow them in your browser settings to get reminders."); return; }
    const registration = await navigator.serviceWorker.ready;
    const subscription = (await registration.pushManager.getSubscription()) ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(vapidKey) });
    const response = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
    if (!response.ok) { setMessage((await response.json().catch(() => null))?.error ?? "Could not turn on reminders."); return; }
    setHour(nextHour);
    save({ reminderHour: nextHour, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }, `Reminder set for ${String(nextHour).padStart(2, "0")}:00. You'll get one nudge a day only if you haven't reached your goal.`);
  }

  async function disableReminders() {
    setHour(null);
    try {
      const registration = await navigator.serviceWorker?.ready;
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
        await subscription.unsubscribe();
      }
    } catch { /* already off */ }
    save({ reminderHour: null }, "Reminders are off.");
  }

  const segment = (active: boolean) => `flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition ${active ? "bg-surface text-brand shadow-[var(--shadow-card)]" : "text-ink-soft hover:text-ink"}`;

  return (
    <section aria-labelledby="settings-heading" className="space-y-5">
      <h2 id="settings-heading" className="font-display text-2xl font-semibold">Settings</h2>

      <div>
        <p className="mb-2 font-semibold">Daily goal</p>
        <div className="flex gap-1 rounded-2xl bg-surface-2 p-1" role="radiogroup" aria-label="Daily goal">
          {DAILY_GOALS.map((value) => (
            <button key={value} type="button" role="radio" aria-checked={dailyGoal === value} disabled={pending} className={segment(dailyGoal === value)}
              onClick={() => { setDailyGoal(value); save({ goal: value as DailyGoal }, `Daily goal set to ${value} XP.`); }}>
              {GOAL_NAMES[value as DailyGoal]} · {value}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 font-semibold">Daily reminder</p>
        {hour === null ? (
          <div className="flex flex-wrap items-center gap-2">
            {[8, 12, 18, 20].map((value) => (
              <button key={value} type="button" onClick={() => void enableReminders(value)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-line bg-surface px-3 text-sm font-semibold hover:border-brand">
                <Bell size={15} aria-hidden="true" />{String(value).padStart(2, "0")}:00
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-3 shadow-[var(--shadow-card)]">
            <span className="flex items-center gap-2"><Bell size={18} className="text-brand" aria-hidden="true" />Every day at {String(hour).padStart(2, "0")}:00</span>
            <button type="button" onClick={() => void disableReminders()} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-danger"><BellOff size={15} aria-hidden="true" />Turn off</button>
          </div>
        )}
        {installHint && (
          <p role="status" className="mt-2 rounded-2xl bg-gold-soft p-3 text-sm">On iPhone, reminders work once Sprechen is on your home screen: tap <strong>Share</strong> → <strong>Add to Home Screen</strong>, open it from there, then turn reminders on (iOS 16.4 or newer).</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 font-semibold">Sound effects</p>
          <div className="flex gap-1 rounded-2xl bg-surface-2 p-1">
            <button type="button" className={segment(sound)} aria-pressed={sound} onClick={() => applySound(true)}><Volume2 size={16} aria-hidden="true" />On</button>
            <button type="button" className={segment(!sound)} aria-pressed={!sound} onClick={() => applySound(false)}><VolumeX size={16} aria-hidden="true" />Off</button>
          </div>
        </div>
        <div>
          <p className="mb-2 font-semibold">Appearance</p>
          <div className="flex gap-1 rounded-2xl bg-surface-2 p-1">
            <button type="button" className={segment(theme === "system")} aria-pressed={theme === "system"} onClick={() => applyTheme("system")}><SunMoon size={16} aria-hidden="true" />Auto</button>
            <button type="button" className={segment(theme === "light")} aria-pressed={theme === "light"} onClick={() => applyTheme("light")}><Sun size={16} aria-hidden="true" />Light</button>
            <button type="button" className={segment(theme === "dark")} aria-pressed={theme === "dark"} onClick={() => applyTheme("dark")}><Moon size={16} aria-hidden="true" />Dark</button>
          </div>
        </div>
      </div>
      {message && <p role="status" className="rounded-2xl bg-brand-soft p-3 text-sm text-ink">{message}</p>}
    </section>
  );
}
