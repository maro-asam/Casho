import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "casho.store";

const RESERVED_SUBDOMAINS = new Set(["www", "app", "casho"]);

function getHost(req: NextRequest) {
  const forwardedHost = req.headers.get("x-forwarded-host");
  return (forwardedHost || req.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase();
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

  // local
  if (host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  if (host.endsWith(".localhost")) {
    const subdomain = host.replace(".localhost", "");
    return subdomain || null;
  }

  // production main domains
  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    return null;
  }

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

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (!token && pathname.startsWith("/dashboard")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const subdomain = getSubdomain(host);

  if (
    subdomain &&
    !RESERVED_SUBDOMAINS.has(subdomain) &&
    !pathname.startsWith("/store/")
  ) {
    const url = req.nextUrl.clone();

    url.pathname =
      pathname === "/"
        ? `/store/${subdomain}`
        : `/store/${subdomain}${pathname}`;

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};