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
import { FEATURE_LABEL, unitPriceFor } from "../../shared/commerce";
import SubmitButton from "../../shared/SubmitButton";
import RecentlyViewed from "../sections/RecentlyViewed";
import { Empty, PageTitle, PlateImage, Wrap, btn, num } from "../ui";

export function Notice({ tone, children }: { tone: "success" | "error" | "warning"; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? XCircle : AlertTriangle;
  return (
    <div
      role={tone === "success" ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2.5 border-s-2 px-4 py-3 text-sm",
        tone === "success" && "border-(--dn-success) bg-[color-mix(in_srgb,var(--dn-success)_8%,transparent)] text-(--dn-success)",
        tone === "error" && "border-(--dn-error) bg-[color-mix(in_srgb,var(--dn-error)_8%,transparent)] text-(--dn-error)",
        tone === "warning" && "border-(--dn-warn) bg-[color-mix(in_srgb,var(--dn-warn)_8%,transparent)] text-(--dn-warn)",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Totals({ summary }: { summary: CartViewProps["cart"]["summary"] }) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-(--dn-quiet)">المجموع الفرعي</dt>
        <dd className="dn-num text-base">{formatPrice(summary.subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-(--dn-quiet)">الشحن</dt>
        <dd className="dn-num text-base">{summary.shipping === 0 ? "مجاني" : formatPrice(summary.shipping)}</dd>
      </div>
      {summary.discount > 0 && (
        <div className="flex justify-between gap-4 text-(--dn-sale)">
          <dt>الخصم</dt>
          <dd className="dn-num text-base">− {formatPrice(summary.discount)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between gap-4 border-t border-(--dn-line) pt-4">
        <dt className="dn-label">الإجمالي</dt>
        <dd className="dn-price text-[1.875rem]">{formatPrice(summary.total)}</dd>
      </div>
    </dl>
  );
}

const STEP = "grid size-10 place-items-center rounded-full transition-opacity disabled:opacity-30 [&_svg]:size-3.5";

export default function DuneCart({ storeSlug, cart, notice }: CartViewProps) {
  const { items, summary, appliedCoupon, shippingMethods, selectedShippingMethodId, appliedLoyalty, loyaltyEnabled, loyaltyMinRedemption, loyaltyPointsValue } = cart;
  const count = items.reduce((t, i) => t + i.quantity, 0);
  const checkoutHref = buildStoreUrl(storeSlug, "/checkout");

  return (
    <div className={cn("pb-8", items.length > 0 && "dn-has-bar")}>
      <Suspense fallback={null}>
        <CartRestorer storeSlug={storeSlug} />
      </Suspense>
      <Wrap>
        <PageTitle title="السلة" crumbs={[{ label: "الرئيسية", href: buildStoreUrl(storeSlug) }, { label: "السلة" }]} note={count > 0 ? `${num(count)} منتج` : undefined} />

        {notice.stockChanged && (
          <div className="mb-8">
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
                </Link>
                <Link href={buildStoreUrl(storeSlug, "/categories")} className={btn({ variant: "outline", size: "lg" })}>
                  التصنيفات
                </Link>
              </>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_27rem]">
            <section aria-label="المنتجات في السلة">
              <div className="dn-label hidden grid-cols-[minmax(0,1fr)_9rem_8rem] gap-6 border-b border-(--dn-line) pb-3 text-(--dn-quiet) md:grid">
                <span>المنتج</span>
                <span className="text-center">الكمية</span>
                <span className="text-end">الإجمالي</span>
              </div>
              <ul className="divide-y divide-(--dn-line) border-b border-(--dn-line)">
                {items.map((item) => {
                  const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                  const wholesale = unit < item.product.price;
                  const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                  const href = buildStoreUrl(storeSlug, `/products/${item.product.slug}`);
                  return (
                    <li key={item.id} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-4 gap-y-3 py-6 md:grid-cols-[7rem_minmax(0,1fr)_9rem_8rem] md:items-center md:gap-6">
                      <Link href={href} tabIndex={-1} aria-hidden className="dn-media row-span-2 aspect-square md:row-span-1">
                        <PlateImage src={item.product.image} sizes="112px" />
                      </Link>
                      <div className="min-w-0">
                        <Link href={href} className="line-clamp-2 text-[0.9375rem] leading-6 hover:underline">
                          {item.product.name}
                        </Link>
                        {features.length > 0 && <p className="mt-1 text-xs text-(--dn-quiet)">{features.map(([k, v]) => `${FEATURE_LABEL[k] ?? k}: ${v}`).join(" · ")}</p>}
                        <p className="mt-1 text-xs text-(--dn-quiet)">
                          {formatPrice(unit)} للقطعة
                          {wholesale && <span className="ms-1.5 text-(--dn-success)">· سعر الجملة</span>}
                        </p>
                        <form action={removeItemAction.bind(null, storeSlug, item.id)} className="mt-2">
                          <SubmitButton className="min-h-8 text-xs text-(--dn-quiet) underline underline-offset-4 hover:text-(--dn-ink) [&_svg]:size-3.5">
                            إزالة<span className="sr-only"> {item.product.name}</span>
                          </SubmitButton>
                        </form>
                      </div>
                      <div className="flex items-center justify-between gap-3 md:contents">
                        <div className="flex w-fit items-center rounded-full border border-(--dn-line-ink) md:mx-auto">
                          <form action={changeQtyAction.bind(null, storeSlug, item.id, "decrement")}>
                            <SubmitButton aria-label={item.quantity <= 1 ? `حذف ${item.product.name}` : "تقليل الكمية"} className={STEP}>
                              <Minus />
                            </SubmitButton>
                          </form>
                          <span className="dn-num w-7 text-center text-lg" aria-label={`الكمية ${item.quantity}`}>
                            {num(item.quantity)}
                          </span>
                          <form action={changeQtyAction.bind(null, storeSlug, item.id, "increment")}>
                            <SubmitButton aria-label="زيادة الكمية" disabled={item.quantity >= item.product.stock} className={STEP}>
                              <Plus />
                            </SubmitButton>
                          </form>
                        </div>
                        <p className="dn-price text-end">{formatPrice(unit * item.quantity)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Link href={buildStoreUrl(storeSlug, "/products")} className="dn-link dn-label mt-6">
                كمّل تسوق
              </Link>
            </section>

            <aside aria-label="ملخص الطلب" className="lg:sticky lg:top-[calc(var(--dn-header-h)+2rem)] lg:self-start">
              <div className="space-y-7 bg-(--dn-plate) p-6 sm:p-8">
                <h2 className="dn-h3">ملخص الطلب</h2>

                {shippingMethods.length > 0 && (
                  <fieldset>
                    <legend className="dn-label mb-3">طريقة الشحن</legend>
                    <div className="space-y-2">
                      {shippingMethods.map((m) => {
                        const on = selectedShippingMethodId === m.id;
                        return (
                          <form key={m.id} action={selectShippingAction.bind(null, storeSlug, m.id)}>
                            <button
                              type="submit"
                              aria-pressed={on}
                              className={cn("flex min-h-14 w-full items-center gap-3 border px-4 py-2 text-start text-sm transition-colors", on ? "border-(--dn-ink) bg-(--dn-bg)" : "border-(--dn-line) hover:border-(--dn-line-ink)")}
                            >
                              <span aria-hidden className={cn("grid size-4 shrink-0 place-items-center rounded-full border", on ? "border-(--dn-ink)" : "border-(--dn-line-ink)")}>
                                {on && <span className="size-2 rounded-full bg-(--dn-ink)" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block">{m.name}</span>
                                {m.estimatedDays ? <span className="block text-xs text-(--dn-quiet)">خلال {num(m.estimatedDays)} أيام</span> : null}
                              </span>
                              <span className="dn-num shrink-0 text-base">{m.price === 0 ? "مجاني" : formatPrice(m.price / 100)}</span>
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
                    <div className="flex items-center justify-between gap-3 border border-dashed border-(--dn-line-ink) px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <TicketPercent className="size-5 shrink-0 text-(--dn-sale)" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold" dir="ltr">
                            {appliedCoupon.coupon.code}
                          </p>
                          <p className="text-xs text-(--dn-quiet)">
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
                      <label className="sr-only" htmlFor="dn-coupon">
                        كود الخصم
                      </label>
                      <input id="dn-coupon" name="code" required placeholder="كود الخصم" autoComplete="off" className="dn-field h-12 uppercase" />
                      <SubmitButton className={btn({ variant: "outline" })}>تطبيق</SubmitButton>
                    </form>
                  )}
                </div>

                {loyaltyEnabled &&
                  (appliedLoyalty ? (
                    <div className="flex items-center justify-between gap-3 border border-(--dn-line) px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Gift className="size-5 text-(--dn-sale)" />
                        <div>
                          <p className="text-sm">استخدمت {num(appliedLoyalty.points)} نقطة</p>
                          <p className="text-xs text-(--dn-quiet)">خصم {formatPrice((appliedLoyalty.points * loyaltyPointsValue) / 100)}</p>
                        </div>
                      </div>
                      <form action={removeLoyaltyAction.bind(null, storeSlug)}>
                        <SubmitButton className="min-h-10 px-2 text-xs underline underline-offset-4">إزالة</SubmitButton>
                      </form>
                    </div>
                  ) : (
                    <details className="dn-details border-y border-(--dn-line)">
                      <summary className="flex min-h-12 items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-2">
                          <Gift className="size-[1.125rem] text-(--dn-quiet)" />
                          استخدم نقاط المكافآت
                        </span>
                        <span className="dn-plus" aria-hidden />
                      </summary>
                      <form action={applyLoyaltyAction.bind(null, storeSlug)} className="space-y-2 pb-4">
                        <input name="loyaltyPhone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="رقم الموبايل" aria-label="رقم الموبايل" className="dn-field h-12" />
                        <div className="flex gap-2">
                          <input name="loyaltyPoints" type="number" inputMode="numeric" min={loyaltyMinRedemption} step={1} required placeholder={`عدد النقاط (أقل حاجة ${num(loyaltyMinRedemption)})`} aria-label="عدد النقاط" className="dn-field h-12" />
                          <SubmitButton className={btn({ variant: "outline" })}>استخدام</SubmitButton>
                        </div>
                      </form>
                    </details>
                  ))}

                <Totals summary={summary} />

                <Link href={checkoutHref} className={btn({ size: "lg", full: true, className: "hidden lg:inline-flex" })}>
                  إتمام الطلب
                </Link>
                <p className="flex items-start gap-2 text-xs leading-6 text-(--dn-quiet)">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  بعد ما تبعت الطلب، المتجر هيتواصل معاك يأكد البيانات وميعاد التوصيل.
                </p>
              </div>
            </aside>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-(--dn-line) bg-(--dn-drawer)/95 backdrop-blur-md lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
              <div className="dn-wrap flex items-center gap-4 py-3">
                <div className="shrink-0">
                  <p className="text-xs text-(--dn-quiet)">الإجمالي</p>
                  <p className="dn-price text-xl">{formatPrice(summary.total)}</p>
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
