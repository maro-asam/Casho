import Link from "next/link";
import { CreditCard, ShoppingBag } from "lucide-react";

import CheckoutForm from "../../../checkout/_components/CheckoutForm";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

import type { CheckoutViewProps } from "../../types";
import { FEATURE_LABEL, unitPriceFor } from "../../shared/commerce";
import { Empty, PageTitle, Wrap, btn, num, PlateImage } from "../ui";
import { Leader } from "./RiwaqCart";
import { formatPrice, st } from "@/lib/i18n/storefront";

export default function RiwaqCheckout({ storeSlug, cart, paymentMethods, createOrder, legal }: CheckoutViewProps) {
  const { items, summary } = cart;
  const count = items.reduce((t, i) => t + i.quantity, 0);

  return (
    <Wrap className="pb-6">
      <PageTitle
        crumbs={[
          { label: st("الرئيسية"), href: buildStoreUrl(storeSlug) },
          { label: st("السلة"), href: buildStoreUrl(storeSlug, "/cart") },
          { label: st("إتمام الطلب") },
        ]}
        title={st("إتمام الطلب")}
        intro={st("اكتب بياناتك، والمتجر هيتواصل معاك يأكد الطلب.")}
      />

      {items.length === 0 ? (
        <Empty
          icon={<ShoppingBag />}
          title={st("السلة فاضية")}
          description={st("ضيف منتجات للسلة الأول وبعدين كمّل طلبك.")}
          action={
            <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg" })}>
              {st("تصفح المنتجات")}
            </Link>
          }
        />
      ) : paymentMethods.length === 0 ? (
        <Empty
          icon={<CreditCard />}
          title={st("مفيش طرق دفع متاحة دلوقتي")}
          description={st("المتجر لسه مفعّلش طريقة دفع. جرب تاني بعد شوية أو كلّم المتجر.")}
          action={
            <Link href={buildStoreUrl(storeSlug, "/contact")} className={btn({ variant: "line" })}>
              {st("تواصل مع المتجر")}
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="rq-checkout order-2 border-t border-(--rq-ink) pt-8 lg:order-1 lg:col-span-7">
            <CheckoutForm paymentMethods={paymentMethods} action={createOrder} legal={legal} storeSlug={storeSlug} defaultGovernorate={cart.selectedGovernorate} digitalOnly={cart.digitalOnly} />
          </div>

          {/* The slip comes first on phones so the shopper sees what they're paying for */}
          <aside aria-label={st("ملخص الطلب")} className="order-1 lg:sticky lg:top-[calc(var(--rq-bar-h)+2.5rem)] lg:order-2 lg:col-span-5 lg:self-start">
            <details className="rq-details rq-receipt mt-2.5 lg:pointer-events-none" open>
              <summary className="flex min-h-16 items-center justify-between gap-3 px-5 sm:px-7">
                <span className="rq-h3">
                  {st("الطلب")}{" "}<span className="rq-sup">({num(count)})</span>
                </span>
                <span className="rq-price text-lg">{formatPrice(summary.total)}</span>
              </summary>
              <div className="px-5 pb-7 sm:px-7">
                <ul className="border-t border-(--rq-rule)">
                  {items.map((item) => {
                    const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                    const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                    return (
                      <li key={item.id} className="flex items-center gap-3.5 border-b border-(--rq-rule) py-3">
                        <span className="rq-plate relative aspect-[4/5] w-12 shrink-0 overflow-hidden">
                          <PlateImage src={item.product.image} sizes="48px" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 text-sm font-medium">{item.product.name}</span>
                          <span className="rq-caption block">
                            × {num(item.quantity)}
                            {features.length > 0 && ` · ${features.map(([k, v]) => `${FEATURE_LABEL[k] ?? k}: ${v}`).join(" · ")}`}
                          </span>
                        </span>
                        <span className="rq-price shrink-0 text-sm">{formatPrice(unit * item.quantity)}</span>
                      </li>
                    );
                  })}
                </ul>

                <dl className="mt-5 space-y-3 text-sm">
                  <Leader label={st("المجموع الفرعي")} value={formatPrice(summary.subtotal)} />
                  <Leader label={st("الشحن")} value={summary.shipping === 0 ? st("مجاني") : formatPrice(summary.shipping)} />
                  {summary.discount > 0 && <Leader className="text-(--rq-success)" label={st("الخصم")} value={`− ${formatPrice(summary.discount)}`} />}
                  <div className="flex items-baseline justify-between gap-4 border-t border-(--rq-ink) pt-4">
                    <dt className="text-base font-semibold">{st("الإجمالي")}</dt>
                    <dd className="rq-price text-[1.75rem]">{formatPrice(summary.total)}</dd>
                  </div>
                </dl>

                <Link
                  href={buildStoreUrl(storeSlug, "/cart")}
                  className="rq-link pointer-events-auto mt-5 inline-flex min-h-10 items-center text-sm font-semibold"
                >
                  {st("تعديل السلة")}
                </Link>
              </div>
            </details>
          </aside>
        </div>
      )}
    </Wrap>
  );
}
