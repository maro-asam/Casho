import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import type { ApiKeyContext } from "./types";

export type AuthResult =
  | { ok: true; apiKey: ApiKeyContext; store: { id: string; slug: string; name: string } }
  | { ok: false; status: number; message: string };

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function extractBearer(req: Request): string | null {
  const auth = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

function getIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const raw = extractBearer(req);
  if (!raw) {
    return { ok: false, status: 401, message: "Missing API key. Use Authorization: Bearer <key>" };
  }

  const keyHash = sha256(raw);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      storeId: true,
      status: true,
      scopes: true,
      ipWhitelist: true,
      expiresAt: true,
      store: { select: { id: true, slug: true, name: true } },
    },
  });

  if (!apiKey) {
    return { ok: false, status: 401, message: "Invalid API key" };
  }

  if (apiKey.status === "REVOKED") {
    return { ok: false, status: 401, message: "API key has been revoked" };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { ok: false, status: 401, message: "API key has expired" };
  }

  if (apiKey.ipWhitelist.length > 0) {
    const ip = getIp(req);
    if (!ip || !apiKey.ipWhitelist.includes(ip)) {
      return { ok: false, status: 403, message: "IP address not whitelisted" };
    }
  }

  // Async update lastUsedAt — don't await to keep latency low
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return {
    ok: true,
    apiKey: {
      id: apiKey.id,
      storeId: apiKey.storeId,
      scopes: apiKey.scopes,
      ipWhitelist: apiKey.ipWhitelist,
    },
    store: apiKey.store,
  };
}

export function requireScope(
  apiKey: ApiKeyContext,
  scope: string,
): { ok: true } | { ok: false; status: number; message: string } {
  if (apiKey.scopes.length > 0 && !apiKey.scopes.includes(scope)) {
    return { ok: false, status: 403, message: `Missing required scope: ${scope}` };
  }
  return { ok: true };
}

export function getIpFromRequest(req: Request): string | null {
  return getIp(req);
}
