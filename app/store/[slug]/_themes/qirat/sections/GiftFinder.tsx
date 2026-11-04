"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { productsQueryString } from "@/lib/products-query";
import type { CategoryLink, ProductCardData } from "../../types";
import { budgetTiers, giftHelpMessage, inBudget, waWith, type Budget } from "../lib/qirat";
import { Kicker, Ornament, PlateImage, Price, TextLink, Wrap, num } from "../ui";

const budgetLabel = (b: Budget) => (b.min === 0 ? `أقل من ${num(b.max)} ج.م` : b.max === 0 ? `أكتر من ${num(b.min)} ج.م` : `${num(b.min)} – ${num(b.max)} ج.م`);

/** Casho Qirat's own section: a gift in two steps. The budgets split the
 *  store's real prices into thirds, the kinds are its real collections; the
 *  pieces that match show at once and the full listing is one tap away with
 *  the same filters. Undecided shoppers can hand the question to the store's
 *  WhatsApp. Nothing here is invented. */
export default function GiftFinder({
  products,
  categories,
  storeSlug,
  storeName,
  whatsappHref,
}: {
  products: ProductCardData[];
  categories: CategoryLink[];
  storeSlug: string;
  storeName: string;
  whatsappHref: string | null;
}) {
  const tiers = useMemo(() => budgetTiers(products.map((p) => p.price)), [products]);
  const kinds = categories.filter((c) => c.productCount > 0).slice(0, 8);
  const [budget, setBudget] = useState<number | null>(null);
  const [kind, setKind] = useState<string | null>(null);

  const b = budget !== null ? tiers[budget] : null;
  const k = kind ? kinds.find((c) => c.slug === kind) ?? null : null;
  const matches = products.filter((p) => p.stock > 0 && (!b || inBudget(p.price, b)) && (!k || p.categoryName === k.name)).slice(0, 4);
  const listing = buildStoreUrl(storeSlug, `/products${productsQueryString({ category: k?.slug ?? "", minPrice: b?.min ?? 0, maxPrice: b?.max ?? 0, inStock: true })}`);
  const help = whatsappHref ? waWith(whatsappHref, giftHelpMessage(storeName, b ? budgetLabel(b) : undefined, k?.name)) : null;

  return (
    <section data-tone="velvet" aria-label="مساعد الهدايا" className="qr-band qr-section qr-gift">
      <Wrap className="qr-gift-grid">
        <div className="min-w-0">
          <Kicker className="qr-reveal">مساعد الهدايا</Kicker>
          <h2 className="qr-display qr-reveal mt-3 text-balance">الهدية المناسبة، في خطوتين</h2>
          <Ornament className="qr-reveal qr-orn--start mt-6" />

          {tiers.length > 0 && (
            <fieldset className="qr-gift-step qr-reveal">
              <legend>
                <span className="qr-gift-n">١</span> الميزانية
              </legend>
              <div className="flex flex-wrap gap-2">
                {tiers.map((t, i) => (
                  <button key={i} type="button" aria-pressed={budget === i} onClick={() => setBudget(budget === i ? null : i)} className="qr-chip">
                    {budgetLabel(t)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {kinds.length > 0 && (
            <fieldset className="qr-gift-step qr-reveal">
              <legend>
                <span className="qr-gift-n">{tiers.length > 0 ? "٢" : "١"}</span> نوع القطعة
              </legend>
              <div className="flex flex-wrap gap-2">
                {kinds.map((c) => (
                  <button key={c.id} type="button" aria-pressed={kind === c.slug} onClick={() => setKind(kind === c.slug ? null : c.slug)} className="qr-chip">
                    {c.name}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {help && (
            <a href={help} target="_blank" rel="noopener noreferrer" className="qr-link qr-reveal mt-10 text-[0.9375rem]">
              <MessageCircle aria-hidden className="size-4" />
              <span className="qr-underline">محتار؟ نختار معاك على واتساب</span>
            </a>
          )}
        </div>

        <div className="min-w-0" aria-live="polite">
          {matches.length > 0 ? (
            <ul className="qr-gift-results" data-n={matches.length}>
              {matches.map((p) => (
                <li key={p.id} className="qr-fade min-w-0">
                  <Link href={buildStoreUrl(storeSlug, `/products/${p.slug}`)} className="qr-mini group">
                    <span className="qr-plate qr-mini-media">
                      <PlateImage src={p.image} sizes="(max-width: 768px) 45vw, 16rem" className="qr-zoom" />
                      <span aria-hidden className="qr-glint" />
                    </span>
                    <span className="qr-serif mt-3 line-clamp-1 block text-[1rem] text-(--qr-ink)">{p.name}</span>
                    <Price price={p.price} compareAt={p.compareAtPrice} size="sm" className="justify-center" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="qr-gift-none">
              <p className="qr-h3">مفيش قطع هنا بالاختيار ده</p>
              <p className="mt-2 text-sm text-(--qr-ink-2)">شوف كل المتاح في الكتالوج بنفس الاختيار، أو غيّر الميزانية.</p>
            </div>
          )}
          <div className="mt-8 flex justify-center">
            <TextLink href={listing}>{b || k ? "شوف كل الاختيارات" : "شوف كل القطع"}</TextLink>
          </div>
        </div>
      </Wrap>
    </section>
  );
}
