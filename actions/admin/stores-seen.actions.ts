"use server";

import { cookies } from "next/headers";
import { requireAdmin } from "./admin-guard.actions";
import { STORES_SEEN_COOKIE, parseSeenAt } from "@/lib/admin/new-stores";

/**
 * Mark the stores the admin was just shown as seen. `at` is the page's render time, so a store
 * that signs up between render and this call still counts as new. Setting the cookie re-renders
 * the admin layout, which clears the sidebar badge.
 */
export async function markStoresSeenAction(at: string) {
  await requireAdmin();

  const seenAt = parseSeenAt(at);
  if (!seenAt) return;

  const jar = await cookies();
  const previous = parseSeenAt(jar.get(STORES_SEEN_COOKIE)?.value);
  if (previous && previous >= seenAt) return; // never move the mark backwards (an older tab)

  jar.set(STORES_SEEN_COOKIE, new Date(Math.min(seenAt.getTime(), Date.now())).toISOString(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
