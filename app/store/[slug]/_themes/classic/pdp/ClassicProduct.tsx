import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ChevronDown, Star, Truck } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductViewProps, ReviewData } from "../../types";
import ProductRail from "../product/ProductRail";
import { Breadcrumbs, Container, Price, SectionHeading, Stars, discountPercent } from "../ui";
import Gallery from "./Gallery";
import PurchasePanel from "./PurchasePanel";
import ShareButton from "./ShareButton";

const nf = new Intl.NumberFormat("ar-EG");

function InfoSection({
  id,
  title,
  defaultOpen,
  children,
}: {
  id?: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details id={id} open={defaultOpen} className="c-accordion group scroll-mt-28 border-b border-border">
      <summary className="flex min-h-14 items-center justify-between gap-4 text-base font-bold sm:min-h-16 sm:text-lg">
        {title}
        <ChevronDown aria-hidden className="c-accordion-icon size-5 shrink-0 text-muted-foreground" />
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}

function Reviews({ reviews }: { reviews: ReviewData[] }) {
  if (reviews.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-(--c-radius) bg-(--c-subtle) px-4 py-5 text-sm text-muted-foreground">
        <Star className="size-5 shrink-0" />
        لسه مفيش تقييمات للمنتج ده.
      </div>
    );
  }
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-10">
        <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-1.5">
          <p className="text-5xl font-bold leading-none tabular-nums">{avg.toFixed(1)}</p>
          <div>
            <Stars value={avg} size="md" />
            <p className="mt-1 text-sm text-muted-foreground">{nf.format(reviews.length)} تقييم</p>
          </div>
        </div>
        <ul className="w-full max-w-xs space-y-1.5">
          {dist.map(({ star, count }) => (
            <li key={star} className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <span className="w-3 tabular-nums">{star}</span>
              <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="absolute inset-y-0 start-0 rounded-full bg-(--c-rating)"
                  style={{ width: `${(count / reviews.length) * 100}%` }}
                />
              </span>
              <span className="w-6 text-end tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="divide-y divide-border">
        {reviews.map((r) => (
          <li key={r.id} className="py-5 first:pt-0">
            <div className="flex items-center gap-3">
              <span className="c-img-bg relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-bold text-muted-foreground">
                {r.customerAvatar ? (
                  <Image src={r.customerAvatar} alt="" fill sizes="40px" className="object-cover" />
                ) : (
                  r.customerName.charAt(0)
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
                  {r.customerName}
                  {r.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-(--c-success)">
                      <BadgeCheck className="size-3.5" />
                      مشتري مؤكد
                    </span>
                  )}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Stars value={r.rating} />
                  <time className="text-xs text-muted-foreground" dateTime={new Date(r.reviewDate).toISOString()}>
                    {new Date(r.reviewDate).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                </div>
              </div>
            </div>
            {r.title && <p className="mt-3 text-sm font-semibold">{r.title}</p>}
            <p className="mt-1.5 whitespace-pre-line text-sm leading-7 text-foreground/85">{r.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ClassicProduct({ store, product, reviews, related, shipping }: ProductViewProps) {
  const inStock = product.stock > 0;
  const discount = discountPercent(product.price, product.compareAtPrice);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const cheapestShipping = shipping.length ? Math.min(...shipping.map((s) => s.price)) : null;

  const specs = [
    { label: "التصنيف", value: product.category.name, href: buildStoreUrl(store.slug, `/categories/${product.category.slug}`) },
    product.brand ? { label: "البراند", value: product.brand } : null,
    product.sku ? { label: "كود المنتج", value: product.sku, ltr: true } : null,
    product.weight !== null ? { label: "الوزن", value: `${product.weight} كجم` } : null,
    product.sizes.length ? { label: "المقاسات", value: product.sizes.join("، ") } : null,
    product.colors.length ? { label: "الألوان", value: product.colors.join("، ") } : null,
  ].filter(Boolean) as { label: string; value: string; href?: string; ltr?: boolean }[];

  return (
    <div className="c-has-bottom-bar">
      <Container>
        <div className="py-3 sm:py-5">
          <Breadcrumbs
            items={[
              { label: "الرئيسية", href: buildStoreUrl(store.slug) },
              { label: product.category.name, href: buildStoreUrl(store.slug, `/categories/${product.category.slug}`) },
              { label: product.name },
            ]}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          <div className="lg:sticky lg:top-[calc(var(--c-header-h)+3.75rem)] lg:self-start">
            <Gallery
              images={product.gallery}
              productName={product.name}
              badge={
                !inStock ? (
                  <span className="rounded-(--c-radius-sm) bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background">
                    نفد المخزون
                  </span>
                ) : discount > 0 ? (
                  <span className="rounded-(--c-radius-sm) bg-(--c-sale-solid) px-2.5 py-1.5 text-xs font-bold text-white tabular-nums">
                    خصم {discount}%
                  </span>
                ) : null
              }
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <Link
                href={buildStoreUrl(store.slug, `/categories/${product.category.slug}`)}
                className="inline-flex min-h-9 items-center text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {product.category.name}
              </Link>
              <ShareButton title={product.name} />
            </div>

            <h1 className="mt-1 text-[1.375rem] font-bold leading-snug tracking-tight sm:text-[1.75rem]">{product.name}</h1>

            {reviews.length > 0 && (
              <a href="#reviews" className="mt-2.5 inline-flex min-h-8 items-center gap-2 text-sm hover:underline">
                <Stars value={avg} size="md" />
                <span className="text-muted-foreground">
                  {avg.toFixed(1)} · {nf.format(reviews.length)} تقييم
                </span>
              </a>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Price price={product.price} compareAt={product.compareAtPrice} size="lg" />
              {discount > 0 && product.compareAtPrice && (
                <span className="rounded-(--c-radius-sm) bg-(--c-sale-soft) px-2 py-1 text-xs font-semibold text-(--c-sale)">
                  وفّر {formatPrice(product.compareAtPrice - product.price)}
                </span>
              )}
            </div>

            <p
              className={cn(
                "mt-3 inline-flex items-center gap-2 text-sm font-medium",
                !inStock ? "text-(--c-danger)" : product.stock <= 5 ? "text-(--c-warning)" : "text-(--c-success)",
              )}
            >
              <span className="size-2 rounded-full bg-current" aria-hidden />
              {!inStock ? "نفد المخزون" : product.stock <= 5 ? `باقي ${nf.format(product.stock)} قطع بس` : "متوفر"}
            </p>

            <div className="my-6 h-px bg-border" />

            <PurchasePanel
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

            {product.type === "BUNDLE" && product.bundleItems && product.bundleItems.length > 0 && (
              <div className="mt-6 rounded-(--c-radius) border border-border">
                <p className="border-b border-border px-4 py-3 text-sm font-semibold">الباقة فيها</p>
                <ul className="divide-y divide-border">
                  {product.bundleItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                      {item.image && (
                        <span className="c-img-bg relative size-10 shrink-0 overflow-hidden rounded-(--c-radius-sm)">
                          <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm">{item.productName}</span>
                      <span className="text-sm font-semibold tabular-nums text-muted-foreground">× {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {shipping.length > 0 && (
              <div className="mt-6 flex gap-3 rounded-(--c-radius) bg-(--c-subtle) p-4">
                <Truck className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">
                    {cheapestShipping === 0 ? "متاح شحن مجاني" : `الشحن يبدأ من ${formatPrice((cheapestShipping ?? 0) / 100)}`}
                  </p>
                  <ul className="mt-1.5 space-y-1 text-muted-foreground">
                    {shipping.slice(0, 3).map((s) => (
                      <li key={s.id} className="flex justify-between gap-3">
                        <span className="truncate">
                          {s.name}
                          {s.estimatedDays ? ` · ${nf.format(s.estimatedDays)} أيام` : ""}
                        </span>
                        <span className="shrink-0 tabular-nums">{s.price === 0 ? "مجاني" : formatPrice(s.price / 100)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-8 border-t border-border">
              {product.description?.trim() && (
                <InfoSection title="وصف المنتج" defaultOpen>
                  <p className="whitespace-pre-line text-[0.9375rem] leading-8 text-foreground/85">{product.description}</p>
                </InfoSection>
              )}
              <InfoSection title="التفاصيل" defaultOpen={!product.description?.trim()}>
                <dl className="divide-y divide-border text-sm">
                  {specs.map((s) => (
                    <div key={s.label} className="flex justify-between gap-6 py-2.5">
                      <dt className="shrink-0 text-muted-foreground">{s.label}</dt>
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
              </InfoSection>
              <InfoSection id="reviews" title={`التقييمات${reviews.length ? ` (${nf.format(reviews.length)})` : ""}`} defaultOpen={reviews.length > 0}>
                <Reviews reviews={reviews} />
              </InfoSection>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="c-section mt-[calc(var(--c-section-y)/2)]">
            <SectionHeading
              title="ممكن يعجبك كمان"
              href={buildStoreUrl(store.slug, `/categories/${product.category.slug}`)}
            />
            <ProductRail products={related} storeSlug={store.slug} />
          </section>
        )}
      </Container>
    </div>
  );
}
