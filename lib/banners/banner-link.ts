// Banner destinations: what the merchant picks in the dashboard → the URL the
// storefront renders. Pure (no DB), shared by the actions, the dashboard and
// every storefront theme so a destination means the same thing everywhere.

import type { BannerLinkType } from "@prisma/client";

import { toWhatsAppDigits } from "@/lib/conversion/conversion-config";

export const BANNER_TITLE_MAX = 80;
export const BANNER_SUBTITLE_MAX = 160;
export const BANNER_CTA_MAX = 24;
export const BANNER_VALUE_MAX = 500;
export const BANNER_DEFAULT_CTA = "تسوق الآن";

/** Store pages a banner can open (PAGE link type). */
export const BANNER_PAGES = {
  categories: { label: "كل الأقسام", path: "/categories" },
  about: { label: "من نحن", path: "/about" },
  contact: { label: "تواصل معنا", path: "/contact" },
  cart: { label: "سلة المشتريات", path: "/cart" },
} as const;
export type BannerPageKey = keyof typeof BANNER_PAGES;
export const isBannerPageKey = (v: string | null | undefined): v is BannerPageKey => !!v && v in BANNER_PAGES;

/** Dashboard copy for each destination, in picker order. */
export const BANNER_LINK_TYPES: Record<BannerLinkType, { label: string; hint: string }> = {
  PRODUCTS: { label: "كل المنتجات", hint: "صفحة المنتجات كلها" },
  CATEGORY: { label: "قسم", hint: "قسم معين من متجرك" },
  PRODUCT: { label: "منتج", hint: "صفحة منتج واحد" },
  FEATURED: { label: "المنتجات المميزة", hint: "المنتجات اللي معلّم عليها مميز" },
  SEARCH: { label: "نتايج بحث", hint: "كل المنتجات اللي فيها كلمة معينة" },
  PAGE: { label: "صفحة في المتجر", hint: "الأقسام، من نحن، التواصل…" },
  WHATSAPP: { label: "واتساب", hint: "محادثة مع رقم متجرك برسالة جاهزة" },
  URL: { label: "رابط مخصص", hint: "أي رابط، جوه متجرك أو براه" },
  NONE: { label: "بدون رابط", hint: "صورة بس، مش بتتداس" },
};

/** What the storefront needs to render a banner's link. */
export type BannerLink = {
  /** Store-relative path ("/products/x") or absolute URL when `external`. */
  href: string;
  external: boolean;
  newTab: boolean;
};

/** A banner row with its link targets loaded (see BANNER_LINK_SELECT). */
export type BannerLinkSource = {
  linkType: BannerLinkType;
  linkValue: string | null;
  openInNewTab: boolean;
  linkCategory: { slug: string } | null;
  linkProduct: { slug: string; isActive: boolean } | null;
};

/** Prisma `select` fragment that loads everything `resolveBannerLink` reads. */
export const BANNER_LINK_SELECT = {
  linkType: true,
  linkValue: true,
  openInNewTab: true,
  linkCategory: { select: { slug: true } },
  linkProduct: { select: { slug: true, isActive: true } },
} as const;

const ALL_PRODUCTS: BannerLink = { href: "/products", external: false, newTab: false };
const internal = (href: string): BannerLink => ({ href, external: false, newTab: false });

/**
 * Banner → link. A target that disappeared (deleted category/product, hidden
 * product, store without WhatsApp) degrades to "all products" instead of a 404,
 * so an old banner never strands a shopper.
 */
export function resolveBannerLink(banner: BannerLinkSource, ctx: { whatsapp?: string | null } = {}): BannerLink | null {
  const value = banner.linkValue?.trim() ?? "";

  switch (banner.linkType) {
    case "NONE":
      return null;
    case "PRODUCTS":
      return ALL_PRODUCTS;
    case "FEATURED":
      return internal("/products?featured=true");
    case "CATEGORY":
      return banner.linkCategory ? internal(`/categories/${encodeURIComponent(banner.linkCategory.slug)}`) : ALL_PRODUCTS;
    case "PRODUCT":
      return banner.linkProduct?.isActive ? internal(`/products/${encodeURIComponent(banner.linkProduct.slug)}`) : ALL_PRODUCTS;
    case "SEARCH":
      return value ? internal(`/products?search=${encodeURIComponent(value)}`) : ALL_PRODUCTS;
    case "PAGE":
      return isBannerPageKey(value) ? internal(BANNER_PAGES[value].path) : ALL_PRODUCTS;
    case "WHATSAPP": {
      const digits = ctx.whatsapp ? toWhatsAppDigits(ctx.whatsapp) : "";
      if (!digits) return ALL_PRODUCTS;
      const text = value ? `?text=${encodeURIComponent(value)}` : "";
      return { href: `https://wa.me/${digits}${text}`, external: true, newTab: true };
    }
    case "URL": {
      if (value.startsWith("/") && !value.startsWith("//")) return { href: value, external: false, newTab: banner.openInNewTab };
      if (/^https?:\/\/\S+$/i.test(value)) return { href: value, external: true, newTab: banner.openInNewTab };
      return ALL_PRODUCTS;
    }
  }
}

// ── Input validation (dashboard → action) ──────────────────────────────────

export type BannerLinkInput = {
  linkType: BannerLinkType;
  linkCategoryId?: string | null;
  linkProductId?: string | null;
  linkValue?: string | null;
  openInNewTab?: boolean;
};

export type CleanBannerLink = {
  linkType: BannerLinkType;
  linkCategoryId: string | null;
  linkProductId: string | null;
  linkValue: string | null;
  openInNewTab: boolean;
};

/** Normalises a destination, keeping only the field its type uses. Returns an
 *  Arabic error message when the destination is incomplete. Ownership of the
 *  category/product is checked by the action, not here. */
export function cleanBannerLink(input: BannerLinkInput): CleanBannerLink | { error: string } {
  const type = input.linkType;
  if (!(type in BANNER_LINK_TYPES)) return { error: "اختار البانر يودّي على فين." };

  const value = input.linkValue?.trim() ?? "";
  if (value.length > BANNER_VALUE_MAX) return { error: "الرابط أو النص طويل زيادة." };

  const base: CleanBannerLink = { linkType: type, linkCategoryId: null, linkProductId: null, linkValue: null, openInNewTab: false };

  switch (type) {
    case "CATEGORY":
      return input.linkCategoryId ? { ...base, linkCategoryId: input.linkCategoryId } : { error: "اختار القسم اللي البانر هيودّي عليه." };
    case "PRODUCT":
      return input.linkProductId ? { ...base, linkProductId: input.linkProductId } : { error: "اختار المنتج اللي البانر هيودّي عليه." };
    case "SEARCH":
      return value ? { ...base, linkValue: value } : { error: "اكتب كلمة البحث." };
    case "PAGE":
      return isBannerPageKey(value) ? { ...base, linkValue: value } : { error: "اختار الصفحة." };
    case "WHATSAPP":
      return { ...base, linkValue: value || null };
    case "URL": {
      const ok = /^https?:\/\/[^\s/]+\.[^\s]+$/i.test(value) || (value.startsWith("/") && !value.startsWith("//") && !/\s/.test(value));
      if (!ok) return { error: "اكتب رابط صحيح يبدأ بـ https:// أو مسار في متجرك يبدأ بـ /" };
      return { ...base, linkValue: value, openInNewTab: Boolean(input.openInNewTab) };
    }
    default:
      return base;
  }
}

// ── Schedule ────────────────────────────────────────────────────────────────

export type BannerStatus = "live" | "scheduled" | "expired" | "hidden";

export function bannerStatus(
  banner: { isActive: boolean; startsAt: Date | null; endsAt: Date | null },
  now: Date = new Date(),
): BannerStatus {
  if (!banner.isActive) return "hidden";
  if (banner.endsAt && banner.endsAt <= now) return "expired";
  if (banner.startsAt && banner.startsAt > now) return "scheduled";
  return "live";
}

/** Prisma `where` for banners a shopper should see right now. */
export function liveBannerWhere(now: Date = new Date()) {
  return {
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    ],
  };
}
