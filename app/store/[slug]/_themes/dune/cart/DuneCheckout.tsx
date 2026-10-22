import Link from "next/link";
import { CreditCard, ShieldCheck, ShoppingBag } from "lucide-react";

import CheckoutForm from "../../../checkout/_components/CheckoutForm";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { formatPrice } from "@/lib/utils";
import type { CheckoutViewProps } from "../../types";
import { FEATURE_LABEL, unitPriceFor } from "../../shared/commerce";
import { Empty, PageTitle, PlateImage, Wrap, btn, num } from "../ui";
import { Totals } from "./DuneCart";

export default function DuneCheckout({ storeSlug, cart, paymentMethods, createOrder }: CheckoutViewProps) {
  const { items, summary } = cart;
  const count = items.reduce((t, i) => t + i.quantity, 0);

  return (
    <Wrap className="pb-12">
      <PageTitle
        title="إتمام الطلب"
        crumbs={[{ label: "الرئيسية", href: buildStoreUrl(storeSlug) }, { label: "السلة", href: buildStoreUrl(storeSlug, "/cart") }, { label: "إتمام الطلب" }]}
        note="اكتب بياناتك والمتجر هيتواصل معاك يأكد الطلب."
      />

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
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_27rem]">
          <div className="dn-checkout order-2 lg:order-1">
            <CheckoutForm paymentMethods={paymentMethods} action={createOrder} storeSlug={storeSlug} defaultGovernorate={cart.selectedGovernorate} digitalOnly={cart.digitalOnly} />
          </div>
          <aside aria-label="ملخص الطلب" className="order-1 lg:sticky lg:top-[calc(var(--dn-header-h)+2rem)] lg:order-2 lg:self-start">
            <details className="dn-details bg-(--dn-plate)" open>
              <summary className="flex min-h-16 items-center justify-between gap-3 px-6 lg:pointer-events-none">
                <span className="dn-h3">
                  طلبك <span className="text-base text-(--dn-quiet)">({num(count)})</span>
                </span>
                <span className="dn-price text-xl">{formatPrice(summary.total)}</span>
              </summary>
              <div className="px-6 pb-7">
                <ul className="space-y-4 border-t border-(--dn-line) pt-5">
                  {items.map((item) => {
                    const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                    const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                    return (
                      <li key={item.id} className="flex items-center gap-4">
                        <span className="relative shrink-0">
                          <span className="dn-media block size-16">
                            <PlateImage src={item.product.image} sizes="64px" />
                          </span>
                          <span className="absolute -end-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-(--dn-ink) px-1 text-[0.6875rem] font-bold tabular-nums text-(--dn-bg)">{num(item.quantity)}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 text-sm">{item.product.name}</span>
                          {features.length > 0 && <span className="block text-xs text-(--dn-quiet)">{features.map(([k, v]) => `${FEATURE_LABEL[k] ?? k}: ${v}`).join(" · ")}</span>}
                        </span>
                        <span className="dn-num shrink-0 text-base">{formatPrice(unit * item.quantity)}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-6 border-t border-(--dn-line) pt-5">
                  <Totals summary={summary} />
                </div>
                <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-(--dn-quiet)">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  بياناتك بتروح للمتجر بس عشان يوصلك الطلب.
                </p>
                <Link href={buildStoreUrl(storeSlug, "/cart")} className="dn-link dn-label mt-3">
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
