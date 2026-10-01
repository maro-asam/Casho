"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { MustSession } from "@/actions/auth/auth-helpers.actions";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { hasFeature, FEATURE_KEYS } from "@/lib/entitlements";
import { newRecoveryToken } from "@/lib/cart-recovery/abandoned";
import { normalizeEgyptPhone } from "@/lib/popups/popup-config";

// ─── Storefront ───────────────────────────────────────────────────────────────

/**
 * Saves what the customer typed at checkout as they go, so an unfinished
 * checkout can still be followed up. Only kept when the cart has items.
 */
export async function SaveCheckoutContactAction(storeSlug: string, input: { fullName?: string; phone?: string; address?: string }) {
  try {
    const { guestSessionId } = await MustSession();
    const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } });
    if (!store) return;
    const hasItems = await prisma.cartItem.count({ where: { storeId: store.id, guestSessionId } });
    if (!hasItems) return;

    const phone = normalizeEgyptPhone(String(input.phone ?? ""));
    const fullName = String(input.fullName ?? "").trim().slice(0, 80) || undefined;
    const address = String(input.address ?? "").trim().slice(0, 500) || undefined;
    if (!phone && !fullName) return;

    await prisma.cartRecovery.upsert({
      where: { storeId_guestSessionId: { storeId: store.id, guestSessionId } },
      create: { storeId: store.id, guestSessionId, token: newRecoveryToken(), phone, fullName, address },
      update: { ...(phone && { phone }), ...(fullName && { fullName }), ...(address && { address }), dismissedAt: null },
    });
  } catch (error) {
    console.error("SaveCheckoutContactAction:", error);
  }
}

/** "Restore my cart" link: copies the abandoned cart into this browser's session. */
export async function RestoreCartAction(storeSlug: string, token: string): Promise<{ ok: boolean; message: string }> {
  if (typeof token !== "string" || token.length > 64) return { ok: false, message: "اللينك مش صحيح." };
  const { guestSessionId } = await MustSession();
  const store = await prisma.store.findUnique({ where: { slug: storeSlug }, select: { id: true } });
  if (!store) return { ok: false, message: "المتجر مش موجود." };

  const rec = await prisma.cartRecovery.findFirst({ where: { token, storeId: store.id } });
  if (!rec) return { ok: false, message: "اللينك ده مبقاش شغّال." };
  if (rec.convertedAt) return { ok: false, message: "الطلب ده اتعمل خلاص — شكرًا ليك!" };
  if (rec.guestSessionId === guestSessionId) return { ok: true, message: "سلتك جاهزة" };

  const source = await prisma.cartItem.findMany({
    where: { storeId: store.id, guestSessionId: rec.guestSessionId },
    select: { productId: true, quantity: true, selectedFeatures: true },
  });
  if (!source.length) return { ok: false, message: "السلة دي فاضية." };

  const existing = await prisma.cartItem.findMany({
    where: { storeId: store.id, guestSessionId },
    select: { productId: true },
  });
  const have = new Set(existing.map((e) => e.productId));

  await prisma.$transaction([
    ...source
      .filter((s) => !have.has(s.productId))
      .map((s) =>
        prisma.cartItem.create({
          data: {
            storeId: store.id,
            guestSessionId,
            productId: s.productId,
            quantity: s.quantity,
            selectedFeatures: s.selectedFeatures ?? undefined,
          },
        }),
      ),
    prisma.cartRecovery.update({ where: { id: rec.id }, data: { restoredSessionId: guestSessionId } }),
  ]);

  revalidatePath(`/store/${storeSlug}/cart`);
  return { ok: true, message: "رجّعنالك المنتجات اللي كنت اخترتها 👌" };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

async function ownStore() {
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store || !(await hasFeature(store.id, FEATURE_KEYS.ABANDONED_CART))) return null;
  return store;
}

/** Gets (or creates) the public restore token for a cart. */
export async function GetRecoveryLinkTokenAction(guestSessionId: string): Promise<{ ok: true; token: string } | { ok: false; message: string }> {
  const store = await ownStore();
  if (!store) return { ok: false, message: "مش متاح." };
  const hasCart = await prisma.cartItem.count({ where: { storeId: store.id, guestSessionId } });
  if (!hasCart) return { ok: false, message: "السلة دي فضيت أو اتحولت لطلب." };

  const rec = await prisma.cartRecovery.upsert({
    where: { storeId_guestSessionId: { storeId: store.id, guestSessionId } },
    create: { storeId: store.id, guestSessionId, token: newRecoveryToken() },
    update: {},
    select: { token: true },
  });
  return { ok: true, token: rec.token };
}

export async function MarkCartContactedAction(guestSessionId: string) {
  const store = await ownStore();
  if (!store) return { ok: false as const };
  await prisma.cartRecovery.upsert({
    where: { storeId_guestSessionId: { storeId: store.id, guestSessionId } },
    create: { storeId: store.id, guestSessionId, token: newRecoveryToken(), contactedAt: new Date(), contactCount: 1 },
    update: { contactedAt: new Date(), contactCount: { increment: 1 } },
  });
  revalidatePath("/dashboard/abandoned-carts");
  return { ok: true as const };
}

/** Hide a cart from the list (until the customer touches it again). */
export async function DismissCartAction(guestSessionId: string) {
  const store = await ownStore();
  if (!store) return { ok: false as const };
  await prisma.cartRecovery.upsert({
    where: { storeId_guestSessionId: { storeId: store.id, guestSessionId } },
    create: { storeId: store.id, guestSessionId, token: newRecoveryToken(), dismissedAt: new Date() },
    update: { dismissedAt: new Date() },
  });
  revalidatePath("/dashboard/abandoned-carts");
  return { ok: true as const };
}
