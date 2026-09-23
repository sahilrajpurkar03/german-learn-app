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
