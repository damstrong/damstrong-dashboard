import { NextResponse, type NextRequest } from "next/server";

/**
 * OPTION A: Disable all middleware auth gating (temporary).
 * Keep middleware in place, but allow every request through to stop redirect loops.
 */

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/auth/callback",
  "/reset-password",
  "/api",
  "/_next",
];

const PUBLIC_FILES = ["/favicon.ico", "/robots.txt", "/sitemap.xml"];

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public routes/files (optional, but harmless)
  if (
    PUBLIC_FILES.includes(pathname) ||
    PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // ✅ Allow everything else too (auth gating disabled)
  return NextResponse.next();
}
