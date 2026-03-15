import { CreateOrderAction } from "@/actions/store/orders.actions";
import CheckoutForm from "@/app/(merchant)/_components/CheckoutForm";
import { PAYMENT_METHODS } from "@/constants/payment-methods";
import type { PaymentMethodKey } from "@/constants/payment-methods";


export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="wrapper py-10 max-w-xl" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">إتمام الطلب</h1>

      <CheckoutForm
        paymentMethods={PAYMENT_METHODS}
        action={async (formData) => {
          "use server";

          const fullName = String(formData.get("fullName") || "");
          const phone = String(formData.get("phone") || "");
          const address = String(formData.get("address") || "");

          const raw = String(formData.get("paymentMethod") || "cash_on_delivery");

          const allowed = PAYMENT_METHODS.map((m) => m.key);
          if (!allowed.includes(raw as PaymentMethodKey)) {
            throw new Error("طريقة دفع غير صحيحة");
          }

          const paymentMethod = raw as PaymentMethodKey;

          await CreateOrderAction(slug, {
            fullName,
            phone,
            address,
            paymentMethod,
          });
        }}
      />
    </div>
  );
}