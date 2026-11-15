import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { withStudioDraft } from "@/lib/studio/storefront-draft";
import { ensureStoreEnglish } from "./load-english";
import { getStoreRscStore, toStoreLocale, type StoreLocale } from "./runtime";

/** The store's language — the Studio draft's while its owner previews. */
const readStoreLocale = cache(async (slug: string): Promise<StoreLocale> => {
  const row = await prisma.storeSettings.findFirst({
    where: { store: { slug } },
    select: { storeId: true, storeLanguage: true },
  });
  if (!row) return "ar";
  const settings = await withStudioDraft(row.storeId, row);
  return toStoreLocale(settings?.storeLanguage);
});

/**
 * Make a store language current for the rest of this request's server render
 * (loads the English dictionary first when needed).
 */
export async function applyStoreLocale(locale: StoreLocale): Promise<StoreLocale> {
  if (locale === "en") await ensureStoreEnglish();
  const store = getStoreRscStore();
  if (store) store.locale = locale;
  return locale;
}

/**
 * Resolve a store's language and make it current for this request's server
 * render. The store layout, every storefront page and their generateMetadata
 * await this before rendering text (cached: one query per request).
 */
export async function loadStoreLocale(slug: string): Promise<StoreLocale> {
  return applyStoreLocale(await readStoreLocale(slug));
}

/** The language of a store by id — for emails and server actions (no render). */
export async function getStoreLocaleById(storeId: string): Promise<StoreLocale> {
  const row = await prisma.storeSettings.findUnique({ where: { storeId }, select: { storeLanguage: true } });
  const locale = toStoreLocale(row?.storeLanguage);
  if (locale === "en") await ensureStoreEnglish();
  return locale;
}
