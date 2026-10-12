import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ChevronDown, Clock, PackageCheck, ShieldCheck, Truck } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { formatPrice } from "@/lib/utils";
import type { ProductViewProps, ReviewData } from "../../types";
import BuyForm from "../product/BuyForm";
import ProductCard from "../product/ProductCard";
import Rail from "../product/Rail";
import RecentlyViewed, { TrackView } from "../sections/RecentlyViewed";
import { Crumbs, Price, Rating, SectionHeader, StockLine, Wrap, discountPercent, num } from "../ui";
import Gallery from "./Gallery";

function Panel({ title, open, children, id }: { title: string; open?: boolean; children: React.ReactNode; id?: string }) {
  return (
    <details id={id} open={open} className="mx-details scroll-mt-28 border-b border-(--mx-line)">
      <summary className="flex min-h-14 items-center justify-between gap-4 text-[1.0625rem] font-bold text-(--mx-ink)">
        {title}
        <ChevronDown className="mx-chev" />
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}

function Reviews({ reviews }: { reviews: ReviewData[] }) {
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
      <div className="h-fit rounded-(--mx-r-lg) bg-(--mx-band) p-6">
        <p className="mx-display text-5xl leading-none">{avg.toFixed(1)}</p>
        <Rating value={avg} size="md" className="mt-3" />
        <p className="mt-1 text-sm text-(--mx-quiet)">من {num(reviews.length)} تقييم</p>
        <ul className="mt-5 space-y-2">
          {dist.map(({ star, count }) => (
            <li key={star} className="flex items-center gap-3 text-xs">
              <span className="w-3 tabular-nums">{num(star)}</span>
              <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-(--mx-line)">
                <span className="absolute inset-y-0 start-0 rounded-full bg-(--mx-star)" style={{ width: `${(count / reviews.length) * 100}%` }} />
              </span>
              <span className="w-6 text-end tabular-nums text-(--mx-quiet)">{num(count)}</span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="divide-y divide-(--mx-line)">
        {reviews.slice(0, 8).map((r) => (
          <li key={r.id} className="py-5 first:pt-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-(--mx-tint) text-sm font-bold text-(--mx-link)">
                  {r.customerAvatar ? <Image src={r.customerAvatar} alt="" fill sizes="40px" className="object-cover" /> : [...r.customerName][0]}
                </span>
                <div>
                  <p className="text-sm font-semibold text-(--mx-ink)">{r.customerName}</p>
                  <time className="text-xs text-(--mx-quiet)" dateTime={new Date(r.reviewDate).toISOString()}>
                    {new Date(r.reviewDate).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                </div>
              </div>
              <Rating value={r.rating} />
            </div>
            {r.verifiedPurchase && (
              <p className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-(--mx-success)">
                <BadgeCheck className="size-3.5" />
                مشتري مؤكد
              </p>
            )}
            {r.title && <p className="mx-h4 mt-2">{r.title}</p>}
            <p className="mt-1 whitespace-pre-line text-[0.9375rem] leading-7">{r.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MaxProduct({ store, product, reviews, related, shipping }: ProductViewProps) {
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

  const delivery = [
    inStock && { Icon: PackageCheck, text: "متوفر وجاهز للشحن" },
    cheapest && { Icon: Truck, text: cheapest.price === 0 ? "شحن مجاني متاح" : `الشحن يبدأ من ${formatPrice(cheapest.price / 100)}` },
    fastest?.estimatedDays && { Icon: Clock, text: `يوصلك خلال ${num(fastest.estimatedDays)} أيام مع ${fastest.name}` },
    inStock && { Icon: ShieldCheck, text: "المتجر بيأكد طلبك معاك قبل الشحن" },
  ].filter(Boolean) as { Icon: typeof Truck; text: string }[];

  const badges = !inStock ? (
    <span className="mx-badge mx-badge--out">نفدت الكمية</span>
  ) : (
    <>
      {product.isFeatured && <span className="mx-badge mx-badge--pick">اختيار المتجر</span>}
      {off > 0 && <span className="mx-badge mx-badge--drop">خصم {num(off)}٪</span>}
    </>
  );

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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          <div className="min-w-0">
            <Gallery images={product.gallery} name={product.name} badges={badges} />

            <div className="mt-8 hidden border-t border-(--mx-line) lg:block">
              <Details description={description} specs={specs} shipping={shipping} />
            </div>
          </div>

          <div className="min-w-0">
            <div className="lg:sticky lg:top-6">
              <Link href={categoryHref} className="text-sm text-(--mx-quiet) hover:text-(--mx-link)">
                {product.brand || product.category.name}
              </Link>
              <h1 className="mx-h1 mt-1 text-balance">{product.name}</h1>
              {reviews.length > 0 && (
                <a href="#reviews" className="mt-2 inline-flex min-h-8 items-center gap-1.5 text-sm hover:underline">
                  <Rating value={avg} count={reviews.length} />
                </a>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Price price={product.price} compareAt={product.compareAtPrice} size="xl" />
                {off > 0 && product.compareAtPrice && <span className="text-sm font-semibold text-(--mx-sale)">وفّر {formatPrice(product.compareAtPrice - product.price)}</span>}
              </div>
              {description && <p className="mt-4 line-clamp-4 text-[0.9375rem] leading-7">{description}</p>}
              <StockLine stock={product.stock} className="mt-4" />

              <div className="mt-5">
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
                <div className="mt-6 rounded-(--mx-r) border border-(--mx-line) p-4">
                  <p className="mb-3 text-sm font-semibold text-(--mx-ink)">الباقة فيها</p>
                  <ul className="space-y-2.5">
                    {product.bundleItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        {item.image && (
                          <span className="mx-media size-11 shrink-0 rounded-(--mx-r-sm)">
                            <Image src={item.image} alt="" fill sizes="44px" className="mx-product-img" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm">{item.productName}</span>
                        <span className="mx-num text-sm text-(--mx-quiet)">× {num(item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {delivery.length > 0 && (
                <ul className="mt-6 space-y-2.5 border-t border-(--mx-line) pt-5">
                  {delivery.map(({ Icon, text }) => (
                    <li key={text} className="flex items-center gap-3 text-sm">
                      <Icon className="size-5 shrink-0 text-(--mx-link)" strokeWidth={1.5} />
                      {text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Phones/tablets: details after the buy box */}
        <div className="mt-8 border-t border-(--mx-line) lg:hidden">
          <Details description={description} specs={specs} shipping={shipping} />
        </div>

        <section id="reviews" className="mx-section mt-6 scroll-mt-28">
          <SectionHeader title="تقييمات العملاء" />
          {reviews.length > 0 ? <Reviews reviews={reviews} /> : <p className="rounded-(--mx-r-lg) bg-(--mx-band) px-5 py-8 text-center text-[0.9375rem]">لسه مفيش تقييمات للمنتج ده.</p>}
        </section>

        {related.length > 0 && (
          <section className="mx-section">
            <SectionHeader eyebrow="من نفس التصنيف" title="ممكن يعجبك كمان" href={categoryHref} linkLabel={`كل ${product.category.name}`} />
            <Rail label="منتجات مشابهة">
              {related.slice(0, 12).map((p, i) => (
                <li key={p.id} className="min-w-0">
                  <ProductCard product={p} storeSlug={store.slug} index={i} sizes="(max-width: 768px) 46vw, 16vw" />
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

function Details({ description, specs, shipping }: { description?: string; specs: { label: string; value: string; href?: string; ltr?: boolean }[]; shipping: ProductViewProps["shipping"] }) {
  return (
    <>
      {description && (
        <Panel title="وصف المنتج" open>
          <p className="mx-prose text-[0.9375rem]">{description}</p>
        </Panel>
      )}
      <Panel title="المواصفات" open={!description}>
        <table className="w-full text-sm">
          <tbody>
            {specs.map((s) => (
              <tr key={s.label} className="border-b border-(--mx-line) last:border-0">
                <th scope="row" className="w-2/5 py-3 pe-4 text-start font-normal text-(--mx-quiet)">
                  {s.label}
                </th>
                <td className="py-3 text-(--mx-ink)" dir={s.ltr ? "ltr" : undefined}>
                  {s.href ? (
                    <Link href={s.href} className="underline-offset-4 hover:text-(--mx-link) hover:underline">
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
      </Panel>
      {shipping.length > 0 && (
        <Panel title="الشحن والتوصيل">
          <ul className="text-sm">
            {shipping.map((s) => (
              <li key={s.id} className="flex justify-between gap-4 border-b border-(--mx-line) py-3 last:border-0">
                <span className="text-(--mx-ink)">
                  {s.name}
                  {s.estimatedDays ? <span className="text-(--mx-quiet)"> · خلال {num(s.estimatedDays)} أيام</span> : null}
                </span>
                <span className="mx-num shrink-0 font-semibold text-(--mx-ink)">{s.price === 0 ? "مجاني" : formatPrice(s.price / 100)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
