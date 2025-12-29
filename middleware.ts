import { NextResponse } from "next/server";

// Netlify is doing the protection now. Do not gate routes here.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
