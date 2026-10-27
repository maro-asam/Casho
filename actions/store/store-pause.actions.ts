"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { pauseInputSchema, type PauseInput } from "@/lib/store/pause";
import { revalidateStorefront } from "@/lib/store/storefront-cache";

type Result = { ok: boolean; message: string };

async function ownStore() {
  const userId = await requireUserId();
  return prisma.store.findFirst({ where: { userId }, select: { id: true, slug: true } });
}

/** Pauses the storefront until `until` (or changes a running pause). */
export async function PauseStoreAction(input: PauseInput): Promise<Result> {
  const parsed = pauseInputSchema().safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "البيانات غير صحيحة" };

  const store = await ownStore();
  if (!store) return { ok: false, message: "غير مصرح لك بتعديل هذا المتجر" };

  const data = {
    pausedUntil: parsed.data.until,
    pauseMessage: parsed.data.message,
    pauseCountdown: parsed.data.showCountdown,
  };
  await prisma.storeSettings.upsert({
    where: { storeId: store.id },
    create: { storeId: store.id, ...data },
    update: data,
  });

  revalidateStorefront(store.slug);
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "المتجر اتوقف مؤقتًا" };
}

/** Opens the storefront now, before the pause runs out. */
export async function ResumeStoreAction(): Promise<Result> {
  const store = await ownStore();
  if (!store) return { ok: false, message: "غير مصرح لك بتعديل هذا المتجر" };

  await prisma.storeSettings.updateMany({ where: { storeId: store.id }, data: { pausedUntil: null } });

  revalidateStorefront(store.slug);
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "المتجر رجع يشتغل" };
}

/**
 * Called by the closed page when its pause runs out. Cached pages don't know
 * the time passed, so the first visitor there clears the pause and expires
 * them. Public on purpose: it only ever clears a pause that's already over,
 * and only once (later calls match no row and purge nothing).
 */
export async function ReopenExpiredPauseAction(storeSlug: string): Promise<{ open: boolean }> {
  if (typeof storeSlug !== "string" || !storeSlug) return { open: false };

  const now = new Date();
  const { count } = await prisma.storeSettings.updateMany({
    where: { store: { slug: storeSlug }, pausedUntil: { lte: now } },
    data: { pausedUntil: null },
  });
  if (count > 0) {
    revalidateStorefront(storeSlug);
    return { open: true };
  }

  const settings = await prisma.storeSettings.findFirst({
    where: { store: { slug: storeSlug } },
    select: { pausedUntil: true },
  });
  return { open: !settings?.pausedUntil || settings.pausedUntil <= now };
}
