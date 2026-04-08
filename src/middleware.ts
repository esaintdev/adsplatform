import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-provide-one-in-env"
);

const SESSION_COOKIE_NAME = "adtrack_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public paths
  if (
    pathname.startsWith("/login") || 
    pathname.startsWith("/setup") || 
    pathname.startsWith("/api/setup") || 
    pathname.startsWith("/api/auth") || 
    pathname.startsWith("/api/track") ||
    pathname.startsWith("/uploads") ||         // Banner images served as static assets
    (pathname.startsWith("/api/banners") && pathname.endsWith("/image")) ||
    pathname.includes("favicon.ico") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/tracker.js")
  ) {
    return NextResponse.next();
  }

  // 2. Check for session cookie
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // 3. Verify JWT
    await jwtVerify(session, SECRET);
    return NextResponse.next();
  } catch (error) {
    // 4. Invalid token -> Redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/track (tracking endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
