import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";

import { CreateOrderAction } from "@/actions/store/orders.actions";
import { GetStoreCheckoutPaymentMethodsAction } from "@/actions/payment-methods/payment-methods.actions";
import { GetCartItemsAction } from "@/actions/store/cart.actions";
import CheckoutForm from "@/app/store/[slug]/checkout/_components/CheckoutForm";
import type { PaymentMethodKey } from "@/constants/welcome/payment-methods";
import { Button } from "@/components/ui/button";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { formatPrice } from "@/lib/utils";

type CheckoutPageProps = {
  params: Promise<{ slug: string }>;
};

type CheckoutPaymentMethod = {
  key: string;
  label: string;
};

function isValidPaymentMethod(
  value: string,
  enabledMethods: CheckoutPaymentMethod[],
): value is PaymentMethodKey {
  return enabledMethods.some((method) => method.key === value);
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;

  const [paymentMethods, cartData] = await Promise.all([
    GetStoreCheckoutPaymentMethodsAction(slug),
    GetCartItemsAction(slug),
  ]);

  const { store, items, summary } = cartData;

  async function handleCreateOrder(formData: FormData) {
    "use server";

    const enabledPaymentMethods =
      await GetStoreCheckoutPaymentMethodsAction(slug);

    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();

    const defaultPaymentMethod =
      enabledPaymentMethods[0]?.key ?? "cash_on_delivery";

    const paymentMethodValue = String(
      formData.get("paymentMethod") ?? defaultPaymentMethod,
    ).trim();

    if (!fullName) throw new Error("الاسم بالكامل مطلوب");
    if (!phone) throw new Error("رقم الموبايل مطلوب");
    if (!address) throw new Error("العنوان مطلوب");

    if (!isValidPaymentMethod(paymentMethodValue, enabledPaymentMethods)) {
      throw new Error("طريقة الدفع غير متاحة");
    }

    await CreateOrderAction(slug, {
      fullName,
      phone,
      address,
      paymentMethod: paymentMethodValue,
    });
  }

  return (
    <div className="min-h-screen" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href={buildStoreUrl(slug, "/cart")}>
              <ArrowRight className="size-4" />
              العودة للسلة
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            إتمام الطلب
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            أكمل بياناتك لإتمام عملية الشراء بنجاح
          </p>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="rounded-2xl border bg-muted/40 p-8 text-center">
            <ShoppingBag className="mx-auto mb-4 size-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">لا توجد طرق دفع متاحة</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              صاحب المتجر لم يفعّل أي طريقة دفع حتى الآن.
            </p>
            <Button asChild className="mt-4 rounded-2xl" variant="outline">
              <Link href={buildStoreUrl(slug)}>العودة للمتجر</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Form */}
            <CheckoutForm
              paymentMethods={paymentMethods}
              action={handleCreateOrder}
            />

            {/* Order summary sidebar */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border bg-muted/30 p-6">
                <h2 className="mb-5 font-semibold">ملخص الطلب</h2>

                {/* Items */}
                <div className="mb-5 space-y-3">
                  {items.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-background">
                        {item.product.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="size-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 font-medium">
                          {item.product.name}
                        </p>
                        {item.selectedFeatures &&
                          Object.keys(
                            item.selectedFeatures as Record<string, string>,
                          ).length > 0 && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {Object.entries(
                                item.selectedFeatures as Record<string, string>,
                              )
                                .map(
                                  ([k, v]) =>
                                    `${k === "size" ? "المقاس" : k === "color" ? "اللون" : k}: ${v}`,
                                )
                                .join(" · ")}
                            </p>
                          )}
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} ×{" "}
                          {formatPrice(item.product.price)}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  {items.length > 4 && (
                    <p className="text-xs text-muted-foreground">
                      + {items.length - 4} منتج آخر
                    </p>
                  )}
                </div>

                <div className="space-y-2 border-t pt-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>المجموع الفرعي</span>
                    <span>{formatPrice(summary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>الشحن</span>
                    <span>
                      {summary.shipping === 0
                        ? "مجاني"
                        : formatPrice(summary.shipping)}
                    </span>
                  </div>
                  {summary.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>الخصم</span>
                      <span>- {formatPrice(summary.discount)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-background px-4 py-3">
                  <span className="font-semibold">الإجمالي</span>
                  <span
                    className="text-2xl font-extrabold"
                    style={{ color: "var(--store-primary)" }}
                  >
                    {formatPrice(summary.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
