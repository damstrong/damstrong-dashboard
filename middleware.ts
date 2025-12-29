import { NextResponse, type NextRequest } from "next/server";

// TEMP: allow everything through to stop auth redirect loops
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
