import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { withStudioDraft } from "@/lib/studio/storefront-draft";
import { ensureStoreEnglish } from "./load-english";
import { getStoreRscStore, toStoreLocale, type StoreLocale } from "./runtime";
import { toStoreCurrency, type StoreCurrency } from "@/lib/store/currency";

/** The store's language (the Studio draft's while its owner previews) and price currency. */
const readStoreI18n = cache(async (slug: string): Promise<{ locale: StoreLocale; currency: StoreCurrency }> => {
  const row = await prisma.storeSettings.findFirst({
    where: { store: { slug } },
    select: { storeId: true, storeLanguage: true, storeCurrency: true },
  });
  if (!row) return { locale: "ar", currency: toStoreCurrency(null) };
  const settings = await withStudioDraft(row.storeId, row);
  return { locale: toStoreLocale(settings?.storeLanguage), currency: toStoreCurrency(row.storeCurrency) };
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

/** Make a store's price currency current for the rest of this request's server render. */
export function applyStoreCurrency(currency: StoreCurrency): StoreCurrency {
  const store = getStoreRscStore();
  if (store) store.currency = currency;
  return currency;
}

/**
 * Resolve a store's language (and price currency) and make them current for
 * this request's server render. The store layout, every storefront page and
 * their generateMetadata await this before rendering text (cached: one query
 * per request).
 */
export async function loadStoreLocale(slug: string): Promise<StoreLocale> {
  const { locale, currency } = await readStoreI18n(slug);
  applyStoreCurrency(currency);
  return applyStoreLocale(locale);
}

/** The price currency of a store by id — for emails and server actions (no render). */
export async function getStoreCurrencyById(storeId: string): Promise<StoreCurrency> {
  const row = await prisma.storeSettings.findUnique({ where: { storeId }, select: { storeCurrency: true } });
  return toStoreCurrency(row?.storeCurrency);
}

/** The language of a store by id — for emails and server actions (no render). */
export async function getStoreLocaleById(storeId: string): Promise<StoreLocale> {
  const row = await prisma.storeSettings.findUnique({ where: { storeId }, select: { storeLanguage: true } });
  const locale = toStoreLocale(row?.storeLanguage);
  if (locale === "en") await ensureStoreEnglish();
  return locale;
}
