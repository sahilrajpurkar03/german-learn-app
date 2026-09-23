"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Download, KeyRound, Shield, Trash2, UserRound, Smartphone } from "lucide-react";
import { changePassword, updateDisplayName, type AccountResult } from "@/lib/account-actions";
import { PasswordInput } from "@/components/password-input";
import { clearOutbox } from "@/features/player/outbox";

const field = "min-h-12 w-full rounded-xl border-2 border-line bg-surface px-4 text-base text-ink outline-none transition focus:border-brand";
const card = "space-y-4 rounded-3xl bg-surface p-5 shadow-[var(--shadow-card)]";

function Notice({ result }: { result: AccountResult | null }) {
  if (!result) return null;
  return <p role={result.ok ? "status" : "alert"} className={`rounded-xl px-3 py-2 text-sm ${result.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>{result.message}</p>;
}

/** Removes what Sprechen keeps in this browser: saved places, the offline answer queue, cached voice clips, preferences. */
async function clearDeviceData() {
  try {
    for (const key of Object.keys(window.localStorage)) if (key.startsWith("sprechen")) window.localStorage.removeItem(key);
  } catch { /* storage unavailable */ }
  await clearOutbox().catch(() => undefined);
  try { indexedDB.deleteDatabase("sprechen"); } catch { /* unsupported */ }
  try { await caches.delete("sprechen-audio"); } catch { /* unsupported */ }
}

export function AccountPanel({ name, email, providers }: { name: string; email: string; providers: string[] }) {
  const router = useRouter();
  const hasPassword = providers.includes("email");
  const [displayName, setDisplayName] = useState(name);
  const [nameResult, setNameResult] = useState<AccountResult | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [passwordResult, setPasswordResult] = useState<AccountResult | null>(null);
  const [deviceResult, setDeviceResult] = useState<AccountResult | null>(null);
  const [confirm, setConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    const response = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm }) });
    if (!response.ok) {
      setDeleteError((await response.json().catch(() => null))?.error ?? "Deletion failed. Nothing was deleted.");
      setDeleting(false);
      return;
    }
    await clearDeviceData();
    router.replace("/login?deleted=1");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="profile-heading" className={card}>
        <h2 id="profile-heading" className="flex items-center gap-2 font-display text-xl font-semibold"><UserRound size={20} className="text-brand" aria-hidden="true" />Profile</h2>
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); startTransition(async () => setNameResult(await updateDisplayName(displayName))); }}>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Name</span>
            <input className={field} value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} autoComplete="name" />
          </label>
          <button type="submit" disabled={pending || displayName.trim() === name} className="min-h-11 rounded-xl bg-brand px-4 font-semibold text-on-brand disabled:opacity-50">Save name</button>
          <Notice result={nameResult} />
        </form>
        <div className="text-sm">
          <p className="font-semibold">Email</p>
          <p className="text-ink-soft">{email}</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Sign-in methods</p>
          <p className="text-ink-soft">{[hasPassword && "Email and password", providers.includes("google") && "Google"].filter(Boolean).join(" · ") || "Email link"}</p>
        </div>
      </section>

      <section aria-labelledby="password-heading" className={card}>
        <h2 id="password-heading" className="flex items-center gap-2 font-display text-xl font-semibold"><KeyRound size={20} className="text-brand" aria-hidden="true" />{hasPassword ? "Change password" : "Set a password"}</h2>
        {!hasPassword && <p className="text-sm text-ink-soft">You sign in with Google. Setting a password also lets you sign in with your email.</p>}
        <form className="space-y-3 [&_.password-input_input]:pr-14" onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await changePassword(current, next);
            setPasswordResult(result);
            if (result.ok) { setCurrent(""); setNext(""); }
          });
        }}>
          {hasPassword && (
            <label className="block space-y-1" htmlFor="current-password">
              <span className="text-sm font-semibold">Current password</span>
              <PasswordInput id="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} autoComplete="current-password" required className={field} visibilityLabel="current password" />
            </label>
          )}
          <label className="block space-y-1" htmlFor="new-password">
            <span className="text-sm font-semibold">New password</span>
            <PasswordInput id="new-password" value={next} onChange={(event) => setNext(event.target.value)} autoComplete="new-password" minLength={8} required className={field} placeholder="At least 8 characters" visibilityLabel="new password" />
          </label>
          <button type="submit" disabled={pending || next.length < 8} className="min-h-11 rounded-xl bg-brand px-4 font-semibold text-on-brand disabled:opacity-50">{hasPassword ? "Change password" : "Set password"}</button>
          <Notice result={passwordResult} />
        </form>
        {hasPassword && <p className="text-sm text-ink-soft">Forgot it? <Link href="/auth/forgot-password" className="font-semibold text-brand underline">Reset by email</Link></p>}
      </section>

      <section aria-labelledby="privacy-heading" className={card}>
        <h2 id="privacy-heading" className="flex items-center gap-2 font-display text-xl font-semibold"><Shield size={20} className="text-brand" aria-hidden="true" />Privacy & your data</h2>
        <ul className="divide-y-2 divide-line overflow-hidden rounded-2xl border-2 border-line">
          {[["/privacy", "Privacy policy"], ["/data-sharing", "What is shared with other services"], ["/security", "Security"], ["/imprint", "Imprint"]].map(([href, label]) => (
            <li key={href}><Link href={href} className="flex items-center justify-between px-4 py-3 font-medium hover:bg-surface-2">{label}<ArrowRight size={16} className="text-ink-soft" aria-hidden="true" /></Link></li>
          ))}
        </ul>
        <a href="/api/account/export" download className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-line font-semibold hover:border-brand"><Download size={18} aria-hidden="true" />Download my data (JSON)</a>
        <div className="space-y-2">
          <button type="button" onClick={() => {
            if (!window.confirm("Remove Sprechen's saved data from this browser? Your account and synced progress stay safe.")) return;
            void clearDeviceData().then(() => setDeviceResult({ ok: true, message: "This browser's Sprechen data has been cleared." }));
          }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-line font-semibold hover:border-brand"><Smartphone size={18} aria-hidden="true" />Clear data on this device</button>
          <p className="text-xs text-ink-soft">Useful on a shared device: removes saved places, queued answers, cached audio and preferences from this browser.</p>
          <Notice result={deviceResult} />
        </div>
      </section>

      <section aria-labelledby="delete-heading" className="space-y-3 rounded-3xl border-2 border-danger/40 bg-danger-soft/40 p-5">
        <h2 id="delete-heading" className="flex items-center gap-2 font-display text-xl font-semibold text-danger"><Trash2 size={20} aria-hidden="true" />Delete account</h2>
        <p className="text-sm">This permanently deletes your account, progress, streak, words, custom lessons and any stored recordings. It can&apos;t be undone. Download your data first if you want a copy.</p>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Type DELETE to confirm</span>
          <input className={field} value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="off" autoCapitalize="characters" />
        </label>
        <button type="button" disabled={confirm !== "DELETE" || deleting} onClick={() => void deleteAccount()} className="min-h-11 w-full rounded-xl bg-danger px-4 font-semibold text-white disabled:opacity-50">
          {deleting ? "Deleting…" : "Delete my account permanently"}
        </button>
        {deleteError && <p role="alert" className="text-sm text-danger">{deleteError}</p>}
      </section>
    </div>
  );
}
