import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Email links that carry a one-time token (Supabase email template:
// {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery).
// Unlike the code link handled by /auth/callback, this works when the link is opened in a
// different browser or app than the one that requested it (e.g. tapped in Gmail on a phone).
const TYPES: EmailOtpType[] = ["recovery", "signup", "invite", "magiclink", "email_change", "email"];

function safeNext(value: string | null): string | null {
  return value && /^\/(?!\/)[\w\-/?=&.]*$/.test(value) ? value : null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const fallback = type === "recovery" ? "/auth/reset-password" : "/learn";
  const next = safeNext(params.get("next")) ?? fallback;
  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL(type === "recovery" ? "/auth/forgot-password?error=invalid-link" : "/login", request.url));
}
