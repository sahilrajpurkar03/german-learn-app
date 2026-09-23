import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readV2Override, V2_COOKIE, V2_COOKIE_MAX_AGE } from "@/lib/feature-flags";

export async function updateSession(request: NextRequest) {
  const response = await sessionResponse(request);
  const override = readV2Override(request.nextUrl.searchParams);
  if (override) {
    response.cookies.set(V2_COOKIE, override === "on" ? "1" : "0", {
      path: "/",
      maxAge: V2_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      httpOnly: true,
    });
  }
  return response;
}

async function sessionResponse(request: NextRequest) {
  // Public pages, and API routes (they authenticate themselves and answer 401 instead of redirecting).
  const path = request.nextUrl.pathname;
  if (["/preview", "/demo", "/imprint", "/privacy", "/data-sharing", "/security"].includes(path) || path.startsWith("/api/")) {
    return NextResponse.next({ request });
  }
  // A deployment without Supabase settings (e.g. a Vercel preview whose env vars are Production-only)
  // can't check sign-in. Say so plainly instead of failing with a bare 500.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return new NextResponse(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sprechen · setup needed</title></head>
<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1.25rem;line-height:1.6;color:#152238">
<h1 style="font-size:1.5rem">This deployment isn't connected to its database</h1>
<p>Sign-in needs <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, which are not set for this environment. In Vercel, add them to this environment (for previews: Settings → Environment Variables → Preview) and redeploy.</p>
<p><a href="/demo">Try the demo lesson</a> — it works without an account.</p></body></html>`,
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
    );
  }
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup";
  const isRecoveryRoute = [
    "/auth/forgot-password",
    "/auth/callback",
    "/auth/reset-password",
  ].includes(request.nextUrl.pathname);

  function privateResponse(response: NextResponse) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  function redirectWithCookies(url: URL) {
    const response = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.cookies.getAll()) response.cookies.set(cookie);
    return privateResponse(response);
  }

  if (!user && !isAuthRoute && !isRecoveryRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return redirectWithCookies(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/learn";
    return redirectWithCookies(url);
  }

  return privateResponse(supabaseResponse);
}
