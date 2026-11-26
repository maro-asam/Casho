import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ChevronDown, MessageCircle, PackageCheck, Timer, Truck } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { ProductViewProps, ReviewData } from "../../types";
import { whatsappHref } from "../../shared/social";
import { askAboutMessage, coffeeLine, readProfile, splitDescription, waWith } from "../lib/coffee";
import BuyForm from "../product/BuyForm";
import ProductCard, { gramsLabel } from "../product/ProductCard";
import Rail from "../product/Rail";
import RecentlyViewed, { TrackView } from "../sections/RecentlyViewed";
import { Band, Crumbs, Kicker, Notes, Price, Rating, RoastMeter, SectionHead, StockLine, Wrap, days, num, num1, optionLabel } from "../ui";
import Gallery from "./Gallery";
import Passport from "./Passport";
import { formatPrice, st, storeIntlLocale } from "@/lib/i18n/storefront";

function Reviews({ reviews }: { reviews: ReviewData[] }) {
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
      <div className="h-fit">
        <p className="bn-stat-value leading-none">{num1(avg)}</p>
        <Rating value={avg} size="md" className="mt-3" />
        <p className="mt-1 text-sm text-(--bn-ink-2)">{st("من {0} تقييم", num(reviews.length))}</p>
        <ul className="mt-6 space-y-2.5">
          {dist.map(({ star, count }) => (
            <li key={star} className="flex items-center gap-3 text-xs text-(--bn-ink-2)">
              <span className="bn-num w-3">{num(star)}</span>
              <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-(--bn-fill)">
                <span className="absolute inset-y-0 start-0 rounded-full bg-(--bn-crema)" style={{ width: `${(count / reviews.length) * 100}%` }} />
              </span>
              <span className="bn-num w-6 text-end">{num(count)}</span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {reviews.slice(0, 8).map((r) => (
          <li key={r.id} className="bn-review">
            <div className="flex items-center justify-between gap-3">
              <Rating value={r.rating} />
              <time className="text-xs text-(--bn-ink-2)" dateTime={new Date(r.reviewDate).toISOString()}>
                {new Date(r.reviewDate).toLocaleDateString(storeIntlLocale(), { year: "numeric", month: "long", day: "numeric" })}
              </time>
            </div>
            {r.title && <p className="bn-h4 mt-3">{r.title}</p>}
            <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-7">{r.content}</p>
            <div className="mt-4 flex items-center gap-2.5">
              <span className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-(--bn-fill) text-xs text-(--bn-ink)">
                {r.customerAvatar ? <Image src={r.customerAvatar} alt="" fill sizes="32px" className="object-cover" /> : [...r.customerName][0]}
              </span>
              <span className="text-sm text-(--bn-ink)">{r.customerName}</span>
              {r.verifiedPurchase && (
                <span className="inline-flex items-center gap-1 text-xs text-(--bn-ok)">
                  <BadgeCheck className="size-3.5" />
                  {st("مشتري مؤكد")}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Fold({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details className="bn-details bn-fold" open={open}>
      <summary>
        <span>{title}</span>
        <ChevronDown className="bn-chev" />
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}

export default function BunnProduct({ store, product, reviews, related, shipping, whatsapp }: ProductViewProps) {
  const inStock = product.stock > 0;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const categoryHref = buildStoreUrl(store.slug, `/categories/${product.category.slug}`);
  const cheapest = shipping.length ? shipping.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const fastest = shipping.filter((s) => s.estimatedDays).sort((a, b) => (a.estimatedDays ?? 99) - (b.estimatedDays ?? 99))[0];
  const profile = readProfile({ name: product.name, categoryName: product.category.name, attributes: product.attributes, sizes: product.sizes, colors: product.colors, description: product.description });
  const story = splitDescription(product.description).story;
  const wa = whatsappHref(whatsapp);
  const coffee = profile.isCoffee;
  // Per 100 g only from a net weight the merchant stated (never the shipping weight).
  const per100 = coffee && profile.grams ? (product.price / profile.grams) * 100 : null;

  const specs = [
    { label: st("القسم"), value: product.category.name, href: categoryHref },
    product.brand ? { label: st("البراند"), value: product.brand } : null,
    coffee && profile.grams ? { label: st("الوزن الصافي"), value: gramsLabel(profile.grams) } : null,
    product.colors.length ? { label: optionLabel("color", product.colors), value: product.colors.join("، ") } : null,
    product.sizes.length ? { label: optionLabel("size", product.sizes), value: product.sizes.join("، ") } : null,
    ...profile.rest.map((a) => ({ label: a.key, value: a.value })),
    product.sku ? { label: st("الكود"), value: product.sku, ltr: true } : null,
  ].filter(Boolean) as { label: string; value: string; href?: string; ltr?: boolean }[];

  // Service facts from the store's real shipping methods only.
  const assurances = [
    cheapest && { Icon: Truck, title: cheapest.price === 0 ? st("توصيل مجاني") : st("التوصيل من {0}", formatPrice(cheapest.price / 100)), note: cheapest.name },
    fastest?.estimatedDays && { Icon: Timer, title: st("توصلك خلال {0}", days(fastest.estimatedDays)), note: fastest.name },
    inStock && { Icon: PackageCheck, title: st("المتجر بيأكد معاك قبل الشحن"), note: st("تقدر تسأل عن أي تفصيلة قبل ما توصلك") },
  ].filter(Boolean) as { Icon: typeof Truck; title: string; note: string }[];

  return (
    <div className="bn-pdp">
      <TrackView storeSlug={store.slug} productId={product.id} />

      <Wrap>
        <Crumbs
          className="py-5"
          items={[
            { label: st("الرئيسية"), href: buildStoreUrl(store.slug) },
            { label: product.category.name, href: categoryHref },
            { label: product.name },
          ]}
        />

        <div className="bn-pdp-grid">
          <div className="min-w-0">
            <Gallery images={product.gallery} name={product.name} />
          </div>

          <div className="bn-pdp-info">
            <div className="lg:sticky lg:top-[calc(var(--bn-head-h)+1.5rem)]">
              <Kicker>{!inStock ? st("خلص حاليًا") : (coffee && coffeeLine(profile)) || product.brand || product.category.name}</Kicker>
              <h1 className="bn-h1 mt-3 text-balance">{product.name}</h1>
              {reviews.length > 0 && (
                <a href="#reviews" className="mt-2 inline-flex min-h-8 items-center hover:underline">
                  <Rating value={avg} count={reviews.length} />
                </a>
              )}
              <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <Price price={product.price} compareAt={product.compareAtPrice} size="xl" save />
                {coffee && profile.grams && (
                  <span className="text-sm text-(--bn-ink-2)">
                    {st("الكيس {0}", gramsLabel(profile.grams))}
                    {per100 && <> · {st("{0} لكل ١٠٠ جم", formatPrice(Math.round(per100)))}</>}
                  </span>
                )}
              </div>
              <StockLine stock={product.stock} count className="mt-2" />

              {coffee && (profile.roast || profile.notes.length > 0) && (
                <div className="bn-pdp-taste">
                  {profile.roast && (
                    <div>
                      <p className="bn-opt-legend">{st("التحميص")}</p>
                      <RoastMeter level={profile.roast.level} size="lg" label className="mt-2" />
                    </div>
                  )}
                  {profile.notes.length > 0 && (
                    <div className="min-w-0">
                      <p className="bn-opt-legend">{st("النكهات")}</p>
                      <Notes notes={profile.notes} max={6} chips className="mt-2" />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-7">
                <BuyForm
                  storeSlug={store.slug}
                  stickyBar
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    compareAtPrice: product.compareAtPrice,
                    stock: product.stock,
                    sizes: product.sizes,
                    colors: product.colors,
                    image: product.gallery[0] ?? null,
                    categoryName: product.category.name,
                    attributes: product.attributes,
                    description: product.description,
                    wholesaleOptions: product.wholesaleOptions,
                  }}
                />
              </div>

              {product.type === "BUNDLE" && product.bundleItems && product.bundleItems.length > 0 && (
                <div className="mt-8">
                  <p className="bn-opt-legend mb-3">{st("جوّه البوكس")}</p>
                  <ul className="bn-group">
                    {product.bundleItems.map((item, i) => (
                      <li key={i} className="bn-row">
                        {item.image && (
                          <span className="bn-plate relative size-12 shrink-0 overflow-hidden">
                            <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-[0.9375rem] text-(--bn-ink)">{item.productName}</span>
                        <span className="bn-num text-sm text-(--bn-ink-2)">× {num(item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {assurances.length > 0 && (
                <ul className="bn-assure">
                  {assurances.map(({ Icon, title, note }) => (
                    <li key={title}>
                      <Icon aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-sm text-(--bn-ink)">{title}</span>
                        <span className="block text-xs text-(--bn-ink-2)">{note}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {wa && (
                <a href={waWith(wa, askAboutMessage(product.name))} target="_blank" rel="noopener noreferrer" className="bn-ask">
                  <MessageCircle aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-(--bn-ink)">{coffee ? st("محتار في الطحنة أو التحضير؟") : st("عندك سؤال عن المنتج؟")}</span>
                    <span className="block text-xs text-(--bn-ink-2)">{st("اسأل المتجر على واتساب وهيرد عليك.")}</span>
                  </span>
                </a>
              )}

              <div className="mt-8 border-t border-(--bn-line)">
                {story && (
                  <Fold title={coffee ? st("عن البن ده") : st("عن المنتج")} open>
                    <p className="whitespace-pre-line text-[0.9375rem] leading-8 text-(--bn-ink-2)">{story}</p>
                  </Fold>
                )}
                <Fold title={st("التفاصيل")} open={!story}>
                  <dl className="bn-specs">
                    {specs.map((s) => (
                      <div key={s.label}>
                        <dt>{s.label}</dt>
                        <dd dir={s.ltr ? "ltr" : undefined}>
                          {s.href ? (
                            <Link href={s.href} className="bn-link">
                              <span className="bn-underline">{s.value}</span>
                            </Link>
                          ) : (
                            <span className={s.ltr ? "inline-block" : undefined}>{s.value}</span>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Fold>
                {shipping.length > 0 && (
                  <Fold title={st("التوصيل")}>
                    <ul className="space-y-2.5 text-sm">
                      {shipping.map((s) => (
                        <li key={s.id} className="flex flex-wrap justify-between gap-x-4">
                          <span className="text-(--bn-ink)">
                            {s.name}
                            {s.estimatedDays ? <span className="text-(--bn-ink-2)"> {st("· خلال {0}", days(s.estimatedDays))}</span> : null}
                          </span>
                          <span className="bn-num">{s.price === 0 ? st("مجاني") : formatPrice(s.price / 100)}</span>
                        </li>
                      ))}
                    </ul>
                  </Fold>
                )}
              </div>
            </div>
          </div>
        </div>
      </Wrap>

      {coffee && <Passport profile={profile} name={product.name} storeSlug={store.slug} storeName={store.name} />}

      {reviews.length > 0 && (
        <Band id="reviews" className="bn-section scroll-mt-28">
          <Wrap>
            <SectionHead kicker={st("من عملاء جرّبوها")} title={st("التقييمات")} />
            <Reviews reviews={reviews} />
          </Wrap>
        </Band>
      )}

      {related.length > 0 && (
        <Band tone={reviews.length > 0 ? "alt" : "page"} className="bn-section">
          <Rail label={st("منتجات مشابهة")} kicker={st("من نفس القسم")} title={st("ممكن تعجبك كمان")} href={categoryHref} linkLabel={st("كل القسم")} listClassName="bn-shelf--cards">
            {related.slice(0, 12).map((p, i) => (
              <li key={p.id} className="min-w-0">
                <ProductCard product={p} storeSlug={store.slug} index={i} sizes="(max-width: 768px) 62vw, 18rem" />
              </li>
            ))}
          </Rail>
        </Band>
      )}
      <RecentlyViewed storeSlug={store.slug} excludeId={product.id} />
    </div>
  );
}
