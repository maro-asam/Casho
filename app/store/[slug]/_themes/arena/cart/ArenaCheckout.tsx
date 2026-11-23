import Link from "next/link";
import { CreditCard, ShieldCheck, ShoppingBag } from "lucide-react";

import CheckoutForm from "../../../checkout/_components/CheckoutForm";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { CheckoutViewProps } from "../../types";
import { BackLink, Empty, PageHead, Panel, Wrap, btn, num } from "../ui";
import { CartLine, Totals } from "./ArenaCart";
import { st } from "@/lib/i18n/storefront";

/** Step 3 of the reference flow: who's ordering and how they pay. The
 *  summary keeps each line's player ID in view, and a wrong line can be
 *  removed right here. */
export default function ArenaCheckout({ storeSlug, cart, paymentMethods, createOrder, legal }: CheckoutViewProps) {
  const { items, summary } = cart;

  return (
    <Wrap className="an-page">
      <BackLink href={buildStoreUrl(storeSlug, "/cart")}>{st("رجوع للسلة")}</BackLink>
      <PageHead title={st("خطوة أخيرة")} note={st("اكتب اسمك ورقمك واختار طريقة الدفع، والمتجر هيأكد طلبك ويشحنه.")} />

      {items.length === 0 ? (
        <Empty
          icon={<ShoppingBag />}
          title={st("سلتك فاضية")}
          description={st("اختار لعبتك وحدّد الباقة الأول، وبعدين كمّل طلبك.")}
          action={
            <Link href={buildStoreUrl(storeSlug, "/categories")} className={btn({ size: "lg" })}>
              {st("اختار لعبتك")}
            </Link>
          }
        />
      ) : paymentMethods.length === 0 ? (
        <Empty
          icon={<CreditCard />}
          title={st("مفيش طرق دفع متاحة دلوقتي")}
          description={st("المتجر لسه مفعّلش طريقة دفع. جرب تاني بعد شوية أو كلّم المتجر.")}
          action={
            <Link href={buildStoreUrl(storeSlug, "/contact")} className={btn({ variant: "glass" })}>
              {st("تواصل مع المتجر")}
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <Panel as="section" className="an-checkout order-2 p-4 sm:p-6 lg:order-1">
            <h2 className="an-step">
              <span className="an-step-n">{num(3)}</span>
              {st("بياناتك والدفع")}
            </h2>
            <CheckoutForm paymentMethods={paymentMethods} action={createOrder} legal={legal} storeSlug={storeSlug} defaultGovernorate={cart.selectedGovernorate} digitalOnly={cart.digitalOnly} total={cart.summary.total} />
          </Panel>
          <Panel as="aside" aria-label={st("ملخص الطلب")} className="order-1 p-3 sm:p-4 lg:sticky lg:top-20 lg:order-2 lg:self-start">
            <h2 className="an-h3 px-1.5 pt-1">{st("طلبك")}</h2>
            <ul className="an-lines mt-1">
              {items.map((item) => (
                <CartLine key={item.id} storeSlug={storeSlug} item={item} editable={false} />
              ))}
            </ul>
            <div className="mt-2 border-t border-(--an-line) px-1.5 pt-3">
              <Totals summary={summary} digitalOnly={cart.digitalOnly} />
            </div>
            <p className="mt-3 flex items-start gap-2 px-1.5 text-[0.75rem] leading-6 text-(--an-muted)">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-(--an-ok)" />
              {st("بياناتك بتروح للمتجر بس عشان يشحن طلبك ويتواصل معاك.")}
            </p>
          </Panel>
        </div>
      )}
    </Wrap>
  );
}
