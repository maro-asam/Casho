import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ChevronDown, MessageCircle, PackageCheck, Timer, Truck } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { formatPrice } from "@/lib/utils";
import type { ProductViewProps, ReviewData } from "../../types";
import { whatsappHref } from "../../shared/social";
import { askAboutMessage, waWith, weightLabel } from "../lib/qirat";
import BuyForm from "../product/BuyForm";
import ProductCard from "../product/ProductCard";
import Rail from "../product/Rail";
import RecentlyViewed, { TrackView } from "../sections/RecentlyViewed";
import { Band, Crumbs, Kicker, Ornament, Price, Rating, SectionHead, StockLine, Wrap, days, num, optionLabel } from "../ui";
import Gallery from "./Gallery";

function Reviews({ reviews }: { reviews: ReviewData[] }) {
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
      <div className="h-fit text-center lg:text-start">
        <p className="qr-stat-value leading-none">{avg.toFixed(1)}</p>
        <Rating value={avg} size="md" className="mt-3" />
        <p className="mt-1 text-sm text-(--qr-ink-2)">من {num(reviews.length)} تقييم</p>
        <ul className="mt-6 space-y-2.5">
          {dist.map(({ star, count }) => (
            <li key={star} className="flex items-center gap-3 text-xs text-(--qr-ink-2)">
              <span className="qr-num w-3">{num(star)}</span>
              <span className="relative h-px flex-1 bg-(--qr-line)">
                <span className="absolute inset-y-[-1px] start-0 bg-(--qr-gold)" style={{ width: `${(count / reviews.length) * 100}%` }} />
              </span>
              <span className="qr-num w-6 text-end">{num(count)}</span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {reviews.slice(0, 8).map((r) => (
          <li key={r.id} className="qr-review">
            <div className="flex items-center justify-between gap-3">
              <Rating value={r.rating} />
              <time className="text-xs text-(--qr-ink-2)" dateTime={new Date(r.reviewDate).toISOString()}>
                {new Date(r.reviewDate).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            </div>
            {r.title && <p className="qr-h4 mt-3">{r.title}</p>}
            <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-7">{r.content}</p>
            <div className="mt-4 flex items-center gap-2.5">
              <span className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-(--qr-alt) text-xs text-(--qr-ink)">
                {r.customerAvatar ? <Image src={r.customerAvatar} alt="" fill sizes="32px" className="object-cover" /> : [...r.customerName][0]}
              </span>
              <span className="text-sm text-(--qr-ink)">{r.customerName}</span>
              {r.verifiedPurchase && (
                <span className="inline-flex items-center gap-1 text-xs text-(--qr-ok)">
                  <BadgeCheck className="size-3.5" />
                  مشتري مؤكد
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
    <details className="qr-details qr-fold" open={open}>
      <summary>
        <span>{title}</span>
        <ChevronDown className="qr-chev" />
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}

export default function QiratProduct({ store, product, reviews, related, shipping, whatsapp }: ProductViewProps) {
  const inStock = product.stock > 0;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const categoryHref = buildStoreUrl(store.slug, `/categories/${product.category.slug}`);
  const cheapest = shipping.length ? shipping.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const fastest = shipping.filter((s) => s.estimatedDays).sort((a, b) => (a.estimatedDays ?? 99) - (b.estimatedDays ?? 99))[0];
  const description = product.description?.trim();
  const wa = whatsappHref(whatsapp);
  const weight = product.weight !== null ? weightLabel(product.weight, num) : null;

  const specs = [
    { label: "المجموعة", value: product.category.name, href: categoryHref },
    product.brand ? { label: "البراند", value: product.brand } : null,
    product.colors.length ? { label: optionLabel("color", product.colors), value: product.colors.join("، ") } : null,
    product.sizes.length ? { label: "المقاسات", value: product.sizes.join("، ") } : null,
    weight ? { label: "الوزن", value: weight } : null,
    product.sku ? { label: "كود القطعة", value: product.sku, ltr: true } : null,
  ].filter(Boolean) as { label: string; value: string; href?: string; ltr?: boolean }[];

  // Service facts from the store's real shipping methods only.
  const assurances = [
    cheapest && { Icon: Truck, title: cheapest.price === 0 ? "توصيل مجاني" : `التوصيل من ${formatPrice(cheapest.price / 100)}`, note: cheapest.name },
    fastest?.estimatedDays && { Icon: Timer, title: `توصلك خلال ${days(fastest.estimatedDays)}`, note: fastest.name },
    inStock && { Icon: PackageCheck, title: "المتجر بيأكد معاك قبل الشحن", note: "تقدر تسأل عن أي تفصيلة قبل ما توصلك" },
  ].filter(Boolean) as { Icon: typeof Truck; title: string; note: string }[];

  return (
    <div className="qr-pdp">
      <TrackView storeSlug={store.slug} productId={product.id} />

      <Wrap>
        <Crumbs
          className="py-5"
          items={[
            { label: "الرئيسية", href: buildStoreUrl(store.slug) },
            { label: product.category.name, href: categoryHref },
            { label: product.name },
          ]}
        />

        <div className="qr-pdp-grid">
          <div className="min-w-0">
            <Gallery images={product.gallery} name={product.name} />
          </div>

          <div className="qr-pdp-info">
            <div className="lg:sticky lg:top-[calc(var(--qr-head-h)+1.5rem)]">
              <Kicker>{!inStock ? "نفدت حاليًا" : product.isFeatured ? "اختيار المتجر" : product.brand || product.category.name}</Kicker>
              <h1 className="qr-h1 mt-3 text-balance">{product.name}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                <Price price={product.price} compareAt={product.compareAtPrice} size="xl" save />
                {reviews.length > 0 && (
                  <a href="#reviews" className="inline-flex min-h-8 items-center hover:underline">
                    <Rating value={avg} count={reviews.length} />
                  </a>
                )}
              </div>
              <StockLine stock={product.stock} count className="mt-3" />
              <Ornament className="qr-orn--start my-7" />

              <BuyForm
                storeSlug={store.slug}
                storeName={store.name}
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
                  wholesaleOptions: product.wholesaleOptions,
                }}
              />

              {product.type === "BUNDLE" && product.bundleItems && product.bundleItems.length > 0 && (
                <div className="mt-8">
                  <p className="qr-opt-legend mb-3">جوّه العلبة</p>
                  <ul className="qr-group">
                    {product.bundleItems.map((item, i) => (
                      <li key={i} className="qr-row">
                        {item.image && (
                          <span className="qr-plate relative size-12 shrink-0 overflow-hidden">
                            <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-[0.9375rem] text-(--qr-ink)">{item.productName}</span>
                        <span className="qr-num text-sm text-(--qr-ink-2)">× {num(item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {assurances.length > 0 && (
                <ul className="qr-assure">
                  {assurances.map(({ Icon, title, note }) => (
                    <li key={title}>
                      <Icon aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-sm text-(--qr-ink)">{title}</span>
                        <span className="block text-xs text-(--qr-ink-2)">{note}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {wa && (
                <a href={waWith(wa, askAboutMessage(product.name))} target="_blank" rel="noopener noreferrer" className="qr-ask">
                  <MessageCircle aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-(--qr-ink)">عندك سؤال عن القطعة؟</span>
                    <span className="block text-xs text-(--qr-ink-2)">اسأل المتجر على واتساب عن المقاس أو الخامة أو التغليف.</span>
                  </span>
                </a>
              )}

              <div className="mt-8 border-t border-(--qr-line)">
                {description && (
                  <Fold title="عن القطعة" open>
                    <p className="whitespace-pre-line text-[0.9375rem] leading-8 text-(--qr-ink-2)">{description}</p>
                  </Fold>
                )}
                <Fold title="التفاصيل" open={!description}>
                  <dl className="qr-specs">
                    {specs.map((s) => (
                      <div key={s.label}>
                        <dt>{s.label}</dt>
                        <dd dir={s.ltr ? "ltr" : undefined}>
                          {s.href ? (
                            <Link href={s.href} className="qr-link">
                              <span className="qr-underline">{s.value}</span>
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
                  <Fold title="التوصيل">
                    <ul className="space-y-2.5 text-sm">
                      {shipping.map((s) => (
                        <li key={s.id} className="flex flex-wrap justify-between gap-x-4">
                          <span className="text-(--qr-ink)">
                            {s.name}
                            {s.estimatedDays ? <span className="text-(--qr-ink-2)"> · خلال {days(s.estimatedDays)}</span> : null}
                          </span>
                          <span className="qr-num">{s.price === 0 ? "مجاني" : formatPrice(s.price / 100)}</span>
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

      {reviews.length > 0 && (
        <Band tone="alt" id="reviews" className="qr-section mt-(--qr-section) scroll-mt-28">
          <Wrap>
            <SectionHead kicker="من عملاء جرّبوها" title="التقييمات" />
            <Reviews reviews={reviews} />
          </Wrap>
        </Band>
      )}

      {related.length > 0 && (
        <Band className="qr-section">
          <Rail label="قطع مشابهة" kicker="من نفس المجموعة" title="ممكن تعجبك كمان" href={categoryHref} linkLabel="كل المجموعة" listClassName="qr-shelf--cards">
            {related.slice(0, 12).map((p, i) => (
              <li key={p.id} className="min-w-0">
                <ProductCard product={p} storeSlug={store.slug} index={i} sizes="(max-width: 768px) 62vw, 19rem" />
              </li>
            ))}
          </Rail>
        </Band>
      )}
      <RecentlyViewed storeSlug={store.slug} excludeId={product.id} />
    </div>
  );
}
