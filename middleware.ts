import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "casho.store";

const RESERVED_SUBDOMAINS = new Set(["www", "app", "casho"]);

function getHost(req: NextRequest) {
  const forwardedHost = req.headers.get("x-forwarded-host");
  return (forwardedHost || req.headers.get("host") || "").split(":")[0];
}

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

function getSubdomain(host: string) {
  if (!host) return null;

  // local dev
  if (host === "localhost") return null;

  if (host.endsWith(".localhost")) {
    const subdomain = host.replace(".localhost", "");
    return subdomain || null;
  }

  // production
  if (host === ROOT_DOMAIN) return null;

  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = host.replace(`.${ROOT_DOMAIN}`, "");
    return subdomain || null;
  }

  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("sessionToken");
  const host = getHost(req);

  if (!token && pathname.startsWith("/dashboard")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const subdomain = getSubdomain(host);

  if (
    subdomain &&
    !RESERVED_SUBDOMAINS.has(subdomain) &&
    !pathname.startsWith("/store/")
  ) {
    const url = req.nextUrl.clone();

    if (pathname === "/") {
      url.pathname = `/store/${subdomain}`;
      return NextResponse.rewrite(url);
    }

    url.pathname = `/store/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};