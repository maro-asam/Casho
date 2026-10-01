import { promises as dns } from "node:dns";

// ─────────────────────────────────────────────────────────────────────────────
//  Checks where a merchant's domain points, and explains what's wrong in words
//  they can act on.
// ─────────────────────────────────────────────────────────────────────────────

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "casho.store";

/** What merchants are told to set. */
export const DNS_TARGETS = {
  cname: `stores.${ROOT_DOMAIN}`,
  /** Vercel's apex IP (stable, documented for A records). */
  a: "76.76.21.21",
} as const;

export type DnsProblem =
  | "no-records" // nothing published for the name yet
  | "cloudflare-proxy" // orange cloud: we see Cloudflare's IPs, not ours
  | "wrong-target" // points somewhere else (old host, parking page…)
  | "lookup-failed";

export type DnsCheck = {
  ok: boolean;
  found: { cname: string[]; a: string[] };
  problem?: DnsProblem;
};

const CLOUDFLARE_PREFIXES = ["104.16.", "104.17.", "104.18.", "104.19.", "104.20.", "104.21.", "172.64.", "172.65.", "172.66.", "172.67.", "188.114."];

async function safe<T>(fn: () => Promise<T>, fallback: T) {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/** IPs our own store hostnames resolve to — whatever they are today. */
async function ourIps() {
  const ips = await safe(() => dns.resolve4(DNS_TARGETS.cname), [] as string[]);
  return new Set([...ips, DNS_TARGETS.a]);
}

export async function checkDomainDns(domain: string): Promise<DnsCheck> {
  const [cname, a, valid] = await Promise.all([
    safe(() => dns.resolveCname(domain), [] as string[]),
    safe(() => dns.resolve4(domain), [] as string[]),
    ourIps(),
  ]);
  const found = { cname: cname.map((c) => c.replace(/\.$/, "").toLowerCase()), a };

  const cnameOk = found.cname.some((c) => c === DNS_TARGETS.cname || c.endsWith(".vercel-dns.com") || c.endsWith(`.${ROOT_DOMAIN}`));
  const aOk = a.length > 0 && a.every((ip) => valid.has(ip) || ip.startsWith("216.198.79.") || ip.startsWith("64.29.17."));
  if (cnameOk || aOk) return { ok: true, found };

  if (!cname.length && !a.length) return { ok: false, found, problem: "no-records" };
  if (a.some((ip) => CLOUDFLARE_PREFIXES.some((p) => ip.startsWith(p)))) return { ok: false, found, problem: "cloudflare-proxy" };
  return { ok: false, found, problem: "wrong-target" };
}
