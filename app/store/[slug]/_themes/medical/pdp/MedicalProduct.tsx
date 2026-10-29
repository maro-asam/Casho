import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Clock, Info, MessageCircle, PackageCheck, ShieldCheck, Truck } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductViewProps, ReviewData } from "../../types";
import { whatsappHref } from "../../shared/social";
import { askAboutMessage, waWith } from "../lib/rx";
import BuyForm from "../product/BuyForm";
import ProductCard from "../product/ProductCard";
import Rail from "../product/Rail";
import RecentlyViewed, { TrackView } from "../sections/RecentlyViewed";
import { Crumbs, Note, OPTION_LABEL, Price, Rating, SectionHeader, StockLine, Wrap, discountPercent, num } from "../ui";
import DetailTabs from "./DetailTabs";
import Gallery from "./Gallery";

function Reviews({ reviews }: { reviews: ReviewData[] }) {
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
      <div className="h-fit rounded-(--rx-r) bg-(--rx-tint) p-6 text-(--rx-tint-ink)">
        <p className="text-5xl leading-none font-bold">{avg.toFixed(1)}</p>
        <Rating value={avg} size="md" className="mt-3" />
        <p className="mt-1 text-sm opacity-80">من {num(reviews.length)} تقييم</p>
        <ul className="mt-5 space-y-2">
          {dist.map(({ star, count }) => (
            <li key={star} className="flex items-center gap-3 text-xs">
              <span className="w-3 tabular-nums">{num(star)}</span>
              <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-(--rx-card)">
                <span className="absolute inset-y-0 start-0 rounded-full bg-(--rx-star)" style={{ width: `${(count / reviews.length) * 100}%` }} />
              </span>
              <span className="w-6 text-end tabular-nums opacity-80">{num(count)}</span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="divide-y divide-(--rx-line)">
        {reviews.slice(0, 8).map((r) => (
          <li key={r.id} className="py-5 first:pt-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-(--rx-tint) text-sm font-bold text-(--rx-btn)">
                  {r.customerAvatar ? <Image src={r.customerAvatar} alt="" fill sizes="40px" className="object-cover" /> : [...r.customerName][0]}
                </span>
                <div>
                  <p className="text-sm font-bold text-(--rx-ink)">{r.customerName}</p>
                  <time className="text-xs text-(--rx-quiet)" dateTime={new Date(r.reviewDate).toISOString()}>
                    {new Date(r.reviewDate).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                </div>
              </div>
              <Rating value={r.rating} />
            </div>
            {r.verifiedPurchase && (
              <p className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-(--rx-ok)">
                <BadgeCheck className="size-3.5" />
                مشتري مؤكد
              </p>
            )}
            {r.title && <p className="rx-h4 mt-2">{r.title}</p>}
            <p className="mt-1 whitespace-pre-line text-[0.9375rem] leading-7">{r.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MedicalProduct({ store, product, reviews, related, shipping, whatsapp }: ProductViewProps) {
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
    product.brand ? { label: "الشركة المصنعة", value: product.brand } : null,
    product.sku ? { label: "كود المنتج", value: product.sku, ltr: true } : null,
    product.weight !== null ? { label: "الوزن", value: `${num(product.weight)} كجم` } : null,
    product.sizes.length ? { label: OPTION_LABEL.size, value: product.sizes.join("، ") } : null,
    product.colors.length ? { label: OPTION_LABEL.color, value: product.colors.join("، ") } : null,
  ].filter(Boolean) as { label: string; value: string; href?: string; ltr?: boolean }[];

  // Service facts from the store's real shipping methods only.
  const delivery = [
    cheapest && { Icon: Truck, title: cheapest.price === 0 ? "توصيل مجاني متاح" : `توصيل من ${formatPrice(cheapest.price / 100)}`, note: cheapest.name },
    fastest?.estimatedDays && { Icon: Clock, title: `يوصلك خلال ${num(fastest.estimatedDays)} أيام`, note: fastest.name },
    inStock && { Icon: PackageCheck, title: "متوفر للطلب", note: "المتجر هيأكد معاك قبل الشحن" },
  ].filter(Boolean) as { Icon: typeof Truck; title: string; note: string }[];

  const badges = !inStock ? (
    <span className="rx-badge rx-badge--out">غير متوفر</span>
  ) : (
    <>
      {off > 0 && <span className="rx-badge rx-badge--sale">خصم {num(off)}٪</span>}
      {product.isFeatured && <span className="rx-badge rx-badge--pick">اختيار المتجر</span>}
    </>
  );

  const tabs = [
    description && { id: "description", label: "الوصف", content: <p className="rx-prose max-w-none text-[0.9375rem]">{description}</p> },
    { id: "specs", label: "التفاصيل", content: <Specs specs={specs} /> },
    shipping.length > 0 && { id: "shipping", label: "التوصيل", content: <ShippingList shipping={shipping} /> },
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
          <div className="min-w-0">
            <div className="lg:sticky lg:top-6">
              <Gallery images={product.gallery} name={product.name} badges={badges} />
            </div>
          </div>

          <div className="min-w-0">
            <div className="rx-panel p-4 sm:p-6">
              <Link href={categoryHref} className="text-sm font-semibold text-(--rx-link) hover:underline">
                {product.brand || product.category.name}
              </Link>
              <h1 className="rx-h1 mt-1 text-balance">{product.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <StockLine stock={product.stock} count />
                {reviews.length > 0 && (
                  <a href="#reviews" className="inline-flex min-h-8 items-center hover:underline">
                    <Rating value={avg} count={reviews.length} />
                  </a>
                )}
                {product.sku && (
                  <span className="text-xs text-(--rx-quiet)">
                    كود: <span dir="ltr">{product.sku}</span>
                  </span>
                )}
              </div>
              <Price price={product.price} compareAt={product.compareAtPrice} size="xl" chip className="mt-4" />
              <hr className="my-5 border-(--rx-line)" />

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

              {wa && (
                <a
                  href={waWith(wa, askAboutMessage(product.name))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-5 flex items-center gap-3 rounded-(--rx-r) border border-(--rx-line) p-3.5 transition-colors hover:border-(--rx-wa)"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-(--rx-ok-tint) text-(--rx-wa)">
                    <MessageCircle className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-(--rx-ink)">عندك سؤال عن المنتج ده؟</span>
                    <span className="block text-xs text-(--rx-quiet)">اسأل الصيدلي على واتساب قبل ما تطلب</span>
                  </span>
                  <span className="text-sm font-bold text-(--rx-wa) group-hover:underline">اسأل</span>
                </a>
              )}

              {product.type === "BUNDLE" && product.bundleItems && product.bundleItems.length > 0 && (
                <div className="mt-5 rounded-(--rx-r) border border-(--rx-line) p-4">
                  <p className="mb-3 text-sm font-bold text-(--rx-ink)">الباقة فيها</p>
                  <ul className="space-y-2.5">
                    {product.bundleItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        {item.image && (
                          <span className="rx-media relative size-11 shrink-0 rounded-(--rx-r-sm)">
                            <Image src={item.image} alt="" fill sizes="44px" className="rx-product-img" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm">{item.productName}</span>
                        <span className="rx-num text-sm text-(--rx-quiet)">× {num(item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {delivery.length > 0 && (
              <ul className={cn("mt-(--rx-gap) grid gap-2", delivery.length === 3 ? "sm:grid-cols-3" : delivery.length === 2 && "sm:grid-cols-2")}>
                {delivery.map(({ Icon, title, note }) => (
                  <li key={title} className={cn("flex items-center gap-3 rounded-(--rx-r) bg-(--rx-band) p-3", delivery.length === 3 && "sm:flex-col sm:items-start sm:gap-2")}>
                    <Icon className="size-5 shrink-0 text-(--rx-btn)" strokeWidth={1.75} />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-(--rx-ink)">{title}</span>
                      <span className="block truncate text-xs text-(--rx-quiet)">{note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <Note icon={<Info />} className="mt-(--rx-gap)">
              المعلومات المعروضة للتوضيح بس ومش بديل عن استشارة الطبيب أو الصيدلي. اقرأ النشرة الداخلية قبل الاستخدام.
            </Note>
          </div>
        </div>

        <section id="details" aria-label="تفاصيل المنتج" className="rx-panel mt-8 scroll-mt-28 p-4 sm:p-6">
          <DetailTabs tabs={tabs} />
        </section>

        <section id="reviews" className="rx-section mt-4 scroll-mt-28">
          <SectionHeader title="تقييمات العملاء" />
          {reviews.length > 0 ? (
            <div className="rx-panel p-4 sm:p-6">
              <Reviews reviews={reviews} />
            </div>
          ) : (
            <p className="rx-panel flex items-center justify-center gap-2 px-5 py-8 text-center text-[0.9375rem]">
              <ShieldCheck className="size-5 text-(--rx-quiet)" />
              لسه مفيش تقييمات للمنتج ده.
            </p>
          )}
        </section>

        {related.length > 0 && (
          <section className="rx-section">
            <Rail label="منتجات مشابهة" title="بدائل ومنتجات مشابهة" sub={`من قسم ${product.category.name}`} href={categoryHref} linkLabel="كل القسم">
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
    <dl className="grid max-w-3xl gap-px overflow-hidden rounded-(--rx-r) border border-(--rx-line) bg-(--rx-line) text-[0.9375rem] sm:grid-cols-2">
      {specs.map((s) => (
        <div key={s.label} className="flex flex-col gap-0.5 bg-(--rx-card) px-4 py-3">
          <dt className="text-xs text-(--rx-quiet)">{s.label}</dt>
          <dd className="font-semibold text-(--rx-ink)" dir={s.ltr ? "ltr" : undefined}>
            {s.href ? (
              <Link href={s.href} className="underline-offset-4 hover:text-(--rx-btn) hover:underline">
                {s.value}
              </Link>
            ) : (
              <span className={s.ltr ? "inline-block" : undefined}>{s.value}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ShippingList({ shipping }: { shipping: ProductViewProps["shipping"] }) {
  return (
    <ul className="max-w-3xl text-[0.9375rem]">
      {shipping.map((s) => (
        <li key={s.id} className="flex justify-between gap-4 border-b border-(--rx-line) py-3 last:border-0">
          <span className="text-(--rx-ink)">
            {s.name}
            {s.estimatedDays ? <span className="text-(--rx-quiet)"> · خلال {num(s.estimatedDays)} أيام</span> : null}
          </span>
          <span className="rx-num shrink-0 font-bold text-(--rx-ink)">{s.price === 0 ? "مجاني" : formatPrice(s.price / 100)}</span>
        </li>
      ))}
    </ul>
  );
}
