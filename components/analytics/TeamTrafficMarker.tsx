"use client";

import { useEffect } from "react";
import { COOKIE_TEAM } from "@/lib/analytics/constants";

/**
 * Mounted in the admin and sales layouts: marks this browser as Casho staff so
 * its visits to the site, the dashboard and storefronts aren't counted
 * (Analytics settings → "exclude the team"). Shared across casho.store
 * subdomains in production.
 */
export function TeamTrafficMarker({ rootDomain }: { rootDomain: string }) {
  useEffect(() => {
    const host = location.hostname.toLowerCase();
    const root = rootDomain.toLowerCase();
    const domain = host === root || host.endsWith(`.${root}`) ? `; Domain=.${root}` : "";
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_TEAM}=1; Path=/; Max-Age=${400 * 24 * 60 * 60}; SameSite=Lax${secure}${domain}`;
  }, [rootDomain]);
  return null;
}
