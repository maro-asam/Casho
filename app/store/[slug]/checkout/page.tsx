import { CreateOrderAction } from "@/actions/store/orders.actions";
import CheckoutForm from "@/app/store/[slug]/checkout/_components/CheckoutForm";
import {
  PAYMENT_METHODS,
  type PaymentMethodKey,
} from "@/constants/welcome/payment-methods";

type CheckoutPageProps = {
  params: Promise<{ slug: string }>;
};

function isValidPaymentMethod(value: string): value is PaymentMethodKey {
  return PAYMENT_METHODS.some((method) => method.key === value);
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;

  async function handleCreateOrder(formData: FormData) {
    "use server";

    const fullName = String(formData.get("fullName") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const paymentMethodValue = String(
      formData.get("paymentMethod") ?? "cash_on_delivery",
    ).trim();

    if (!fullName) {
      throw new Error("الاسم الكامل مطلوب");
    }

    if (!phone) {
      throw new Error("رقم الهاتف مطلوب");
    }

    if (!address) {
      throw new Error("العنوان مطلوب");
    }

    if (!isValidPaymentMethod(paymentMethodValue)) {
      throw new Error("طريقة الدفع غير صحيحة");
    }

    await CreateOrderAction(slug, {
      fullName,
      phone,
      address,
      paymentMethod: paymentMethodValue,
    });
  }

  return (
    <section className="py-6" dir="rtl">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 space-y-8">
          <div className="space-y-6 text-right">
            <div className="inline-flex items-center rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
              اتمام الطلب
            </div>

            <div className="space-y-6">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                خلّي طلبك يكتمل في أقل من دقيقة
              </h1>

              {/* <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                اكتب بياناتك بشكل صحيح، واختر طريقة الدفع المناسبة، وبعدها هيتم
                تأكيد الطلب والتواصل معاك في أسرع وقت.
              </p> */}
            </div>

            {/* <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border bg-background p-4 shadow-sm">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Truck className="size-5" />
                </div>
                <h3 className="mb-1 font-semibold">توصيل سريع</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  تأكد من كتابة العنوان بالتفصيل لتسليم أسرع.
                </p>
              </div>

              <div className="rounded-xl border bg-background p-4 shadow-sm">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <WalletCards className="size-5" />
                </div>
                <h3 className="mb-1 font-semibold">دفع مناسب</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  اختار وسيلة الدفع اللي تناسبك قبل تأكيد الطلب.
                </p>
              </div>
            </div> */}
          </div>

          <div className="mx-auto w-full max-w-2xl rounded-xl border bg-linear-to-b from-background to-muted/30 p-5 shadow-sm md:p-6">
            <CheckoutForm
              paymentMethods={PAYMENT_METHODS}
              action={handleCreateOrder}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
