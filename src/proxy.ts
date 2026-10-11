import { SESSION_COOKIE } from "@/lib/constants";
import { readSessionToken } from "@/lib/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/api/auth/login" && request.method === "POST") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let session = null;
  if (token) {
    try {
      session = await readSessionToken(token);
    } catch {
      session = null;
    }
  }

  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/api/:path*", "/admin", "/admin/:path*", "/desk", "/desk/:path*"],
};
