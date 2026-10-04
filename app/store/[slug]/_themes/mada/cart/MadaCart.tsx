import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronDown, Gift, Lock, Minus, Plus, ShieldCheck, ShoppingBag, TicketPercent, Trash2, XCircle } from "lucide-react";

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
import { FEATURE_LABEL, unitPriceFor } from "../../shared/commerce";
import SubmitButton from "../../shared/SubmitButton";
import RecentlyViewed from "../sections/RecentlyViewed";
import { Arrow, Crumbs, Empty, PlateImage, Wrap, btn, num } from "../ui";

export function Notice({ tone, children }: { tone: "success" | "error" | "warning"; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? XCircle : AlertTriangle;
  return (
    <div
      role={tone === "success" ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm",
        tone === "success" && "bg-[color-mix(in_srgb,var(--md-success)_12%,transparent)] text-(--md-success)",
        tone === "error" && "bg-[color-mix(in_srgb,var(--md-sale)_10%,transparent)] text-(--md-sale)",
        tone === "warning" && "bg-[color-mix(in_srgb,var(--md-warn)_12%,transparent)] text-(--md-warn)",
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
        <dt className="text-(--md-quiet)">المجموع الفرعي</dt>
        <dd className="md-price">{formatPrice(summary.subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-(--md-quiet)">الشحن</dt>
        <dd className="md-price">{summary.shipping === 0 ? "مجاني" : formatPrice(summary.shipping)}</dd>
      </div>
      {summary.discount > 0 && (
        <div className="flex justify-between gap-4 text-(--md-success)">
          <dt>الخصم</dt>
          <dd className="md-price">− {formatPrice(summary.discount)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between gap-4 border-t border-(--md-line) pt-4">
        <dt className="text-base font-semibold">الإجمالي</dt>
        <dd className="md-price text-2xl">{formatPrice(summary.total)}</dd>
      </div>
    </dl>
  );
}

const STEP = "grid size-10 place-items-center rounded-full transition-colors hover:bg-(--md-studio) disabled:opacity-30 [&_svg]:size-4";

export default function MadaCart({ storeSlug, cart, notice }: CartViewProps) {
  const { items, summary, appliedCoupon, shippingMethods, selectedShippingMethodId, appliedLoyalty, loyaltyEnabled, loyaltyMinRedemption, loyaltyPointsValue } = cart;
  const count = items.reduce((t, i) => t + i.quantity, 0);
  const checkoutHref = buildStoreUrl(storeSlug, "/checkout");

  return (
    <div className={cn("pb-8", items.length > 0 && "md-has-bar")}>
      <Suspense fallback={null}>
        <CartRestorer storeSlug={storeSlug} />
      </Suspense>
      <Wrap>
        <header className="pb-6 pt-5 sm:pt-7">
          <Crumbs items={[{ label: "الرئيسية", href: buildStoreUrl(storeSlug) }, { label: "السلة" }]} />
          <h1 className="md-h1 mt-4">
            سلة المشتريات {count > 0 && <span className="text-(--md-quiet)">({num(count)})</span>}
          </h1>
        </header>

        {notice.stockChanged && (
          <div className="mb-6">
            <Notice tone="warning">
              <p className="font-semibold">عدّلنا سلتك على حسب المتاح</p>
              <p className="mt-0.5">في منتجات خلصت أو الكمية المتاحة منها قلّت، فشلناها أو قلّلنا الكمية.</p>
            </Notice>
          </div>
        )}

        {items.length === 0 ? (
          <Empty
            icon={<ShoppingBag />}
            title="سلتك فاضية"
            description="لسه ما ضفتش أي منتجات. لفّ في المتجر واختار اللي يعجبك."
            action={
              <>
                <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg" })}>
                  ابدأ التسوق
                  <Arrow />
                </Link>
                <Link href={buildStoreUrl(storeSlug, "/categories")} className={btn({ variant: "outline", size: "lg" })}>
                  التصنيفات
                </Link>
              </>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_26rem]">
            <section aria-label="المنتجات في السلة">
              <ul className="space-y-3">
                {items.map((item) => {
                  const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                  const wholesale = unit < item.product.price;
                  const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                  const href = buildStoreUrl(storeSlug, `/products/${item.product.slug}`);
                  return (
                    <li key={item.id} className="md-panel flex gap-4 p-3 sm:p-4">
                      <Link href={href} tabIndex={-1} aria-hidden className="md-media aspect-[4/5] w-24 shrink-0 rounded-xl sm:w-28">
                        <PlateImage src={item.product.image} sizes="112px" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link href={href} className="line-clamp-2 text-[0.9375rem] font-semibold leading-6 hover:text-(--md-brand)">
                              {item.product.name}
                            </Link>
                            {features.length > 0 && (
                              <p className="mt-1 flex flex-wrap gap-1.5">
                                {features.map(([k, v]) => (
                                  <span key={k} className="rounded-full bg-(--md-studio) px-2.5 py-0.5 text-xs">
                                    {FEATURE_LABEL[k] ?? k}: {v}
                                  </span>
                                ))}
                              </p>
                            )}
                            <p className="mt-1.5 text-xs text-(--md-quiet)">
                              {formatPrice(unit)} للقطعة
                              {wholesale && <span className="ms-1.5 font-semibold text-(--md-success)">· سعر الجملة</span>}
                            </p>
                          </div>
                          <form action={removeItemAction.bind(null, storeSlug, item.id)} className="-me-1 -mt-1">
                            <SubmitButton aria-label={`حذف ${item.product.name}`} className="grid size-10 place-items-center rounded-full text-(--md-quiet) transition-colors hover:bg-(--md-studio) hover:text-(--md-sale) [&_svg]:size-4">
                              <Trash2 />
                            </SubmitButton>
                          </form>
                        </div>
                        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                          <div className="flex items-center rounded-full border border-(--md-line)">
                            <form action={changeQtyAction.bind(null, storeSlug, item.id, "decrement")}>
                              <SubmitButton aria-label={item.quantity <= 1 ? `حذف ${item.product.name}` : "تقليل الكمية"} className={STEP}>
                                <Minus />
                              </SubmitButton>
                            </form>
                            <span className="md-price w-8 text-center text-sm" aria-label={`الكمية ${item.quantity}`}>
                              {num(item.quantity)}
                            </span>
                            <form action={changeQtyAction.bind(null, storeSlug, item.id, "increment")}>
                              <SubmitButton aria-label="زيادة الكمية" disabled={item.quantity >= item.product.stock} className={STEP}>
                                <Plus />
                              </SubmitButton>
                            </form>
                          </div>
                          <p className="md-price text-base sm:text-lg">{formatPrice(unit * item.quantity)}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ variant: "ghost", size: "sm", className: "mt-4 -ms-3" })}>
                كمّل تسوق
                <Arrow />
              </Link>
            </section>

            <aside aria-label="ملخص الطلب" className="lg:sticky lg:top-[calc(var(--md-header-h)+1.5rem)] lg:self-start">
              <div className="md-panel space-y-6 p-5 sm:p-6">
                <h2 className="md-h3">ملخص الطلب</h2>

                {shippingMethods.length > 0 && (
                  <fieldset>
                    <legend className="mb-2.5 text-sm font-semibold">طريقة الشحن</legend>
                    <div className="space-y-2">
                      {shippingMethods.map((m) => {
                        const on = selectedShippingMethodId === m.id;
                        return (
                          <form key={m.id} action={selectShippingAction.bind(null, storeSlug, m.id)}>
                            <button
                              type="submit"
                              aria-pressed={on}
                              className={cn("flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-2 text-start text-sm transition-colors", on ? "border-(--md-brand) bg-[color-mix(in_srgb,var(--md-brand)_6%,transparent)]" : "border-(--md-line) hover:border-(--md-line-strong)")}
                            >
                              <span aria-hidden className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", on ? "border-(--md-brand)" : "border-(--md-line-strong)")}>
                                {on && <span className="size-2.5 rounded-full bg-(--md-brand)" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-medium">{m.name}</span>
                                {m.estimatedDays ? <span className="block text-xs text-(--md-quiet)">خلال {num(m.estimatedDays)} أيام</span> : null}
                              </span>
                              <span className="md-price shrink-0">{m.price === 0 ? "مجاني" : formatPrice(m.price / 100)}</span>
                            </button>
                          </form>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                <div className="space-y-2.5">
                  {notice.couponMessage && <Notice tone={notice.couponStatus === "success" ? "success" : "error"}>{notice.couponMessage}</Notice>}
                  {!appliedCoupon && <PendingCouponApplier storeSlug={storeSlug} />}
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-(--md-signal) px-4 py-2.5 text-(--md-signal-ink)">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <TicketPercent className="size-5 shrink-0" />
                        <div className="min-w-0">
                          <p className="md-face truncate text-sm font-bold" dir="ltr">{appliedCoupon.coupon.code}</p>
                          <p className="text-xs opacity-80">
                            {appliedCoupon.coupon.type === "PERCENTAGE" ? `خصم ${num(appliedCoupon.coupon.value)}٪` : `خصم ${formatPrice(appliedCoupon.coupon.value)}`}
                          </p>
                        </div>
                      </div>
                      <form action={removeCouponAction.bind(null, storeSlug)}>
                        <SubmitButton className="min-h-10 px-2 text-xs font-semibold underline-offset-4 hover:underline">إزالة</SubmitButton>
                      </form>
                    </div>
                  ) : (
                    <form action={applyCouponAction.bind(null, storeSlug)} className="flex gap-2">
                      <label className="sr-only" htmlFor="md-coupon">كود الخصم</label>
                      <input id="md-coupon" name="code" required placeholder="كود الخصم" autoComplete="off" className="md-field h-12 rounded-full uppercase" />
                      <SubmitButton className={btn({ variant: "outline" })}>تطبيق</SubmitButton>
                    </form>
                  )}
                </div>

                {loyaltyEnabled &&
                  (appliedLoyalty ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-(--md-studio) px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Gift className="size-5 text-(--md-brand)" />
                        <div>
                          <p className="text-sm font-semibold">استخدمت {num(appliedLoyalty.points)} نقطة</p>
                          <p className="text-xs text-(--md-quiet)">خصم {formatPrice((appliedLoyalty.points * loyaltyPointsValue) / 100)}</p>
                        </div>
                      </div>
                      <form action={removeLoyaltyAction.bind(null, storeSlug)}>
                        <SubmitButton className="min-h-10 px-2 text-xs font-semibold text-(--md-quiet) hover:text-(--md-ink)">إزالة</SubmitButton>
                      </form>
                    </div>
                  ) : (
                    <details className="md-details">
                      <summary className="flex min-h-11 items-center justify-between gap-2 text-sm font-semibold">
                        <span className="flex items-center gap-2">
                          <Gift className="size-[1.125rem] text-(--md-quiet)" />
                          استخدم نقاط المكافآت
                        </span>
                        <ChevronDown aria-hidden className="md-details-icon size-4 text-(--md-quiet)" />
                      </summary>
                      <form action={applyLoyaltyAction.bind(null, storeSlug)} className="mt-2 space-y-2">
                        <input name="loyaltyPhone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="رقم الموبايل" aria-label="رقم الموبايل" className="md-field h-12" />
                        <div className="flex gap-2">
                          <input name="loyaltyPoints" type="number" inputMode="numeric" min={loyaltyMinRedemption} step={1} required placeholder={`عدد النقاط (أقل حاجة ${num(loyaltyMinRedemption)})`} aria-label="عدد النقاط" className="md-field h-12" />
                          <SubmitButton className={btn({ variant: "outline" })}>استخدام</SubmitButton>
                        </div>
                      </form>
                    </details>
                  ))}

                <Totals summary={summary} />

                <Link href={checkoutHref} className={btn({ size: "lg", full: true, className: "hidden lg:inline-flex" })}>
                  <Lock />
                  إتمام الطلب
                </Link>
                <p className="flex items-start gap-2 text-xs leading-6 text-(--md-quiet)">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-(--md-brand)" />
                  بعد ما تبعت الطلب، المتجر هيتواصل معاك يأكد البيانات وميعاد التوصيل.
                </p>
              </div>
            </aside>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-(--md-line) bg-(--md-surface)/95 backdrop-blur-md lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
              <div className="md-wrap flex items-center gap-4 py-3">
                <div className="shrink-0">
                  <p className="text-xs text-(--md-quiet)">الإجمالي</p>
                  <p className="md-price text-lg">{formatPrice(summary.total)}</p>
                </div>
                <Link href={checkoutHref} className={btn({ size: "lg", className: "flex-1" })}>
                  <Lock />
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
