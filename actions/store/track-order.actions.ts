"use server";

import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { orderPhoneSchema } from "@/lib/store/order-input";
import { parseOrderCode, type TrackedOrder } from "@/lib/orders/tracking";
import {
  TRACK_RATE_LIMIT_MESSAGE,
  findTrackedOrder,
  isTrackRateLimited,
  recordTrackFailure,
} from "@/lib/orders/track-order";

export type TrackOrderResult =
  | { ok: true; order: TrackedOrder }
  | { ok: false; message: string; field?: "code" | "phone" };

/** Storefront /track: an order number plus the phone it was placed with — no login. */
export async function TrackOrderAction(storeSlug: string, rawCode: string, rawPhone: string): Promise<TrackOrderResult> {
  const code = parseOrderCode(String(rawCode ?? ""));
  if (!code) return { ok: false, field: "code", message: "رقم الطلب 6 حروف وأرقام زي A1B2C3 — تلاقيه في رسالة أو إيميل الطلب." };

  const phone = orderPhoneSchema.safeParse(String(rawPhone ?? ""));
  if (!phone.success) return { ok: false, field: "phone", message: "اكتب رقم الموبايل اللي طلبت بيه." };

  const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } });
  if (!store) return { ok: false, message: "المتجر مش موجود." };

  const h = await headers();
  const ipAddress = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || null;

  if (await isTrackRateLimited({ storeId: store.id, phone: phone.data, ipAddress })) {
    return { ok: false, message: TRACK_RATE_LIMIT_MESSAGE };
  }

  const order = await findTrackedOrder({ storeId: store.id, code, phone: phone.data });
  if (!order) {
    await recordTrackFailure({ storeId: store.id, phone: phone.data, ipAddress, userAgent: h.get("user-agent") });
    // One message for both mismatches, so a wrong guess doesn't confirm which half was right.
    return { ok: false, message: "مالقيناش طلب بالرقم ده والموبايل ده. راجع رقم الطلب واكتب نفس الموبايل اللي طلبت بيه." };
  }

  return { ok: true, order };
}
