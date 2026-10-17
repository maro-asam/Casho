"use server";

import { revalidatePath } from "next/cache";
import { OrderOtpMode } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import { canonicalPhone } from "@/lib/fraud/phone";
import { isOtpConfigured } from "@/lib/fraud/otp";

export type FraudActionResult = { ok: true; message: string } | { ok: false; message: string };

function revalidate() {
  revalidatePath("/dashboard/fraud");
  revalidatePath("/dashboard/orders");
}

const settingsSchema = z.object({
  orderOtpMode: z.enum(OrderOtpMode),
  blockHighRiskOrders: z.boolean(),
});

export async function SaveFraudSettingsAction(storeId: string, input: z.input<typeof settingsSchema>): Promise<FraudActionResult> {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "إعدادات مش صحيحة" };
  if (parsed.data.orderOtpMode !== OrderOtpMode.OFF && !isOtpConfigured()) {
    return { ok: false, message: "تأكيد الطلب بالكود مش متاح حاليًا على كاشو." };
  }

  await prisma.storeSettings.upsert({
    where: { storeId: store.id },
    update: parsed.data,
    create: { storeId: store.id, ...parsed.data },
  });
  revalidate();
  return { ok: true, message: "اتحفظت إعدادات الحماية" };
}

const blockSchema = z.object({
  phone: z
    .string()
    .transform((v) => canonicalPhone(v))
    .pipe(z.string().regex(/^\+?\d{8,15}$/, "رقم الموبايل مش صحيح")),
  reason: z.string().trim().max(200, "السبب طويل").optional().default(""),
});

export async function BlockPhoneAction(storeId: string, input: z.input<typeof blockSchema>): Promise<FraudActionResult> {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const parsed = blockSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "بيانات مش صحيحة" };

  await prisma.blockedPhone.upsert({
    where: { storeId_phone: { storeId: store.id, phone: parsed.data.phone } },
    update: { reason: parsed.data.reason || null },
    create: { storeId: store.id, phone: parsed.data.phone, reason: parsed.data.reason || null, createdByUserId: userId },
  });
  revalidate();
  return { ok: true, message: `اتحظر ${parsed.data.phone} — مش هيقدر يطلب من متجرك تاني` };
}

export async function UnblockPhoneAction(storeId: string, blockedPhoneId: string): Promise<FraudActionResult> {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const { count } = await prisma.blockedPhone.deleteMany({ where: { id: blockedPhoneId, storeId: store.id } });
  if (!count) return { ok: false, message: "الرقم مش في قايمة الحظر" };
  revalidate();
  return { ok: true, message: "اتشال الحظر" };
}
