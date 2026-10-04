import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Gift, Lock, Minus, Plus, ShoppingBag, TicketPercent, XCircle } from "lucide-react";

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
import { Arrow, Empty, PageTitle, Wrap, btn, idx, num, PlateImage } from "../ui";

export function Notice({ tone, children }: { tone: "success" | "error" | "warning"; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? XCircle : AlertTriangle;
  return (
    <div
      role={tone === "success" ? "status" : "alert"}
      className={cn(
        "flex items-start gap-3 border-s-2 py-1 ps-3.5 text-sm",
        tone === "success" && "border-(--rq-success) text-(--rq-success)",
        tone === "error" && "border-(--rq-sale) text-(--rq-sale)",
        tone === "warning" && "border-(--rq-warn) text-(--rq-warn)",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** "Label ........ value" */
export function Leader({ label, value, className }: { label: React.ReactNode; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rq-leader", className)}>
      <dt>{label}</dt>
      <span className="rq-dots" aria-hidden />
      <dd className="rq-price shrink-0">{value}</dd>
    </div>
  );
}

const STEP = "grid size-11 place-items-center transition-colors hover:bg-(--rq-sheet) disabled:opacity-30 [&_svg]:size-4";

export default function RiwaqCart({ storeSlug, cart, notice }: CartViewProps) {
  const {
    items,
    summary,
    appliedCoupon,
    shippingMethods,
    selectedShippingMethodId,
    appliedLoyalty,
    loyaltyEnabled,
    loyaltyMinRedemption,
    loyaltyPointsValue,
  } = cart;
  const count = items.reduce((t, i) => t + i.quantity, 0);
  const checkoutHref = buildStoreUrl(storeSlug, "/checkout");

  return (
    <Wrap className={cn("pb-6", items.length > 0 && "rq-has-bar")}>
      <Suspense fallback={null}>
        <CartRestorer storeSlug={storeSlug} />
      </Suspense>

      <PageTitle
        crumbs={[{ label: "الرئيسية", href: buildStoreUrl(storeSlug) }, { label: "السلة" }]}
        title="السلة"
        count={count}
      />

      {notice.stockChanged && (
        <div className="mb-8">
          <Notice tone="warning">
            <p className="font-semibold">عدّلنا سلتك على حسب المتاح</p>
            <p className="mt-0.5">في منتجات خلصت أو الكمية المتاحة منها قلّت، فشلناها أو قلّلنا الكمية. راجع السلة وكمّل طلبك.</p>
          </Notice>
        </div>
      )}

      {items.length === 0 ? (
        <Empty
          icon={<ShoppingBag />}
          title="السلة لسه فاضية"
          description="لسه ما ضفتش أي منتجات. لفّ في المتجر واختار اللي يعجبك، وهتلاقيه مستنيك هنا."
          action={
            <>
              <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg", className: "group" })}>
                ابدأ التسوق
                <Arrow />
              </Link>
              <Link href={buildStoreUrl(storeSlug, "/categories")} className={btn({ variant: "line", size: "lg" })}>
                التصنيفات
              </Link>
            </>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
          {/* ── Items ─────────────────────────────────────────────────────── */}
          <section aria-label="المنتجات في السلة" className="lg:col-span-7 xl:col-span-8">
            <div className="hidden grid-cols-[minmax(0,1fr)_9rem_8rem] gap-6 border-b border-(--rq-ink) pb-3 text-xs font-semibold text-(--rq-quiet) sm:grid">
              <span>المنتج</span>
              <span className="text-center">الكمية</span>
              <span className="text-end">الإجمالي</span>
            </div>
            <ul className="border-t border-(--rq-ink) sm:border-t-0">
              {items.map((item, i) => {
                const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                const wholesale = unit < item.product.price;
                const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                const productHref = buildStoreUrl(storeSlug, `/products/${item.product.slug}`);
                const atMax = item.quantity >= item.product.stock;

                return (
                  <li
                    key={item.id}
                    className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 gap-y-4 border-b border-(--rq-rule) py-5 sm:grid-cols-[minmax(0,1fr)_9rem_8rem] sm:items-center sm:gap-6"
                  >
                    <div className="contents sm:flex sm:min-w-0 sm:gap-5">
                      <Link
                        href={productHref}
                        tabIndex={-1}
                        aria-hidden
                        className="rq-plate relative row-span-2 aspect-[4/5] w-[5.5rem] shrink-0 overflow-hidden sm:row-span-1 sm:w-24"
                      >
                        <PlateImage src={item.product.image} sizes="96px" />
                      </Link>
                      <div className="min-w-0">
                        <p className="rq-num text-xs text-(--rq-quiet)">{idx(i + 1)}</p>
                        <Link href={productHref} className="rq-link mt-0.5 line-clamp-2 text-[0.9375rem] font-semibold leading-6 sm:text-base">
                          {item.product.name}
                        </Link>
                        {features.length > 0 && (
                          <p className="rq-caption mt-1">{features.map(([k, v]) => `${FEATURE_LABEL[k] ?? k}: ${v}`).join(" · ")}</p>
                        )}
                        <p className="rq-caption mt-1 tabular-nums">
                          {formatPrice(unit)} للقطعة
                          {wholesale && <span className="ms-1.5 font-semibold text-(--rq-success)">· سعر الجملة</span>}
                        </p>
                        <form action={removeItemAction.bind(null, storeSlug, item.id)} className="mt-1">
                          <SubmitButton
                            aria-label={`إزالة ${item.product.name}`}
                            className="-ms-1 inline-flex min-h-10 items-center px-1 text-xs font-semibold text-(--rq-quiet) underline-offset-4 hover:text-(--rq-sale) hover:underline [&_svg]:size-4"
                          >
                            إزالة
                          </SubmitButton>
                        </form>
                      </div>
                    </div>

                    <div className="col-start-2 flex items-center justify-between gap-3 sm:contents">
                      <div className="flex items-center border border-(--rq-rule-strong) sm:justify-self-center">
                        <form action={changeQtyAction.bind(null, storeSlug, item.id, "decrement")}>
                          <SubmitButton aria-label={item.quantity <= 1 ? `إزالة ${item.product.name}` : "تقليل الكمية"} className={STEP}>
                            <Minus />
                          </SubmitButton>
                        </form>
                        <span className="rq-face w-9 text-center text-base font-semibold tabular-nums" aria-label={`الكمية ${item.quantity}`}>
                          {num(item.quantity)}
                        </span>
                        <form action={changeQtyAction.bind(null, storeSlug, item.id, "increment")}>
                          <SubmitButton aria-label="زيادة الكمية" disabled={atMax} title={atMax ? "مفيش كمية أكتر متاحة" : undefined} className={STEP}>
                            <Plus />
                          </SubmitButton>
                        </form>
                      </div>
                      <p className="rq-price text-lg sm:text-end">{formatPrice(unit * item.quantity)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <Link href={buildStoreUrl(storeSlug, "/products")} className="group mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
              <span className="rq-link">كمّل تسوق</span>
              <Arrow />
            </Link>
          </section>

          {/* ── Receipt ───────────────────────────────────────────────────── */}
          <aside aria-label="ملخص الطلب" className="lg:col-span-5 lg:sticky lg:top-[calc(var(--rq-bar-h)+2.5rem)] lg:self-start xl:col-span-4">
            <div className="rq-receipt mt-2.5 space-y-7 px-5 py-7 sm:px-7">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="rq-h3">إيصال الطلب</h2>
                <span className="rq-num text-xs text-(--rq-quiet)">{num(count)} قطعة</span>
              </div>

              {shippingMethods.length > 0 && (
                <fieldset>
                  <legend className="rq-label mb-2">طريقة الشحن</legend>
                  <div className="border-t border-(--rq-rule)">
                    {shippingMethods.map((m) => {
                      const on = selectedShippingMethodId === m.id;
                      return (
                        <form key={m.id} action={selectShippingAction.bind(null, storeSlug, m.id)} className="border-b border-(--rq-rule)">
                          <button
                            type="submit"
                            aria-pressed={on}
                            className="flex min-h-14 w-full items-center gap-3 py-2 text-start text-sm transition-colors hover:text-(--rq-accent)"
                          >
                            <span
                              aria-hidden
                              className={cn("grid size-[1.125rem] shrink-0 place-items-center border", on ? "border-(--rq-ink)" : "border-(--rq-rule-strong)")}
                            >
                              {on && <span className="size-2.5 bg-(--rq-ink)" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={cn("block", on && "font-semibold")}>{m.name}</span>
                              {m.estimatedDays ? <span className="rq-caption block">خلال {num(m.estimatedDays)} أيام</span> : null}
                            </span>
                            <span className="rq-price shrink-0">{m.price === 0 ? "مجاني" : formatPrice(m.price / 100)}</span>
                          </button>
                        </form>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {/* Coupon */}
              <div className="space-y-3">
                {notice.couponMessage && (
                  <Notice tone={notice.couponStatus === "success" ? "success" : "error"}>{notice.couponMessage}</Notice>
                )}
                {!appliedCoupon && <PendingCouponApplier storeSlug={storeSlug} />}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-3 border border-dashed border-(--rq-ink) px-3.5 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <TicketPercent className="size-5 shrink-0 text-(--rq-accent)" />
                      <div className="min-w-0">
                        <p className="rq-face truncate text-sm font-semibold" dir="ltr">
                          {appliedCoupon.coupon.code}
                        </p>
                        <p className="rq-caption">
                          {appliedCoupon.coupon.type === "PERCENTAGE"
                            ? `خصم ${num(appliedCoupon.coupon.value)}٪`
                            : `خصم ${formatPrice(appliedCoupon.coupon.value)}`}
                        </p>
                      </div>
                    </div>
                    <form action={removeCouponAction.bind(null, storeSlug)}>
                      <SubmitButton className="min-h-10 px-2 text-xs font-semibold text-(--rq-quiet) hover:text-(--rq-ink)">إزالة</SubmitButton>
                    </form>
                  </div>
                ) : (
                  <form action={applyCouponAction.bind(null, storeSlug)} className="flex items-end gap-3">
                    <label className="min-w-0 flex-1">
                      <span className="rq-label block">كوبون خصم</span>
                      <input name="code" required placeholder="اكتب الكود" autoComplete="off" className="rq-field uppercase" />
                    </label>
                    <SubmitButton className={btn({ variant: "line", size: "sm" })}>تطبيق</SubmitButton>
                  </form>
                )}
              </div>

              {loyaltyEnabled &&
                (appliedLoyalty ? (
                  <div className="flex items-center justify-between gap-3 border border-dashed border-(--rq-ink) px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Gift className="size-5 text-(--rq-accent)" />
                      <div>
                        <p className="text-sm font-semibold">استخدمت {num(appliedLoyalty.points)} نقطة</p>
                        <p className="rq-caption">خصم {formatPrice((appliedLoyalty.points * loyaltyPointsValue) / 100)}</p>
                      </div>
                    </div>
                    <form action={removeLoyaltyAction.bind(null, storeSlug)}>
                      <SubmitButton className="min-h-10 px-2 text-xs font-semibold text-(--rq-quiet) hover:text-(--rq-ink)">إزالة</SubmitButton>
                    </form>
                  </div>
                ) : (
                  <details className="rq-details">
                    <summary className="flex min-h-11 items-center justify-between gap-2 text-sm font-semibold">
                      <span className="flex items-center gap-2">
                        <Gift className="size-[1.125rem] text-(--rq-quiet)" />
                        استخدم نقاط المكافآت
                      </span>
                      <Plus aria-hidden className="rq-details-icon size-4 text-(--rq-quiet)" />
                    </summary>
                    <form action={applyLoyaltyAction.bind(null, storeSlug)} className="mt-3 space-y-4">
                      <label className="block">
                        <span className="rq-label block">رقم الموبايل</span>
                        <input name="loyaltyPhone" type="tel" inputMode="tel" autoComplete="tel" required className="rq-field" dir="ltr" />
                      </label>
                      <div className="flex items-end gap-3">
                        <label className="min-w-0 flex-1">
                          <span className="rq-label block">عدد النقاط (أقل حاجة {num(loyaltyMinRedemption)})</span>
                          <input name="loyaltyPoints" type="number" inputMode="numeric" min={loyaltyMinRedemption} step={1} required className="rq-field" />
                        </label>
                        <SubmitButton className={btn({ variant: "line", size: "sm" })}>استخدام</SubmitButton>
                      </div>
                    </form>
                  </details>
                ))}

              <dl className="space-y-3 border-t border-dashed border-(--rq-rule-strong) pt-6 text-sm">
                <Leader label="المجموع الفرعي" value={formatPrice(summary.subtotal)} />
                <Leader label="الشحن" value={summary.shipping === 0 ? "مجاني" : formatPrice(summary.shipping)} />
                {summary.discount > 0 && (
                  <Leader className="text-(--rq-success)" label="الخصم" value={`− ${formatPrice(summary.discount)}`} />
                )}
                <div className="flex items-baseline justify-between gap-4 border-t border-(--rq-ink) pt-4">
                  <dt className="text-base font-semibold">الإجمالي</dt>
                  <dd className="rq-price text-[1.75rem]">{formatPrice(summary.total)}</dd>
                </div>
              </dl>

              <Link href={checkoutHref} className={btn({ size: "lg", full: true, className: "group hidden lg:inline-flex" })}>
                <Lock />
                إتمام الطلب
              </Link>

              <p className="rq-caption leading-6">بعد ما تبعت الطلب، المتجر هيتواصل معاك يأكد البيانات وميعاد التوصيل.</p>
            </div>
          </aside>

          {/* Checkout bar — phones/tablets */}
          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-(--rq-ink) bg-(--rq-paper) lg:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="rq-wrap flex items-center gap-4 py-2.5">
              <div className="shrink-0">
                <p className="rq-caption">الإجمالي</p>
                <p className="rq-price text-xl">{formatPrice(summary.total)}</p>
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
  );
}
