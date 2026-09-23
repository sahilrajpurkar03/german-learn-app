import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles both email recovery links (no `next` → reset password) and Google sign-in (`next=/learn`).
// Only same-site paths are accepted as a destination, so the link can't send people elsewhere.
function safeNext(value: string | null): string | null {
  return value && /^\/(?!\/)[\w\-/?=&.]*$/.test(value) ? value : null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next"));
  const code = params.get("code");
  if (params.get("error")) {
    return NextResponse.redirect(new URL(next ? "/login?error=google" : "/auth/forgot-password?error=invalid-link", request.url));
  }
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next) {
        // New Google accounts: use the name Google provides instead of the default "Learner".
        const user = data.user;
        const googleName = (user?.user_metadata?.full_name ?? user?.user_metadata?.name) as string | undefined;
        if (user && googleName) {
          await supabase.from("profiles").update({ display_name: googleName.trim().slice(0, 60) }).eq("id", user.id).eq("display_name", "Learner");
        }
        return NextResponse.redirect(new URL(next, request.url));
      }
      return NextResponse.redirect(new URL("/auth/reset-password", request.url));
    }
  }
  return NextResponse.redirect(new URL(next ? "/login?error=google" : "/auth/forgot-password?error=invalid-link", request.url));
}
