import type { Metadata } from "next";

/**
 * Per-page metadata for store pages. Paths are relative — the store layout sets
 * `metadataBase` to the store's real address (custom domain or subdomain).
 */
export function storePageMetadata({
  title,
  description,
  path,
  image,
  storeName,
  type = "website",
  noindex,
}: {
  title?: string;
  description?: string;
  path: string;
  image?: string | null;
  storeName?: string;
  type?: "website" | "article";
  noindex?: boolean;
}): Metadata {
  if (noindex) return { title, robots: { index: false, follow: true } };
  return {
    ...(title && { title }),
    ...(description && { description }),
    alternates: { canonical: path },
    openGraph: {
      ...(title && { title: storeName ? `${title} | ${storeName}` : title }),
      ...(description && { description }),
      url: path,
      type,
      locale: "ar_EG",
      ...(storeName && { siteName: storeName }),
      ...(image && { images: [{ url: image, alt: title ?? storeName ?? "" }] }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      ...(title && { title }),
      ...(description && { description }),
      ...(image && { images: [image] }),
    },
  };
}
