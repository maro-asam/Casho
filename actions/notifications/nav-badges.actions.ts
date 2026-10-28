"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { countNavBadges } from "@/lib/dashboard/nav-badges";
import type { NavBadges } from "@/app/(merchant)/_components/main/dashboard-nav";

/** Refetched by the dashboard shell on navigation and every minute. The store always comes from the session. */
export async function GetNavBadgesAction(): Promise<NavBadges> {
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  return store ? countNavBadges(store.id) : {};
}
