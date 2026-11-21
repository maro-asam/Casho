import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";

import { CreateOrderAction } from "@/actions/store/orders.actions";
import { GetStoreCheckoutPaymentMethodsAction } from "@/actions/payment-methods/payment-methods.actions";
import { GetCartItemsAction } from "@/actions/store/cart.actions";
import type { PaymentMethodKey } from "@/constants/welcome/payment-methods";
import { isGovernorateCode } from "@/constants/egypt-governorates";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { POLICY_LABELS, consentPolicyTypes, policyPath } from "@/lib/store-policies";
import { loadPolicySettings } from "@/lib/store-policies/server";
import type { CheckoutLegal, CheckoutResult } from "../_themes/types";
import { getStorefrontTheme } from "../_themes";
import { getManualTransferDetails, getStoreThemeId, getStorefrontClosure } from "../_lib/storefront";
import { PixelEvent } from "../_components/pixels/PixelEvent";
import { st } from "@/lib/i18n/storefront";
import { loadStoreLocale } from "@/lib/i18n/storefront/server";

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

/**
 * The checkout's own refusals are Arabic sentences meant for the shopper (the
 * form translates them); anything else — a database or network failure —
 * stays in the logs and the shopper gets a plain "try again".
 */
function shopperMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/[\u0600-\u06FF]/.test(message)) return message;
  console.error("[checkout] order failed", error);
  return st("حصلت مشكلة واحنا بنأكد طلبك. جرّب تاني بعد شوية.");
}

/** The terms and return policy the shopper agrees to by ordering (terms first). */
async function checkoutLegal(storeId: string, slug: string): Promise<CheckoutLegal> {
  const data = await loadPolicySettings(storeId);
  const links = consentPolicyTypes(data.stored)
    .sort((a, b) => (a === "terms" ? -1 : b === "terms" ? 1 : 0))
    .map((type) => ({ label: st(POLICY_LABELS[type].title), href: buildStoreUrl(slug, policyPath(type)) }));
  return { requireConsent: data.requireTermsAtCheckout && links.length > 0, links };
}

/** Validates the form and places the order (CreateOrderAction redirects to the order page). */
async function placeOrder(slug: string, formData: FormData) {
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

  if (!fullName) throw new Error(st("الاسم بالكامل مطلوب"));
  if (!phone) throw new Error(st("رقم الموبايل مطلوب"));
  if (!cart.digitalOnly) {
    if (!isGovernorateCode(governorate)) throw new Error(st("اختر المحافظة"));
    if (!address) throw new Error(st("العنوان مطلوب"));
  }

  if (!isValidPaymentMethod(paymentMethodValue, enabledPaymentMethods)) {
    throw new Error(st("طريقة الدفع غير متاحة"));
  }

  // Re-read the setting: the page may have been open since the merchant changed it.
  const { requireConsent } = await checkoutLegal(cart.store.id, slug);
  const termsAccepted = formData.get("acceptTerms") === "on";
  if (requireConsent && !termsAccepted) throw new Error(st("لازم توافق على الشروط عشان تكمّل الطلب"));

  await CreateOrderAction(slug, {
    fullName,
    phone,
    email,
    address,
    governorate,
    paymentMethod: paymentMethodValue,
    termsAccepted: requireConsent && termsAccepted,
    paymentProof: { payer: formData.get("paymentPayer"), image: formData.get("paymentProof") },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  await loadStoreLocale((await params).slug);
  return { title: st("إتمام الطلب"), robots: { index: false, follow: false } };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  await loadStoreLocale(slug);

  const [paymentMethods, cartData, themeId] = await Promise.all([
    GetStoreCheckoutPaymentMethodsAction(slug),
    GetCartItemsAction(slug),
    getStoreThemeId(slug),
  ]);
  const theme = getStorefrontTheme(themeId);
  const closure = await getStorefrontClosure(cartData.store.id);
  if (closure) return <theme.StoreClosed storeSlug={slug} pause={closure.pause} />;

  // Digital-only carts can't be paid on delivery — there is no delivery.
  const offered = cartData.digitalOnly ? paymentMethods.filter((method) => method.key !== "cash_on_delivery") : paymentMethods;
  const [legal, transfers] = await Promise.all([
    checkoutLegal(cartData.store.id, slug),
    getManualTransferDetails(cartData.store.id, offered.map((method) => method.key)),
  ]);
  // A manual method with details asks for "paid from" + a screenshot (required as the
  // merchant set) before the order is placed.
  const checkoutMethods = offered.map((method) => {
    const transferTo = transfers.details[method.key] ?? null;
    return { ...method, label: st(method.label), transferTo, proof: transferTo ? transfers.rules : null };
  });

  async function handleCreateOrder(formData: FormData): Promise<CheckoutResult> {
    "use server";
    try {
      await placeOrder(slug, formData);
    } catch (error) {
      unstable_rethrow(error); // the redirect to the order page (or Paymob)
      return { error: shopperMessage(error) };
    }
    return {};
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
        legal={legal}
      />
    </>
  );
}
