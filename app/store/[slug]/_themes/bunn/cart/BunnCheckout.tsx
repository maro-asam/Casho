import Link from "next/link";
import { CreditCard, ShieldCheck, ShoppingBag } from "lucide-react";

import CheckoutForm from "../../../checkout/_components/CheckoutForm";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";

import type { CheckoutViewProps } from "../../types";
import { unitPriceFor } from "../../shared/commerce";
import { Empty, PageHead, PlateImage, Wrap, btn, featureLabel, num } from "../ui";
import { Totals } from "./BunnCart";
import { formatPrice, st } from "@/lib/i18n/storefront";

export default function BunnCheckout({ storeSlug, cart, paymentMethods, createOrder, legal }: CheckoutViewProps) {
  const { items, summary } = cart;
  const count = items.reduce((t, i) => t + i.quantity, 0);

  return (
    <Wrap className="pb-14">
      <PageHead
        kicker={st("الخطوة الأخيرة")}
        title={st("إتمام الطلب")}
        note={st("اكتب بياناتك والمتجر هيتواصل معاك يأكد الطلب.")}
        crumbs={[{ label: st("الرئيسية"), href: buildStoreUrl(storeSlug) }, { label: st("السلة"), href: buildStoreUrl(storeSlug, "/cart") }, { label: st("إتمام الطلب") }]}
      />

      {items.length === 0 ? (
        <Empty
          icon={<ShoppingBag />}
          title={st("سلتك فاضية")}
          description={st("ضيف منتجات للسلة الأول وبعدين كمّل طلبك.")}
          action={
            <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg" })}>
              {st("شوف القهوة")}
            </Link>
          }
        />
      ) : paymentMethods.length === 0 ? (
        <Empty
          icon={<CreditCard />}
          title={st("مفيش طرق دفع متاحة دلوقتي")}
          description={st("المتجر لسه مفعّلش طريقة دفع. جرب تاني بعد شوية أو كلّم المتجر.")}
          action={
            <Link href={buildStoreUrl(storeSlug, "/contact")} className={btn({ variant: "outline" })}>
              {st("تواصل مع المتجر")}
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-12">
          <div className="bn-checkout bn-panel order-2 min-w-0 p-4 sm:p-7 lg:order-1">
            <CheckoutForm paymentMethods={paymentMethods} action={createOrder} legal={legal} storeSlug={storeSlug} defaultGovernorate={cart.selectedGovernorate} digitalOnly={cart.digitalOnly} total={cart.summary.total} />
          </div>
          <aside aria-label={st("ملخص الطلب")} className="order-1 lg:sticky lg:top-[calc(var(--bn-head-h)+1.5rem)] lg:order-2 lg:self-start">
            <details className="bn-details bn-panel" open>
              <summary className="flex min-h-16 items-center justify-between gap-3 px-5 lg:pointer-events-none">
                <span className="bn-h4">
                  {st("طلبك")}{" "}<span className="text-(--bn-ink-2)">({num(count)})</span>
                </span>
                <span className="bn-price text-lg">{formatPrice(summary.total)}</span>
              </summary>
              <div className="px-5 pb-6">
                <ul className="space-y-4 border-t border-(--bn-line) pt-5">
                  {items.map((item) => {
                    const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                    const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                    return (
                      <li key={item.id} className="flex items-center gap-3.5">
                        <span className="relative shrink-0">
                          <span className="bn-plate relative block aspect-square w-14 overflow-hidden">
                            <PlateImage src={item.product.image} sizes="56px" />
                          </span>
                          <span className="bn-count !-end-2 !-top-2">{num(item.quantity)}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="bn-display line-clamp-1 text-[0.9375rem] text-(--bn-ink)">{item.product.name}</span>
                          {features.length > 0 && <span className="block text-xs text-(--bn-ink-2)">{features.map(([k, v]) => featureLabel(k, v)).join(" · ")}</span>}
                        </span>
                        <span className="bn-num shrink-0 text-sm text-(--bn-ink)">{formatPrice(unit * item.quantity)}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-5 border-t border-(--bn-line) pt-5">
                  <Totals summary={summary} />
                </div>
                <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-(--bn-ink-2)">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-(--bn-crema-ink)" />
                  {st("بياناتك بتروح للمتجر بس عشان يوصلك الطلب.")}
                </p>
                <Link href={buildStoreUrl(storeSlug, "/cart")} className="bn-link mt-3 text-sm">
                  <span className="bn-underline">{st("تعديل السلة")}</span>
                </Link>
              </div>
            </details>
          </aside>
        </div>
      )}
    </Wrap>
  );
}
