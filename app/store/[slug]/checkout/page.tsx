import type { Metadata } from "next";

import { CreateOrderAction } from "@/actions/store/orders.actions";
import { GetStoreCheckoutPaymentMethodsAction } from "@/actions/payment-methods/payment-methods.actions";
import { GetCartItemsAction } from "@/actions/store/cart.actions";
import type { PaymentMethodKey } from "@/constants/welcome/payment-methods";
import { isGovernorateCode } from "@/constants/egypt-governorates";
import { getStorefrontTheme } from "../_themes";
import { getStoreThemeId, getStorefrontClosure } from "../_lib/storefront";
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
  const closure = await getStorefrontClosure(cartData.store.id);
  if (closure) return <theme.StoreClosed storeSlug={slug} pause={closure.pause} />;

  // Digital-only carts can't be paid on delivery — there is no delivery.
  const checkoutMethods = cartData.digitalOnly
    ? paymentMethods.filter((method) => method.key !== "cash_on_delivery")
    : paymentMethods;

  async function handleCreateOrder(formData: FormData) {
    "use server";

    const [enabledPaymentMethods, cart] = await Promise.all([
      GetStoreCheckoutPaymentMethodsAction(slug),
      GetCartItemsAction(slug),
    ]);

    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const governorate = String(formData.get("governorate") ?? "").trim();

    const defaultPaymentMethod =
      enabledPaymentMethods[0]?.key ?? "cash_on_delivery";

    const paymentMethodValue = String(
      formData.get("paymentMethod") ?? defaultPaymentMethod,
    ).trim();

    if (!fullName) throw new Error("الاسم بالكامل مطلوب");
    if (!phone) throw new Error("رقم الموبايل مطلوب");
    if (!cart.digitalOnly) {
      if (!isGovernorateCode(governorate)) throw new Error("اختر المحافظة");
      if (!address) throw new Error("العنوان مطلوب");
    }

    if (!isValidPaymentMethod(paymentMethodValue, enabledPaymentMethods)) {
      throw new Error("طريقة الدفع غير متاحة");
    }

    await CreateOrderAction(slug, {
      fullName,
      phone,
      email,
      address,
      governorate,
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
        paymentMethods={checkoutMethods}
        createOrder={handleCreateOrder}
      />
    </>
  );
}
