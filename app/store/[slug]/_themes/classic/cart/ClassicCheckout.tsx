import Image from "next/image";
import Link from "next/link";
import { CreditCard, ShoppingBag } from "lucide-react";

import CheckoutForm from "../../../checkout/_components/CheckoutForm";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

import type { CheckoutViewProps } from "../../types";
import { Container, EmptyState, PageHeader, btn } from "../ui";
import { FEATURE_LABEL, unitPriceFor } from "../../shared/commerce";
import { formatPrice, lazyStoreIntl, st } from "@/lib/i18n/storefront";

const nf = lazyStoreIntl.number();

export default function ClassicCheckout({ storeSlug, cart, paymentMethods, createOrder, legal }: CheckoutViewProps) {
  const { items, summary } = cart;
  const count = items.reduce((t, i) => t + i.quantity, 0);

  return (
    <Container className="pb-6">
      <PageHeader
        breadcrumbs={[
          { label: st("الرئيسية"), href: buildStoreUrl(storeSlug) },
          { label: st("السلة"), href: buildStoreUrl(storeSlug, "/cart") },
          { label: st("إتمام الطلب") },
        ]}
        title={st("إتمام الطلب")}
        meta={st("اكتب بياناتك والمتجر هيتواصل معاك لتأكيد الطلب.")}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag />}
          title={st("سلتك فاضية")}
          description={st("ضيف منتجات للسلة الأول وبعدين كمّل طلبك.")}
          action={
            <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg" })}>
              {st("تصفح المنتجات")}
            </Link>
          }
        />
      ) : paymentMethods.length === 0 ? (
        <EmptyState
          icon={<CreditCard />}
          title={st("مفيش طرق دفع متاحة دلوقتي")}
          description={st("المتجر لسه مفعّلش طريقة دفع. جرب تاني بعد شوية أو تواصل مع المتجر.")}
          action={
            <Link href={buildStoreUrl(storeSlug, "/contact")} className={btn({ variant: "outline" })}>
              {st("تواصل مع المتجر")}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="order-2 lg:order-1">
            <CheckoutForm paymentMethods={paymentMethods} action={createOrder} legal={legal} storeSlug={storeSlug} defaultGovernorate={cart.selectedGovernorate} digitalOnly={cart.digitalOnly} total={cart.summary.total} />
          </div>

          {/* Summary first on phones so the shopper sees what they're paying for */}
          <aside aria-label={st("ملخص الطلب")} className="order-1 lg:sticky lg:top-[calc(var(--c-header-h)+3.75rem)] lg:order-2 lg:self-start">
            <details className="c-accordion group rounded-(--c-radius-lg) bg-(--c-subtle) lg:pointer-events-none" open>
              <summary className="flex min-h-14 items-center justify-between gap-3 px-5 sm:px-6">
                <span className="text-base font-bold">
                  {st("ملخص الطلب")}{" "}<span className="font-normal text-muted-foreground">({nf.format(count)})</span>
                </span>
                <span className="text-base font-bold tabular-nums">{formatPrice(summary.total)}</span>
              </summary>
              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                <ul className="space-y-3.5 border-t border-border pt-4">
                  {items.map((item) => {
                    const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                    const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                    return (
                      <li key={item.id} className="flex items-center gap-3">
                        <span className="relative size-14 shrink-0 overflow-hidden rounded-(--c-radius-sm) bg-background">
                          <Image
                            src={item.product.image || "/images/product-placeholder.png"}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                          <span className="absolute end-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1 text-[0.6875rem] font-bold text-background tabular-nums">
                            {item.quantity}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 text-sm font-medium">{item.product.name}</span>
                          {features.length > 0 && (
                            <span className="block text-xs text-muted-foreground">
                              {features.map(([k, v]) => `${FEATURE_LABEL[k] ?? k}: ${v}`).join(" · ")}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(unit * item.quantity)}</span>
                      </li>
                    );
                  })}
                </ul>

                <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{st("المجموع الفرعي")}</dt>
                    <dd className="tabular-nums">{formatPrice(summary.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{st("الشحن")}</dt>
                    <dd className="tabular-nums">{summary.shipping === 0 ? st("مجاني") : formatPrice(summary.shipping)}</dd>
                  </div>
                  {summary.discount > 0 && (
                    <div className="flex justify-between gap-4 text-(--c-success)">
                      <dt>{st("الخصم")}</dt>
                      <dd className="font-semibold tabular-nums">− {formatPrice(summary.discount)}</dd>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3.5">
                    <dt className="text-base font-bold">{st("الإجمالي")}</dt>
                    <dd className="text-xl font-bold tabular-nums">{formatPrice(summary.total)}</dd>
                  </div>
                </dl>

                <Link
                  href={buildStoreUrl(storeSlug, "/cart")}
                  className="pointer-events-auto mt-4 inline-flex min-h-10 items-center text-sm font-semibold underline-offset-4 hover:underline"
                >
                  {st("تعديل السلة")}
                </Link>
              </div>
            </details>
          </aside>
        </div>
      )}
    </Container>
  );
}
