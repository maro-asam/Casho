import Link from "next/link";
import { CreditCard, ShieldCheck, ShoppingBag } from "lucide-react";

import CheckoutForm from "../../../checkout/_components/CheckoutForm";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { formatPrice } from "@/lib/utils";
import type { CheckoutViewProps } from "../../types";
import { unitPriceFor } from "../../shared/commerce";
import { Empty, PageHead, PlateImage, Wrap, btn, featureLabel, num } from "../ui";
import { Totals } from "./QiratCart";

export default function QiratCheckout({ storeSlug, cart, paymentMethods, createOrder }: CheckoutViewProps) {
  const { items, summary } = cart;
  const count = items.reduce((t, i) => t + i.quantity, 0);

  return (
    <Wrap className="pb-14">
      <PageHead
        kicker="الخطوة الأخيرة"
        title="إتمام الطلب"
        note="اكتب بياناتك والمتجر هيتواصل معاك يأكد الطلب."
        crumbs={[{ label: "الرئيسية", href: buildStoreUrl(storeSlug) }, { label: "الحقيبة", href: buildStoreUrl(storeSlug, "/cart") }, { label: "إتمام الطلب" }]}
      />

      {items.length === 0 ? (
        <Empty
          icon={<ShoppingBag />}
          title="حقيبتك فاضية"
          description="ضيف قطع للحقيبة الأول وبعدين كمّل طلبك."
          action={
            <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg" })}>
              اكتشف المجموعة
            </Link>
          }
        />
      ) : paymentMethods.length === 0 ? (
        <Empty
          icon={<CreditCard />}
          title="مفيش طرق دفع متاحة دلوقتي"
          description="المتجر لسه مفعّلش طريقة دفع. جرب تاني بعد شوية أو كلّم المتجر."
          action={
            <Link href={buildStoreUrl(storeSlug, "/contact")} className={btn({ variant: "outline" })}>
              تواصل مع المتجر
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-12">
          <div className="qr-checkout qr-panel order-2 min-w-0 p-4 sm:p-7 lg:order-1">
            <CheckoutForm paymentMethods={paymentMethods} action={createOrder} storeSlug={storeSlug} defaultGovernorate={cart.selectedGovernorate} digitalOnly={cart.digitalOnly} />
          </div>
          <aside aria-label="ملخص الطلب" className="order-1 lg:sticky lg:top-[calc(var(--qr-head-h)+1.5rem)] lg:order-2 lg:self-start">
            <details className="qr-details qr-panel" open>
              <summary className="flex min-h-16 items-center justify-between gap-3 px-5 lg:pointer-events-none">
                <span className="qr-h4">
                  طلبك <span className="text-(--qr-ink-2)">({num(count)})</span>
                </span>
                <span className="qr-price text-lg">{formatPrice(summary.total)}</span>
              </summary>
              <div className="px-5 pb-6">
                <ul className="space-y-4 border-t border-(--qr-line) pt-5">
                  {items.map((item) => {
                    const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                    const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                    return (
                      <li key={item.id} className="flex items-center gap-3.5">
                        <span className="relative shrink-0">
                          <span className="qr-plate relative block aspect-[3/4] w-14 overflow-hidden">
                            <PlateImage src={item.product.image} sizes="56px" />
                          </span>
                          <span className="qr-count !-end-2 !-top-2">{num(item.quantity)}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="qr-serif line-clamp-1 text-[0.9375rem] text-(--qr-ink)">{item.product.name}</span>
                          {features.length > 0 && <span className="block text-xs text-(--qr-ink-2)">{features.map(([k, v]) => featureLabel(k, v)).join(" · ")}</span>}
                        </span>
                        <span className="qr-num shrink-0 text-sm text-(--qr-ink)">{formatPrice(unit * item.quantity)}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-5 border-t border-(--qr-line) pt-5">
                  <Totals summary={summary} />
                </div>
                <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-(--qr-ink-2)">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-(--qr-gold-ink)" />
                  بياناتك بتروح للمتجر بس عشان يوصلك الطلب.
                </p>
                <Link href={buildStoreUrl(storeSlug, "/cart")} className="qr-link mt-3 text-sm">
                  <span className="qr-underline">تعديل الحقيبة</span>
                </Link>
              </div>
            </details>
          </aside>
        </div>
      )}
    </Wrap>
  );
}
