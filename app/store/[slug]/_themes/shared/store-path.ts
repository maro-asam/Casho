"use client";

import { usePathname } from "next/navigation";

/** Current path relative to the store root ("/", "/products", …), whether the
 *  store is served on its subdomain, a custom domain or under /store/<slug>. */
export function useStorePath(storeSlug: string) {
  const pathname = usePathname() || "/";
  const prefix = `/store/${storeSlug}`;
  if (pathname === prefix) return "/";
  if (pathname.startsWith(prefix + "/")) return pathname.slice(prefix.length);
  return pathname;
}

/** Same-origin path for router.push(): keeps shoppers on a custom domain and
 *  inside the /store/<slug> preview instead of jumping to the subdomain. */
export function storeHref(storeSlug: string, path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined" && window.location.pathname.startsWith(`/store/${storeSlug}`)) {
    return `/store/${storeSlug}${clean === "/" ? "" : clean}`;
  }
  return clean;
}

export function isActivePath(current: string, target: string) {
  if (target === "/") return current === "/";
  return current === target || current.startsWith(target + "/");
}
