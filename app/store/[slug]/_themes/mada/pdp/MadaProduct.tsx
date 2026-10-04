import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ChevronDown, Package, Truck } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductViewProps, ReviewData } from "../../types";
import { WishlistButton } from "../product/CardActions";
import BuyForm from "../product/BuyForm";
import ProductRail from "../sections/ProductRail";
import RecentlyViewed, { TrackView } from "../sections/RecentlyViewed";
import { Crumbs, Price, Rating, Wrap, discountPercent, num } from "../ui";
import Gallery from "./Gallery";
import ShareButton from "./ShareButton";

function Accordion({ title, open, children, id }: { title: string; open?: boolean; children: React.ReactNode; id?: string }) {
  return (
    <details id={id} open={open} className="md-details scroll-mt-28 border-b border-(--md-line)">
      <summary className="flex min-h-14 items-center justify-between gap-4 text-[0.9375rem] font-semibold">
        {title}
        <ChevronDown aria-hidden className="md-details-icon size-5 text-(--md-quiet)" />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}

function Reviews({ reviews }: { reviews: ReviewData[] }) {
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-14">
      <div className="md-panel h-fit p-6">
        <p className="md-face text-5xl font-bold tabular-nums">{avg.toFixed(1)}</p>
        <Rating value={avg} size="md" className="mt-2" />
        <p className="mt-1 text-sm text-(--md-quiet)">من {num(reviews.length)} تقييم</p>
        <ul className="mt-5 space-y-2">
          {dist.map(({ star, count }) => (
            <li key={star} className="flex items-center gap-2.5 text-xs text-(--md-quiet)">
              <span className="w-3 tabular-nums">{num(star)}</span>
              <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-(--md-studio)">
                <span className="absolute inset-y-0 start-0 rounded-full bg-(--md-star)" style={{ width: `${(count / reviews.length) * 100}%` }} />
              </span>
              <span className="w-6 text-end tabular-nums">{num(count)}</span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {reviews.slice(0, 8).map((r) => (
          <li key={r.id} className="md-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-(--md-signal) text-sm font-bold text-(--md-signal-ink)">
                  {r.customerAvatar ? <Image src={r.customerAvatar} alt="" fill sizes="40px" className="object-cover" /> : [...r.customerName][0]}
                </span>
                <div>
                  <p className="text-sm font-semibold">{r.customerName}</p>
                  <time className="text-xs text-(--md-quiet)" dateTime={new Date(r.reviewDate).toISOString()}>
                    {new Date(r.reviewDate).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                </div>
              </div>
              <Rating value={r.rating} />
            </div>
            {r.verifiedPurchase && (
              <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-(--md-success)">
                <BadgeCheck className="size-3.5" />
                مشتري مؤكد
              </p>
            )}
            {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
            <p className="mt-1.5 whitespace-pre-line text-sm leading-7 text-(--md-quiet)">{r.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MadaProduct({ store, product, reviews, related, shipping }: ProductViewProps) {
  const discount = discountPercent(product.price, product.compareAtPrice);
  const inStock = product.stock > 0;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const categoryHref = buildStoreUrl(store.slug, `/categories/${product.category.slug}`);
  const cheapest = shipping.length ? shipping.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const fastest = shipping.filter((s) => s.estimatedDays).sort((a, b) => (a.estimatedDays ?? 99) - (b.estimatedDays ?? 99))[0];

  const specs = [
    { label: "التصنيف", value: product.category.name, href: categoryHref },
    product.brand ? { label: "البراند", value: product.brand } : null,
    product.sku ? { label: "كود المنتج", value: product.sku, ltr: true } : null,
    product.weight !== null ? { label: "الوزن", value: `${num(product.weight)} كجم` } : null,
    product.sizes.length ? { label: "المقاسات", value: product.sizes.join("، ") } : null,
    product.colors.length ? { label: "الألوان", value: product.colors.join("، ") } : null,
  ].filter(Boolean) as { label: string; value: string; href?: string; ltr?: boolean }[];

  return (
    <div className="pb-8">
      <TrackView storeSlug={store.slug} productId={product.id} />
      <Wrap>
        <Crumbs
          className="py-4 sm:py-6"
          items={[
            { label: "الرئيسية", href: buildStoreUrl(store.slug) },
            { label: product.category.name, href: categoryHref },
            { label: product.name },
          ]}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
          <div className="min-w-0">
            <Gallery
              images={product.gallery}
              name={product.name}
              badges={
                !inStock ? (
                  <span className="md-badge md-badge--ink">نفدت الكمية</span>
                ) : discount > 0 ? (
                  <span className="md-badge md-badge--sale">−{num(discount)}٪</span>
                ) : null
              }
            />
          </div>

          <div className="min-w-0">
            <div className="lg:sticky lg:top-[calc(var(--md-header-h)+1.5rem)]">
              <div className="flex items-center justify-between gap-3">
                <Link href={categoryHref} className="inline-flex min-h-9 items-center rounded-full bg-(--md-surface) px-3.5 text-xs font-semibold transition-colors hover:bg-(--md-studio)">
                  {product.brand || product.category.name}
                </Link>
                <div className="flex items-center gap-1">
                  <ShareButton title={product.name} />
                  <WishlistButton storeSlug={store.slug} product={product} className="border border-(--md-line) shadow-none" />
                </div>
              </div>

              <h1 className="md-h1 mt-4 text-[1.75rem] sm:text-[2.25rem]">{product.name}</h1>

              {reviews.length > 0 && (
                <a href="#reviews" className="mt-2 inline-flex min-h-9 items-center gap-2 text-sm hover:underline">
                  <Rating value={avg} count={reviews.length} />
                </a>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Price price={product.price} compareAt={product.compareAtPrice} size="xl" />
                {discount > 0 && product.compareAtPrice && (
                  <span className="md-badge md-badge--new">وفّر {formatPrice(product.compareAtPrice - product.price)}</span>
                )}
              </div>

              {inStock && product.stock <= 10 ? (
                <div className="mt-4">
                  <p className="text-sm font-medium text-(--md-warn)">فاضل {num(product.stock)} قطع بس — اطلب قبل ما يخلص</p>
                  <span className="mt-2 block h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-(--md-studio)" aria-hidden>
                    <span className="block h-full rounded-full bg-(--md-warn)" style={{ width: `${Math.max(8, product.stock * 10)}%` }} />
                  </span>
                </div>
              ) : (
                <p className={cn("mt-4 inline-flex items-center gap-2 text-sm font-medium", inStock ? "text-(--md-success)" : "text-(--md-sale)")}>
                  <span className="size-2 rounded-full bg-current" aria-hidden />
                  {inStock ? "متوفر وجاهز للشحن" : "نفدت الكمية"}
                </p>
              )}

              <div className="mt-7">
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

              {cheapest && (
                <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-2xl bg-(--md-surface) p-4">
                    <Truck className="mt-0.5 size-5 shrink-0 text-(--md-brand)" />
                    <div className="text-sm">
                      <p className="font-semibold">{cheapest.price === 0 ? "شحن مجاني متاح" : `الشحن من ${formatPrice(cheapest.price / 100)}`}</p>
                      <p className="mt-0.5 text-xs text-(--md-quiet)">{num(shipping.length)} طرق شحن متاحة</p>
                    </div>
                  </div>
                  {fastest?.estimatedDays && (
                    <div className="flex items-start gap-3 rounded-2xl bg-(--md-surface) p-4">
                      <Package className="mt-0.5 size-5 shrink-0 text-(--md-brand)" />
                      <div className="text-sm">
                        <p className="font-semibold">يوصلك خلال {num(fastest.estimatedDays)} أيام</p>
                        <p className="mt-0.5 text-xs text-(--md-quiet)">مع {fastest.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {product.type === "BUNDLE" && product.bundleItems && product.bundleItems.length > 0 && (
                <div className="mt-6 rounded-2xl bg-(--md-surface) p-4">
                  <p className="mb-3 text-sm font-semibold">الباقة فيها</p>
                  <ul className="space-y-2.5">
                    {product.bundleItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        {item.image && (
                          <span className="md-media size-11 shrink-0 rounded-lg">
                            <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm">{item.productName}</span>
                        <span className="md-price text-sm text-(--md-quiet)">× {num(item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 border-t border-(--md-line)">
                {product.description?.trim() && (
                  <Accordion title="وصف المنتج" open>
                    <p className="md-prose text-[0.9375rem]">{product.description}</p>
                  </Accordion>
                )}
                <Accordion title="التفاصيل والمواصفات" open={!product.description?.trim()}>
                  <dl className="divide-y divide-(--md-line) rounded-2xl bg-(--md-surface) px-4 text-sm">
                    {specs.map((s) => (
                      <div key={s.label} className="flex justify-between gap-6 py-3">
                        <dt className="text-(--md-quiet)">{s.label}</dt>
                        <dd className="min-w-0 text-end font-medium" dir={s.ltr ? "ltr" : undefined}>
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
                </Accordion>
                {shipping.length > 0 && (
                  <Accordion title="الشحن والتوصيل">
                    <ul className="space-y-2 text-sm">
                      {shipping.map((s) => (
                        <li key={s.id} className="flex justify-between gap-4 rounded-xl bg-(--md-surface) px-4 py-3">
                          <span>
                            {s.name}
                            {s.estimatedDays ? <span className="text-(--md-quiet)"> · خلال {num(s.estimatedDays)} أيام</span> : null}
                          </span>
                          <span className="md-price shrink-0">{s.price === 0 ? "مجاني" : formatPrice(s.price / 100)}</span>
                        </li>
                      ))}
                    </ul>
                  </Accordion>
                )}
              </div>
            </div>
          </div>
        </div>

        <section id="reviews" className="md-section mt-8 scroll-mt-28">
          <h2 className="md-h2 mb-6 sm:mb-8">التقييمات</h2>
          {reviews.length > 0 ? (
            <Reviews reviews={reviews} />
          ) : (
            <p className="md-panel p-6 text-[0.9375rem] text-(--md-quiet)">لسه مفيش تقييمات للمنتج ده. لو اشتريته، رأيك هيفرق مع اللي بعدك.</p>
          )}
        </section>
      </Wrap>

      {related.length > 0 && (
        <ProductRail products={related} storeSlug={store.slug} eyebrow="من نفس التصنيف" title="ممكن يعجبك كمان" href={categoryHref} />
      )}
      <RecentlyViewed storeSlug={store.slug} excludeId={product.id} />
    </div>
  );
}
