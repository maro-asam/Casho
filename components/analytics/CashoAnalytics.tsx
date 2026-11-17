"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

import { AUTH_PATH_PREFIXES, INTERNAL_PATH_PREFIXES, hasPathPrefix, type ScopeCode } from "@/lib/analytics/constants";
import type { InitOptions, VitalMetric } from "@/lib/analytics/sdk/tracker";

type Tracker = typeof import("@/lib/analytics/sdk/tracker");

// One tracker per page: the root layout's instance stands down on storefront
// hosts, where the store layout mounts its own (with the store id).
let tracker: Tracker | null = null;
const earlyVitals: VitalMetric[] = [];
// web-vitals may be registered more than once per page — report each measurement once.
const seenVitals = new Set<string>();

function reportVital(metric: VitalMetric) {
  // Each registration (two mounts, Strict Mode) gets its own metric id for the
  // same measurement — so the measurement itself is the key.
  const key = `${metric.name}:${metric.navigationType ?? ""}:${metric.value}`;
  if (seenVitals.has(key)) return;
  seenVitals.add(key);
  if (tracker) tracker.vital(metric);
  else if (earlyVitals.length < 10) earlyVitals.push(metric);
}

/** Which scope this mount tracks on the current host, or null to stay idle. */
function scopeFor(rootDomain: string, storeId?: string): ScopeCode | null {
  if (storeId) return "s";
  const host = location.hostname.toLowerCase();
  const path = location.pathname;
  const root = rootDomain.toLowerCase();
  const isApp = host === `app.${root}` || host === "app.localhost";
  const isMain = host === root || host === `www.${root}` || host === "localhost" || host === "127.0.0.1";
  if (!isApp && !isMain) return null; // a storefront host
  if (/^\/store(\/|$)/.test(path)) return null; // storefront under /store/<slug>
  if (hasPathPrefix(path, INTERNAL_PATH_PREFIXES)) return null;
  if (isApp) return hasPathPrefix(path, AUTH_PATH_PREFIXES) ? "m" : "a";
  return hasPathPrefix(path, ["/dashboard", "/onboarding", "/builder", "/pos"]) ? "a" : "m";
}

/**
 * Casho's first-party analytics (lib/analytics). Mounted once in the root
 * layout (Casho site + dashboard) and once in the storefront layout. The SDK
 * itself loads after the page is idle, as its own small chunk.
 */
export function CashoAnalytics({ rootDomain, storeId }: { rootDomain: string; storeId?: string }) {
  const pathname = usePathname();
  useReportWebVitals(reportVital);

  useEffect(() => {
    const scope = scopeFor(rootDomain, storeId);
    if (!scope) return;
    const host = location.hostname.toLowerCase();
    const root = rootDomain.toLowerCase();
    const opts: InitOptions = {
      scope,
      storeId,
      // casho.store and app.casho.store share one visitor (the signup journey crosses them).
      cookieDomain: scope !== "s" && (host === root || host.endsWith(`.${root}`)) ? `.${root}` : undefined,
    };
    let cancelled = false;
    const start = () => {
      import("@/lib/analytics/sdk/tracker")
        .then((mod) => {
          if (cancelled || tracker) return;
          tracker = mod;
          for (const metric of earlyVitals.splice(0)) mod.vital(metric);
          return mod.init(opts);
        })
        .catch(() => {});
    };
    const idle = window.requestIdleCallback;
    const handle = idle ? idle(start, { timeout: 4_000 }) : window.setTimeout(start, 1_500);
    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [rootDomain, storeId]);

  // Client-side navigations (the first page is recorded by init itself).
  useEffect(() => {
    tracker?.page();
  }, [pathname]);

  return null;
}
