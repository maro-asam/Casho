/**
 * Abuse protection for the collector: a per-IP rate limit (per server
 * instance — enough against one noisy client; the size and per-session caps
 * bound the rest) and internal-IP matching. IPs are used in memory only.
 */

const WINDOW_MS = 60_000;
const MAX_KEYS = 20_000;

export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();
  constructor(
    private readonly limit: number,
    private readonly windowMs = WINDOW_MS,
  ) {}

  /** true = allowed. */
  take(key: string, now = Date.now()): boolean {
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      if (this.hits.size >= MAX_KEYS) this.sweep(now);
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= this.limit;
  }

  private sweep(now: number) {
    for (const [key, entry] of this.hits) if (entry.resetAt <= now) this.hits.delete(key);
    if (this.hits.size >= MAX_KEYS) this.hits.clear();
  }
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const v = Number(part);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

/** Exact IPv4/IPv6 match, or an IPv4 CIDR range ("41.33.0.0/16"). */
export function ipMatches(ip: string, rule: string): boolean {
  const r = rule.trim();
  if (!r || !ip) return false;
  if (!r.includes("/")) return r.toLowerCase() === ip.toLowerCase();
  const [base, bitsRaw] = r.split("/");
  const bits = Number(bitsRaw);
  const ipInt = ipv4ToInt(ip);
  const baseInt = ipv4ToInt(base);
  if (ipInt === null || baseInt === null || !Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  if (bits === 0) return true;
  const mask = bits === 32 ? 0xffffffff : (~0 << (32 - bits)) >>> 0;
  return ((ipInt & mask) >>> 0) === ((baseInt & mask) >>> 0);
}

export function isInternalIp(ip: string | null, rules: readonly string[]) {
  return !!ip && rules.some((rule) => ipMatches(ip, rule));
}

/** Validates an admin-typed rule (so a typo can't silently match nothing). */
export function isValidIpRule(rule: string) {
  const r = rule.trim();
  if (r.includes("/")) {
    const [base, bits] = r.split("/");
    return ipv4ToInt(base) !== null && /^\d{1,2}$/.test(bits) && Number(bits) <= 32;
  }
  return ipv4ToInt(r) !== null || /^[0-9a-f:]{2,39}$/i.test(r);
}
