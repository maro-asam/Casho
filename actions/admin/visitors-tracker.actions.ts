"use server";

import { getCurrentSession } from "@/lib/auth/session";
import { getMetaRequestContext } from "@/lib/meta-request";
import { prisma } from "@/lib/prisma";

type TrackVisitResult = {
  success: boolean;
};

// A repeat hit from the same device inside this window is the same visit.
const VISIT_WINDOW_MS = 30 * 60 * 1000;

// Crawlers and link-preview fetchers that execute JS.
const BOT_PATTERN = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp|telegram/i;

/**
 * Records one storefront visit (a session per device per 30 minutes).
 *
 * The Meta PageView is intentionally NOT sent from here: the browser pixel in
 * the root layout already fires it, and a server event without a shared
 * eventID would be double-counted by Meta.
 */
export async function TrackVisitAction(storeId: string): Promise<TrackVisitResult> {
  try {
    if (!storeId) return { success: false };

    const { ip, userAgent } = await getMetaRequestContext();
    if (userAgent && BOT_PATTERN.test(userAgent)) return { success: false };

    const [store, session] = await Promise.all([
      prisma.store.findUnique({ where: { id: storeId }, select: { userId: true } }),
      getCurrentSession(),
    ]);
    if (!store) return { success: false };

    // The merchant previewing their own store isn't a customer visit.
    if (session?.userId === store.userId) return { success: false };

    const existingVisit = await prisma.visit.findFirst({
      where: {
        storeId,
        ip,
        userAgent,
        createdAt: { gte: new Date(Date.now() - VISIT_WINDOW_MS) },
      },
      select: { id: true },
    });

    if (!existingVisit) {
      await prisma.visit.create({ data: { storeId, ip, userAgent } });
    }

    return { success: true };
  } catch (error) {
    console.error("TrackVisitAction error:", error);
    return { success: false };
  }
}
