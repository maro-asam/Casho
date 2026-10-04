import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Gift,
  Lock,
  Minus,
  Plus,
  ShoppingBag,
  TicketPercent,
  Trash2,
  XCircle,
} from "lucide-react";

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
import { Container, EmptyState, PageHeader, btn } from "../ui";
import SubmitButton from "../../shared/SubmitButton";

const nf = new Intl.NumberFormat("ar-EG");

const INPUT =
  "h-11 w-full min-w-0 rounded-(--c-radius-sm) border border-border bg-background px-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40 sm:text-sm";

function Notice({ tone, children }: { tone: "success" | "error" | "warning"; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? XCircle : AlertTriangle;
  return (
    <div
      role={tone === "success" ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2.5 rounded-(--c-radius-sm) px-3.5 py-3 text-sm",
        tone === "success" && "bg-(--c-success-soft) text-(--c-success)",
        tone === "error" && "bg-(--c-sale-soft) text-(--c-danger)",
        tone === "warning" && "bg-(--c-warning-soft) text-(--c-warning)",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default function ClassicCart({ storeSlug, cart, notice }: CartViewProps) {
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
    <Container className={cn("pb-6", items.length > 0 && "c-has-bottom-bar")}>
      <Suspense fallback={null}>
        <CartRestorer storeSlug={storeSlug} />
      </Suspense>

      <PageHeader
        breadcrumbs={[{ label: "الرئيسية", href: buildStoreUrl(storeSlug) }, { label: "السلة" }]}
        title="سلة المشتريات"
        meta={items.length > 0 ? `${nf.format(count)} ${count === 1 ? "منتج" : "منتجات"}` : undefined}
      />

      {notice.stockChanged && (
        <div className="mb-5">
          <Notice tone="warning">
            <p className="font-semibold">عدّلنا سلتك على حسب المتاح</p>
            <p className="mt-0.5">في منتجات خلصت أو الكمية المتاحة منها قلّت، فشلناها أو قلّلنا الكمية. راجع السلة وكمّل طلبك.</p>
          </Notice>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag />}
          title="سلتك فاضية"
          description="لسه ما ضفتش أي منتجات. تصفح المتجر واختار اللي يعجبك."
          action={
            <Link href={buildStoreUrl(storeSlug, "/products")} className={btn({ size: "lg", className: "min-w-44" })}>
              ابدأ التسوق
            </Link>
          }
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_25rem]">
          {/* ── Items ─────────────────────────────────────────────────── */}
          <section aria-label="المنتجات في السلة">
            <ul className="divide-y divide-border border-y border-border">
              {items.map((item) => {
                const unit = unitPriceFor(item.product.price, item.product.wholesaleOptions, item.quantity);
                const wholesale = unit < item.product.price;
                const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
                const productHref = buildStoreUrl(storeSlug, `/products/${item.product.slug}`);
                const atMax = item.quantity >= item.product.stock;

                return (
                  <li key={item.id} className="flex gap-3.5 py-5 sm:gap-5">
                    <Link
                      href={productHref}
                      className="c-img-bg relative size-24 shrink-0 overflow-hidden rounded-(--c-radius-sm) sm:size-28"
                      tabIndex={-1}
                      aria-hidden
                    >
                      <Image
                        src={item.product.image || "/images/product-placeholder.png"}
                        alt=""
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={productHref}
                            className="line-clamp-2 text-[0.9375rem] font-semibold leading-snug hover:underline sm:text-base"
                          >
                            {item.product.name}
                          </Link>
                          {features.length > 0 && (
                            <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                              {features.map(([k, v]) => `${FEATURE_LABEL[k] ?? k}: ${v}`).join(" · ")}
                            </p>
                          )}
                          <p className="mt-1 text-[0.8125rem] text-muted-foreground tabular-nums">
                            {formatPrice(unit)} للقطعة
                            {wholesale && (
                              <span className="ms-1.5 font-semibold text-(--c-success)">· سعر الجملة</span>
                            )}
                          </p>
                        </div>
                        <form action={removeItemAction.bind(null, storeSlug, item.id)} className="-me-2 -mt-2">
                          <SubmitButton
                            aria-label={`حذف ${item.product.name}`}
                            className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-(--c-subtle) hover:text-(--c-danger) [&_svg]:size-[1.125rem]"
                          >
                            <Trash2 />
                          </SubmitButton>
                        </form>
                      </div>

                      <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                        <div className="flex h-10 items-center rounded-(--c-btn-radius) border border-border">
                          <form action={changeQtyAction.bind(null, storeSlug, item.id, "decrement")}>
                            <SubmitButton
                              aria-label={item.quantity <= 1 ? `حذف ${item.product.name}` : "تقليل الكمية"}
                              className="grid h-10 w-10 place-items-center [&_svg]:size-4"
                            >
                              {item.quantity <= 1 ? <Trash2 /> : <Minus />}
                            </SubmitButton>
                          </form>
                          <span className="w-7 text-center text-sm font-semibold tabular-nums" aria-label={`الكمية ${item.quantity}`}>
                            {item.quantity}
                          </span>
                          <form action={changeQtyAction.bind(null, storeSlug, item.id, "increment")}>
                            <SubmitButton
                              aria-label="زيادة الكمية"
                              disabled={atMax}
                              title={atMax ? "مفيش كمية أكتر متاحة" : undefined}
                              className="grid h-10 w-10 place-items-center disabled:opacity-30 [&_svg]:size-4"
                            >
                              <Plus />
                            </SubmitButton>
                          </form>
                        </div>
                        <p className="text-base font-bold tabular-nums">{formatPrice(unit * item.quantity)}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <Link
              href={buildStoreUrl(storeSlug, "/products")}
              className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline"
            >
              كمّل تسوق
            </Link>
          </section>

          {/* ── Summary ───────────────────────────────────────────────── */}
          <aside aria-label="ملخص الطلب" className="lg:sticky lg:top-[calc(var(--c-header-h)+3.75rem)] lg:self-start">
            <div className="space-y-5 rounded-(--c-radius-lg) bg-(--c-subtle) p-5 sm:p-6">
              <h2 className="text-lg font-bold">ملخص الطلب</h2>

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
                            className={cn(
                              "flex min-h-12 w-full items-center gap-3 rounded-(--c-radius-sm) border bg-background px-3.5 py-2 text-start text-sm transition-colors",
                              on ? "border-foreground" : "border-border hover:border-foreground/40",
                            )}
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "grid size-[1.125rem] shrink-0 place-items-center rounded-full border-2",
                                on ? "border-foreground" : "border-muted-foreground/50",
                              )}
                            >
                              {on && <span className="size-2 rounded-full bg-foreground" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium">{m.name}</span>
                              {m.estimatedDays ? (
                                <span className="block text-xs text-muted-foreground">خلال {nf.format(m.estimatedDays)} أيام</span>
                              ) : null}
                            </span>
                            <span className="shrink-0 font-semibold tabular-nums">
                              {m.price === 0 ? "مجاني" : formatPrice(m.price / 100)}
                            </span>
                          </button>
                        </form>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {/* Coupon */}
              <div className="space-y-2.5">
                {notice.couponMessage && (
                  <Notice tone={notice.couponStatus === "success" ? "success" : "error"}>{notice.couponMessage}</Notice>
                )}
                {!appliedCoupon && <PendingCouponApplier storeSlug={storeSlug} />}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-3 rounded-(--c-radius-sm) border border-dashed border-foreground/30 bg-background px-3.5 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <TicketPercent className="size-5 shrink-0 text-(--c-success)" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold" dir="ltr">
                          {appliedCoupon.coupon.code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {appliedCoupon.coupon.type === "PERCENTAGE"
                            ? `خصم ${appliedCoupon.coupon.value}%`
                            : `خصم ${formatPrice(appliedCoupon.coupon.value)}`}
                        </p>
                      </div>
                    </div>
                    <form action={removeCouponAction.bind(null, storeSlug)}>
                      <SubmitButton className="min-h-10 px-2 text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                        إزالة
                      </SubmitButton>
                    </form>
                  </div>
                ) : (
                  <details className="c-accordion group" open={notice.couponStatus === "error"}>
                    <summary className="flex min-h-11 items-center justify-between gap-2 text-sm font-semibold">
                      <span className="flex items-center gap-2">
                        <TicketPercent className="size-[1.125rem] text-muted-foreground" />
                        عندك كوبون خصم؟
                      </span>
                      <ChevronDown aria-hidden className="c-accordion-icon size-4 text-muted-foreground" />
                    </summary>
                    <form action={applyCouponAction.bind(null, storeSlug)} className="mt-2 flex gap-2">
                      <label className="sr-only" htmlFor="coupon-code">
                        كود الخصم
                      </label>
                      <input id="coupon-code" name="code" required placeholder="اكتب الكود" autoComplete="off" className={cn(INPUT, "uppercase")} />
                      <SubmitButton className={btn({ variant: "primary", size: "md", className: "h-11 px-4" })}>تطبيق</SubmitButton>
                    </form>
                  </details>
                )}
              </div>

              {loyaltyEnabled && (
                <div>
                  {appliedLoyalty ? (
                    <div className="flex items-center justify-between gap-3 rounded-(--c-radius-sm) bg-background px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Gift className="size-5 text-(--c-success)" />
                        <div>
                          <p className="text-sm font-semibold">استخدمت {nf.format(appliedLoyalty.points)} نقطة</p>
                          <p className="text-xs text-muted-foreground">
                            خصم {formatPrice((appliedLoyalty.points * loyaltyPointsValue) / 100)}
                          </p>
                        </div>
                      </div>
                      <form action={removeLoyaltyAction.bind(null, storeSlug)}>
                        <SubmitButton className="min-h-10 px-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                          إزالة
                        </SubmitButton>
                      </form>
                    </div>
                  ) : (
                    <details className="c-accordion group">
                      <summary className="flex min-h-11 items-center justify-between gap-2 text-sm font-semibold">
                        <span className="flex items-center gap-2">
                          <Gift className="size-[1.125rem] text-muted-foreground" />
                          استخدم نقاط المكافآت
                        </span>
                        <ChevronDown aria-hidden className="c-accordion-icon size-4 text-muted-foreground" />
                      </summary>
                      <form action={applyLoyaltyAction.bind(null, storeSlug)} className="mt-2 space-y-2">
                        <input
                          name="loyaltyPhone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          required
                          placeholder="رقم الموبايل"
                          aria-label="رقم الموبايل"
                          className={INPUT}
                        />
                        <div className="flex gap-2">
                          <input
                            name="loyaltyPoints"
                            type="number"
                            inputMode="numeric"
                            min={loyaltyMinRedemption}
                            step={1}
                            required
                            placeholder={`عدد النقاط (أقل حاجة ${nf.format(loyaltyMinRedemption)})`}
                            aria-label="عدد النقاط"
                            className={INPUT}
                          />
                          <SubmitButton className={btn({ size: "md", className: "h-11 px-4" })}>استخدام</SubmitButton>
                        </div>
                      </form>
                    </details>
                  )}
                </div>
              )}

              <dl className="space-y-2.5 border-t border-border pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">المجموع الفرعي</dt>
                  <dd className="font-medium tabular-nums">{formatPrice(summary.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">الشحن</dt>
                  <dd className="font-medium tabular-nums">{summary.shipping === 0 ? "مجاني" : formatPrice(summary.shipping)}</dd>
                </div>
                {summary.discount > 0 && (
                  <div className="flex justify-between gap-4 text-(--c-success)">
                    <dt>الخصم</dt>
                    <dd className="font-semibold tabular-nums">− {formatPrice(summary.discount)}</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3.5">
                  <dt className="text-base font-bold">الإجمالي</dt>
                  <dd className="text-xl font-bold tabular-nums">{formatPrice(summary.total)}</dd>
                </div>
              </dl>

              <Link href={checkoutHref} className={btn({ size: "lg", full: true, className: "hidden lg:inline-flex" })}>
                <Lock />
                إتمام الطلب
              </Link>

              <p className="text-xs leading-6 text-muted-foreground">
                بعد ما تبعت الطلب، المتجر هيتواصل معاك لتأكيد البيانات وميعاد التوصيل.
              </p>
            </div>
          </aside>

          {/* Sticky checkout bar — phones/tablets */}
          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="c-container flex items-center gap-4 py-3">
              <div className="shrink-0">
                <p className="text-xs text-muted-foreground">الإجمالي</p>
                <p className="text-lg font-bold leading-tight tabular-nums">{formatPrice(summary.total)}</p>
              </div>
              <Link href={checkoutHref} className={btn({ size: "lg", className: "flex-1" })}>
                إتمام الطلب
              </Link>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
