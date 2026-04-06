"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function TrackVisitAction(storeId: string) {
  try {
    const headersList = await headers();

    const forwardedFor = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");

    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || null;
    const userAgent = headersList.get("user-agent") || null;

    await prisma.visit.create({
      data: {
        storeId,
        ip,
        userAgent,
      },
    });
  } catch (error) {
    console.error("TrackVisitAction error:", error);
  }
}