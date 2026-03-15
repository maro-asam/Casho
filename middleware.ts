import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// لو عندك auth system مؤقت
export function middleware(req: NextRequest) {
  const token = req.cookies.get("sessionToken"); // مؤقت
  const url = req.nextUrl.clone();

  if (!token && url.pathname.startsWith("/dashboard")) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};