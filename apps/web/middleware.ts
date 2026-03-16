import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "recruitai_session";

const protectedPrefixes = [
  "/dashboard",
  "/quick-interview",
  "/coding-interview",
  "/upload",
  "/interview",
  "/report"
];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const hasToken = !!token;

  const isAuthApi = pathname.startsWith("/api/auth");
  const isProtectedPage = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
  const isProtectedApi = pathname.startsWith("/api/") && !isAuthApi && !pathname.startsWith("/api/webhooks");

  // Redirect logged-in users from login page or root to dashboard
  if ((pathname === "/login" || pathname === "/") && hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users to login
  if ((isProtectedPage || isProtectedApi) && !hasToken) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
