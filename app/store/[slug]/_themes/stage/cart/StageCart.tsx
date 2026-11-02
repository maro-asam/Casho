import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Gift, Minus, Plus, ShieldCheck, ShoppingBag, TicketPercent, XCircle } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn, formatPrice } from "@/lib/utils";
import {
  applyCouponAction,
  applyLoyaltyAction,
  changeQtyAction,
  removeCouponAction,
  removeItemAction,
  removeLoyaltyAction,
  selectShippingAction,
} from "../../../cart/actions";
import { CartRestorer } from "../../../cart/_components/CartRestorer";
import { PendingCouponApplier } from "../../../cart/_components/PendingCouponApplier";
import type { CartViewProps } from "../../types";
import { unitPriceFor } from "../../shared/commerce";
import SubmitButton from "../../shared/SubmitButton";
import RecentlyViewed from "../sections/RecentlyViewed";
import { Empty, featureLabel, PlateImage, Wrap, btn, days, num } from "../ui";

export function Notice({ tone, children }: { tone: "success" | "error" | "warning"; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? XCircle : AlertTriangle;
  return (
    <div
      role={tone === "success" ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2.5 rounded-(--sg-r) px-4 py-3 text-sm",
        tone === "success" && "bg-(--sg-ok-tint) text-(--sg-ok)",
        tone === "error" && "bg-(--sg-sale-tint) text-(--sg-error)",
        tone === "warning" && "bg-(--sg-low-tint) text-(--sg-warn)",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** apple.com's bag summary: quiet rows, then the total large. */
export function Totals({ summary }: { summary: CartViewProps["cart"]["summary"] }) {
  return (
    <dl className="sg-totals">
      <div>
        <dt>المجموع الفرعي</dt>
        <dd className="sg-num">{formatPrice(summary.subtotal)}</dd>
      </div>
      <div>
        <dt>التوصيل</dt>
        <dd className="sg-num">{summary.shipping === 0 ? "مجاني" : formatPrice(summary.shipping)}</dd>
      </div>
      {summary.discount > 0 && (
        <div className="text-(--sg-ok)">
          <dt>الخصم</dt>
          <dd className="sg-num">− {formatPrice(summary.discount)}</dd>
        </div>
      )}
      <div className="sg-totals-grand">
        <dt>الإجمالي</dt>
        <dd className="sg-num">{formatPrice(summary.total)}</dd>
      </div>
    </dl>
  );
}

const STEP = "grid size-9 place-items-center rounded-full transition-colors hover:bg-(--sg-fill) disabled:opacity-30 [&_svg]:size-3.5";

export default function StageCart({ storeSlug, cart, notice }: CartViewProps) {
  const { items, summary, appliedCoupon, shippingMethods, selectedShippingMethodId, appliedLoyalty, loyaltyEnabled, loyaltyMinRedemption, loyaltyPointsValue } = cart;
  const checkoutHref = buildStoreUrl(storeSlug, "/checkout");

  return (
    <div className={cn("pb-8", items.length > 0 && "sg-has-bar")}>
      <Suspense fallback={null}>
        <CartRestorer storeSlug={storeSlug} />
      </Suspense>
      <Wrap className="sg-narrow">
        {items.length === 0 ? (
          <>
            <Empty
              icon={<ShoppingBag />}
              title="حقيبتك فاضية."
              description="لسه ما ضفتش أي حاجة. دوّر على اللي بتحبه أو تصفّح الأقسام."
              action={
                <>
                  <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg" })}>
                    ابدأ التسوق
                  </Link>
                  <Link href={buildStoreUrl(storeSlug, "/categories")} className={btn({ variant: "gray", size: "lg" })}>
                    الأقسام
                  </Link>
                </>
              }
            />
            {notice.stockChanged && (
              <Notice tone="warning">
                <p className="font-semibold">عدّلنا حقيبتك على حسب المتاح</p>
                <p className="mt-0.5">في منتجات خلصت، فشلناها.</p>
              </Notice>
            )}
          </>
        ) : (
          <>
            <header className="sg-baghead">
              <h1 className="sg-h1 text-balance">إجمالي حقيبتك {formatPrice(summary.total)}</h1>
              <p className="sg-lead mx-auto mt-3 max-w-xl text-balance">{summary.shipping === 0 ? "التوصيل مجاني على طلبك." : "المتجر بيأكد معاك الطلب وميعاد التوصيل قبل الشحن."}</p>
              <Link href={checkoutHref} className={btn({ size: "lg", className: "mt-7 min-w-56 max-lg:hidden" })}>
                كمّل الطلب
              </Link>
            </header>

            {notice.stockChanged && (
              <div className="mb-6">
                <Notice tone="warning">
                  <p className="font-semibold">عدّلنا حقيبتك على حسب المتاح</p>
                  <p className="mt-0.5">في منتجات خلصت أو الكمية المتاحة منها قلّت، فشلناها أو قلّلنا الكمية.</p>
                </Notice>
              </div>
            )}

            <section aria-label="المنتجات في الحقيبة">
              <ul className="sg-bag-items">
                {items.map((item) => {
                  const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                  const wholesale = unit < item.product.price;
                  const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                  const href = buildStoreUrl(storeSlug, `/products/${item.product.slug}`);
                  return (
                    <li key={item.id} className="sg-bag-item">
                      <Link href={href} tabIndex={-1} aria-hidden className="sg-media sg-bag-media">
                        <PlateImage src={item.product.image} sizes="(max-width: 768px) 6rem, 10rem" />
                      </Link>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                          <div className="min-w-0 flex-1">
                            <Link href={href} className="sg-bag-name">
                              {item.product.name}
                            </Link>
                            {features.length > 0 && <p className="mt-1 text-sm text-(--sg-label-2)">{features.map(([k, v]) => featureLabel(k, v)).join(" · ")}</p>}
                            <p className="mt-1 text-sm text-(--sg-label-2)">
                              {formatPrice(unit)} للقطعة
                              {wholesale && <span className="ms-1.5 font-semibold text-(--sg-ok)">· سعر الكمية</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-5">
                            <div className="sg-qty !h-10">
                              <form action={changeQtyAction.bind(null, storeSlug, item.id, "decrement")}>
                                <SubmitButton aria-label={item.quantity <= 1 ? `حذف ${item.product.name}` : "تقليل الكمية"} className={STEP}>
                                  <Minus />
                                </SubmitButton>
                              </form>
                              <span className="sg-num w-7 text-center font-semibold text-(--sg-ink)" aria-label={`الكمية ${item.quantity}`}>
                                {num(item.quantity)}
                              </span>
                              <form action={changeQtyAction.bind(null, storeSlug, item.id, "increment")}>
                                <SubmitButton aria-label="زيادة الكمية" disabled={item.quantity >= item.product.stock} className={STEP}>
                                  <Plus />
                                </SubmitButton>
                              </form>
                            </div>
                            <p className="sg-price min-w-24 text-end text-xl">{formatPrice(unit * item.quantity)}</p>
                          </div>
                        </div>
                        <form action={removeItemAction.bind(null, storeSlug, item.id)} className="mt-3 flex justify-end">
                          <SubmitButton className="sg-link min-h-8 text-[0.9375rem]">
                            إزالة<span className="sr-only"> {item.product.name}</span>
                          </SubmitButton>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section aria-label="ملخص الطلب" className="sg-bag-summary">
              {shippingMethods.length > 0 && (
                <fieldset>
                  <legend className="sg-step-legend">
                    <span className="text-(--sg-ink)">التوصيل.</span> اختار الطريقة اللي تناسبك.
                  </legend>
                  <div className="grid gap-2.5">
                    {shippingMethods.map((m) => {
                      const on = selectedShippingMethodId === m.id;
                      return (
                        <form key={m.id} action={selectShippingAction.bind(null, storeSlug, m.id)}>
                          <button type="submit" aria-pressed={on} data-on={on} className="sg-optbox !min-h-16 w-full !flex-row !justify-between gap-4 !px-5 !text-start">
                            <span className="min-w-0">
                              <span className="block font-semibold text-(--sg-ink)">{m.name}</span>
                              {m.estimatedDays ? <span className="block text-[0.8125rem] font-normal text-(--sg-label-2)">خلال {days(m.estimatedDays)}</span> : null}
                            </span>
                            <span className="sg-num shrink-0 font-semibold text-(--sg-ink)">{m.price === 0 ? "مجاني" : formatPrice(m.price / 100)}</span>
                          </button>
                        </form>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              <div className="space-y-3">
                {notice.couponMessage && <Notice tone={notice.couponStatus === "success" ? "success" : "error"}>{notice.couponMessage}</Notice>}
                {!appliedCoupon && <PendingCouponApplier storeSlug={storeSlug} />}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-3 rounded-(--sg-r) bg-(--sg-alt) px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <TicketPercent className="size-5 shrink-0 text-(--sg-ok)" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-(--sg-ink)" dir="ltr">
                          {appliedCoupon.coupon.code}
                        </p>
                        <p className="text-xs text-(--sg-label-2)">
                          {appliedCoupon.coupon.type === "PERCENTAGE" ? `خصم ${num(appliedCoupon.coupon.value)}٪` : `خصم ${formatPrice(appliedCoupon.coupon.value)}`}
                        </p>
                      </div>
                    </div>
                    <form action={removeCouponAction.bind(null, storeSlug)}>
                      <SubmitButton className="sg-link min-h-10 px-2 text-sm">إزالة</SubmitButton>
                    </form>
                  </div>
                ) : (
                  <details className="sg-details border-b border-(--sg-sep)" open={!!notice.couponMessage}>
                    <summary className="flex min-h-12 items-center justify-between gap-2 text-[0.9375rem] text-(--sg-ink)">
                      <span className="flex items-center gap-2">
                        <TicketPercent className="size-[1.125rem] text-(--sg-label-2)" />
                        عندك كود خصم؟
                      </span>
                      <svg viewBox="0 0 16 16" className="sg-chev" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                        <path d="m4 6 4 4 4-4" />
                      </svg>
                    </summary>
                    <form action={applyCouponAction.bind(null, storeSlug)} className="flex gap-2 pb-4">
                      <label className="sr-only" htmlFor="sg-coupon">
                        كود الخصم
                      </label>
                      <input id="sg-coupon" name="code" required placeholder="اكتب الكود" autoComplete="off" className="sg-field uppercase" />
                      <SubmitButton className={btn({ variant: "gray" })}>تطبيق</SubmitButton>
                    </form>
                  </details>
                )}
              </div>

              {loyaltyEnabled &&
                (appliedLoyalty ? (
                  <div className="flex items-center justify-between gap-3 rounded-(--sg-r) bg-(--sg-alt) px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Gift className="size-5 text-(--sg-ok)" />
                      <div>
                        <p className="text-sm text-(--sg-ink)">استخدمت {num(appliedLoyalty.points)} نقطة</p>
                        <p className="text-xs text-(--sg-label-2)">خصم {formatPrice((appliedLoyalty.points * loyaltyPointsValue) / 100)}</p>
                      </div>
                    </div>
                    <form action={removeLoyaltyAction.bind(null, storeSlug)}>
                      <SubmitButton className="sg-link min-h-10 px-2 text-sm">إزالة</SubmitButton>
                    </form>
                  </div>
                ) : (
                  <details className="sg-details border-b border-(--sg-sep)">
                    <summary className="flex min-h-12 items-center justify-between gap-2 text-[0.9375rem] text-(--sg-ink)">
                      <span className="flex items-center gap-2">
                        <Gift className="size-[1.125rem] text-(--sg-label-2)" />
                        استخدم نقاط المكافآت
                      </span>
                      <svg viewBox="0 0 16 16" className="sg-chev" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                        <path d="m4 6 4 4 4-4" />
                      </svg>
                    </summary>
                    <form action={applyLoyaltyAction.bind(null, storeSlug)} className="space-y-2 pb-4">
                      <input name="loyaltyPhone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="رقم الموبايل" aria-label="رقم الموبايل" className="sg-field" />
                      <div className="flex gap-2">
                        <input name="loyaltyPoints" type="number" inputMode="numeric" min={loyaltyMinRedemption} step={1} required placeholder={`عدد النقاط (أقل حاجة ${num(loyaltyMinRedemption)})`} aria-label="عدد النقاط" className="sg-field" />
                        <SubmitButton className={btn({ variant: "gray" })}>استخدام</SubmitButton>
                      </div>
                    </form>
                  </details>
                ))}

              <Totals summary={summary} />

              <Link href={checkoutHref} className={btn({ size: "lg", full: true, className: "max-lg:hidden" })}>
                كمّل الطلب
              </Link>
              <p className="flex items-start gap-2 text-[0.8125rem] leading-6 text-(--sg-label-2)">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                بعد ما تبعت الطلب، المتجر هيتواصل معاك يأكد البيانات وميعاد التوصيل.
              </p>
              <Link href={buildStoreUrl(storeSlug, "/products")} className="sg-link text-[0.9375rem]">
                كمّل تسوّق ›
              </Link>
            </section>

            <div className="sg-buybar lg:hidden" data-show="true">
              <div className="sg-wrap flex items-center gap-4 py-3">
                <div className="shrink-0">
                  <p className="text-xs text-(--sg-label-2)">الإجمالي</p>
                  <p className="sg-price text-lg">{formatPrice(summary.total)}</p>
                </div>
                <Link href={checkoutHref} className={btn({ size: "lg", className: "flex-1" })}>
                  كمّل الطلب
                </Link>
              </div>
            </div>
          </>
        )}
      </Wrap>
      <RecentlyViewed storeSlug={storeSlug} />
    </div>
  );
}
