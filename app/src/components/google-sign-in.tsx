"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Shown only when Google sign-in has been configured in Supabase (NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true). */
export const googleSignInEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

export function GoogleSignIn({ label = "Continue with Google" }: { label?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    const { error: failure } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/learn`, queryParams: { prompt: "select_account" } },
    });
    // On success the browser is already on its way to Google.
    if (failure) {
      setError("Google sign-in isn't available right now. Please use your email and password.");
      setPending(false);
    }
  }

  if (!googleSignInEnabled) return null;
  return (
    <div className="google-sign-in w-full space-y-4">
      <button type="button" onClick={() => void start()} disabled={pending}
        className="flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-neutral-300 bg-white px-3 py-2 font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z" />
        </svg>
        {pending ? "Opening Google…" : label}
      </button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-neutral-500" aria-hidden="true">
        <span className="h-px flex-1 bg-neutral-300" />or<span className="h-px flex-1 bg-neutral-300" />
      </div>
    </div>
  );
}
