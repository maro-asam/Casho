"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { MustOwnStore } from "@/actions/auth/auth-helpers.actions";
import { createNotification } from "@/lib/notifications/in-app";
import { ReadSession } from "@/actions/auth/auth-helpers.actions";
import { newRecoveryToken } from "@/lib/cart-recovery/abandoned";
import {
  isPopupType,
  normalizeEgyptPhone,
  popupConfigSchema,
  readPopupConfig,
  type PopupConfig,
  type PopupType,
} from "@/lib/popups/popup-config";

export type PopupMutationResult =
  | { ok: true; id?: string }
  | { ok: false; code: "NOT_FOUND" | "INVALID" | "FAILED"; message: string };

export type PopupInput = {
  name: string;
  type: PopupType;
  config: PopupConfig;
  startsAt?: string | null;
  endsAt?: string | null;
};

const MAX_POPUPS = 20;

function revalidatePopups(storeSlug: string) {
  revalidatePath("/dashboard/customization");
  revalidatePath(`/store/${storeSlug}`, "layout");
}

async function ownedStore(storeId: string) {
  const userId = await requireUserId();
  return MustOwnStore(storeId, userId);
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function validateInput(storeId: string, input: PopupInput) {
  const name = input.name.trim();
  if (!name) return { error: "اكتب اسم للنافذة عشان تفرّق بينها وبين غيرها." } as const;
  if (name.length > 60) return { error: "الاسم طويل، خليه أقل من ٦٠ حرف." } as const;
  if (!isPopupType(input.type)) return { error: "نوع النافذة مش معروف." } as const;

  const parsed = popupConfigSchema.safeParse(input.config);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "في بيانات ناقصة." } as const;
  const config = parsed.data;

  if (input.type === "discount") {
    if (!config.content.couponCode) return { error: "اختار كود الخصم اللي هيظهر للعميل." } as const;
    const coupon = await prisma.coupon.findFirst({
      where: { storeId, code: config.content.couponCode },
      select: { id: true },
    });
    if (!coupon) return { error: "كود الخصم ده مش موجود في متجرك." } as const;
  }
  if (input.type === "lead") config.gate.requirePhone = true;
  if (input.type !== "discount") config.content.couponCode = "";

  const startsAt = parseDate(input.startsAt);
  const endsAt = parseDate(input.endsAt);
  if (startsAt === undefined || endsAt === undefined) return { error: "التاريخ مش صحيح." } as const;
  if (startsAt && endsAt && endsAt <= startsAt) return { error: "تاريخ النهاية لازم يكون بعد البداية." } as const;

  return { data: { name, type: input.type, config, startsAt, endsAt } } as const;
}

export async function CreatePopupAction(storeId: string, input: PopupInput): Promise<PopupMutationResult> {
  const store = await ownedStore(storeId);

  const count = await prisma.storePopup.count({ where: { storeId } });
  if (count >= MAX_POPUPS) return { ok: false, code: "INVALID", message: `الحد الأقصى ${MAX_POPUPS} نافذة. امسح القديم الأول.` };

  const result = await validateInput(storeId, input);
  if ("error" in result) return { ok: false, code: "INVALID", message: result.error! };

  const popup = await prisma.storePopup.create({
    data: { storeId, ...result.data, isActive: false },
    select: { id: true },
  });

  revalidatePopups(store.slug);
  return { ok: true, id: popup.id };
}

export async function UpdatePopupAction(popupId: string, storeId: string, input: PopupInput): Promise<PopupMutationResult> {
  const store = await ownedStore(storeId);
  const existing = await prisma.storePopup.findFirst({ where: { id: popupId, storeId }, select: { id: true } });
  if (!existing) return { ok: false, code: "NOT_FOUND", message: "النافذة مش موجودة." };

  const result = await validateInput(storeId, input);
  if ("error" in result) return { ok: false, code: "INVALID", message: result.error! };

  await prisma.storePopup.update({ where: { id: popupId }, data: result.data });

  revalidatePopups(store.slug);
  return { ok: true, id: popupId };
}

export async function SetPopupActiveAction(popupId: string, storeId: string, isActive: boolean): Promise<PopupMutationResult> {
  const store = await ownedStore(storeId);
  const existing = await prisma.storePopup.findFirst({ where: { id: popupId, storeId }, select: { id: true } });
  if (!existing) return { ok: false, code: "NOT_FOUND", message: "النافذة مش موجودة." };

  await prisma.storePopup.update({ where: { id: popupId }, data: { isActive } });

  revalidatePopups(store.slug);
  return { ok: true };
}

export async function DuplicatePopupAction(popupId: string, storeId: string): Promise<PopupMutationResult> {
  const store = await ownedStore(storeId);
  const popup = await prisma.storePopup.findFirst({ where: { id: popupId, storeId } });
  if (!popup) return { ok: false, code: "NOT_FOUND", message: "النافذة مش موجودة." };

  const count = await prisma.storePopup.count({ where: { storeId } });
  if (count >= MAX_POPUPS) return { ok: false, code: "INVALID", message: `الحد الأقصى ${MAX_POPUPS} نافذة.` };

  const copy = await prisma.storePopup.create({
    data: {
      storeId,
      name: `${popup.name} (نسخة)`.slice(0, 60),
      type: popup.type,
      config: popup.config ?? {},
      priority: popup.priority,
      startsAt: popup.startsAt,
      endsAt: popup.endsAt,
      isActive: false,
    },
    select: { id: true },
  });

  revalidatePopups(store.slug);
  return { ok: true, id: copy.id };
}

export async function DeletePopupAction(popupId: string, storeId: string): Promise<PopupMutationResult> {
  const store = await ownedStore(storeId);
  const existing = await prisma.storePopup.findFirst({ where: { id: popupId, storeId }, select: { id: true } });
  if (!existing) return { ok: false, code: "NOT_FOUND", message: "النافذة مش موجودة." };

  await prisma.storePopup.delete({ where: { id: popupId } });

  revalidatePopups(store.slug);
  return { ok: true };
}

/** Drag-to-reorder: first id = highest priority (shown first when several qualify). */
export async function ReorderPopupsAction(storeId: string, orderedIds: string[]): Promise<PopupMutationResult> {
  const store = await ownedStore(storeId);
  const owned = await prisma.storePopup.findMany({ where: { storeId, id: { in: orderedIds } }, select: { id: true } });
  if (owned.length !== orderedIds.length) return { ok: false, code: "INVALID", message: "ترتيب غير صالح." };

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.storePopup.update({ where: { id }, data: { priority: orderedIds.length - index } }),
    ),
  );

  revalidatePopups(store.slug);
  return { ok: true };
}

// ─── Public (storefront) ──────────────────────────────────────────────────────

async function findLivePopup(popupId: string) {
  if (typeof popupId !== "string" || popupId.length > 64) return null;
  const now = new Date();
  return prisma.storePopup.findFirst({
    where: {
      id: popupId,
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    },
    select: { id: true, storeId: true, name: true, type: true, config: true, store: { select: { slug: true } } },
  });
}

/** Counters for the dashboard. The client sends each event at most once per page view. */
export async function TrackPopupEventAction(popupId: string, event: "view" | "click") {
  const popup = await findLivePopup(popupId);
  if (!popup) return;
  await prisma.storePopup.update({
    where: { id: popup.id },
    data: event === "view" ? { views: { increment: 1 } } : { clicks: { increment: 1 } },
  });
}

/** Non-gated conversion (e.g. copied the code, followed the announcement link). */
export async function TrackPopupConversionAction(popupId: string) {
  const popup = await findLivePopup(popupId);
  if (!popup || readPopupConfig(popup.config).gate.requirePhone) return;
  await prisma.storePopup.update({ where: { id: popup.id }, data: { conversions: { increment: 1 } } });
}

export type LeadResult = { ok: true; couponCode: string | null } | { ok: false; message: string };

/** Phone capture from a popup → saved as a store customer, reveals the coupon. */
export async function SubmitPopupLeadAction(popupId: string, input: { phone: string; name?: string }): Promise<LeadResult> {
  const popup = await findLivePopup(popupId);
  if (!popup) return { ok: false, message: "العرض ده خلص." };

  const phone = normalizeEgyptPhone(String(input.phone ?? ""));
  if (!phone) return { ok: false, message: "اكتب رقم موبايل مصري صحيح (11 رقم)." };
  const name = String(input.name ?? "").trim().slice(0, 60) || null;
  const config = readPopupConfig(popup.config);

  try {
    const existing = await prisma.customer.findUnique({
      where: { storeId_phone: { storeId: popup.storeId, phone } },
      select: { id: true, name: true },
    });

    if (!existing) {
      await prisma.customer.create({
        data: { storeId: popup.storeId, phone, name, notes: `اشترك من نافذة "${popup.name}"` },
      });
      await createNotification({
        storeId: popup.storeId,
        type: "SYSTEM",
        title: "عميل جديد من النافذة المنبثقة",
        message: `${name ?? phone} سجّل من "${popup.name}"`,
        href: "/crm",
      });
    } else if (!existing.name && name) {
      await prisma.customer.update({ where: { id: existing.id }, data: { name } });
    }

    await prisma.storePopup.update({ where: { id: popup.id }, data: { conversions: { increment: 1 } } });

    // If this visitor leaves a cart later, the merchant can still reach them.
    const { guestSessionId } = await ReadSession();
    if (guestSessionId) {
      await prisma.cartRecovery.upsert({
        where: { storeId_guestSessionId: { storeId: popup.storeId, guestSessionId } },
        create: { storeId: popup.storeId, guestSessionId, token: newRecoveryToken(), phone, fullName: name },
        update: { phone, ...(name && { fullName: name }) },
      });
    }
  } catch (error) {
    console.error("SubmitPopupLeadAction error:", error);
    return { ok: false, message: "حصلت مشكلة، جرّب تاني." };
  }

  return { ok: true, couponCode: popup.type === "discount" ? config.content.couponCode || null : null };
}
