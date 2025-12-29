import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Public routes that must NOT be gated by auth.
 * These are required for Supabase email flows (magic link, invite, reset).
 */
const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/auth/callback",
  "/reset-password",
  "/api", // allow API routes (adjust if you want to protect some)
  "/_next", // Next assets
];

const PUBLIC_FILES = ["/favicon.ico", "/robots.txt", "/sitemap.xml"];

// You can tighten this matcher later. This one avoids static files automatically.
export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Let public routes and static files through immediately
  if (
    PUBLIC_FILES.includes(pathname) ||
    PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // Prepare response so Supabase can write cookies
  const res = NextResponse.next();

  // Supabase SSR client using NextRequest/NextResponse cookie bridge
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Write cookie to the outgoing response
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  // ✅ Check session (if no session, kick to login)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Optional: simple allowlist via env var ALLOWED_EMAILS="a@b.com,c@d.com"
  // If you don't want this, delete this block.
  const allowed = (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length > 0) {
    const email = (session.user.email || "").toLowerCase();
    if (!allowed.includes(email)) {
      // Sign them out by clearing cookies and send to login
      const out = NextResponse.redirect(new URL("/login?e=not_allowed", req.url));
      // Best-effort clear common Supabase cookie prefixes
      for (const c of req.cookies.getAll()) {
        if (c.name.startsWith("sb-")) {
          out.cookies.set({ name: c.name, value: "", path: "/", maxAge: 0 });
        }
      }
      return out;
    }
  }

  return res;
}
