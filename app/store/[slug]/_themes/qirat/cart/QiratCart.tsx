import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronDown, Gift, Minus, Plus, ShieldCheck, ShoppingBag, TicketPercent, XCircle } from "lucide-react";

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
import { Empty, PageHead, PlateImage, Wrap, btn, days, featureLabel, num } from "../ui";

export function Notice({ tone, children }: { tone: "success" | "error" | "warning"; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? XCircle : AlertTriangle;
  return (
    <div role={tone === "success" ? "status" : "alert"} className="qr-notice" data-tone={tone}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Quiet rows, then the total in serif. */
export function Totals({ summary }: { summary: CartViewProps["cart"]["summary"] }) {
  return (
    <dl className="qr-totals">
      <div>
        <dt>المجموع الفرعي</dt>
        <dd className="qr-num">{formatPrice(summary.subtotal)}</dd>
      </div>
      <div>
        <dt>التوصيل</dt>
        <dd className="qr-num">{summary.shipping === 0 ? "مجاني" : formatPrice(summary.shipping)}</dd>
      </div>
      {summary.discount > 0 && (
        <div className="text-(--qr-ok)">
          <dt>الخصم</dt>
          <dd className="qr-num">− {formatPrice(summary.discount)}</dd>
        </div>
      )}
      <div className="qr-totals-grand">
        <dt>الإجمالي</dt>
        <dd className="qr-num">{formatPrice(summary.total)}</dd>
      </div>
    </dl>
  );
}

function Disclosure({ icon, title, open, children }: { icon: React.ReactNode; title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details className="qr-details border-b border-(--qr-line)" open={open}>
      <summary className="flex min-h-12 items-center justify-between gap-2 text-[0.9375rem] text-(--qr-ink)">
        <span className="flex items-center gap-2 [&_svg]:size-[1.125rem] [&_svg]:text-(--qr-gold-ink)">
          {icon}
          {title}
        </span>
        <ChevronDown className="qr-chev" />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

export default function QiratCart({ storeSlug, cart, notice }: CartViewProps) {
  const { items, summary, appliedCoupon, shippingMethods, selectedShippingMethodId, appliedLoyalty, loyaltyEnabled, loyaltyMinRedemption, loyaltyPointsValue } = cart;
  const checkoutHref = buildStoreUrl(storeSlug, "/checkout");
  const count = items.reduce((t, i) => t + i.quantity, 0);

  return (
    <div className={cn("pb-10", items.length > 0 && "qr-has-bar")}>
      <Suspense fallback={null}>
        <CartRestorer storeSlug={storeSlug} />
      </Suspense>
      <Wrap>
        {items.length === 0 ? (
          <div className="mx-auto max-w-xl">
            <Empty
              icon={<ShoppingBag />}
              title="حقيبتك فاضية"
              description="لسه ما اخترتش أي قطعة. اكتشف المجموعة أو تصفّح الكوليكشنز."
              action={
                <>
                  <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg" })}>
                    اكتشف المجموعة
                  </Link>
                  <Link href={buildStoreUrl(storeSlug, "/categories")} className={btn({ variant: "outline", size: "lg" })}>
                    المجموعات
                  </Link>
                </>
              }
            />
            {notice.stockChanged && (
              <Notice tone="warning">
                <p className="font-semibold">عدّلنا حقيبتك على حسب المتاح</p>
                <p className="mt-0.5">في قطع خلصت، فشلناها.</p>
              </Notice>
            )}
          </div>
        ) : (
          <>
            <PageHead
              kicker={`${num(count)} قطعة`}
              title="حقيبتك"
              crumbs={[{ label: "الرئيسية", href: buildStoreUrl(storeSlug) }, { label: "الحقيبة" }]}
              note={summary.shipping === 0 ? "التوصيل مجاني على طلبك." : "المتجر بيأكد معاك الطلب وميعاد التوصيل قبل الشحن."}
            />

            {notice.stockChanged && (
              <div className="mx-auto mb-8 max-w-3xl">
                <Notice tone="warning">
                  <p className="font-semibold">عدّلنا حقيبتك على حسب المتاح</p>
                  <p className="mt-0.5">في قطع خلصت أو الكمية المتاحة منها قلّت، فشلناها أو قلّلنا الكمية.</p>
                </Notice>
              </div>
            )}

            <div className="qr-bag">
              <section aria-label="القطع في الحقيبة" className="min-w-0">
                <ul className="qr-bag-items">
                  {items.map((item) => {
                    const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                    const wholesale = unit < item.product.price;
                    const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                    const href = buildStoreUrl(storeSlug, `/products/${item.product.slug}`);
                    return (
                      <li key={item.id} className="qr-bag-item">
                        <Link href={href} tabIndex={-1} aria-hidden className="qr-plate qr-bag-media">
                          <PlateImage src={item.product.image} sizes="(max-width: 768px) 6rem, 9rem" />
                        </Link>
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <Link href={href} className="qr-bag-name">
                                {item.product.name}
                              </Link>
                              {features.length > 0 && <p className="mt-1 text-sm text-(--qr-ink-2)">{features.map(([k, v]) => featureLabel(k, v)).join(" · ")}</p>}
                              <p className="mt-1 text-sm text-(--qr-ink-2)">
                                {formatPrice(unit)} للقطعة
                                {wholesale && <span className="ms-1.5 text-(--qr-ok)">· سعر الكمية</span>}
                              </p>
                            </div>
                            <p className="qr-price shrink-0 text-lg">{formatPrice(unit * item.quantity)}</p>
                          </div>
                          <div className="mt-auto flex items-center justify-between gap-4 pt-4">
                            <div className="qr-qty qr-qty--sm">
                              <form action={changeQtyAction.bind(null, storeSlug, item.id, "decrement")}>
                                <SubmitButton aria-label={item.quantity <= 1 ? `حذف ${item.product.name}` : "تقليل الكمية"}>
                                  <Minus />
                                </SubmitButton>
                              </form>
                              <output className="qr-num" aria-label={`الكمية ${item.quantity}`}>
                                {num(item.quantity)}
                              </output>
                              <form action={changeQtyAction.bind(null, storeSlug, item.id, "increment")}>
                                <SubmitButton aria-label="زيادة الكمية" disabled={item.quantity >= item.product.stock}>
                                  <Plus />
                                </SubmitButton>
                              </form>
                            </div>
                            <form action={removeItemAction.bind(null, storeSlug, item.id)}>
                              <SubmitButton className="qr-link min-h-9 text-sm text-(--qr-ink-2)">
                                <span className="qr-underline">إزالة</span>
                                <span className="sr-only"> {item.product.name}</span>
                              </SubmitButton>
                            </form>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-6">
                  <Link href={buildStoreUrl(storeSlug, "/products")} className="qr-link text-[0.9375rem]">
                    <span className="qr-underline">كمّل تسوّق</span>
                  </Link>
                </div>
              </section>

              <aside aria-label="ملخص الطلب" className="qr-bag-summary">
                <h2 className="qr-h3">ملخص الطلب</h2>

                {shippingMethods.length > 0 && (
                  <fieldset className="mt-6">
                    <legend className="qr-opt-legend mb-3">التوصيل</legend>
                    <div className="grid gap-2">
                      {shippingMethods.map((m) => {
                        const on = selectedShippingMethodId === m.id;
                        return (
                          <form key={m.id} action={selectShippingAction.bind(null, storeSlug, m.id)}>
                            <button type="submit" aria-pressed={on} data-on={on} className="qr-optbox qr-optbox--row w-full">
                              <span className="min-w-0 text-start">
                                <span className="block text-(--qr-ink)">{m.name}</span>
                                {m.estimatedDays ? <span className="block text-xs text-(--qr-ink-2)">خلال {days(m.estimatedDays)}</span> : null}
                              </span>
                              <span className="qr-num shrink-0 text-(--qr-ink)">{m.price === 0 ? "مجاني" : formatPrice(m.price / 100)}</span>
                            </button>
                          </form>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                <div className="mt-6 space-y-3">
                  {notice.couponMessage && <Notice tone={notice.couponStatus === "success" ? "success" : "error"}>{notice.couponMessage}</Notice>}
                  {!appliedCoupon && <PendingCouponApplier storeSlug={storeSlug} />}
                  {appliedCoupon ? (
                    <div className="qr-applied">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <TicketPercent className="size-5 shrink-0 text-(--qr-ok)" />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-(--qr-ink)" dir="ltr">
                            {appliedCoupon.coupon.code}
                          </p>
                          <p className="text-xs text-(--qr-ink-2)">{appliedCoupon.coupon.type === "PERCENTAGE" ? `خصم ${num(appliedCoupon.coupon.value)}٪` : `خصم ${formatPrice(appliedCoupon.coupon.value)}`}</p>
                        </div>
                      </div>
                      <form action={removeCouponAction.bind(null, storeSlug)}>
                        <SubmitButton className="qr-link min-h-10 px-2 text-sm">
                          <span className="qr-underline">إزالة</span>
                        </SubmitButton>
                      </form>
                    </div>
                  ) : (
                    <Disclosure icon={<TicketPercent />} title="عندك كود خصم؟" open={!!notice.couponMessage}>
                      <form action={applyCouponAction.bind(null, storeSlug)} className="flex gap-2">
                        <label className="sr-only" htmlFor="qr-coupon">
                          كود الخصم
                        </label>
                        <input id="qr-coupon" name="code" required placeholder="اكتب الكود" autoComplete="off" className="qr-field uppercase" />
                        <SubmitButton className={btn({ variant: "outline" })}>تطبيق</SubmitButton>
                      </form>
                    </Disclosure>
                  )}

                  {loyaltyEnabled &&
                    (appliedLoyalty ? (
                      <div className="qr-applied">
                        <div className="flex items-center gap-2.5">
                          <Gift className="size-5 text-(--qr-ok)" />
                          <div>
                            <p className="text-sm text-(--qr-ink)">استخدمت {num(appliedLoyalty.points)} نقطة</p>
                            <p className="text-xs text-(--qr-ink-2)">خصم {formatPrice((appliedLoyalty.points * loyaltyPointsValue) / 100)}</p>
                          </div>
                        </div>
                        <form action={removeLoyaltyAction.bind(null, storeSlug)}>
                          <SubmitButton className="qr-link min-h-10 px-2 text-sm">
                            <span className="qr-underline">إزالة</span>
                          </SubmitButton>
                        </form>
                      </div>
                    ) : (
                      <Disclosure icon={<Gift />} title="استخدم نقاط المكافآت">
                        <form action={applyLoyaltyAction.bind(null, storeSlug)} className="space-y-2">
                          <input name="loyaltyPhone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="رقم الموبايل" aria-label="رقم الموبايل" className="qr-field" />
                          <div className="flex gap-2">
                            <input name="loyaltyPoints" type="number" inputMode="numeric" min={loyaltyMinRedemption} step={1} required placeholder={`عدد النقاط (أقل حاجة ${num(loyaltyMinRedemption)})`} aria-label="عدد النقاط" className="qr-field" />
                            <SubmitButton className={btn({ variant: "outline" })}>استخدام</SubmitButton>
                          </div>
                        </form>
                      </Disclosure>
                    ))}
                </div>

                <div className="mt-6">
                  <Totals summary={summary} />
                </div>

                <Link href={checkoutHref} className={btn({ size: "lg", full: true, className: "mt-6 max-lg:hidden" })}>
                  كمّل الطلب
                </Link>
                <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-(--qr-ink-2)">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-(--qr-gold-ink)" />
                  بعد ما تبعت الطلب، المتجر هيتواصل معاك يأكد البيانات وميعاد التوصيل.
                </p>
              </aside>
            </div>

            <div className="qr-buybar lg:hidden" data-show="true">
              <div className="qr-wrap flex items-center gap-4 py-3">
                <div className="shrink-0">
                  <p className="text-xs text-(--qr-ink-2)">الإجمالي</p>
                  <p className="qr-price text-lg">{formatPrice(summary.total)}</p>
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
