"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Password reset that works with Supabase's default email template and when the email is
// opened in a different browser or app than the one that asked for it (e.g. Gmail on a phone).
// The request uses the "implicit" flow, so the link returns the session in the URL fragment
// (#access_token=…), which /auth/reset-password turns into a normal cookie session.

export async function requestPasswordReset(email: string) {
  const client = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset-password` });
}

export type RecoveryLink =
  | { kind: "tokens"; accessToken: string; refreshToken: string }
  | { kind: "error"; message: string }
  | { kind: "none" };

/** Reads (and then removes) the tokens Supabase puts in the fragment of a reset link. */
export function readRecoveryLink(hash: string): RecoveryLink {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const error = params.get("error_description") ?? params.get("error");
  if (error) return { kind: "error", message: error.replace(/\+/g, " ") };
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (accessToken && refreshToken) return { kind: "tokens", accessToken, refreshToken };
  return { kind: "none" };
}
