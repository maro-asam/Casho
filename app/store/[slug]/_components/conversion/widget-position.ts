/** Store-relative path whether we're on the subdomain or under /store/[slug]. */
export function storePath(pathname: string, slug: string) {
  const prefix = `/store/${slug}`;
  const path = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
  return path || "/";
}

/** Product pages have a sticky purchase bar on small screens — float above it. */
export function hasStickyBar(path: string) {
  return /^\/products\/[^/]+/.test(path);
}

export const QUIET_PATHS = /^\/(cart|checkout|order)(\/|$)/;

/** Internal store link that works on the subdomain and under /store/[slug] (builder preview). */
export function storeHref(pathname: string, slug: string, href: string) {
  const prefix = `/store/${slug}`;
  return pathname.startsWith(prefix) && href.startsWith("/") ? `${prefix}${href === "/" ? "" : href}` : href;
}
