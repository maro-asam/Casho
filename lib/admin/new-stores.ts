import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/** When this browser's admin last opened /admin/stores (ISO time). Per browser, no schema change. */
export const STORES_SEEN_COOKIE = "casho_admin_stores_seen";

// Before the first visit there is no mark: count the last day's signups.
const FIRST_VISIT_WINDOW = 86_400_000;

export function parseSeenAt(raw: string | undefined): Date | null {
  if (!raw) return null;
  const at = new Date(raw);
  return Number.isNaN(at.getTime()) ? null : at;
}

/** Stores created since the admin last opened the stores page — the sidebar's "new" badge. */
export const countUnseenStores = cache(async () => {
  const seenAt = parseSeenAt((await cookies()).get(STORES_SEEN_COOKIE)?.value) ?? new Date(Date.now() - FIRST_VISIT_WINDOW);
  return prisma.store.count({ where: { createdAt: { gt: seenAt } } });
});
