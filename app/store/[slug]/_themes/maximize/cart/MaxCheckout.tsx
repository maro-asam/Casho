import Link from "next/link";
import { CreditCard, ShieldCheck, ShoppingCart } from "lucide-react";

import CheckoutForm from "../../../checkout/_components/CheckoutForm";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { formatPrice } from "@/lib/utils";
import type { CheckoutViewProps } from "../../types";
import { FEATURE_LABEL, unitPriceFor } from "../../shared/commerce";
import { Crumbs, Empty, PlateImage, Wrap, btn, num } from "../ui";
import { Totals } from "./MaxCart";

export default function MaxCheckout({ storeSlug, cart, paymentMethods, createOrder }: CheckoutViewProps) {
  const { items, summary } = cart;
  const count = items.reduce((t, i) => t + i.quantity, 0);

  return (
    <Wrap className="pb-12">
      <Crumbs
        className="py-4"
        items={[{ label: "الرئيسية", href: buildStoreUrl(storeSlug) }, { label: "السلة", href: buildStoreUrl(storeSlug, "/cart") }, { label: "إتمام الطلب" }]}
      />
      <h1 className="mx-h1">إتمام الطلب</h1>
      <p className="mb-6 mt-1 text-sm text-(--mx-quiet)">اكتب بياناتك والمتجر هيتواصل معاك يأكد الطلب.</p>

      {items.length === 0 ? (
        <Empty
          icon={<ShoppingCart />}
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
          <div className="mx-checkout order-2 min-w-0 lg:order-1">
            <CheckoutForm paymentMethods={paymentMethods} action={createOrder} storeSlug={storeSlug} defaultGovernorate={cart.selectedGovernorate} />
          </div>
          <aside aria-label="ملخص الطلب" className="order-1 lg:sticky lg:top-6 lg:order-2 lg:self-start">
            <details className="mx-details rounded-(--mx-r-lg) border border-(--mx-line) bg-(--mx-band)" open>
              <summary className="flex min-h-16 items-center justify-between gap-3 px-5 lg:pointer-events-none">
                <span className="mx-h4">
                  طلبك <span className="font-normal text-(--mx-quiet)">({num(count)})</span>
                </span>
                <span className="mx-price text-lg">{formatPrice(summary.total)}</span>
              </summary>
              <div className="px-5 pb-6">
                <ul className="space-y-4 border-t border-(--mx-line) pt-5">
                  {items.map((item) => {
                    const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                    const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                    return (
                      <li key={item.id} className="flex items-center gap-3.5">
                        <span className="relative shrink-0">
                          <span className="mx-media block size-16 bg-(--mx-bg)">
                            <PlateImage src={item.product.image} sizes="64px" />
                          </span>
                          <span className="absolute -end-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-(--mx-btn) px-1 text-[0.6875rem] font-bold tabular-nums text-(--mx-btn-ink)">{num(item.quantity)}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 text-sm font-semibold text-(--mx-ink)">{item.product.name}</span>
                          {features.length > 0 && <span className="block text-xs text-(--mx-quiet)">{features.map(([k, v]) => `${FEATURE_LABEL[k] ?? k}: ${v}`).join(" · ")}</span>}
                        </span>
                        <span className="mx-num shrink-0 text-sm font-semibold text-(--mx-ink)">{formatPrice(unit * item.quantity)}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-5 border-t border-(--mx-line) pt-5">
                  <Totals summary={summary} />
                </div>
                <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-(--mx-quiet)">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  بياناتك بتروح للمتجر بس عشان يوصلك الطلب.
                </p>
                <Link href={buildStoreUrl(storeSlug, "/cart")} className="mx-link mt-3">
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
