"use server";

import { MustOwnStore } from "../auth/auth-helpers.actions";
import { requireUserId } from "../auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type BannerMutationResult =
  | { ok: true }
  | { ok: false; code: "NOT_FOUND" | "INVALID" | "FAILED"; message: string };

type BannerInput = { title: string; image: string; isActive?: boolean };

const TITLE_MAX = 80;

function validate(input: BannerInput): { title: string; image: string } | BannerMutationResult {
  const title = input.title.trim();
  const image = input.image.trim();
  if (!title) return { ok: false, code: "INVALID", message: "اكتب عنوان البانر." };
  if (title.length > TITLE_MAX) return { ok: false, code: "INVALID", message: "العنوان طويل، خليه أقل من ٨٠ حرف." };
  if (!/^https?:\/\/\S+$/i.test(image)) return { ok: false, code: "INVALID", message: "ضيف صورة للبانر." };
  return { title, image };
}

function revalidateBanners(storeSlug: string) {
  revalidatePath("/dashboard/banners");
  revalidatePath(`/store/${storeSlug}`);
}

async function findOwnedBanner(bannerId: string, storeId: string) {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);
  const banner = await prisma.banner.findFirst({ where: { id: bannerId, storeId }, select: { id: true } });
  return { store, banner };
}

export async function CreateBannerAction(storeId: string, input: BannerInput): Promise<BannerMutationResult> {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const data = validate(input);
  if ("ok" in data) return data;

  await prisma.banner.create({
    data: { storeId, ...data, isActive: input.isActive ?? true },
  });

  revalidateBanners(store.slug);
  return { ok: true };
}

export async function UpdateBannerAction(
  bannerId: string,
  storeId: string,
  input: BannerInput,
): Promise<BannerMutationResult> {
  const { store, banner } = await findOwnedBanner(bannerId, storeId);
  if (!banner) return { ok: false, code: "NOT_FOUND", message: "البانر مش موجود." };

  const data = validate(input);
  if ("ok" in data) return data;

  await prisma.banner.update({
    where: { id: bannerId },
    data: { ...data, ...(typeof input.isActive === "boolean" && { isActive: input.isActive }) },
  });

  revalidateBanners(store.slug);
  return { ok: true };
}

/** Quick show/hide from the table. */
export async function SetBannerActiveAction(
  bannerId: string,
  storeId: string,
  isActive: boolean,
): Promise<BannerMutationResult> {
  const { store, banner } = await findOwnedBanner(bannerId, storeId);
  if (!banner) return { ok: false, code: "NOT_FOUND", message: "البانر مش موجود." };

  await prisma.banner.update({ where: { id: bannerId }, data: { isActive } });

  revalidateBanners(store.slug);
  return { ok: true };
}

export async function DeleteBannerAction(bannerId: string, storeId: string): Promise<BannerMutationResult> {
  const { store, banner } = await findOwnedBanner(bannerId, storeId);
  if (!banner) return { ok: false, code: "NOT_FOUND", message: "البانر مش موجود." };

  try {
    await prisma.banner.delete({ where: { id: bannerId } });
  } catch (error) {
    console.error("DeleteBannerAction error:", error);
    return { ok: false, code: "FAILED", message: "مقدرناش نمسح البانر. جرّب تاني." };
  }

  revalidateBanners(store.slug);
  return { ok: true };
}
