import type { Metadata } from "next";

import { CreateOrderAction } from "@/actions/store/orders.actions";
import { GetStoreCheckoutPaymentMethodsAction } from "@/actions/payment-methods/payment-methods.actions";
import { GetCartItemsAction } from "@/actions/store/cart.actions";
import type { PaymentMethodKey } from "@/constants/welcome/payment-methods";
import { getStorefrontTheme } from "../_themes";
import { getStoreThemeId } from "../_lib/storefront";
import { PixelEvent } from "../_components/pixels/PixelEvent";

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

export const metadata: Metadata = { title: "إتمام الطلب", robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;

  const [paymentMethods, cartData, themeId] = await Promise.all([
    GetStoreCheckoutPaymentMethodsAction(slug),
    GetCartItemsAction(slug),
    getStoreThemeId(slug),
  ]);
  const theme = getStorefrontTheme(themeId);

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
    <>
      {cartData.items.length > 0 && (
        <PixelEvent
          name="InitiateCheckout"
          payload={{
            value: cartData.summary.total,
            currency: "EGP",
            contents: cartData.items.map((item) => ({
              id: item.product.id,
              quantity: item.quantity,
              price: item.product.price,
              name: item.product.name,
            })),
          }}
        />
      )}
      <theme.Checkout
        storeSlug={slug}
        cart={cartData}
        paymentMethods={paymentMethods}
        createOrder={handleCreateOrder}
      />
    </>
  );
}
