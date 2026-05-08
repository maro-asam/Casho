"use server";

import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { getMetaRequestContext } from "@/lib/meta-request";
import { prisma } from "@/lib/prisma";

type TrackVisitResult = {
  success: boolean;
};

export async function TrackVisitAction(
  storeId: string,
): Promise<TrackVisitResult> {
  try {
    if (!storeId) {
      return { success: false };
    }

    const { ip, userAgent, eventSourceUrl, fbp, fbc } =
      await getMetaRequestContext();

    const existingVisit = await prisma.visit.findFirst({
      where: {
        storeId,
        ip,
        userAgent,
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000),
        },
      },
      select: {
        id: true,
      },
    });

    if (!existingVisit) {
      await prisma.visit.create({
        data: {
          storeId,
          ip,
          userAgent,
        },
      });
    }

    await sendMetaCapiEvent({
      eventName: "PageView",
      eventSourceUrl,
      ip,
      userAgent,
      fbp,
      fbc,
      customData: {
        store_id: storeId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("TrackVisitAction error:", error);

    return { success: false };
  }
}
