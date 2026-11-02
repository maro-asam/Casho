import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Gift, Minus, Plus, ShieldCheck, ShoppingBag, TicketPercent, Trash2, Truck, XCircle } from "lucide-react";

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
import { Crumbs, Empty, featureLabel, PlateImage, Wrap, btn, days, num } from "../ui";

export function Notice({ tone, children }: { tone: "success" | "error" | "warning"; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? XCircle : AlertTriangle;
  return (
    <div
      role={tone === "success" ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2.5 rounded-(--mk-r) px-4 py-3 text-sm",
        tone === "success" && "bg-(--mk-ok-tint) text-(--mk-ok)",
        tone === "error" && "bg-(--mk-sale-tint) text-(--mk-error)",
        tone === "warning" && "bg-(--mk-low-tint) text-(--mk-warn)",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Totals({ summary }: { summary: CartViewProps["cart"]["summary"] }) {
  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between gap-4">
        <dt>المجموع الفرعي</dt>
        <dd className="mk-num font-bold text-(--mk-ink)">{formatPrice(summary.subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt>التوصيل</dt>
        <dd className="mk-num font-bold text-(--mk-ink)">{summary.shipping === 0 ? "مجاني" : formatPrice(summary.shipping)}</dd>
      </div>
      {summary.discount > 0 && (
        <div className="flex justify-between gap-4 text-(--mk-ok)">
          <dt>الخصم</dt>
          <dd className="mk-num font-bold">− {formatPrice(summary.discount)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between gap-4 border-t border-dashed border-(--mk-sep) pt-3.5">
        <dt className="font-bold text-(--mk-ink)">الإجمالي</dt>
        <dd className="mk-price text-2xl">{formatPrice(summary.total)}</dd>
      </div>
    </dl>
  );
}

const STEP = "grid size-9 place-items-center rounded-(--mk-r-sm) transition-opacity hover:bg-(--mk-cell) disabled:opacity-30 [&_svg]:size-3.5";

export default function MarketCart({ storeSlug, cart, notice }: CartViewProps) {
  const { items, summary, appliedCoupon, shippingMethods, selectedShippingMethodId, appliedLoyalty, loyaltyEnabled, loyaltyMinRedemption, loyaltyPointsValue } = cart;
  const count = items.reduce((t, i) => t + i.quantity, 0);
  const checkoutHref = buildStoreUrl(storeSlug, "/checkout");

  return (
    <div className={cn("pb-8", items.length > 0 && "mk-has-bar")}>
      <Suspense fallback={null}>
        <CartRestorer storeSlug={storeSlug} />
      </Suspense>
      <Wrap>
        <Crumbs className="py-4" items={[{ label: "الرئيسية", href: buildStoreUrl(storeSlug) }, { label: "السلة" }]} />
        <h1 className="mk-h1 mb-6 flex items-baseline gap-2">
          سلة المشتريات
          {count > 0 && <span className="text-base font-normal text-(--mk-label-2)">({num(count)} منتج)</span>}
        </h1>

        {notice.stockChanged && (
          <div className="mb-6">
            <Notice tone="warning">
              <p className="font-bold">عدّلنا سلتك على حسب المتاح</p>
              <p className="mt-0.5">في منتجات خلصت أو الكمية المتاحة منها قلّت، فشلناها أو قلّلنا الكمية.</p>
            </Notice>
          </div>
        )}

        {items.length === 0 ? (
          <Empty
            icon={<ShoppingBag />}
            title="سلتك فاضية"
            description="لسه ما ضفتش أي منتجات. ابحث عن اللي محتاجه أو تصفّح الأقسام."
            action={
              <>
                <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg" })}>
                  ابدأ التسوق
                </Link>
                <Link href={buildStoreUrl(storeSlug, "/categories")} className={btn({ variant: "outline", size: "lg" })}>
                  الأقسام
                </Link>
              </>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_26rem]">
            <section aria-label="المنتجات في السلة" className="mk-panel min-w-0 self-start px-4 sm:px-5">
              <ul className="divide-y divide-(--mk-sep)">
                {items.map((item) => {
                  const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                  const wholesale = unit < item.product.price;
                  const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                  const href = buildStoreUrl(storeSlug, `/products/${item.product.slug}`);
                  return (
                    <li key={item.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 py-5 md:grid-cols-[6rem_minmax(0,1fr)_auto_8rem] md:items-center md:gap-6">
                      <Link href={href} tabIndex={-1} aria-hidden className="mk-media row-span-2 aspect-square md:row-span-1">
                        <PlateImage src={item.product.image} sizes="96px" />
                      </Link>
                      <div className="min-w-0">
                        <Link href={href} className="line-clamp-2 text-[0.9375rem] font-semibold leading-6 text-(--mk-ink) hover:text-(--mk-tint)">
                          {item.product.name}
                        </Link>
                        {features.length > 0 && <p className="mt-1 text-xs text-(--mk-label-2)">{features.map(([k, v]) => featureLabel(k, v)).join(" · ")}</p>}
                        <p className="mt-1 text-xs text-(--mk-label-2)">
                          {formatPrice(unit)} للقطعة
                          {wholesale && <span className="ms-1.5 font-bold text-(--mk-ok)">· سعر الكمية</span>}
                        </p>
                        <form action={removeItemAction.bind(null, storeSlug, item.id)} className="mt-1">
                          <SubmitButton className="inline-flex min-h-8 items-center gap-1.5 text-xs text-(--mk-label-2) hover:text-(--mk-error) [&_svg]:size-3.5">
                            <Trash2 />
                            إزالة<span className="sr-only"> {item.product.name}</span>
                          </SubmitButton>
                        </form>
                      </div>
                      <div className="flex items-center justify-between gap-3 md:contents">
                        <div className="flex w-fit items-center rounded-(--mk-r-sm) border border-(--mk-sep)">
                          <form action={changeQtyAction.bind(null, storeSlug, item.id, "decrement")}>
                            <SubmitButton aria-label={item.quantity <= 1 ? `حذف ${item.product.name}` : "تقليل الكمية"} className={STEP}>
                              <Minus />
                            </SubmitButton>
                          </form>
                          <span className="mk-num w-8 text-center font-bold text-(--mk-ink)" aria-label={`الكمية ${item.quantity}`}>
                            {num(item.quantity)}
                          </span>
                          <form action={changeQtyAction.bind(null, storeSlug, item.id, "increment")}>
                            <SubmitButton aria-label="زيادة الكمية" disabled={item.quantity >= item.product.stock} className={STEP}>
                              <Plus />
                            </SubmitButton>
                          </form>
                        </div>
                        <p className="mk-price text-end text-[1.0625rem]">{formatPrice(unit * item.quantity)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-(--mk-sep) py-4">
                <Link href={buildStoreUrl(storeSlug, "/products")} className="mk-link text-sm">
                  كمّل تسوق
                </Link>
              </div>
            </section>

            <aside aria-label="ملخص الطلب" className="lg:sticky lg:top-6 lg:self-start">
              <div className="mk-panel space-y-6 p-5 sm:p-6">
                <h2 className="mk-h3">ملخص الطلب</h2>

                {shippingMethods.length > 0 && (
                  <fieldset>
                    <legend className="mb-2.5 flex items-center gap-2 text-sm font-bold text-(--mk-ink)">
                      <Truck className="size-4 text-(--mk-tint)" />
                      طريقة التوصيل
                    </legend>
                    <div className="space-y-2">
                      {shippingMethods.map((m) => {
                        const on = selectedShippingMethodId === m.id;
                        return (
                          <form key={m.id} action={selectShippingAction.bind(null, storeSlug, m.id)}>
                            <button
                              type="submit"
                              aria-pressed={on}
                              className={cn(
                                "flex min-h-14 w-full items-center gap-3 rounded-(--mk-r) border px-4 py-2 text-start text-sm transition-colors",
                                on ? "border-(--mk-btn) bg-(--mk-wash) shadow-[inset_0_0_0_1px_var(--mk-btn)]" : "border-(--mk-sep) hover:border-(--mk-quiet)",
                              )}
                            >
                              <span aria-hidden className={cn("grid size-4 shrink-0 place-items-center rounded-full border", on ? "border-(--mk-btn)" : "border-(--mk-quiet)")}>
                                {on && <span className="size-2 rounded-full bg-(--mk-btn)" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-bold text-(--mk-ink)">{m.name}</span>
                                {m.estimatedDays ? <span className="block text-xs text-(--mk-label-2)">خلال {days(m.estimatedDays)}</span> : null}
                              </span>
                              <span className="mk-num shrink-0 font-bold text-(--mk-ink)">{m.price === 0 ? "مجاني" : formatPrice(m.price / 100)}</span>
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
                    <div className="flex items-center justify-between gap-3 rounded-(--mk-r) border border-dashed border-(--mk-btn) bg-(--mk-wash) px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <TicketPercent className="size-5 shrink-0 text-(--mk-tint)" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-(--mk-ink)" dir="ltr">
                            {appliedCoupon.coupon.code}
                          </p>
                          <p className="text-xs text-(--mk-label-2)">
                            {appliedCoupon.coupon.type === "PERCENTAGE" ? `خصم ${num(appliedCoupon.coupon.value)}٪` : `خصم ${formatPrice(appliedCoupon.coupon.value)}`}
                          </p>
                        </div>
                      </div>
                      <form action={removeCouponAction.bind(null, storeSlug)}>
                        <SubmitButton className="min-h-10 px-2 text-xs underline underline-offset-4">إزالة</SubmitButton>
                      </form>
                    </div>
                  ) : (
                    <form action={applyCouponAction.bind(null, storeSlug)} className="flex gap-2">
                      <label className="sr-only" htmlFor="mk-coupon">
                        كود الخصم
                      </label>
                      <input id="mk-coupon" name="code" required placeholder="كود الخصم" autoComplete="off" className="mk-field uppercase" />
                      <SubmitButton className={btn({ variant: "tint" })}>تطبيق</SubmitButton>
                    </form>
                  )}
                </div>

                {loyaltyEnabled &&
                  (appliedLoyalty ? (
                    <div className="flex items-center justify-between gap-3 rounded-(--mk-r) border border-(--mk-sep) px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Gift className="size-5 text-(--mk-tint)" />
                        <div>
                          <p className="text-sm text-(--mk-ink)">استخدمت {num(appliedLoyalty.points)} نقطة</p>
                          <p className="text-xs text-(--mk-label-2)">خصم {formatPrice((appliedLoyalty.points * loyaltyPointsValue) / 100)}</p>
                        </div>
                      </div>
                      <form action={removeLoyaltyAction.bind(null, storeSlug)}>
                        <SubmitButton className="min-h-10 px-2 text-xs underline underline-offset-4">إزالة</SubmitButton>
                      </form>
                    </div>
                  ) : (
                    <details className="mk-details rounded-(--mk-r) border border-(--mk-sep) px-4">
                      <summary className="flex min-h-12 items-center justify-between gap-2 text-sm text-(--mk-ink)">
                        <span className="flex items-center gap-2">
                          <Gift className="size-[1.125rem] text-(--mk-tint)" />
                          استخدم نقاط المكافآت
                        </span>
                        <svg viewBox="0 0 16 16" className="mk-chev" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                          <path d="m4 6 4 4 4-4" />
                        </svg>
                      </summary>
                      <form action={applyLoyaltyAction.bind(null, storeSlug)} className="space-y-2 pb-4">
                        <input name="loyaltyPhone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="رقم الموبايل" aria-label="رقم الموبايل" className="mk-field" />
                        <div className="flex gap-2">
                          <input name="loyaltyPoints" type="number" inputMode="numeric" min={loyaltyMinRedemption} step={1} required placeholder={`عدد النقاط (أقل حاجة ${num(loyaltyMinRedemption)})`} aria-label="عدد النقاط" className="mk-field" />
                          <SubmitButton className={btn({ variant: "tint" })}>استخدام</SubmitButton>
                        </div>
                      </form>
                    </details>
                  ))}

                <Totals summary={summary} />

                <Link href={checkoutHref} className={btn({ size: "lg", full: true, className: "hidden lg:inline-flex" })}>
                  إتمام الطلب
                </Link>
                <p className="flex items-start gap-2 text-xs leading-6 text-(--mk-label-2)">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-(--mk-tint)" />
                  بعد ما تبعت الطلب، المتجر هيتواصل معاك يأكد البيانات وميعاد التوصيل.
                </p>
              </div>
            </aside>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-(--mk-sep) bg-(--mk-sheet)/95 backdrop-blur-md lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
              <div className="mk-wrap flex items-center gap-4 py-3">
                <div className="shrink-0">
                  <p className="text-xs text-(--mk-label-2)">الإجمالي</p>
                  <p className="mk-price text-lg">{formatPrice(summary.total)}</p>
                </div>
                <Link href={checkoutHref} className={btn({ size: "lg", className: "flex-1" })}>
                  إتمام الطلب
                </Link>
              </div>
            </div>
          </div>
        )}
      </Wrap>
      <RecentlyViewed storeSlug={storeSlug} />
    </div>
  );
}
