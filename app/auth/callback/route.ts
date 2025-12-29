import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // If Supabase used PKCE code flow, exchange code for a session cookie
  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // send back to login with a hint
      return NextResponse.redirect(new URL(`/login?e=${encodeURIComponent(error.message)}`, url));
    }
  }

  // where to go after login / magic link / invite
  return NextResponse.redirect(new URL("/", url));
}
