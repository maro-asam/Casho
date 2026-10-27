"use server";

import { MustOwnStore } from "../auth/auth-helpers.actions";
import { requireUserId } from "../auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/store/storefront-cache";
import {
  BANNER_CTA_MAX,
  BANNER_SUBTITLE_MAX,
  BANNER_TITLE_MAX,
  cleanBannerLink,
  type BannerLinkInput,
  type CleanBannerLink,
} from "@/lib/banners/banner-link";

export type BannerMutationResult =
  | { ok: true }
  | { ok: false; code: "NOT_FOUND" | "INVALID" | "FAILED"; field?: BannerField; message: string };

export type BannerField = "image" | "mobileImage" | "title" | "subtitle" | "ctaLabel" | "link" | "schedule";

export type BannerInput = {
  title: string;
  subtitle?: string | null;
  ctaLabel?: string | null;
  image: string;
  mobileImage?: string | null;
  isActive?: boolean;
  link: BannerLinkInput;
  /** ISO strings; null clears. */
  startsAt?: string | null;
  endsAt?: string | null;
};

type CleanBanner = {
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  image: string;
  mobileImage: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
} & CleanBannerLink;

const invalid = (field: BannerField, message: string): BannerMutationResult => ({ ok: false, code: "INVALID", field, message });
const isImageUrl = (v: string) => /^https?:\/\/\S+$/i.test(v);

function parseDate(value: string | null | undefined): Date | null | "invalid" {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "invalid" : date;
}

async function validate(storeId: string, input: BannerInput): Promise<CleanBanner | BannerMutationResult> {
  const title = input.title.trim();
  const subtitle = input.subtitle?.trim() || null;
  const ctaLabel = input.ctaLabel?.trim() || null;
  const image = input.image.trim();
  const mobileImage = input.mobileImage?.trim() || null;

  if (!isImageUrl(image)) return invalid("image", "ضيف صورة للبانر.");
  if (mobileImage && !isImageUrl(mobileImage)) return invalid("mobileImage", "صورة الموبايل مش صحيحة.");
  if (!title) return invalid("title", "اكتب عنوان البانر.");
  if (title.length > BANNER_TITLE_MAX) return invalid("title", "العنوان طويل، خليه أقل من ٨٠ حرف.");
  if (subtitle && subtitle.length > BANNER_SUBTITLE_MAX) return invalid("subtitle", "الوصف طويل زيادة.");
  if (ctaLabel && ctaLabel.length > BANNER_CTA_MAX) return invalid("ctaLabel", "نص الزرار طويل، خليه كلمتين تلاتة.");

  const startsAt = parseDate(input.startsAt);
  const endsAt = parseDate(input.endsAt);
  if (startsAt === "invalid" || endsAt === "invalid") return invalid("schedule", "التاريخ مش صحيح.");
  if (startsAt && endsAt && endsAt <= startsAt) return invalid("schedule", "تاريخ النهاية لازم يكون بعد البداية.");

  const link = cleanBannerLink(input.link);
  if ("error" in link) return invalid("link", link.error);

  // The picked target must belong to this store.
  if (link.linkCategoryId) {
    const found = await prisma.category.count({ where: { id: link.linkCategoryId, storeId } });
    if (!found) return invalid("link", "القسم ده مش موجود في متجرك.");
  }
  if (link.linkProductId) {
    const found = await prisma.product.count({ where: { id: link.linkProductId, storeId } });
    if (!found) return invalid("link", "المنتج ده مش موجود في متجرك.");
  }

  return { title, subtitle, ctaLabel, image, mobileImage, startsAt, endsAt, ...link };
}

function revalidateBanners(storeSlug: string) {
  revalidatePath("/dashboard/banners");
  revalidateStorefront(storeSlug);
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

  const data = await validate(storeId, input);
  if ("ok" in data) return data;

  // New banners lead the slider, like before positions existed.
  const { _min } = await prisma.banner.aggregate({ where: { storeId }, _min: { position: true } });

  await prisma.banner.create({
    data: { storeId, ...data, isActive: input.isActive ?? true, position: (_min.position ?? 1) - 1 },
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

  const data = await validate(storeId, input);
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

/** Moves a banner one slot earlier/later in the slider. Renumbers the store's
 *  banners 0..n-1 first, so legacy ties (all 0) can't make the swap a no-op. */
export async function MoveBannerAction(
  bannerId: string,
  storeId: string,
  direction: "up" | "down",
): Promise<BannerMutationResult> {
  const { store, banner } = await findOwnedBanner(bannerId, storeId);
  if (!banner) return { ok: false, code: "NOT_FOUND", message: "البانر مش موجود." };

  const ordered = await prisma.banner.findMany({
    where: { storeId },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }, { id: "asc" }],
    select: { id: true },
  });
  const ids = ordered.map((b) => b.id);
  const from = ids.indexOf(bannerId);
  const to = direction === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= ids.length) return { ok: true };
  [ids[from], ids[to]] = [ids[to], ids[from]];

  await prisma.$transaction(ids.map((id, position) => prisma.banner.update({ where: { id }, data: { position } })));

  revalidateBanners(store.slug);
  return { ok: true };
}

/** Copies a banner as a hidden draft right after the original. */
export async function DuplicateBannerAction(bannerId: string, storeId: string): Promise<BannerMutationResult> {
  const userId = await requireUserId();
  const store = await MustOwnStore(storeId, userId);

  const source = await prisma.banner.findFirst({ where: { id: bannerId, storeId } });
  if (!source) return { ok: false, code: "NOT_FOUND", message: "البانر مش موجود." };

  const title = `${source.title} (نسخة)`.slice(0, BANNER_TITLE_MAX);
  const copy = {
    subtitle: source.subtitle,
    ctaLabel: source.ctaLabel,
    image: source.image,
    mobileImage: source.mobileImage,
    linkType: source.linkType,
    linkCategoryId: source.linkCategoryId,
    linkProductId: source.linkProductId,
    linkValue: source.linkValue,
    openInNewTab: source.openInNewTab,
    startsAt: source.startsAt,
    endsAt: source.endsAt,
  };

  await prisma.$transaction([
    prisma.banner.updateMany({ where: { storeId, position: { gt: source.position } }, data: { position: { increment: 1 } } }),
    prisma.banner.create({ data: { ...copy, storeId, title, isActive: false, position: source.position + 1 } }),
  ]);

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

export type BannerProductOption = { id: string; name: string; slug: string; image: string; isActive: boolean };

/** Product picker for the "link to a product" destination. */
export async function SearchBannerProductsAction(storeId: string, query: string): Promise<BannerProductOption[]> {
  const userId = await requireUserId();
  await MustOwnStore(storeId, userId);

  const q = query.trim().slice(0, 80);
  return prisma.product.findMany({
    where: {
      storeId,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    take: 8,
    select: { id: true, name: true, slug: true, image: true, isActive: true },
  });
}
