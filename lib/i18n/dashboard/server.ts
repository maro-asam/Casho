import { cache } from "react";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";
import { ensureEnglish } from "./load-english";
import { getRscStore, isLocale, type Locale } from "./runtime";

const readUserLocale = cache(async (): Promise<Locale> => {
  // Read-only lookup: session renewal (a cookie write) isn't allowed while rendering.
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return "ar";
  const session = await prisma.session.findUnique({
    where: { tokenHash: createHash("sha256").update(token).digest("hex") },
    select: { expiresAt: true, user: { select: { locale: true } } },
  });
  if (!session || session.expiresAt.getTime() <= Date.now()) return "ar";
  return isLocale(session.user.locale) ? session.user.locale : "ar";
});

/**
 * Resolve the signed-in user's dashboard locale and make it current for the
 * rest of this request's server render. Every merchant layout and page awaits
 * this before rendering text (cached, so it costs one query per request).
 */
export async function loadDashboardLocale(): Promise<Locale> {
  const locale = await readUserLocale();
  if (locale === "en") await ensureEnglish();
  const store = getRscStore();
  if (store) store.locale = locale;
  return locale;
}
