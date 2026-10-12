import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Gift, Minus, Plus, ShieldCheck, ShoppingCart, TicketPercent, Trash2, XCircle } from "lucide-react";

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
import { Crumbs, Empty, PlateImage, Wrap, btn, num } from "../ui";

export function Notice({ tone, children }: { tone: "success" | "error" | "warning"; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? XCircle : AlertTriangle;
  return (
    <div
      role={tone === "success" ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2.5 rounded-(--ce-r) px-4 py-3 text-sm",
        tone === "success" && "bg-[color-mix(in_srgb,var(--ce-success)_10%,transparent)] text-(--ce-success)",
        tone === "error" && "bg-[color-mix(in_srgb,var(--ce-error)_10%,transparent)] text-(--ce-error)",
        tone === "warning" && "bg-[color-mix(in_srgb,var(--ce-warn)_12%,transparent)] text-(--ce-warn)",
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
        <dd className="ce-num font-semibold text-(--ce-ink)">{formatPrice(summary.subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt>الشحن</dt>
        <dd className="ce-num font-semibold text-(--ce-ink)">{summary.shipping === 0 ? "مجاني" : formatPrice(summary.shipping)}</dd>
      </div>
      {summary.discount > 0 && (
        <div className="flex justify-between gap-4 text-(--ce-sale)">
          <dt>الخصم</dt>
          <dd className="ce-num font-semibold">− {formatPrice(summary.discount)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between gap-4 border-t border-(--ce-line) pt-3.5">
        <dt className="font-semibold text-(--ce-ink)">الإجمالي</dt>
        <dd className="ce-price text-2xl">{formatPrice(summary.total)}</dd>
      </div>
    </dl>
  );
}

const STEP = "grid size-10 place-items-center transition-opacity disabled:opacity-30 [&_svg]:size-3.5";

export default function CelloCart({ storeSlug, cart, notice }: CartViewProps) {
  const { items, summary, appliedCoupon, shippingMethods, selectedShippingMethodId, appliedLoyalty, loyaltyEnabled, loyaltyMinRedemption, loyaltyPointsValue } = cart;
  const count = items.reduce((t, i) => t + i.quantity, 0);
  const checkoutHref = buildStoreUrl(storeSlug, "/checkout");

  return (
    <div className={cn("pb-8", items.length > 0 && "ce-has-bar")}>
      <Suspense fallback={null}>
        <CartRestorer storeSlug={storeSlug} />
      </Suspense>
      <Wrap>
        <Crumbs className="py-4" items={[{ label: "الرئيسية", href: buildStoreUrl(storeSlug) }, { label: "سلة المشتريات" }]} />
        <h1 className="ce-h1 mb-6 flex items-baseline gap-2">
          سلة المشتريات
          {count > 0 && <span className="text-base font-normal text-(--ce-quiet)">({num(count)} منتج)</span>}
        </h1>

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
            icon={<ShoppingCart />}
            title="سلتك فاضية"
            description="لسه ما ضفتش أي منتجات. لفّ في المتجر واختار اللي يعجبك."
            action={
              <>
                <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg" })}>
                  ابدأ التسوق
                </Link>
                <Link href={buildStoreUrl(storeSlug, "/categories")} className={btn({ variant: "outline", size: "lg" })}>
                  التصنيفات
                </Link>
              </>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
            <section aria-label="المنتجات في السلة" className="min-w-0">
              <div className="hidden grid-cols-[minmax(0,1fr)_9rem_8rem] gap-6 rounded-(--ce-r) bg-(--ce-band) px-4 py-3 text-sm font-semibold text-(--ce-ink) md:grid">
                <span>المنتج</span>
                <span className="text-center">الكمية</span>
                <span className="text-end">الإجمالي</span>
              </div>
              <ul className="divide-y divide-(--ce-line)">
                {items.map((item) => {
                  const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                  const wholesale = unit < item.product.price;
                  const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                  const href = buildStoreUrl(storeSlug, `/products/${item.product.slug}`);
                  return (
                    <li key={item.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 py-5 md:grid-cols-[6.5rem_minmax(0,1fr)_9rem_8rem] md:items-center md:gap-6 md:px-4">
                      <Link href={href} tabIndex={-1} aria-hidden className="ce-media row-span-2 aspect-square md:row-span-1">
                        <PlateImage src={item.product.image} sizes="104px" />
                      </Link>
                      <div className="min-w-0">
                        <Link href={href} className="line-clamp-2 text-[0.9375rem] font-semibold leading-6 text-(--ce-ink) hover:text-(--ce-link)">
                          {item.product.name}
                        </Link>
                        {features.length > 0 && <p className="mt-1 text-xs text-(--ce-quiet)">{features.map(([k, v]) => `${FEATURE_LABEL[k] ?? k}: ${v}`).join(" · ")}</p>}
                        <p className="mt-1 text-xs text-(--ce-quiet)">
                          {formatPrice(unit)} للقطعة
                          {wholesale && <span className="ms-1.5 font-semibold text-(--ce-success)">· سعر الكمية</span>}
                        </p>
                        <form action={removeItemAction.bind(null, storeSlug, item.id)} className="mt-1.5">
                          <SubmitButton className="inline-flex min-h-8 items-center gap-1.5 text-xs text-(--ce-quiet) hover:text-(--ce-error) [&_svg]:size-3.5">
                            <Trash2 />
                            إزالة<span className="sr-only"> {item.product.name}</span>
                          </SubmitButton>
                        </form>
                      </div>
                      <div className="flex items-center justify-between gap-3 md:contents">
                        <div className="flex w-fit items-center rounded-(--ce-r-sm) border border-(--ce-line) md:mx-auto">
                          <form action={changeQtyAction.bind(null, storeSlug, item.id, "decrement")}>
                            <SubmitButton aria-label={item.quantity <= 1 ? `حذف ${item.product.name}` : "تقليل الكمية"} className={STEP}>
                              <Minus />
                            </SubmitButton>
                          </form>
                          <span className="ce-num w-8 text-center font-semibold text-(--ce-ink)" aria-label={`الكمية ${item.quantity}`}>
                            {num(item.quantity)}
                          </span>
                          <form action={changeQtyAction.bind(null, storeSlug, item.id, "increment")}>
                            <SubmitButton aria-label="زيادة الكمية" disabled={item.quantity >= item.product.stock} className={STEP}>
                              <Plus />
                            </SubmitButton>
                          </form>
                        </div>
                        <p className="ce-price text-end text-[1.0625rem]">{formatPrice(unit * item.quantity)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Link href={buildStoreUrl(storeSlug, "/products")} className="ce-link mt-5">
                كمّل تسوق
              </Link>
            </section>

            <aside aria-label="ملخص الطلب" className="lg:sticky lg:top-6 lg:self-start">
              <div className="space-y-6 rounded-(--ce-r-lg) border border-(--ce-line) p-5 sm:p-6">
                <h2 className="ce-h3">ملخص الطلب</h2>

                {shippingMethods.length > 0 && (
                  <fieldset>
                    <legend className="mb-2.5 text-sm font-semibold text-(--ce-ink)">طريقة الشحن</legend>
                    <div className="space-y-2">
                      {shippingMethods.map((m) => {
                        const on = selectedShippingMethodId === m.id;
                        return (
                          <form key={m.id} action={selectShippingAction.bind(null, storeSlug, m.id)}>
                            <button
                              type="submit"
                              aria-pressed={on}
                              className={cn(
                                "flex min-h-14 w-full items-center gap-3 rounded-(--ce-r) border px-4 py-2 text-start text-sm transition-colors",
                                on ? "border-(--ce-btn) bg-(--ce-tint) shadow-[inset_0_0_0_1px_var(--ce-btn)]" : "border-(--ce-line) hover:border-(--ce-quiet)",
                              )}
                            >
                              <span aria-hidden className={cn("grid size-4 shrink-0 place-items-center rounded-full border", on ? "border-(--ce-btn)" : "border-(--ce-quiet)")}>
                                {on && <span className="size-2 rounded-full bg-(--ce-btn)" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-semibold text-(--ce-ink)">{m.name}</span>
                                {m.estimatedDays ? <span className="block text-xs text-(--ce-quiet)">خلال {num(m.estimatedDays)} أيام</span> : null}
                              </span>
                              <span className="ce-num shrink-0 font-semibold text-(--ce-ink)">{m.price === 0 ? "مجاني" : formatPrice(m.price / 100)}</span>
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
                    <div className="flex items-center justify-between gap-3 rounded-(--ce-r) border border-dashed border-(--ce-btn) px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <TicketPercent className="size-5 shrink-0 text-(--ce-link)" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-(--ce-ink)" dir="ltr">
                            {appliedCoupon.coupon.code}
                          </p>
                          <p className="text-xs text-(--ce-quiet)">
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
                      <label className="sr-only" htmlFor="ce-coupon">
                        كود الخصم
                      </label>
                      <input id="ce-coupon" name="code" required placeholder="كود الخصم" autoComplete="off" className="ce-field uppercase" />
                      <SubmitButton className={btn({ variant: "soft" })}>تطبيق</SubmitButton>
                    </form>
                  )}
                </div>

                {loyaltyEnabled &&
                  (appliedLoyalty ? (
                    <div className="flex items-center justify-between gap-3 rounded-(--ce-r) border border-(--ce-line) px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Gift className="size-5 text-(--ce-link)" />
                        <div>
                          <p className="text-sm text-(--ce-ink)">استخدمت {num(appliedLoyalty.points)} نقطة</p>
                          <p className="text-xs text-(--ce-quiet)">خصم {formatPrice((appliedLoyalty.points * loyaltyPointsValue) / 100)}</p>
                        </div>
                      </div>
                      <form action={removeLoyaltyAction.bind(null, storeSlug)}>
                        <SubmitButton className="min-h-10 px-2 text-xs underline underline-offset-4">إزالة</SubmitButton>
                      </form>
                    </div>
                  ) : (
                    <details className="ce-details rounded-(--ce-r) border border-(--ce-line) px-4">
                      <summary className="flex min-h-12 items-center justify-between gap-2 text-sm text-(--ce-ink)">
                        <span className="flex items-center gap-2">
                          <Gift className="size-[1.125rem] text-(--ce-link)" />
                          استخدم نقاط المكافآت
                        </span>
                        <svg viewBox="0 0 16 16" className="ce-chev" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                          <path d="m4 6 4 4 4-4" />
                        </svg>
                      </summary>
                      <form action={applyLoyaltyAction.bind(null, storeSlug)} className="space-y-2 pb-4">
                        <input name="loyaltyPhone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="رقم الموبايل" aria-label="رقم الموبايل" className="ce-field" />
                        <div className="flex gap-2">
                          <input name="loyaltyPoints" type="number" inputMode="numeric" min={loyaltyMinRedemption} step={1} required placeholder={`عدد النقاط (أقل حاجة ${num(loyaltyMinRedemption)})`} aria-label="عدد النقاط" className="ce-field" />
                          <SubmitButton className={btn({ variant: "soft" })}>استخدام</SubmitButton>
                        </div>
                      </form>
                    </details>
                  ))}

                <Totals summary={summary} />

                <Link href={checkoutHref} className={btn({ size: "lg", full: true, className: "hidden lg:inline-flex" })}>
                  إتمام الطلب
                </Link>
                <p className="flex items-start gap-2 text-xs leading-6 text-(--ce-quiet)">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  بعد ما تبعت الطلب، المتجر هيتواصل معاك يأكد البيانات وميعاد التوصيل.
                </p>
              </div>
            </aside>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-(--ce-line) bg-(--ce-surface)/95 backdrop-blur-md lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
              <div className="ce-wrap flex items-center gap-4 py-3">
                <div className="shrink-0">
                  <p className="text-xs text-(--ce-quiet)">الإجمالي</p>
                  <p className="ce-price text-lg">{formatPrice(summary.total)}</p>
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
