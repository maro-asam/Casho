import { prisma } from "@/lib/prisma";
import { cachedQuery } from "./shared";

/** When the first visit was recorded (ISO), or null before any. */
export const getTrackingStart = cachedQuery(
  "tracking-start",
  async (): Promise<string | null> => {
    const row = await prisma.analyticsSession.findFirst({ orderBy: { startedAt: "asc" }, select: { startedAt: true } });
    return row?.startedAt.toISOString() ?? null;
  },
  300,
);
