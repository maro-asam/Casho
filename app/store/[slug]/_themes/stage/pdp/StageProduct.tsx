import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MessageCircle, PackageCheck, Timer, Truck } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { formatPrice } from "@/lib/utils";
import type { ProductViewProps, ReviewData } from "../../types";
import { whatsappHref } from "../../shared/social";
import { askAboutMessage, waWith } from "../lib/stage";
import BuyForm from "../product/BuyForm";
import ProductCard from "../product/ProductCard";
import Rail from "../product/Rail";
import RecentlyViewed, { TrackView } from "../sections/RecentlyViewed";
import { Band, Crumbs, Eyebrow, OPTION_LABEL, Price, Rating, SectionHeader, StockLine, Wrap, days, discountPercent, isVariety, num } from "../ui";
import Gallery from "./Gallery";
import LocalNav from "./LocalNav";

function Reviews({ reviews }: { reviews: ReviewData[] }) {
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-16">
      <div className="h-fit">
        <p className="sg-stat-value leading-none">{avg.toFixed(1)}</p>
        <Rating value={avg} size="md" className="mt-3" />
        <p className="mt-1 text-sm text-(--sg-label-2)">من {num(reviews.length)} تقييم</p>
        <ul className="mt-6 space-y-2.5">
          {dist.map(({ star, count }) => (
            <li key={star} className="flex items-center gap-3 text-xs text-(--sg-label-2)">
              <span className="w-3 tabular-nums">{num(star)}</span>
              <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-(--sg-fill)">
                <span className="absolute inset-y-0 start-0 rounded-full bg-(--sg-ink)" style={{ width: `${(count / reviews.length) * 100}%` }} />
              </span>
              <span className="w-6 text-end tabular-nums">{num(count)}</span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {reviews.slice(0, 8).map((r) => (
          <li key={r.id} className="sg-quote !w-auto">
            <div className="flex items-center justify-between gap-3">
              <Rating value={r.rating} />
              <time className="text-xs text-(--sg-label-2)" dateTime={new Date(r.reviewDate).toISOString()}>
                {new Date(r.reviewDate).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            </div>
            {r.title && <p className="sg-h4 mt-3">{r.title}</p>}
            <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-7 text-(--sg-ink)">{r.content}</p>
            <div className="mt-auto flex items-center gap-2.5 pt-5">
              <span className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-(--sg-fill) text-xs font-semibold text-(--sg-ink)">
                {r.customerAvatar ? <Image src={r.customerAvatar} alt="" fill sizes="32px" className="object-cover" /> : [...r.customerName][0]}
              </span>
              <span className="text-sm font-semibold text-(--sg-ink)">{r.customerName}</span>
              {r.verifiedPurchase && (
                <span className="inline-flex items-center gap-1 text-xs text-(--sg-ok)">
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

export default function StageProduct({ store, product, reviews, related, shipping, whatsapp }: ProductViewProps) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const inStock = product.stock > 0;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const categoryHref = buildStoreUrl(store.slug, `/categories/${product.category.slug}`);
  const cheapest = shipping.length ? shipping.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const fastest = shipping.filter((s) => s.estimatedDays).sort((a, b) => (a.estimatedDays ?? 99) - (b.estimatedDays ?? 99))[0];
  const description = product.description?.trim();
  const wa = whatsappHref(whatsapp);

  const specs = [
    { label: "القسم", value: product.category.name, href: categoryHref },
    product.brand ? { label: "البراند", value: product.brand } : null,
    product.colors.length ? { label: isVariety(product.colors) ? "النوع" : OPTION_LABEL.color, value: product.colors.join("، ") } : null,
    product.sizes.length ? { label: OPTION_LABEL.size, value: product.sizes.join("، ") } : null,
    product.weight !== null ? { label: "الوزن", value: `${num(product.weight)} كجم` } : null,
    product.sku ? { label: "كود المنتج", value: product.sku, ltr: true } : null,
  ].filter(Boolean) as { label: string; value: string; href?: string; ltr?: boolean }[];

  // Service facts from the store's real shipping methods only.
  const delivery = [
    cheapest && { Icon: Truck, title: cheapest.price === 0 ? "توصيل مجاني" : `التوصيل من ${formatPrice(cheapest.price / 100)}`, note: cheapest.name },
    fastest?.estimatedDays && { Icon: Timer, title: `يوصلك خلال ${days(fastest.estimatedDays)}`, note: fastest.name },
    inStock && { Icon: PackageCheck, title: "متوفر وجاهز للطلب", note: "المتجر بيأكد معاك قبل الشحن" },
  ].filter(Boolean) as { Icon: typeof Truck; title: string; note: string }[];

  return (
    <div className="sg-pdp">
      <TrackView storeSlug={store.slug} productId={product.id} />
      <LocalNav name={product.name} price={product.price} watch="sg-buy-head" target="sg-buy" />

      <Wrap>
        <Crumbs
          className="pt-5"
          items={[
            { label: "الرئيسية", href: buildStoreUrl(store.slug) },
            { label: product.category.name, href: categoryHref },
            { label: product.name },
          ]}
        />

        <header id="sg-buy-head" className="sg-buyhead">
          {!inStock ? <Eyebrow className="!text-(--sg-label-2)">غير متوفر حاليًا</Eyebrow> : off > 0 ? <Eyebrow>وفّر {num(off)}٪</Eyebrow> : product.isFeatured ? <Eyebrow>اختيار المتجر</Eyebrow> : null}
          <h1 className="sg-h1 text-balance">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Price price={product.price} compareAt={product.compareAtPrice} size="md" />
            {reviews.length > 0 && (
              <a href="#reviews" className="inline-flex min-h-8 items-center hover:underline">
                <Rating value={avg} count={reviews.length} />
              </a>
            )}
            <StockLine stock={product.stock} />
          </div>
        </header>

        <div className="sg-buy-grid">
          <div className="min-w-0">
            <div className="lg:sticky lg:top-[calc(var(--sg-bar-h)+4.5rem)]">
              <Gallery images={product.gallery} name={product.name} />
            </div>
          </div>

          <div id="sg-buy" className="min-w-0 scroll-mt-28">
            <BuyForm
              storeSlug={store.slug}
              stickyBar
              product={{
                id: product.id,
                name: product.name,
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
                <p className="sg-step-legend">
                  <span className="text-(--sg-ink)">جوّه العلبة.</span> كل اللي هيوصلك.
                </p>
                <ul className="sg-group">
                  {product.bundleItems.map((item, i) => (
                    <li key={i} className="sg-row">
                      {item.image && (
                        <span className="sg-media relative size-11 shrink-0 rounded-(--sg-r-sm)">
                          <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-semibold text-(--sg-ink)">{item.productName}</span>
                      <span className="sg-num text-sm text-(--sg-label-2)">× {num(item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {delivery.length > 0 && (
              <ul className="sg-delivery">
                {delivery.map(({ Icon, title, note }) => (
                  <li key={title}>
                    <Icon aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-[0.9375rem] font-semibold text-(--sg-ink)">{title}</span>
                      <span className="block text-[0.8125rem] text-(--sg-label-2)">{note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {wa && (
              <div className="sg-help">
                <MessageCircle aria-hidden />
                <p className="min-w-0 flex-1 text-[0.9375rem] text-(--sg-label-2)">
                  <span className="font-semibold text-(--sg-ink)">محتاج مساعدة؟</span>{" "}
                  <a href={waWith(wa, askAboutMessage(product.name))} target="_blank" rel="noopener noreferrer" className="sg-link">
                    اسأل المتجر على واتساب ›
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </Wrap>

      {description && (
        <Band tone="alt" className="sg-section mt-(--sg-section)">
          <Wrap>
            <SectionHeader title="نظرة أقرب." tagline="كل اللي محتاج تعرفه." />
            <p className="sg-statement sg-statement--body sg-reveal whitespace-pre-line">{description}</p>
          </Wrap>
        </Band>
      )}

      <Band className="sg-section">
        <Wrap>
          <SectionHeader title="المواصفات." />
          <dl className="sg-specs">
            {specs.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd dir={s.ltr ? "ltr" : undefined}>
                  {s.href ? (
                    <Link href={s.href} className="sg-link">
                      {s.value}
                    </Link>
                  ) : (
                    <span className={s.ltr ? "inline-block" : undefined}>{s.value}</span>
                  )}
                </dd>
              </div>
            ))}
            {shipping.length > 0 && (
              <div>
                <dt>التوصيل</dt>
                <dd>
                  <ul className="space-y-1.5">
                    {shipping.map((s) => (
                      <li key={s.id} className="flex flex-wrap justify-between gap-x-4">
                        <span>
                          {s.name}
                          {s.estimatedDays ? <span className="text-(--sg-label-2)"> · خلال {days(s.estimatedDays)}</span> : null}
                        </span>
                        <span className="sg-num">{s.price === 0 ? "مجاني" : formatPrice(s.price / 100)}</span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </Wrap>
      </Band>

      {reviews.length > 0 && (
        <Band tone="alt" id="reviews" className="sg-section scroll-mt-28">
          <Wrap>
            <SectionHeader title="التقييمات." tagline="من ناس جرّبته." />
            <Reviews reviews={reviews} />
          </Wrap>
        </Band>
      )}

      {related.length > 0 && (
        <Band className="sg-section">
          <Rail label="منتجات مشابهة" title="ممكن يعجبك كمان." href={categoryHref} linkLabel="كل القسم" listClassName="sg-shelf--cards">
            {related.slice(0, 12).map((p, i) => (
              <li key={p.id} className="min-w-0">
                <ProductCard product={p} storeSlug={store.slug} index={i} sizes="(max-width: 768px) 60vw, 18rem" />
              </li>
            ))}
          </Rail>
        </Band>
      )}
      <RecentlyViewed storeSlug={store.slug} excludeId={product.id} />
    </div>
  );
}
