
// ─────────────────────────────────────────────────────────────────────────────
//  Vercel project domains — needed so Vercel routes the domain to this app and
//  issues its SSL certificate. Optional: without credentials the DNS check
//  alone decides (the domain must then be added to the project by hand).
//
//  Env: VERCEL_API_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID (optional)
// ─────────────────────────────────────────────────────────────────────────────

import { isApexDomain } from "./shared";

const TOKEN = process.env.VERCEL_API_TOKEN;
const PROJECT = process.env.VERCEL_PROJECT_ID;
const TEAM = process.env.VERCEL_TEAM_ID;

export const vercelConfigured = Boolean(TOKEN && PROJECT);

function url(path: string) {
  const u = new URL(`https://api.vercel.com${path}`);
  if (TEAM) u.searchParams.set("teamId", TEAM);
  return u.toString();
}

async function call<T>(method: string, path: string, body?: unknown): Promise<{ ok: boolean; status: number; data: T | null }> {
  if (!vercelConfigured) return { ok: false, status: 0, data: null };
  try {
    const res = await fetch(url(path), {
      method,
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    console.error("[vercel-domains]", method, path, error);
    return { ok: false, status: 0, data: null };
  }
}

type VercelError = { error?: { code?: string; message?: string } };

/** Adds `domain` and `www.domain` (redirecting to the apex) to the project. Idempotent. */
export async function addProjectDomain(domain: string) {
  const main = await call<VercelError>("POST", `/v10/projects/${PROJECT}/domains`, { name: domain });
  if (!main.ok) {
    // Already on this project counts as success; anything else (e.g. used by another Vercel account) doesn't.
    const existing = await call("GET", `/v9/projects/${PROJECT}/domains/${domain}`);
    if (!existing.ok) {
      const code = main.data?.error?.code;
      return {
        ok: false as const,
        message:
          code === "domain_already_in_use"
            ? "النطاق ده مربوط بحساب استضافة تاني. افصله من هناك الأول."
            : "مقدرناش نضيف النطاق للاستضافة دلوقتي. جرّب تاني بعد شوية.",
      };
    }
  }
  if (isApexDomain(domain)) {
    await call("POST", `/v10/projects/${PROJECT}/domains`, { name: `www.${domain}`, redirect: domain, redirectStatusCode: 308 });
  }
  return { ok: true as const };
}

export async function removeProjectDomain(domain: string) {
  await Promise.all([
    call("DELETE", `/v9/projects/${PROJECT}/domains/${domain}`),
    call("DELETE", `/v9/projects/${PROJECT}/domains/www.${domain}`),
  ]);
}

/** Vercel's own view: is the domain verified on the project and its DNS correct? */
export async function getProjectDomainStatus(domain: string) {
  const [project, config] = await Promise.all([
    call<{ verified?: boolean }>("GET", `/v9/projects/${PROJECT}/domains/${domain}`),
    call<{ misconfigured?: boolean }>("GET", `/v6/domains/${domain}/config`),
  ]);
  return {
    onProject: project.ok,
    verified: Boolean(project.data?.verified),
    configured: config.ok ? !config.data?.misconfigured : null,
  };
}
