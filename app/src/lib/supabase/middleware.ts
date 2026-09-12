import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  if (["/preview", "/imprint", "/privacy", "/data-sharing", "/security", "/api/personal-chapters", "/api/personal-chapters/cleanup"].includes(request.nextUrl.pathname)) {
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
