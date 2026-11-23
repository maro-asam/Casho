import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Gift, Minus, Plus, ShoppingBag, TicketPercent, Trash2, XCircle } from "lucide-react";

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
import { Empty, GameIcon, PageHead, Panel, Price, Wrap, btn, featureLabel, num, packagesCount } from "../ui";
import { formatPrice, st } from "@/lib/i18n/storefront";

export function Notice({ tone, children }: { tone: "success" | "error" | "warning"; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? XCircle : AlertTriangle;
  return (
    <div role={tone === "success" ? "status" : "alert"} className="an-notice" data-tone={tone}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Totals({ summary, digitalOnly }: { summary: CartViewProps["cart"]["summary"]; digitalOnly?: boolean }) {
  return (
    <dl className="an-totals">
      <div>
        <dt>{st("المجموع")}</dt>
        <dd>{formatPrice(summary.subtotal)}</dd>
      </div>
      {!digitalOnly && (
        <div>
          <dt>{st("التوصيل")}</dt>
          <dd>{summary.shipping === 0 ? st("مجاني") : formatPrice(summary.shipping)}</dd>
        </div>
      )}
      {summary.discount > 0 && (
        <div className="text-(--an-ok)">
          <dt>{st("الخصم")}</dt>
          <dd>− {formatPrice(summary.discount)}</dd>
        </div>
      )}
      <div className="an-totals-grand">
        <dt>{st("الإجمالي")}</dt>
        <dd>
          <Price value={summary.total} size="lg" />
        </dd>
      </div>
    </dl>
  );
}

/** One cart line: the package, the account it goes to, its quantity. */
export function CartLine({ storeSlug, item, editable = true }: { storeSlug: string; item: CartViewProps["cart"]["items"][number]; editable?: boolean }) {
  const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
  const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
  return (
    <li className="an-line">
      <Link href={buildStoreUrl(storeSlug, `/products/${item.product.slug}`)} tabIndex={-1} aria-hidden>
        <GameIcon src={item.product.image} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={buildStoreUrl(storeSlug, `/products/${item.product.slug}`)} className="an-line-name">
          {item.product.name}
        </Link>
        {features.length > 0 && (
          <p className="an-line-detail">
            {features.map(([k, v]) => (
              <span key={k} className="block" dir="auto">
                {featureLabel(k, v)}
              </span>
            ))}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          {editable ? (
            <div className="an-qty">
              <form action={changeQtyAction.bind(null, storeSlug, item.id, "decrement")}>
                <SubmitButton aria-label={item.quantity <= 1 ? st("حذف {0}", item.product.name) : st("تقليل الكمية")} className="an-qty-btn">
                  <Minus />
                </SubmitButton>
              </form>
              <span className="w-7 text-center text-sm font-bold tabular-nums" aria-label={st("الكمية {0}", item.quantity)}>
                {num(item.quantity)}
              </span>
              <form action={changeQtyAction.bind(null, storeSlug, item.id, "increment")}>
                <SubmitButton aria-label={st("زيادة الكمية")} disabled={item.quantity >= item.product.stock} className="an-qty-btn">
                  <Plus />
                </SubmitButton>
              </form>
            </div>
          ) : (
            <span className="text-[0.75rem] text-(--an-muted)">× {num(item.quantity)}</span>
          )}
          <Price value={unit * item.quantity} />
        </div>
      </div>
      <form action={removeItemAction.bind(null, storeSlug, item.id)} className="self-start">
        <SubmitButton className="an-iconbtn an-iconbtn--sm" aria-label={st("شيل {0}", item.product.name)}>
          <Trash2 />
        </SubmitButton>
      </form>
    </li>
  );
}

export default function ArenaCart({ storeSlug, cart, notice }: CartViewProps) {
  const { items, summary, appliedCoupon, shippingMethods, selectedShippingMethodId, appliedLoyalty, loyaltyEnabled, loyaltyMinRedemption, loyaltyPointsValue, digitalOnly } = cart;
  const checkoutHref = buildStoreUrl(storeSlug, "/checkout");
  const count = items.reduce((t, i) => t + i.quantity, 0);

  return (
    <Wrap className="an-page">
      <Suspense fallback={null}>
        <CartRestorer storeSlug={storeSlug} />
      </Suspense>
      <PageHead title={st("السلة")} note={items.length ? st("{0} في السلة", packagesCount(count)) : undefined} />

      {notice.stockChanged && (
        <div className="mb-5">
          <Notice tone="warning">{st("في باقات خلصت أو الكمية المتاحة منها قلّت، فعدّلنا السلة على حسب المتاح.")}</Notice>
        </div>
      )}

      {items.length === 0 ? (
        <Empty
          icon={<ShoppingBag />}
          title={st("سلتك فاضية")}
          description={st("اختار لعبتك وحدّد الباقة اللي تناسبك.")}
          action={
            <Link href={buildStoreUrl(storeSlug, "/categories")} className={btn({ size: "lg" })}>
              {st("اختار لعبتك")}
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Panel as="section" className="p-2 sm:p-3" aria-label={st("الباقات في السلة")}>
            <ul className="an-lines">
              {items.map((item) => (
                <CartLine key={item.id} storeSlug={storeSlug} item={item} />
              ))}
            </ul>
          </Panel>

          <Panel as="aside" className="space-y-4 p-4 sm:p-5 lg:sticky lg:top-20 lg:self-start" aria-label={st("ملخص الطلب")}>
            {!digitalOnly && shippingMethods.length > 0 && (
              <fieldset className="space-y-2">
                <legend className="an-label">{st("طريقة التوصيل")}</legend>
                {shippingMethods.map((m) => {
                  const on = selectedShippingMethodId === m.id;
                  return (
                    <form key={m.id} action={selectShippingAction.bind(null, storeSlug, m.id)}>
                      <button type="submit" aria-pressed={on} className="an-option" data-on={on || undefined}>
                        <span className="font-bold">{m.name}</span>
                        <span className="tabular-nums">{m.price === 0 ? st("مجاني") : formatPrice(m.price / 100)}</span>
                      </button>
                    </form>
                  );
                })}
              </fieldset>
            )}

            {notice.couponMessage && <Notice tone={notice.couponStatus === "success" ? "success" : "error"}>{notice.couponMessage}</Notice>}
            {!appliedCoupon && <PendingCouponApplier storeSlug={storeSlug} />}
            {appliedCoupon ? (
              <div className="an-applied">
                <TicketPercent className="size-5 shrink-0 text-(--an-ok)" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold" dir="ltr">
                    {appliedCoupon.coupon.code}
                  </p>
                  <p className="text-[0.75rem] text-(--an-muted)">
                    {appliedCoupon.coupon.type === "PERCENTAGE" ? st("خصم {0}٪", num(appliedCoupon.coupon.value)) : st("خصم {0}", formatPrice(appliedCoupon.coupon.value))}
                  </p>
                </div>
                <form action={removeCouponAction.bind(null, storeSlug)}>
                  <SubmitButton className="an-linkbtn">{st("إزالة")}</SubmitButton>
                </form>
              </div>
            ) : (
              <form action={applyCouponAction.bind(null, storeSlug)} className="flex gap-2">
                <label className="sr-only" htmlFor="an-coupon">
                  {st("كود الخصم")}
                </label>
                <input id="an-coupon" name="code" required placeholder={st("كود خصم؟")} autoComplete="off" className="an-field uppercase" />
                <SubmitButton className={btn({ variant: "glass" })}>{st("تطبيق")}</SubmitButton>
              </form>
            )}

            {loyaltyEnabled &&
              (appliedLoyalty ? (
                <div className="an-applied">
                  <Gift className="size-5 shrink-0 text-(--an-ok)" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{st("استخدمت {0} نقطة", num(appliedLoyalty.points))}</p>
                    <p className="text-[0.75rem] text-(--an-muted)">{st("خصم {0}", formatPrice((appliedLoyalty.points * loyaltyPointsValue) / 100))}</p>
                  </div>
                  <form action={removeLoyaltyAction.bind(null, storeSlug)}>
                    <SubmitButton className="an-linkbtn">{st("إزالة")}</SubmitButton>
                  </form>
                </div>
              ) : (
                <details className="an-details">
                  <summary>
                    <Gift className="size-4 text-(--an-soft)" />
                    {st("استخدم نقاط المكافآت")}
                  </summary>
                  <form action={applyLoyaltyAction.bind(null, storeSlug)} className="mt-3 space-y-2">
                    <input name="loyaltyPhone" type="tel" inputMode="tel" autoComplete="tel" required placeholder={st("رقم الموبايل")} aria-label={st("رقم الموبايل")} className="an-field" />
                    <div className="flex gap-2">
                      <input name="loyaltyPoints" type="number" inputMode="numeric" min={loyaltyMinRedemption} step={1} required placeholder={st("عدد النقاط (أقل حاجة {0})", num(loyaltyMinRedemption))} aria-label={st("عدد النقاط")} className="an-field" />
                      <SubmitButton className={btn({ variant: "glass" })}>{st("استخدام")}</SubmitButton>
                    </div>
                  </form>
                </details>
              ))}

            <Totals summary={summary} digitalOnly={digitalOnly} />
            <Link href={checkoutHref} className={cn(btn({ size: "lg", full: true }))}>
              {st("كمّل الطلب")}
            </Link>
            <Link href={buildStoreUrl(storeSlug, "/categories")} className="an-linkbtn block text-center">
              {st("ضيف باقة تانية")}
            </Link>
          </Panel>
        </div>
      )}
    </Wrap>
  );
}
