// QA-TEMP — fixture page for visual QA of the Mada cart/checkout. Deleted after QA.
import { resolveStoreTheme } from "@/constants/store-themes";
import { buildThemeCSSString } from "@/lib/theme/build-css-vars";
import { madaTheme } from "../store/[slug]/_themes/mada";
import type { CartViewProps } from "../store/[slug]/_themes/types";

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&q=75`;
const cart = {
  items: [
    { id: "a", quantity: 2, selectedFeatures: { size: "L", color: "زيتي" }, product: { id: "p1", name: "جاكيت شتوي دافئ بياقة مبطنة", slug: "x", price: 45000, stock: 4, image: img("1523275335684-37898b6baf30"), wholesaleOptions: null } },
    { id: "b", quantity: 1, selectedFeatures: null, product: { id: "p2", name: "حقيبة يد جلد طبيعي", slug: "y", price: 35000, stock: 1, image: img("1548036328-c9fa89d128fa"), wholesaleOptions: null } },
    { id: "c", quantity: 6, selectedFeatures: { size: "M" }, product: { id: "p3", name: "تيشيرت قطني كلاسيك", slug: "z", price: 450, stock: 30, image: "", wholesaleOptions: [{ minQty: 5, price: 390 }] } },
  ],
  summary: { subtotal: 127340, shipping: 6500, discount: 12734, total: 121106 },
  appliedCoupon: { coupon: { code: "AUTUMN10", type: "PERCENTAGE", value: 10 } },
  shippingMethods: [
    { id: "s1", name: "شحن عادي — القاهرة والجيزة", price: 6500, estimatedDays: 3 },
    { id: "s2", name: "شحن سريع", price: 12000, estimatedDays: 1 },
  ],
  selectedShippingMethodId: "s1",
  appliedLoyalty: null,
  loyaltyEnabled: true,
  loyaltyMinRedemption: 100,
  loyaltyPointsValue: 10,
} as unknown as CartViewProps["cart"];

async function noop() {
  "use server";
}

export default async function Page({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v } = await searchParams;
  const theme = resolveStoreTheme("mada", null);
  const T = madaTheme;
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" />
      <style>{buildThemeCSSString(theme, "'Cairo', sans-serif", theme.darkTokens)}</style>
      <div dir="rtl" className={`store-theme-root ${T.rootClassName} min-h-dvh`}>
        {v === "checkout" ? (
          <T.Checkout storeSlug="shosho" cart={cart} paymentMethods={[{ key: "cash_on_delivery", label: "الدفع عند الاستلام" }, { key: "instapay", label: "إنستاباي" }]} createOrder={noop} />
        ) : (
          <T.Cart storeSlug="shosho" cart={cart} notice={{ stockChanged: false, couponStatus: "success", couponMessage: "اتطبق كوبون AUTUMN10" }} />
        )}
      </div>
    </>
  );
}
