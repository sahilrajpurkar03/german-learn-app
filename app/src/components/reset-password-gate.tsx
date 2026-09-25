"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { readRecoveryLink } from "@/lib/supabase/recovery";
import { PasswordRecoveryForm } from "./password-recovery-form";

type State = { kind: "checking" } | { kind: "ready" } | { kind: "invalid"; message?: string };

/** Accepts a reset link (tokens in the URL fragment) or an existing recovery session, then shows the new-password form. */
export function ResetPasswordGate() {
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    let active = true;
    const client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      isSingleton: false,
      auth: { detectSessionInUrl: false },
    });
    const link = readRecoveryLink(window.location.hash);
    // Keep the tokens out of the address bar and browser history.
    if (link.kind !== "none") window.history.replaceState(null, "", window.location.pathname);
    (async () => {
      if (link.kind === "error") return { kind: "invalid" as const, message: link.message };
      if (link.kind === "tokens") {
        const { error } = await client.auth.setSession({ access_token: link.accessToken, refresh_token: link.refreshToken });
        return error ? { kind: "invalid" as const } : { kind: "ready" as const };
      }
      const { data } = await client.auth.getUser();
      return data.user ? { kind: "ready" as const } : { kind: "invalid" as const };
    })().then((next) => { if (active) setState(next); });
    return () => { active = false; };
  }, []);

  if (state.kind === "checking") return <p role="status" className="text-sm text-neutral-400">Checking your reset link…</p>;
  if (state.kind === "invalid") {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <p role="alert" className="text-sm text-red-700">
          This reset link is invalid or expired{state.message ? ` (${state.message})` : ""}. Links work once and for about an hour.
        </p>
        <Link href="/auth/forgot-password" className="inline-block text-sm text-blue-400 hover:underline">Send a new reset link</Link>
      </div>
    );
  }
  return <PasswordRecoveryForm mode="reset" />;
}
