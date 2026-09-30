/** Raw Next.js searchParams shape. */
export type SearchParamsRecord = Record<string, string | string[] | undefined>;

/** First value of a search param, trimmed; undefined when empty. */
export function readParam(params: SearchParamsRecord | undefined, key: string) {
  const raw = params?.[key];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  return value ? value : undefined;
}

/** Current page number from `?page=`, never below 1. */
export function readPage(params: SearchParamsRecord | undefined) {
  return Math.max(1, Math.floor(Number(readParam(params, "page"))) || 1);
}

/**
 * Builds `basePath?…` from the current params with some keys changed.
 * `undefined` / `null` / "" removes a key. Changing any filter resets `page`.
 */
export function hrefWith(
  basePath: string,
  current: SearchParamsRecord | undefined,
  changes: Record<string, string | number | null | undefined>,
) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(current ?? {})) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first) next.set(key, first);
  }
  if (!("page" in changes)) next.delete("page");
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined || value === null || value === "") next.delete(key);
    else next.set(key, String(value));
  }
  const query = next.toString();
  return query ? `${basePath}?${query}` : basePath;
}
