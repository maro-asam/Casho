import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronDown, Gift, Minus, Plus, ShieldCheck, ShoppingBag, TicketPercent, XCircle } from "lucide-react";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
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
import { formatPrice, st } from "@/lib/i18n/storefront";

export function Notice({ tone, children }: { tone: "success" | "error" | "warning"; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? XCircle : AlertTriangle;
  return (
    <div role={tone === "success" ? "status" : "alert"} className="bn-notice" data-tone={tone}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Quiet rows, then the total in serif. */
export function Totals({ summary }: { summary: CartViewProps["cart"]["summary"] }) {
  return (
    <dl className="bn-totals">
      <div>
        <dt>{st("المجموع الفرعي")}</dt>
        <dd className="bn-num">{formatPrice(summary.subtotal)}</dd>
      </div>
      <div>
        <dt>{st("التوصيل")}</dt>
        <dd className="bn-num">{summary.shipping === 0 ? st("مجاني") : formatPrice(summary.shipping)}</dd>
      </div>
      {summary.discount > 0 && (
        <div className="text-(--bn-ok)">
          <dt>{st("الخصم")}</dt>
          <dd className="bn-num">− {formatPrice(summary.discount)}</dd>
        </div>
      )}
      <div className="bn-totals-grand">
        <dt>{st("الإجمالي")}</dt>
        <dd className="bn-num">{formatPrice(summary.total)}</dd>
      </div>
    </dl>
  );
}

function Disclosure({ icon, title, open, children }: { icon: React.ReactNode; title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details className="bn-details border-b border-(--bn-line)" open={open}>
      <summary className="flex min-h-12 items-center justify-between gap-2 text-[0.9375rem] text-(--bn-ink)">
        <span className="flex items-center gap-2 [&_svg]:size-[1.125rem] [&_svg]:text-(--bn-crema-ink)">
          {icon}
          {title}
        </span>
        <ChevronDown className="bn-chev" />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}

export default function BunnCart({ storeSlug, cart, notice }: CartViewProps) {
  const { items, summary, appliedCoupon, shippingMethods, selectedShippingMethodId, appliedLoyalty, loyaltyEnabled, loyaltyMinRedemption, loyaltyPointsValue } = cart;
  const checkoutHref = buildStoreUrl(storeSlug, "/checkout");
  const count = items.reduce((t, i) => t + i.quantity, 0);

  return (
    <div className={cn("pb-10", items.length > 0 && "bn-has-bar")}>
      <Suspense fallback={null}>
        <CartRestorer storeSlug={storeSlug} />
      </Suspense>
      <Wrap>
        {items.length === 0 ? (
          <div className="mx-auto max-w-xl">
            <Empty
              icon={<ShoppingBag />}
              title={st("سلتك فاضية")}
              description={st("لسه ما اخترتش حاجة. شوف القهوة أو أدوات التحضير.")}
              action={
                <>
                  <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg" })}>
                    {st("شوف القهوة")}
                  </Link>
                  <Link href={buildStoreUrl(storeSlug, "/categories")} className={btn({ variant: "outline", size: "lg" })}>
                    {st("الأقسام")}
                  </Link>
                </>
              }
            />
            {notice.stockChanged && (
              <Notice tone="warning">
                <p className="font-semibold">{st("عدّلنا سلتك على حسب المتاح")}</p>
                <p className="mt-0.5">{st("في منتجات خلصت، فشلناها.")}</p>
              </Notice>
            )}
          </div>
        ) : (
          <>
            <PageHead
              kicker={st("{0} منتج", num(count))}
              title={st("سلتك")}
              crumbs={[{ label: st("الرئيسية"), href: buildStoreUrl(storeSlug) }, { label: st("السلة") }]}
              note={summary.shipping === 0 ? st("التوصيل مجاني على طلبك.") : st("المتجر بيأكد معاك الطلب وميعاد التوصيل قبل الشحن.")}
            />

            {notice.stockChanged && (
              <div className="mx-auto mb-8 max-w-3xl">
                <Notice tone="warning">
                  <p className="font-semibold">{st("عدّلنا سلتك على حسب المتاح")}</p>
                  <p className="mt-0.5">{st("في منتجات خلصت أو الكمية المتاحة منها قلّت، فشلناها أو قلّلنا الكمية.")}</p>
                </Notice>
              </div>
            )}

            <div className="bn-bag">
              <section aria-label={st("المنتجات في السلة")} className="min-w-0">
                <ul className="bn-bag-items">
                  {items.map((item) => {
                    const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                    const wholesale = unit < item.product.price;
                    const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                    const href = buildStoreUrl(storeSlug, `/products/${item.product.slug}`);
                    return (
                      <li key={item.id} className="bn-bag-item">
                        <Link href={href} tabIndex={-1} aria-hidden className="bn-plate bn-bag-media">
                          <PlateImage src={item.product.image} sizes="(max-width: 768px) 6rem, 9rem" />
                        </Link>
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <Link href={href} className="bn-bag-name">
                                {item.product.name}
                              </Link>
                              {features.length > 0 && <p className="mt-1 text-sm text-(--bn-ink-2)">{features.map(([k, v]) => featureLabel(k, v)).join(" · ")}</p>}
                              <p className="mt-1 text-sm text-(--bn-ink-2)">
                                {st("{0} للواحدة", formatPrice(unit))}
                                {wholesale && <span className="ms-1.5 text-(--bn-ok)">{st("· سعر الكمية")}</span>}
                              </p>
                            </div>
                            <p className="bn-price shrink-0 text-lg">{formatPrice(unit * item.quantity)}</p>
                          </div>
                          <div className="mt-auto flex items-center justify-between gap-4 pt-4">
                            <div className="bn-qty bn-qty--sm">
                              <form action={changeQtyAction.bind(null, storeSlug, item.id, "decrement")}>
                                <SubmitButton aria-label={item.quantity <= 1 ? st("حذف {0}", item.product.name) : st("تقليل الكمية")}>
                                  <Minus />
                                </SubmitButton>
                              </form>
                              <output className="bn-num" aria-label={st("الكمية {0}", item.quantity)}>
                                {num(item.quantity)}
                              </output>
                              <form action={changeQtyAction.bind(null, storeSlug, item.id, "increment")}>
                                <SubmitButton aria-label={st("زيادة الكمية")} disabled={item.quantity >= item.product.stock}>
                                  <Plus />
                                </SubmitButton>
                              </form>
                            </div>
                            <form action={removeItemAction.bind(null, storeSlug, item.id)}>
                              <SubmitButton className="bn-link min-h-9 text-sm text-(--bn-ink-2)">
                                <span className="bn-underline">{st("إزالة")}</span>
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
                  <Link href={buildStoreUrl(storeSlug, "/products")} className="bn-link text-[0.9375rem]">
                    <span className="bn-underline">{st("كمّل تسوّق")}</span>
                  </Link>
                </div>
              </section>

              <aside aria-label={st("ملخص الطلب")} className="bn-bag-summary">
                <h2 className="bn-h3">{st("ملخص الطلب")}</h2>

                {shippingMethods.length > 0 && (
                  <fieldset className="mt-6">
                    <legend className="bn-opt-legend mb-3">{st("التوصيل")}</legend>
                    <div className="grid gap-2">
                      {shippingMethods.map((m) => {
                        const on = selectedShippingMethodId === m.id;
                        return (
                          <form key={m.id} action={selectShippingAction.bind(null, storeSlug, m.id)}>
                            <button type="submit" aria-pressed={on} data-on={on} className="bn-optbox bn-optbox--row w-full">
                              <span className="min-w-0 text-start">
                                <span className="block text-(--bn-ink)">{m.name}</span>
                                {m.estimatedDays ? <span className="block text-xs text-(--bn-ink-2)">{st("خلال {0}", days(m.estimatedDays))}</span> : null}
                              </span>
                              <span className="bn-num shrink-0 text-(--bn-ink)">{m.price === 0 ? st("مجاني") : formatPrice(m.price / 100)}</span>
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
                    <div className="bn-applied">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <TicketPercent className="size-5 shrink-0 text-(--bn-ok)" />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-(--bn-ink)" dir="ltr">
                            {appliedCoupon.coupon.code}
                          </p>
                          <p className="text-xs text-(--bn-ink-2)">{appliedCoupon.coupon.type === "PERCENTAGE" ? st("خصم {0}٪", num(appliedCoupon.coupon.value)) : st("خصم {0}", formatPrice(appliedCoupon.coupon.value))}</p>
                        </div>
                      </div>
                      <form action={removeCouponAction.bind(null, storeSlug)}>
                        <SubmitButton className="bn-link min-h-10 px-2 text-sm">
                          <span className="bn-underline">{st("إزالة")}</span>
                        </SubmitButton>
                      </form>
                    </div>
                  ) : (
                    <Disclosure icon={<TicketPercent />} title={st("عندك كود خصم؟")} open={!!notice.couponMessage}>
                      <form action={applyCouponAction.bind(null, storeSlug)} className="flex gap-2">
                        <label className="sr-only" htmlFor="bn-coupon">
                          {st("كود الخصم")}
                        </label>
                        <input id="bn-coupon" name="code" required placeholder={st("اكتب الكود")} autoComplete="off" className="bn-field uppercase" />
                        <SubmitButton className={btn({ variant: "outline" })}>{st("تطبيق")}</SubmitButton>
                      </form>
                    </Disclosure>
                  )}

                  {loyaltyEnabled &&
                    (appliedLoyalty ? (
                      <div className="bn-applied">
                        <div className="flex items-center gap-2.5">
                          <Gift className="size-5 text-(--bn-ok)" />
                          <div>
                            <p className="text-sm text-(--bn-ink)">{st("استخدمت {0} نقطة", num(appliedLoyalty.points))}</p>
                            <p className="text-xs text-(--bn-ink-2)">{st("خصم {0}", formatPrice((appliedLoyalty.points * loyaltyPointsValue) / 100))}</p>
                          </div>
                        </div>
                        <form action={removeLoyaltyAction.bind(null, storeSlug)}>
                          <SubmitButton className="bn-link min-h-10 px-2 text-sm">
                            <span className="bn-underline">{st("إزالة")}</span>
                          </SubmitButton>
                        </form>
                      </div>
                    ) : (
                      <Disclosure icon={<Gift />} title={st("استخدم نقاط المكافآت")}>
                        <form action={applyLoyaltyAction.bind(null, storeSlug)} className="space-y-2">
                          <input name="loyaltyPhone" type="tel" inputMode="tel" autoComplete="tel" required placeholder={st("رقم الموبايل")} aria-label={st("رقم الموبايل")} className="bn-field" />
                          <div className="flex gap-2">
                            <input name="loyaltyPoints" type="number" inputMode="numeric" min={loyaltyMinRedemption} step={1} required placeholder={st("عدد النقاط (أقل حاجة {0})", num(loyaltyMinRedemption))} aria-label={st("عدد النقاط")} className="bn-field" />
                            <SubmitButton className={btn({ variant: "outline" })}>{st("استخدام")}</SubmitButton>
                          </div>
                        </form>
                      </Disclosure>
                    ))}
                </div>

                <div className="mt-6">
                  <Totals summary={summary} />
                </div>

                <Link href={checkoutHref} className={btn({ size: "lg", full: true, className: "mt-6 max-lg:hidden" })}>
                  {st("كمّل الطلب")}
                </Link>
                <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-(--bn-ink-2)">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-(--bn-crema-ink)" />
                  {st("بعد ما تبعت الطلب، المتجر هيتواصل معاك يأكد البيانات وميعاد التوصيل.")}
                </p>
              </aside>
            </div>

            <div className="bn-buybar lg:hidden" data-show="true">
              <div className="bn-wrap flex items-center gap-4 py-3">
                <div className="shrink-0">
                  <p className="text-xs text-(--bn-ink-2)">{st("الإجمالي")}</p>
                  <p className="bn-price text-lg">{formatPrice(summary.total)}</p>
                </div>
                <Link href={checkoutHref} className={btn({ size: "lg", className: "flex-1" })}>
                  {st("كمّل الطلب")}
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
