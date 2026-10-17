"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderConfirmationStatus, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MustSession } from "@/actions/auth/auth-helpers.actions";
import { checkOrderOtp, sendOrderOtp } from "@/lib/fraud/otp";
import { announceNewOrder } from "@/lib/store/order-announce";

const MAX_SENDS = 3;
const RESEND_COOLDOWN_MS = 60 * 1000;

export type OrderCodeResult = { ok: true; message: string } | { ok: false; message: string };

/** Only the browser that placed the order can confirm it. */
async function findAwaitingOrder(storeSlug: string, orderId: string) {
  const { guestSessionId } = await MustSession();
  return prisma.order.findFirst({
    where: { id: orderId, guestSessionId, store: { slug: storeSlug } },
    select: { id: true, phone: true, status: true, confirmationStatus: true, otpSentCount: true, otpLastSentAt: true },
  });
}

export async function ConfirmOrderCodeAction(storeSlug: string, orderId: string, code: string): Promise<OrderCodeResult> {
  const order = await findAwaitingOrder(storeSlug, orderId);
  if (!order) return { ok: false, message: "الطلب مش موجود." };
  if (order.confirmationStatus !== OrderConfirmationStatus.PENDING) redirect(`/store/${storeSlug}/order/${order.id}`);
  if (order.status !== OrderStatus.PENDING) {
    return { ok: false, message: "الطلب ده اتلغى لأنه ماتأكدش في الوقت المحدد. اعمل طلب جديد." };
  }

  const clean = code.replace(/\D/g, "");
  if (!(await checkOrderOtp(order.phone, clean))) {
    return { ok: false, message: "الكود غلط أو انتهى. راجع الرسالة أو اطلب كود جديد." };
  }

  // Conditional: a double submit confirms (and announces) once.
  const confirmed = await prisma.order.updateMany({
    where: { id: order.id, confirmationStatus: OrderConfirmationStatus.PENDING, status: OrderStatus.PENDING },
    data: { confirmationStatus: OrderConfirmationStatus.CONFIRMED, confirmedAt: new Date() },
  });
  if (confirmed.count === 1) await announceNewOrder(order.id);

  revalidatePath("/dashboard/orders");
  redirect(`/store/${storeSlug}/order/${order.id}`);
}

export async function ResendOrderCodeAction(storeSlug: string, orderId: string): Promise<OrderCodeResult> {
  const order = await findAwaitingOrder(storeSlug, orderId);
  if (!order || order.confirmationStatus !== OrderConfirmationStatus.PENDING || order.status !== OrderStatus.PENDING) {
    return { ok: false, message: "مفيش طلب مستني تأكيد." };
  }
  if (order.otpSentCount >= MAX_SENDS) {
    return { ok: false, message: "وصلت لأقصى عدد مرات إرسال. تواصل مع المتجر لتأكيد طلبك." };
  }
  const waitMs = order.otpLastSentAt ? RESEND_COOLDOWN_MS - (Date.now() - order.otpLastSentAt.getTime()) : 0;
  if (waitMs > 0) return { ok: false, message: `استنى ${Math.ceil(waitMs / 1000)} ثانية وجرب تاني.` };

  // Count the attempt first (conditional on the count we read), so parallel clicks can't spam.
  const claimed = await prisma.order.updateMany({
    where: { id: order.id, otpSentCount: order.otpSentCount },
    data: { otpSentCount: { increment: 1 }, otpLastSentAt: new Date() },
  });
  if (claimed.count !== 1) return { ok: false, message: "استنى شوية وجرب تاني." };

  const sent = await sendOrderOtp(order.phone);
  return sent.ok
    ? { ok: true, message: sent.channel === "whatsapp" ? "بعتنالك كود جديد على واتساب." : "بعتنالك كود جديد في رسالة SMS." }
    : { ok: false, message: "مقدرناش نبعت الكود دلوقتي. جرّب كمان شوية أو تواصل مع المتجر." };
}
