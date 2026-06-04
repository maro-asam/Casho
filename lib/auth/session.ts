import { randomBytes, createHash } from "crypto";
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

  if (isProduction) {
    cookieStore.delete({ name: SESSION_COOKIE_NAME, path: "/" });
    cookieStore.delete({ name: SESSION_COOKIE_NAME, path: "/", domain: rootDomain });
  }

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

  if (isProduction) {
    cookieStore.delete({ name: SESSION_COOKIE_NAME, domain: `.${rootDomain}`, path: "/" });
    cookieStore.delete({ name: SESSION_COOKIE_NAME, domain: rootDomain, path: "/" });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function deleteAllUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function getCurrentSession() {
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
          role: true,
          stores: {
            select: { id: true, name: true, slug: true },
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

  if (shouldRenew) {
    const newExpiresAt = getSessionExpiryDate();
    await prisma.session.update({
      where: { tokenHash },
      data: { expiresAt: newExpiresAt, lastUsedAt: new Date() },
    });
    // Reissue cookie with fresh maxAge
    await _setSessionCookie(token);
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
