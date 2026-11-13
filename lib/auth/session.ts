import { randomBytes, createHash } from "crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth/constants";

// Sliding window: extend session when more than half the lifetime has elapsed
const SESSION_RENEW_THRESHOLD = SESSION_MAX_AGE / 2;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function generateSessionToken() {
  return randomBytes(32).toString("hex");
}

export function getSessionExpiryDate() {
  return new Date(Date.now() + SESSION_MAX_AGE * 1000);
}

async function getRequestMeta() {
  try {
    const h = await headers();
    const userAgent = h.get("user-agent") ?? undefined;
    const ip =
      h.get("x-forwarded-for")?.split(",")[0].trim() ??
      h.get("x-real-ip") ??
      undefined;
    return { userAgent, ipAddress: ip };
  } catch {
    return { userAgent: undefined, ipAddress: undefined };
  }
}

export async function createUserSession(userId: string) {
  const token = generateSessionToken();
  const tokenHash = sha256(token);
  const expiresAt = getSessionExpiryDate();
  const { userAgent, ipAddress } = await getRequestMeta();

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  await _setSessionCookie(token);
}

async function _setSessionCookie(token: string) {
  const cookieStore = await cookies();
  const rootDomain = process.env.ROOT_DOMAIN || "casho.store";
  const isProduction = process.env.NODE_ENV === "production";

  // Next sends one Set-Cookie per name (the last write wins), so deleting other
  // copies first never reached the browser — this just replaces the shared one.
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    domain: isProduction ? `.${rootDomain}` : undefined,
  });
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = sha256(token);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }

  const rootDomain = process.env.ROOT_DOMAIN || "casho.store";
  const isProduction = process.env.NODE_ENV === "production";

  // Clear the cookie _setSessionCookie wrote: the shared `.casho.store` one in
  // production (a delete has to name the same domain), host-only in dev. Only
  // the last write per name is sent, so it has to be this one delete — the old
  // chain only sent the host-only delete and left the shared cookie behind.
  cookieStore.delete({
    name: SESSION_COOKIE_NAME,
    path: "/",
    ...(isProduction ? { domain: `.${rootDomain}` } : {}),
  });
}

export async function deleteAllUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

/**
 * The signed-in session, looked up once per server render: the dashboard
 * layout, its page, the locale loader and the notifications/badge helpers all
 * ask for it, and each call used to repeat the same session + user + store
 * query. Where React has no request scope (e.g. route handlers) cache()
 * just calls through, so those keep one lookup per call as before.
 */
export const getCurrentSession = cache(readCurrentSession);

async function readCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const tokenHash = sha256(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      lastUsedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          stores: {
            select: { id: true, name: true, slug: true, customDomain: true, customDomainStatus: true },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!session) return null;

  const now = Date.now();

  // Expired — delete and reject
  if (session.expiresAt.getTime() <= now) {
    await prisma.session.deleteMany({ where: { tokenHash } });
    return null;
  }

  // Sliding session: extend expiry if past the renew threshold
  const remainingMs = session.expiresAt.getTime() - now;
  const shouldRenew = remainingMs < SESSION_RENEW_THRESHOLD * 1000;

  // Cookies can only be written from a Server Action or Route Handler — in a
  // page render cookies().set throws — so renew only where the cookie can be
  // reissued too. (Renewing the row first, then throwing, crashed that render
  // and left the browser cookie on its old expiry.) On the dashboard the 30s
  // notifications poll, a Server Action, renews it right after.
  const renewed =
    shouldRenew &&
    (await _setSessionCookie(token).then(
      () => true,
      () => false,
    ));

  if (renewed) {
    await prisma.session.update({
      where: { tokenHash },
      data: { expiresAt: getSessionExpiryDate(), lastUsedAt: new Date() },
    });
  } else {
    // Always update lastUsedAt (throttled: only if stale by > 1 minute)
    const lastUsedMs = session.lastUsedAt.getTime();
    if (now - lastUsedMs > 60_000) {
      prisma.session
        .update({ where: { tokenHash }, data: { lastUsedAt: new Date() } })
        .catch(() => {});
    }
  }

  return session;
}

export async function getCurrentSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const tokenHash = sha256(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: { id: true },
  });
  return session?.id ?? null;
}
