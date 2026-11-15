import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Package, ShieldCheck, Truck } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import type { ProductViewProps, ReviewData } from "../../types";
import BuyForm from "../product/BuyForm";
import { ProductGrid } from "../product/ProductCard";
import RecentlyViewed, { TrackView } from "../sections/RecentlyViewed";
import { Crumbs, Price, Rating, SectionHeader, Wrap, discountPercent, num } from "../ui";
import Gallery from "./Gallery";
import { formatPrice, st, storeIntlLocale } from "@/lib/i18n/storefront";

function Tab({ title, open, children, id }: { title: string; open?: boolean; children: React.ReactNode; id?: string }) {
  return (
    <details id={id} open={open} className="dn-details scroll-mt-28 border-b border-(--dn-line)">
      <summary className="flex min-h-15 items-center justify-between gap-4">
        <span className="dn-label">{title}</span>
        <span className="dn-plus" aria-hidden />
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}

function Reviews({ reviews }: { reviews: ReviewData[] }) {
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-16">
      <div className="h-fit">
        <p className="dn-num text-6xl leading-none">{avg.toFixed(1)}</p>
        <Rating value={avg} size="md" className="mt-3" />
        <p className="mt-1 text-sm text-(--dn-quiet)">{st("من {0} تقييم", num(reviews.length))}</p>
        <ul className="mt-6 space-y-2">
          {dist.map(({ star, count }) => (
            <li key={star} className="flex items-center gap-3 text-xs text-(--dn-quiet)">
              <span className="w-3 tabular-nums">{num(star)}</span>
              <span className="relative h-px flex-1 bg-(--dn-line)">
                <span className="absolute inset-y-0 start-0 bg-(--dn-ink)" style={{ width: `${(count / reviews.length) * 100}%` }} />
              </span>
              <span className="w-6 text-end tabular-nums">{num(count)}</span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="divide-y divide-(--dn-line) border-y border-(--dn-line)">
        {reviews.slice(0, 8).map((r) => (
          <li key={r.id} className="py-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-(--dn-plate) text-sm">
                  {r.customerAvatar ? <Image src={r.customerAvatar} alt="" fill sizes="40px" className="object-cover" /> : [...r.customerName][0]}
                </span>
                <div>
                  <p className="text-sm font-semibold">{r.customerName}</p>
                  <time className="text-xs text-(--dn-quiet)" dateTime={new Date(r.reviewDate).toISOString()}>
                    {new Date(r.reviewDate).toLocaleDateString(storeIntlLocale(), { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                </div>
              </div>
              <Rating value={r.rating} />
            </div>
            {r.verifiedPurchase && (
              <p className="mt-3 inline-flex items-center gap-1 text-xs text-(--dn-success)">
                <BadgeCheck className="size-3.5" />
                {st("مشتري مؤكد")}
              </p>
            )}
            {r.title && <p className="dn-h4 mt-2">{r.title}</p>}
            <p className="mt-1.5 whitespace-pre-line text-[0.9375rem] leading-7 text-(--dn-quiet)">{r.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DuneProduct({ store, product, reviews, related, shipping }: ProductViewProps) {
  const discount = discountPercent(product.price, product.compareAtPrice);
  const inStock = product.stock > 0;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const categoryHref = buildStoreUrl(store.slug, `/categories/${product.category.slug}`);
  const cheapest = shipping.length ? shipping.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const fastest = shipping.filter((s) => s.estimatedDays).sort((a, b) => (a.estimatedDays ?? 99) - (b.estimatedDays ?? 99))[0];

  const specs = [
    { label: st("التصنيف"), value: product.category.name, href: categoryHref },
    product.brand ? { label: st("البراند"), value: product.brand } : null,
    product.sku ? { label: st("كود المنتج"), value: product.sku, ltr: true } : null,
    product.weight !== null ? { label: st("الوزن"), value: st("{0} كجم", num(product.weight)) } : null,
    product.sizes.length ? { label: st("المقاسات"), value: product.sizes.join("، ") } : null,
    product.colors.length ? { label: st("الألوان"), value: product.colors.join("، ") } : null,
  ].filter(Boolean) as { label: string; value: string; href?: string; ltr?: boolean }[];

  const trust = [
    cheapest && { Icon: Truck, title: cheapest.price === 0 ? st("شحن مجاني متاح") : st("الشحن من {0}", formatPrice(cheapest.price / 100)), note: st("{0} طرق شحن", num(shipping.length)) },
    fastest?.estimatedDays && { Icon: Package, title: st("يوصلك خلال {0} أيام", num(fastest.estimatedDays)), note: fastest.name },
    inStock && { Icon: ShieldCheck, title: st("تأكيد الطلب مع المتجر"), note: st("المتجر بيتواصل معاك قبل الشحن") },
  ].filter(Boolean) as { Icon: typeof Truck; title: string; note: string }[];

  return (
    <div className="pb-8">
      <TrackView storeSlug={store.slug} productId={product.id} />
      <Wrap>
        <Crumbs
          className="py-5 sm:py-7"
          items={[
            { label: st("الرئيسية"), href: buildStoreUrl(store.slug) },
            { label: product.category.name, href: categoryHref },
            { label: product.name },
          ]}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
          <div className="min-w-0">
            <Gallery
              images={product.gallery}
              name={product.name}
              tags={!inStock ? <span className="dn-tag dn-tag--ink">{st("نفدت الكمية")}</span> : discount > 0 ? <span className="dn-tag dn-tag--sale">{st("خصم {0}٪", num(discount))}</span> : null}
            />
          </div>

          <div className="min-w-0">
            <div data-reveal className="lg:sticky lg:top-[calc(var(--dn-header-h)+2rem)]">
              <Link href={categoryHref} className="dn-label dn-appear text-(--dn-quiet) hover:text-(--dn-ink)">
                {product.brand || product.category.name}
              </Link>
              <h1 className="dn-h1 dn-appear mt-3 text-[2.25rem] sm:text-[2.75rem]">{product.name}</h1>

              <div className="dn-appear mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                <Price price={product.price} compareAt={product.compareAtPrice} size="xl" />
                {discount > 0 && product.compareAtPrice && <span className="text-sm text-(--dn-sale)">{st("وفّر {0}", formatPrice(product.compareAtPrice - product.price))}</span>}
              </div>
              {reviews.length > 0 && (
                <a href="#reviews" className="dn-appear mt-2 inline-flex min-h-9 items-center gap-2 text-sm hover:underline">
                  <Rating value={avg} count={reviews.length} />
                </a>
              )}

              <p className={cn("dn-appear mt-3 inline-flex items-center gap-2 text-sm", !inStock ? "text-(--dn-error)" : product.stock <= 10 ? "text-(--dn-warn)" : "text-(--dn-success)")}>
                <span className="size-1.5 rounded-full bg-current" aria-hidden />
                {!inStock ? st("نفدت الكمية") : product.stock <= 10 ? st("فاضل {0} قطع بس في المخزون", num(product.stock)) : st("متوفر في المخزون وجاهز للشحن")}
              </p>

              <div className="dn-rule mt-7 pt-7">
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
              </div>

              {product.type === "BUNDLE" && product.bundleItems && product.bundleItems.length > 0 && (
                <div className="mt-7 border border-(--dn-line) p-5">
                  <p className="dn-label mb-4">{st("الباقة فيها")}</p>
                  <ul className="space-y-3">
                    {product.bundleItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        {item.image && (
                          <span className="dn-media size-12 shrink-0">
                            <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm">{item.productName}</span>
                        <span className="dn-num text-(--dn-quiet)">× {num(item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-8 border-t border-(--dn-line)">
                {product.description?.trim() && (
                  <Tab title={st("الوصف")} open>
                    <p className="dn-prose text-[0.9375rem]">{product.description}</p>
                  </Tab>
                )}
                <Tab title={st("التفاصيل")} open={!product.description?.trim()}>
                  <dl className="text-sm">
                    {specs.map((s) => (
                      <div key={s.label} className="flex justify-between gap-6 border-b border-(--dn-line) py-3 last:border-0">
                        <dt className="text-(--dn-quiet)">{s.label}</dt>
                        <dd className="min-w-0 text-end" dir={s.ltr ? "ltr" : undefined}>
                          {s.href ? (
                            <Link href={s.href} className="underline-offset-4 hover:underline">
                              {s.value}
                            </Link>
                          ) : (
                            s.value
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Tab>
                {shipping.length > 0 && (
                  <Tab title={st("الشحن والتوصيل")}>
                    <ul className="text-sm">
                      {shipping.map((s) => (
                        <li key={s.id} className="flex justify-between gap-4 border-b border-(--dn-line) py-3 last:border-0">
                          <span>
                            {s.name}
                            {s.estimatedDays ? <span className="text-(--dn-quiet)">{" "}{st("· خلال {0} أيام", num(s.estimatedDays))}</span> : null}
                          </span>
                          <span className="dn-num shrink-0 text-base">{s.price === 0 ? st("مجاني") : formatPrice(s.price / 100)}</span>
                        </li>
                      ))}
                    </ul>
                  </Tab>
                )}
              </div>

              {trust.length > 0 && (
                <ul className="mt-7 grid gap-4 sm:grid-cols-2">
                  {trust.map(({ Icon, title, note }) => (
                    <li key={title} className="flex items-start gap-3">
                      <Icon className="mt-0.5 size-5 shrink-0 text-(--dn-quiet)" />
                      <span className="text-sm">
                        <span className="block">{title}</span>
                        <span className="block text-xs text-(--dn-quiet)">{note}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <section id="reviews" data-reveal className="dn-section mt-12 scroll-mt-28">
          <SectionHeader title={st("التقييمات")} />
          {reviews.length > 0 ? (
            <Reviews reviews={reviews} />
          ) : (
            <p className="border-y border-(--dn-line) py-8 text-[0.9375rem] text-(--dn-quiet)">{st("لسه مفيش تقييمات للمنتج ده.")}</p>
          )}
        </section>

        {related.length > 0 && (
          <section data-reveal className="dn-section">
            <SectionHeader title={st("ممكن يعجبك كمان")} href={categoryHref} linkLabel={st("كل {0}", product.category.name)} />
            <ProductGrid products={related.slice(0, 4)} storeSlug={store.slug} railOnMobile cols={4} />
          </section>
        )}
      </Wrap>
      <RecentlyViewed storeSlug={store.slug} excludeId={product.id} />
    </div>
  );
}
