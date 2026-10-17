"use server";

import { revalidatePath } from "next/cache";
import { NotificationType, Prisma, SubscriptionStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/actions/admin/admin-guard.actions";

type ActionResult = { success: boolean; message: string };

export type BroadcastAudience = "all" | "active" | "attention" | "store";

const schema = z.object({
  audience: z.enum(["all", "active", "attention", "store"]),
  storeSlug: z.string().trim().optional(),
  title: z.string().trim().min(3, "العنوان قصير").max(120, "العنوان طويل"),
  message: z.string().trim().min(5, "الرسالة قصيرة").max(600, "الرسالة طويلة"),
  // Internal dashboard path only — never an external URL inside a notification.
  href: z
    .string()
    .trim()
    .regex(/^\/[\w\-/]*$/, "الرابط لازم يبدأ بـ / ويكون صفحة جوه اللوحة")
    .optional()
    .or(z.literal("")),
});

function audienceWhere(audience: BroadcastAudience, storeSlug?: string): Prisma.StoreWhereInput {
  switch (audience) {
    case "active":
      return { subscriptionStatus: SubscriptionStatus.ACTIVE };
    case "attention":
      return { subscriptionStatus: { in: [SubscriptionStatus.GRACE_PERIOD, SubscriptionStatus.PAST_DUE, SubscriptionStatus.INACTIVE] } };
    case "store":
      return { slug: storeSlug ?? "" };
    default:
      return {};
  }
}

/** Number of stores a broadcast would reach (shown before sending). */
export async function countBroadcastAudienceAction(audience: BroadcastAudience, storeSlug?: string): Promise<number> {
  await requireAdmin();
  if (audience === "store" && !storeSlug?.trim()) return 0;
  return prisma.store.count({ where: audienceWhere(audience, storeSlug?.trim()) });
}

/** In-app SYSTEM notification to every matching store owner. Picked up by the 30s poll. */
export async function broadcastNotificationAction(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "البيانات ناقصة" };
  const { audience, storeSlug, title, message, href } = parsed.data;
  if (audience === "store" && !storeSlug) return { success: false, message: "اكتب رابط المتجر" };

  try {
    const stores = await prisma.store.findMany({
      where: audienceWhere(audience, storeSlug),
      select: { id: true, userId: true },
    });
    if (stores.length === 0) {
      return { success: false, message: audience === "store" ? "مفيش متجر بالرابط ده" : "مفيش متاجر في الشريحة دي" };
    }

    const data = { broadcast: true, audience, sentBy: admin.id } satisfies Prisma.InputJsonValue;
    // One INSERT → every row shares createdAt, which groups the send in history.
    const { count } = await prisma.notification.createMany({
      data: stores.map((s) => ({
        storeId: s.id,
        userId: s.userId,
        type: NotificationType.SYSTEM,
        title,
        message,
        href: href || null,
        data,
      })),
    });

    revalidatePath("/admin/notifications");
    return { success: true, message: `اتبعت لـ ${count} متجر` };
  } catch (error) {
    console.error("broadcastNotificationAction Error:", error);
    return { success: false, message: "حصل خطأ أثناء الإرسال" };
  }
}
