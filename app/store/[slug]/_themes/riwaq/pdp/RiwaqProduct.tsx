import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductViewProps, ReviewData } from "../../types";
import { RuledGrid } from "../product/ProductCard";
import { Crumbs, Price, SectionHead, Stars, Wrap, discountPercent, idx, num } from "../ui";
import Gallery from "./Gallery";
import Purchase from "./Purchase";
import ShareButton from "./ShareButton";

/** A numbered chapter: heading column + body column, ruled on top. */
function Chapter({ id, index, title, children }: { id?: string; index: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-(--rq-rule) py-10 lg:grid lg:grid-cols-12 lg:gap-14 lg:py-16">
      <header className="mb-6 lg:col-span-4 lg:mb-0">
        <div className="lg:sticky lg:top-[calc(var(--rq-bar-h)+2rem)]">
          <span className="rq-num text-sm text-(--rq-accent)">{idx(index)}</span>
          <h2 className="rq-h2 mt-2">{title}</h2>
        </div>
      </header>
      <div className="min-w-0 lg:col-span-8">{children}</div>
    </section>
  );
}

function Reviews({ reviews }: { reviews: ReviewData[] }) {
  if (reviews.length === 0) {
    return <p className="rq-body text-(--rq-quiet)">لسه مفيش تقييمات للمنتج ده. اشتريه وكون أول واحد يقيّمه.</p>;
  }
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));

  return (
    <div className="space-y-10">
      <div className="grid gap-8 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-14">
        <div>
          <p className="rq-face text-[4.5rem] font-semibold leading-none tabular-nums">{avg.toFixed(1)}</p>
          <Stars value={avg} className="mt-3" />
          <p className="rq-caption mt-1">{num(reviews.length)} تقييم</p>
        </div>
        <ul className="w-full max-w-sm space-y-2">
          {dist.map(({ star, count }) => (
            <li key={star} className="flex items-center gap-3 text-xs text-(--rq-quiet)">
              <span className="rq-num w-3">{num(star)}</span>
              <span className="relative h-px flex-1 bg-(--rq-rule)">
                <span className="absolute inset-y-[-1px] start-0 bg-(--rq-ink)" style={{ width: `${(count / reviews.length) * 100}%` }} />
              </span>
              <span className="rq-num w-6 text-end">{num(count)}</span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="border-t border-(--rq-ink)">
        {reviews.map((r) => (
          <li key={r.id} className="border-b border-(--rq-rule) py-6">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="flex items-center gap-3">
                <span className="rq-arch rq-face relative grid h-11 w-9 shrink-0 place-items-center pt-1 text-sm font-semibold">
                  {r.customerAvatar ? <Image src={r.customerAvatar} alt="" fill sizes="36px" className="object-cover" /> : [...r.customerName][0]}
                </span>
                <div>
                  <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
                    {r.customerName}
                    {r.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-(--rq-success)">
                        <BadgeCheck className="size-3.5" />
                        مشتري مؤكد
                      </span>
                    )}
                  </p>
                  <time className="rq-caption" dateTime={new Date(r.reviewDate).toISOString()}>
                    {new Date(r.reviewDate).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                </div>
              </div>
              <Stars value={r.rating} />
            </div>
            {r.title && <p className="rq-h4 mt-4">{r.title}</p>}
            <p className="rq-prose mt-2 text-[0.9375rem]">{r.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RiwaqProduct({ store, product, reviews, related, shipping }: ProductViewProps) {
  const inStock = product.stock > 0;
  const discount = discountPercent(product.price, product.compareAtPrice);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const categoryHref = buildStoreUrl(store.slug, `/categories/${product.category.slug}`);

  const specs = [
    { label: "التصنيف", value: product.category.name, href: categoryHref },
    product.brand ? { label: "البراند", value: product.brand } : null,
    product.sku ? { label: "كود المنتج", value: product.sku, ltr: true } : null,
    product.weight !== null ? { label: "الوزن", value: `${num(product.weight)} كجم` } : null,
    product.sizes.length ? { label: "المقاسات", value: product.sizes.join("، ") } : null,
    product.colors.length ? { label: "الألوان", value: product.colors.join("، ") } : null,
  ].filter(Boolean) as { label: string; value: string; href?: string; ltr?: boolean }[];

  let chapter = 0;
  const next = () => ++chapter;

  return (
    <div className={cn(inStock && "rq-has-bar")}>
      <Wrap>
        <Crumbs
          className="py-4 sm:py-6"
          items={[
            { label: "الرئيسية", href: buildStoreUrl(store.slug) },
            { label: product.category.name, href: categoryHref },
            { label: product.name },
          ]}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <Gallery
              images={product.gallery}
              productName={product.name}
              badge={
                !inStock ? (
                  <span className="rq-badge rq-badge--ink">نفدت الكمية</span>
                ) : discount > 0 ? (
                  <span className="rq-badge rq-badge--sale">−{num(discount)}٪</span>
                ) : null
              }
            />
          </div>

          <div className="min-w-0 lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--rq-bar-h)+2rem)]">
              <div className="flex items-center justify-between gap-3">
                <Link href={categoryHref} className="rq-link text-sm font-semibold text-(--rq-accent)">
                  {product.category.name}
                </Link>
                <ShareButton title={product.name} />
              </div>

              <h1 className="rq-face mt-2 text-[1.875rem] font-semibold leading-[1.25] sm:text-[2.5rem]">{product.name}</h1>

              {reviews.length > 0 && (
                <a href="#reviews" className="mt-3 inline-flex min-h-9 items-center gap-2 text-sm">
                  <Stars value={avg} />
                  <span className="rq-link text-(--rq-quiet)">
                    {avg.toFixed(1)} · {num(reviews.length)} تقييم
                  </span>
                </a>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Price price={product.price} compareAt={product.compareAtPrice} size="xl" />
                {discount > 0 && product.compareAtPrice && (
                  <span className="text-sm font-semibold text-(--rq-accent)">وفّر {formatPrice(product.compareAtPrice - product.price)}</span>
                )}
              </div>

              <p
                className={cn(
                  "mt-3 inline-flex items-center gap-2 text-sm font-medium",
                  !inStock ? "text-(--rq-sale)" : product.stock <= 5 ? "text-(--rq-warn)" : "text-(--rq-success)",
                )}
              >
                <span className="size-1.5 bg-current" aria-hidden />
                {!inStock ? "نفدت الكمية" : product.stock <= 5 ? `فاضل ${num(product.stock)} قطع بس` : "متوفر"}
              </p>

              <hr className="rq-rule-ink my-7" />

              <Purchase
                storeSlug={store.slug}
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  stock: product.stock,
                  sizes: product.sizes,
                  colors: product.colors,
                  image: product.gallery[0],
                  wholesaleOptions: product.wholesaleOptions,
                }}
              />

              {shipping.length > 0 && (
                <div className="mt-8">
                  <p className="rq-label mb-2">الشحن</p>
                  <ul className="border-t border-(--rq-rule)">
                    {shipping.slice(0, 4).map((s) => (
                      <li key={s.id} className="rq-leader border-b border-(--rq-rule) py-2.5 text-sm">
                        <span className="min-w-0 truncate">
                          {s.name}
                          {s.estimatedDays ? <span className="text-(--rq-quiet)"> · {num(s.estimatedDays)} أيام</span> : null}
                        </span>
                        <span className="rq-dots" aria-hidden />
                        <span className="rq-price shrink-0">{s.price === 0 ? "مجاني" : formatPrice(s.price / 100)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-14 lg:mt-24">
          {product.description?.trim() && (
            <Chapter index={next()} title="عن المنتج">
              <p className="rq-prose sm:text-[1.0625rem]">{product.description}</p>
            </Chapter>
          )}

          <Chapter index={next()} title="المواصفات">
            <dl className="border-t border-(--rq-ink)">
              {specs.map((s) => (
                <div key={s.label} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-6 border-b border-(--rq-rule) py-3.5 text-[0.9375rem] sm:grid-cols-[12rem_minmax(0,1fr)]">
                  <dt className="text-(--rq-quiet)">{s.label}</dt>
                  <dd className="min-w-0 font-medium" dir={s.ltr ? "ltr" : undefined}>
                    {s.href ? (
                      <Link href={s.href} className="rq-link">
                        {s.value}
                      </Link>
                    ) : (
                      s.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            {product.type === "BUNDLE" && product.bundleItems && product.bundleItems.length > 0 && (
              <div className="mt-10">
                <p className="rq-h3 mb-3">الباقة فيها</p>
                <ul className="border-t border-(--rq-ink)">
                  {product.bundleItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-4 border-b border-(--rq-rule) py-3">
                      <span className="rq-num w-6 text-xs text-(--rq-quiet)">{idx(i + 1)}</span>
                      {item.image && (
                        <span className="rq-plate relative aspect-[4/5] w-11 shrink-0 overflow-hidden">
                          <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-[0.9375rem]">{item.productName}</span>
                      <span className="rq-price text-sm text-(--rq-quiet)">× {num(item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Chapter>

          <Chapter id="reviews" index={next()} title="التقييمات">
            <Reviews reviews={reviews} />
          </Chapter>
        </div>

        {related.length > 0 && (
          <section className="rq-section">
            <SectionHead title="ممكن يعجبك كمان" href={categoryHref} linkLabel={`كل ${product.category.name}`} />
            <RuledGrid products={related.slice(0, 8)} storeSlug={store.slug} />
          </section>
        )}
      </Wrap>
    </div>
  );
}
