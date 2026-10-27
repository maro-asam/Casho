// Cache invalidation for one store's public pages.
//
// The ISR-cached storefront pages (home, product, category) are tagged only
// with their route pattern (`/store/[slug]/layout`) and their exact URL, so
// revalidatePath(`/store/${slug}`, "layout") matches nothing and a store's
// subdomain kept serving the old page after an edit. (The owner on
// app.casho.store/store/<slug> saw the change because Studio draft mode skips
// the cache.) The store layout tags every page it renders with the store's slug
// instead, and changes expire that tag.

import { revalidateTag, unstable_cache } from "next/cache";

const storefrontTag = (slug: string) => `storefront:${slug}`;

/** Called by the store layout: tags the page being rendered with its store. */
export function tagStorefrontPage(slug: string) {
  return unstable_cache(async () => true, ["storefront-tag", slug], { tags: [storefrontTag(slug)] })();
}

/** Expires every cached page of one store, on its subdomain and custom domain alike. */
export function revalidateStorefront(slug: string) {
  revalidateTag(storefrontTag(slug), { expire: 0 });
}
