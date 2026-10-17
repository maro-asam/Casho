"use client";

// Merchant banners, theme-agnostic: where a click goes and which image a phone
// gets. Themes own the look; these own the behaviour, so a banner's
// destination, new-tab rule and click count work the same in every theme.

import Image, { getImageProps } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { BannerData } from "../types";

/** Counts a click once per banner per browsing session. Never throws. */
function trackClick(bannerId: string) {
  try {
    const key = `banner-click:${bannerId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Storage blocked — still count.
  }
  try {
    navigator.sendBeacon?.(`/api/banners/${bannerId}/click`);
  } catch {
    // Tracking is best-effort.
  }
}

/** Absolute href for a banner link, or null when the banner isn't clickable. */
export function bannerHref(banner: Pick<BannerData, "link">, storeSlug: string) {
  if (!banner.link) return null;
  return banner.link.external ? banner.link.href : buildStoreUrl(storeSlug, banner.link.href);
}

type BannerLinkProps = {
  banner: Pick<BannerData, "id" | "link">;
  storeSlug: string;
  className?: string;
  children: ReactNode;
  tabIndex?: number;
  "aria-label"?: string;
  /** Runs alongside click tracking (e.g. close a menu). */
  onClick?: () => void;
  /** Element rendered for an image-only banner (link type NONE). */
  as?: "div" | "span";
};

/** The banner's link — or a plain element when the merchant chose "no link". */
export function BannerLink({ banner, storeSlug, className, children, onClick: onClickProp, as: Fallback = "div", ...rest }: BannerLinkProps) {
  const href = bannerHref(banner, storeSlug);
  if (!href || !banner.link) {
    return <Fallback className={className}>{children}</Fallback>;
  }

  const onClick = () => {
    trackClick(banner.id);
    onClickProp?.();
  };
  const target = banner.link.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return banner.link.external ? (
    <a href={href} className={className} onClick={onClick} {...target} {...rest}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className} onClick={onClick} {...target} {...rest}>
      {children}
    </Link>
  );
}

type BannerImageProps = {
  banner: Pick<BannerData, "image" | "mobileImage">;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/** `fill` banner image; swaps to the merchant's phone art below `sm` when set. */
export function BannerImage({ banner, sizes, priority, className }: BannerImageProps) {
  if (!banner.mobileImage) {
    return <Image src={banner.image} alt="" fill sizes={sizes} priority={priority} className={className} />;
  }

  const common = { alt: "", fill: true, priority, className };
  const { props: mobile } = getImageProps({ ...common, src: banner.mobileImage, sizes: "100vw" });
  const { props: desktop } = getImageProps({ ...common, src: banner.image, sizes });

  return (
    <picture>
      <source media="(max-width: 639px)" srcSet={mobile.srcSet} sizes={mobile.sizes} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt="" comes from getImageProps */}
      <img {...desktop} />
    </picture>
  );
}
