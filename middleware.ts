import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "casho.store";
const APP_URL = process.env.APP_URL || `https://app.${ROOT_DOMAIN}`;

const RESERVED_SUBDOMAINS = new Set(["www", "app", "casho"]);

const AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

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

  if (host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  if (host.endsWith(".localhost")) {
    const subdomain = host.replace(".localhost", "");
    return subdomain || null;
  }

  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    return null;
  }

  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = host.replace(`.${ROOT_DOMAIN}`, "");
    return subdomain || null;
  }

  return null;
}

function isCustomDomain(host: string): boolean {
  if (!host) return false;
  if (host === "localhost" || host === "127.0.0.1") return false;
  if (host.endsWith(".localhost")) return false;
  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) return false;
  if (host.endsWith(`.${ROOT_DOMAIN}`)) return false;
  return true;
}

async function resolveCustomDomain(host: string, origin: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${origin}/api/internal/domain-lookup?domain=${encodeURIComponent(host)}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.slug ?? null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("sessionToken");
  const host = getHost(req);

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const subdomain = getSubdomain(host);

  // ─── Root domain auth pages → redirect to app subdomain ──────────────────
  // prod: casho.store/login → app.casho.store/login
  // dev:  localhost:3000/login → app.localhost:3000/login
  if (!subdomain && isAuthPath(pathname)) {
    if (process.env.NODE_ENV !== "production") {
      const port = req.nextUrl.port ? `:${req.nextUrl.port}` : "";
      return NextResponse.redirect(
        `http://app.localhost${port}${pathname}${req.nextUrl.search}`
      );
    }
    return NextResponse.redirect(
      `https://app.${ROOT_DOMAIN}${pathname}${req.nextUrl.search}`
    );
  }

  // ─── app.casho.store (or app.localhost) → dashboard app ───────────────────
  if (subdomain === "app") {
    // Unauthenticated users go to /login (except auth pages themselves)
    if (!token && !isAuthPath(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Rewrite clean paths → /dashboard prefix (internal Next.js routing)
    // e.g. /orders → /dashboard/orders, / → /dashboard
    // Paths that map directly to their own top-level routes (no rewrite needed)
    const DIRECT_PATHS = ["/builder", "/store"];
    if (
      !pathname.startsWith("/dashboard") &&
      !isAuthPath(pathname) &&
      !DIRECT_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
    ) {
      const url = req.nextUrl.clone();
      url.pathname =
        pathname === "/" ? "/dashboard" : `/dashboard${pathname}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  // ─── Protect /dashboard and /builder on other domains (localhost dev) ──────
  if (!token && (pathname.startsWith("/dashboard") || pathname.startsWith("/builder"))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ─── Custom domains → resolve slug via internal API ──────────────────────
  if (isCustomDomain(host) && !pathname.startsWith("/store/")) {
    const origin = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const slug = await resolveCustomDomain(host, origin);
    if (slug) {
      const url = req.nextUrl.clone();
      url.pathname = pathname === "/" ? `/store/${slug}` : `/store/${slug}${pathname}`;
      return NextResponse.rewrite(url);
    }
    // Unknown custom domain — fall through to 404
    return NextResponse.next();
  }

  // ─── Store subdomains → /store/[slug] ─────────────────────────────────────
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
