import { CreateOrderAction } from "@/actions/store/orders.actions";
import { GetStoreCheckoutPaymentMethodsAction } from "@/actions/payment-methods/payment-methods.actions";
import CheckoutForm from "@/app/store/[slug]/checkout/_components/CheckoutForm";
import type { PaymentMethodKey } from "@/constants/welcome/payment-methods";

type CheckoutPageProps = {
  params: Promise<{ slug: string }>;
};

function isValidPaymentMethod(
  value: string,
  enabledMethods: { key: string }[],
): value is PaymentMethodKey {
  return enabledMethods.some((method) => method.key === value);
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const paymentMethods = await GetStoreCheckoutPaymentMethodsAction(slug);

  async function handleCreateOrder(formData: FormData) {
    "use server";

    const enabledPaymentMethods = await GetStoreCheckoutPaymentMethodsAction(slug);

    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const defaultPaymentMethod =
      enabledPaymentMethods[0]?.key ?? "cash_on_delivery";
    const paymentMethodValue = String(
      formData.get("paymentMethod") ?? defaultPaymentMethod,
    ).trim();

    if (!fullName) throw new Error("Full name is required");
    if (!phone) throw new Error("Phone is required");
    if (!address) throw new Error("Address is required");

    if (!isValidPaymentMethod(paymentMethodValue, enabledPaymentMethods)) {
      throw new Error("Payment method is not available");
    }

    await CreateOrderAction(slug, {
      fullName,
      phone,
      address,
      paymentMethod: paymentMethodValue,
    });
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-8 space-y-2 text-right">
        <p className="text-sm font-semibold text-primary">Checkout</p>
        <h1 className="text-3xl font-bold tracking-tight">اتمام الطلب</h1>
        <p className="text-muted-foreground">
          اكتب بياناتك بشكل صحيح، واختر طريقة الدفع المناسبة للمتجر.
        </p>
      </div>

      {paymentMethods.length > 0 ? (
        <CheckoutForm paymentMethods={paymentMethods} action={handleCreateOrder} />
      ) : (
        <div className="rounded-2xl border bg-muted/40 p-6 text-right">
          <h2 className="text-lg font-semibold">لا توجد طرق دفع متاحة</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            صاحب المتجر لم يفعّل أي طريقة دفع حتى الآن. حاول لاحقًا أو تواصل مع المتجر.
          </p>
        </div>
      )}
    </main>
  );
}
