import Image from "next/image";
import Link from "next/link";
import { ArrowDown, BadgeCheck, Clock, PackageCheck, Truck } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { formatPrice } from "@/lib/utils";
import type { ProductViewProps, ReviewData } from "../../types";
import BuyForm from "../product/BuyForm";
import ProductCard from "../product/ProductCard";
import Rail from "../product/Rail";
import RecentlyViewed, { TrackView } from "../sections/RecentlyViewed";
import { Crumbs, Price, Rating, SectionHeader, StockLine, Wrap, discountPercent, num } from "../ui";
import DetailTabs from "./DetailTabs";
import Gallery from "./Gallery";

function Reviews({ reviews }: { reviews: ReviewData[] }) {
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
      <div className="h-fit rounded-(--ce-r) bg-(--ce-band) p-6">
        <p className="ce-display text-5xl leading-none">{avg.toFixed(1)}</p>
        <Rating value={avg} size="md" className="mt-3" />
        <p className="mt-1 text-sm text-(--ce-quiet)">من {num(reviews.length)} تقييم</p>
        <ul className="mt-5 space-y-2">
          {dist.map(({ star, count }) => (
            <li key={star} className="flex items-center gap-3 text-xs">
              <span className="w-3 tabular-nums">{num(star)}</span>
              <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-(--ce-line)">
                <span className="absolute inset-y-0 start-0 rounded-full bg-(--ce-star)" style={{ width: `${(count / reviews.length) * 100}%` }} />
              </span>
              <span className="w-6 text-end tabular-nums text-(--ce-quiet)">{num(count)}</span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="divide-y divide-(--ce-line)">
        {reviews.slice(0, 8).map((r) => (
          <li key={r.id} className="py-5 first:pt-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-(--ce-tint) text-sm font-bold text-(--ce-link)">
                  {r.customerAvatar ? <Image src={r.customerAvatar} alt="" fill sizes="40px" className="object-cover" /> : [...r.customerName][0]}
                </span>
                <div>
                  <p className="text-sm font-semibold text-(--ce-ink)">{r.customerName}</p>
                  <time className="text-xs text-(--ce-quiet)" dateTime={new Date(r.reviewDate).toISOString()}>
                    {new Date(r.reviewDate).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                </div>
              </div>
              <Rating value={r.rating} />
            </div>
            {r.verifiedPurchase && (
              <p className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-(--ce-success)">
                <BadgeCheck className="size-3.5" />
                مشتري مؤكد
              </p>
            )}
            {r.title && <p className="ce-h4 mt-2">{r.title}</p>}
            <p className="mt-1 whitespace-pre-line text-[0.9375rem] leading-7">{r.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CelloProduct({ store, product, reviews, related, shipping }: ProductViewProps) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const inStock = product.stock > 0;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const categoryHref = buildStoreUrl(store.slug, `/categories/${product.category.slug}`);
  const cheapest = shipping.length ? shipping.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const fastest = shipping.filter((s) => s.estimatedDays).sort((a, b) => (a.estimatedDays ?? 99) - (b.estimatedDays ?? 99))[0];
  const description = product.description?.trim();

  const specs = [
    { label: "التصنيف", value: product.category.name, href: categoryHref },
    product.brand ? { label: "البراند", value: product.brand } : null,
    product.sku ? { label: "كود المنتج", value: product.sku, ltr: true } : null,
    product.weight !== null ? { label: "الوزن", value: `${num(product.weight)} كجم` } : null,
    product.sizes.length ? { label: "المقاسات", value: product.sizes.join("، ") } : null,
    product.colors.length ? { label: "الألوان", value: product.colors.join("، ") } : null,
  ].filter(Boolean) as { label: string; value: string; href?: string; ltr?: boolean }[];

  // Service facts from the store's real shipping methods only.
  const delivery = [
    cheapest && { Icon: Truck, text: cheapest.price === 0 ? "شحن مجاني متاح" : `شحن من ${formatPrice(cheapest.price / 100)}` },
    fastest?.estimatedDays && { Icon: Clock, text: `توصيل خلال ${num(fastest.estimatedDays)} أيام` },
    inStock && { Icon: PackageCheck, text: "متوفر للطلب" },
  ].filter(Boolean) as { Icon: typeof Truck; text: string }[];

  const badges = !inStock ? (
    <span className="ce-badge ce-badge--out">نفدت الكمية</span>
  ) : (
    <>
      {product.isFeatured && <span className="ce-badge ce-badge--pick">اختيار المتجر</span>}
      {off > 0 && <span className="ce-badge ce-badge--drop">خصم {num(off)}٪</span>}
    </>
  );

  const tabs = [
    description && { id: "description", label: "الوصف", content: <p className="ce-prose max-w-none text-[0.9375rem]">{description}</p> },
    { id: "specs", label: "المواصفات", content: <Specs specs={specs} /> },
    shipping.length > 0 && { id: "shipping", label: "الشحن والتوصيل", content: <ShippingList shipping={shipping} /> },
  ].filter(Boolean) as { id: string; label: string; content: React.ReactNode }[];

  return (
    <div className="pb-8">
      <TrackView storeSlug={store.slug} productId={product.id} />
      <Wrap>
        <Crumbs
          className="py-4"
          items={[
            { label: "الرئيسية", href: buildStoreUrl(store.slug) },
            { label: product.category.name, href: categoryHref },
            { label: product.name },
          ]}
        />

        <div className="grid grid-cols-1 gap-6 rounded-(--ce-r-lg) bg-(--ce-card) p-3 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8">
          <div className="min-w-0">
            <Gallery images={product.gallery} name={product.name} badges={badges} />
          </div>

          <div className="min-w-0 px-1 lg:px-0">
            <div className="lg:sticky lg:top-6">
              <Link href={categoryHref} className="text-sm text-(--ce-quiet) hover:text-(--ce-btn)">
                {product.brand || product.category.name}
              </Link>
              <h1 className="ce-h1 mt-1 text-balance">{product.name}</h1>
              {reviews.length > 0 && (
                <a href="#reviews" className="mt-2 inline-flex min-h-8 items-center gap-1.5 text-sm hover:underline">
                  <Rating value={avg} count={reviews.length} />
                </a>
              )}
              <Price price={product.price} compareAt={product.compareAtPrice} size="xl" chip className="mt-3" />
              <hr className="my-5 border-(--ce-line)" />

              <StockLine stock={product.stock} count className="mb-5" />

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

              {description && <p className="mt-6 line-clamp-4 text-[0.9375rem] leading-7">{description}</p>}

              {product.type === "BUNDLE" && product.bundleItems && product.bundleItems.length > 0 && (
                <div className="mt-6 rounded-(--ce-r) border border-(--ce-line) p-4">
                  <p className="mb-3 text-sm font-semibold text-(--ce-ink)">الباقة فيها</p>
                  <ul className="space-y-2.5">
                    {product.bundleItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        {item.image && (
                          <span className="relative size-11 shrink-0 overflow-hidden rounded-(--ce-r-sm) border border-(--ce-line)">
                            <Image src={item.image} alt="" fill sizes="44px" className="ce-product-img" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm">{item.productName}</span>
                        <span className="ce-num text-sm text-(--ce-quiet)">× {num(item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {delivery.length > 0 && (
                <ul className="mt-6 grid grid-cols-3 gap-3">
                  {delivery.map(({ Icon, text }) => (
                    <li key={text} className="flex flex-col items-center gap-2.5 text-center text-sm font-medium text-(--ce-ink)">
                      <span className="grid size-12 place-items-center rounded-full bg-(--ce-band)">
                        <Icon className="size-5 text-(--ce-quiet)" strokeWidth={1.5} />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              )}

              <a href="#details" className="mt-6 inline-flex min-h-10 items-center gap-1.5 text-sm text-(--ce-ink) hover:text-(--ce-btn)">
                تفاصيل المنتج
                <ArrowDown aria-hidden className="size-4" />
              </a>
            </div>
          </div>
        </div>

        <section id="details" aria-label="تفاصيل المنتج" className="mt-8 scroll-mt-28 rounded-(--ce-r-lg) bg-(--ce-card) p-4 sm:p-6">
          <DetailTabs tabs={tabs} />
        </section>

        <section id="reviews" className="ce-section mt-6 scroll-mt-28">
          <SectionHeader title="تقييمات العملاء" />
          {reviews.length > 0 ? (
            <div className="rounded-(--ce-r-lg) bg-(--ce-card) p-4 sm:p-6">
              <Reviews reviews={reviews} />
            </div>
          ) : (
            <p className="rounded-(--ce-r-lg) bg-(--ce-card) px-5 py-8 text-center text-[0.9375rem]">لسه مفيش تقييمات للمنتج ده.</p>
          )}
        </section>

        {related.length > 0 && (
          <section className="ce-section">
            <Rail label="منتجات مشابهة" title="ممكن يعجبك كمان" sub={`من ${product.category.name}`} href={categoryHref} linkLabel={`كل ${product.category.name}`}>
              {related.slice(0, 12).map((p, i) => (
                <li key={p.id} className="min-w-0">
                  <ProductCard product={p} storeSlug={store.slug} index={i} sizes="(max-width: 768px) 46vw, 18vw" />
                </li>
              ))}
            </Rail>
          </section>
        )}
      </Wrap>
      <RecentlyViewed storeSlug={store.slug} excludeId={product.id} />
    </div>
  );
}

function Specs({ specs }: { specs: { label: string; value: string; href?: string; ltr?: boolean }[] }) {
  return (
    <table className="w-full max-w-3xl text-[0.9375rem]">
      <tbody>
        {specs.map((s) => (
          <tr key={s.label} className="border-b border-(--ce-line) last:border-0">
            <th scope="row" className="w-2/5 py-3 pe-4 text-start font-normal text-(--ce-quiet)">
              {s.label}
            </th>
            <td className="py-3 text-(--ce-ink)" dir={s.ltr ? "ltr" : undefined}>
              {s.href ? (
                <Link href={s.href} className="underline-offset-4 hover:text-(--ce-btn) hover:underline">
                  {s.value}
                </Link>
              ) : (
                s.value
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ShippingList({ shipping }: { shipping: ProductViewProps["shipping"] }) {
  return (
    <ul className="max-w-3xl text-[0.9375rem]">
      {shipping.map((s) => (
        <li key={s.id} className="flex justify-between gap-4 border-b border-(--ce-line) py-3 last:border-0">
          <span className="text-(--ce-ink)">
            {s.name}
            {s.estimatedDays ? <span className="text-(--ce-quiet)"> · خلال {num(s.estimatedDays)} أيام</span> : null}
          </span>
          <span className="ce-num shrink-0 font-medium text-(--ce-ink)">{s.price === 0 ? "مجاني" : formatPrice(s.price / 100)}</span>
        </li>
      ))}
    </ul>
  );
}
