"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "./password-input";

export function PasswordRecoveryForm({ mode }: { mode: "request" | "reset" }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const isReset = mode === "reset";
  const inputClass = "w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-blue-500";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    setError(null);

    if (isReset && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (isReset && password !== formData.get("confirmPassword")) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      if (isReset) {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
          setError(updateError.message);
          return;
        }
      } else {
        const { error: requestError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`,
        });
        if (requestError) {
          setError("Could not send a reset link. Please wait a moment and try again.");
          return;
        }
      }
      setComplete(true);
    } catch {
      setError("Could not connect. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (complete) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <p role="status" className="text-sm text-neutral-200">
          {isReset
            ? "Your password has been updated."
            : "If an account exists for that email, you will receive a password-reset link. Check your inbox and spam folder, and open the link in this browser."}
        </p>
        <Link href={isReset ? "/learn" : "/login"} className="inline-block text-sm text-blue-400 hover:underline">
          {isReset ? "Continue to your practice" : "Back to login"}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-4">
      {isReset ? (
        <>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-neutral-200">New password</label>
            <PasswordInput id="password" name="password" visibilityLabel="new password" autoComplete="new-password" minLength={8} required className={inputClass} />
          </div>
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-200">Confirm new password</label>
            <PasswordInput id="confirmPassword" name="confirmPassword" visibilityLabel="confirmed password" autoComplete="new-password" minLength={8} required className={inputClass} />
          </div>
        </>
      ) : (
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-neutral-200">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-blue-600 px-3 py-2 font-medium text-white transition hover:bg-blue-500 disabled:opacity-60">
        {pending ? "Please wait..." : isReset ? "Update password" : "Send reset link"}
      </button>
      <p className="text-center text-sm">
        <Link href={isReset ? "/auth/forgot-password" : "/login"} className="text-blue-400 hover:underline">
          {isReset ? "Request a new reset link" : "Back to login"}
        </Link>
      </p>
    </form>
  );
}