import Link from "next/link";
import { CreditCard, ShieldCheck, ShoppingBag } from "lucide-react";

import CheckoutForm from "../../../checkout/_components/CheckoutForm";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { formatPrice } from "@/lib/utils";
import type { CheckoutViewProps } from "../../types";
import { FEATURE_LABEL, unitPriceFor } from "../../shared/commerce";
import { Crumbs, Empty, PlateImage, Wrap, btn, num } from "../ui";
import { Totals } from "./MadaCart";

export default function MadaCheckout({ storeSlug, cart, paymentMethods, createOrder }: CheckoutViewProps) {
  const { items, summary } = cart;
  const count = items.reduce((t, i) => t + i.quantity, 0);

  return (
    <Wrap className="pb-10">
      <header className="pb-6 pt-5 sm:pt-7">
        <Crumbs items={[{ label: "الرئيسية", href: buildStoreUrl(storeSlug) }, { label: "السلة", href: buildStoreUrl(storeSlug, "/cart") }, { label: "إتمام الطلب" }]} />
        <h1 className="md-h1 mt-4">إتمام الطلب</h1>
        <p className="mt-2 text-sm text-(--md-quiet)">اكتب بياناتك والمتجر هيتواصل معاك يأكد الطلب.</p>
      </header>

      {items.length === 0 ? (
        <Empty
          icon={<ShoppingBag />}
          title="سلتك فاضية"
          description="ضيف منتجات للسلة الأول وبعدين كمّل طلبك."
          action={
            <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg" })}>
              تصفح المنتجات
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
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="md-checkout md-panel order-2 p-5 sm:p-7 lg:order-1">
            <CheckoutForm paymentMethods={paymentMethods} action={createOrder} storeSlug={storeSlug} defaultGovernorate={cart.selectedGovernorate} />
          </div>
          <aside aria-label="ملخص الطلب" className="order-1 lg:sticky lg:top-[calc(var(--md-header-h)+1.5rem)] lg:order-2 lg:self-start">
            <details className="md-details md-panel lg:pointer-events-none" open>
              <summary className="flex min-h-16 items-center justify-between gap-3 px-5 sm:px-6">
                <span className="md-h3">
                  طلبك <span className="text-sm font-normal text-(--md-quiet)">({num(count)})</span>
                </span>
                <span className="md-price text-lg">{formatPrice(summary.total)}</span>
              </summary>
              <div className="px-5 pb-6 sm:px-6">
                <ul className="space-y-3 border-t border-(--md-line) pt-4">
                  {items.map((item) => {
                    const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                    const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                    return (
                      <li key={item.id} className="flex items-center gap-3">
                        <span className="md-media relative aspect-[4/5] w-14 shrink-0 overflow-visible rounded-xl">
                          <span className="absolute inset-0 overflow-hidden rounded-xl">
                            <PlateImage src={item.product.image} sizes="56px" />
                          </span>
                          <span className="absolute -end-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-(--md-ink) px-1 text-[0.6875rem] font-bold text-(--md-bg) tabular-nums">{num(item.quantity)}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 text-sm font-medium">{item.product.name}</span>
                          {features.length > 0 && <span className="block text-xs text-(--md-quiet)">{features.map(([k, v]) => `${FEATURE_LABEL[k] ?? k}: ${v}`).join(" · ")}</span>}
                        </span>
                        <span className="md-price shrink-0 text-sm">{formatPrice(unit * item.quantity)}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-5 border-t border-(--md-line) pt-4">
                  <Totals summary={summary} />
                </div>
                <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-(--md-quiet)">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-(--md-brand)" />
                  بياناتك بتروح للمتجر بس عشان يوصلك الطلب.
                </p>
                <Link href={buildStoreUrl(storeSlug, "/cart")} className="pointer-events-auto mt-3 inline-flex min-h-10 items-center text-sm font-semibold underline-offset-4 hover:underline">
                  تعديل السلة
                </Link>
              </div>
            </details>
          </aside>
        </div>
      )}
    </Wrap>
  );
}
