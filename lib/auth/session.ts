import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth/constants";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function generateSessionToken() {
  return randomBytes(32).toString("hex");
}

export function getSessionExpiryDate() {
  return new Date(Date.now() + SESSION_MAX_AGE * 1000);
}

export async function createUserSession(userId: string) {
  const token = generateSessionToken();
  const tokenHash = sha256(token);
  const expiresAt = getSessionExpiryDate();

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();

  const rootDomain = process.env.ROOT_DOMAIN || "casho.store";
  const isProduction = process.env.NODE_ENV === "production";

  // Clear stale cookies that could take priority over the shared .casho.store cookie.
  // Browser sends the most specific domain cookie first, so we must clear both:
  // - subdomain-specific (e.g. app.casho.store) — deleted by omitting domain
  // - root domain (e.g. casho.store without dot) — deleted by explicit domain
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

    await prisma.session.deleteMany({
      where: {
        tokenHash,
      },
    });
  }

  const rootDomain = process.env.ROOT_DOMAIN || "casho.store";
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // Delete the shared .casho.store cookie
    cookieStore.delete({ name: SESSION_COOKIE_NAME, domain: `.${rootDomain}`, path: "/" });
    // Delete root domain cookie (casho.store without dot)
    cookieStore.delete({ name: SESSION_COOKIE_NAME, domain: rootDomain, path: "/" });
  }

  // Delete any host-specific cookie (e.g. app.casho.store or app.localhost)
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const tokenHash = sha256(token);

  const session = await prisma.session.findUnique({
    where: {
      tokenHash,
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          stores: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
            orderBy: {
              createdAt: "asc",
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.deleteMany({
      where: {
        tokenHash,
      },
    });

    return null;
  }

  return session;
}