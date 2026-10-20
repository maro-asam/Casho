"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Copy, ExternalLink, Phone } from "lucide-react";
import { toast } from "sonner";

import { GetRecoveryLinkTokenAction, MarkCartContactedAction } from "@/actions/store/cart-recovery.actions";
import { WhatsAppIcon } from "@/app/store/[slug]/_components/conversion/WhatsAppButton";
import { StatusText, appleButton } from "@/components/saas-page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AbandonedCartRow } from "@/lib/cart-recovery/abandoned";
import { toWhatsAppDigits } from "@/lib/conversion/conversion-config";
import { recoveryMeta } from "./recovery-meta";
import { ThumbStack } from "./carts-table";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";

const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 0 });
const NO_COUPON = "__none";

type Props = {
  cart: AbandonedCartRow | null;
  storeName: string;
  storeBaseUrl: string;
  coupons: { code: string; label: string }[];
};

/** URL-driven (`?cart=<key>`): everything needed to win the cart back. */
export function RecoverDialog(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function close() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("cart");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <Dialog open={Boolean(props.cart)} onOpenChange={(o) => !o && close()}>
      <DialogContent dir={tdir()} className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {props.cart && <RecoverPanel key={props.cart.key} {...props} cart={props.cart} />}
      </DialogContent>
    </Dialog>
  );
}

function buildMessage(cart: AbandonedCartRow, storeName: string, link: string, coupon: string | null) {
  const first = cart.fullName?.trim().split(/\s+/)[0];
  const lines = cart.items.slice(0, 3).map((i) => `• ${i.name}${i.quantity > 1 ? ` (×${i.quantity})` : ""}`);
  if (cart.items.length > 3) lines.push(tr("• و{0} منتج تاني", cart.items.length - 3));
  return [
    tr("أهلاً{0} 👋", first ? ` ${first}` : ""),
    tr("لاحظنا إن في منتجات مستنياك في سلتك في {0}:", storeName),
    ...lines,
    coupon ? tr("\nوعشانك، ليك خصم بالكود {0} 🎁 هيتطبق لوحده.", coupon) : "",
    tr("\nكمّل طلبك من هنا 👇\n{0}", link),
  ]
    .filter(Boolean)
    .join("\n");
}

function RecoverPanel({ cart, storeName, storeBaseUrl, coupons }: Props & { cart: AbandonedCartRow }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState(NO_COUPON);
  const [edited, setEdited] = useState<string | null>(null);
  const [copied, setCopied] = useState<"msg" | "link" | null>(null);
  const [pending, startTransition] = useTransition();
  const recovered = cart.status === "recovered";

  useEffect(() => {
    if (recovered) return;
    let cancelled = false;
    GetRecoveryLinkTokenAction(cart.key)
      .then((r) => {
        if (cancelled) return;
        if (r.ok) setToken(r.token);
        else setLinkError(r.message);
      })
      .catch(() => !cancelled && setLinkError(tr("مقدرناش نجهّز اللينك.")));
    return () => {
      cancelled = true;
    };
  }, [cart.key, recovered]);

  const link = token
    ? `${storeBaseUrl}/cart?restore=${token}${coupon !== NO_COUPON ? `&coupon=${encodeURIComponent(coupon)}` : ""}`
    : "";
  const generated = useMemo(
    () => (link ? buildMessage(cart, storeName, link, coupon === NO_COUPON ? null : coupon) : ""),
    [cart, storeName, link, coupon],
  );
  const message = edited ?? generated;

  function markContacted() {
    startTransition(async () => {
      await MarkCartContactedAction(cart.key);
      router.refresh();
    });
  }

  function sendWhatsApp() {
    if (!cart.phone) return;
    window.open(`https://wa.me/${toWhatsAppDigits(cart.phone)}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    markContacted();
    toast.success(tr("اتفتح الواتساب — اتسجلت إنك تواصلت"));
  }

  function copy(text: string, what: "msg" | "link") {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  }

  const meta = recoveryMeta(cart.status);

  return (
    <div className="min-w-0">
      <DialogHeader className="items-center gap-1.5 px-6 pt-8 pb-5 text-center sm:text-center">
        <div className="mb-2">
          <ThumbStack cart={cart} size="lg" />
        </div>
        <DialogTitle className="text-[22px] font-bold">{cart.fullName || (cart.phone ? tr("عميل") : tr("زائر من غير رقم"))}</DialogTitle>
        <DialogDescription className="flex flex-wrap items-center justify-center gap-x-2 text-[15px]">
          <StatusText tone={meta.tone}>{meta.label}</StatusText>
          {cart.phone ? (
            <span className="font-mono" dir="ltr">
              {cart.phone}
            </span>
          ) : (
            <span>{tr("مسابش رقمه — تقدر تبعتله اللينك لو بيكلمك على إنستجرام أو ماسنجر.")}</span>
          )}
          {cart.contactCount > 0 && <span>{tr(" · اتواصلت {0} مرة", cart.contactCount)}</span>}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 px-5 pb-5">
        {recovered ? (
          <div className="flex flex-col items-center gap-3 rounded-[14px] bg-(--sys-green)/10 p-5 text-center">
            <p className="text-[17px] font-semibold">{tr("رجع وطلب بـ {0} بعد ما تواصلت معاه 🎉", money.format(cart.value / 100))}</p>
            {cart.orderId && (
              <Link href={`/orders/${cart.orderId}`} className={cn(appleButton.tinted, "bg-card text-primary")}>
                <ExternalLink className="size-4" />
                {tr("افتح الطلب")}
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Cart contents */}
            <ul className="apple-rows overflow-hidden rounded-[14px] bg-(--fill-3) [--row-inset:68px]">
              {cart.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="size-10 shrink-0 overflow-hidden rounded-[9px] bg-card">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="size-full object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[15px]">{item.name}</span>
                  <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
                    {item.quantity} × {money.format(item.price / 100)}
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between px-4 py-3 text-[15px] font-semibold">
                <span>{tr("الإجمالي")}</span>
                <span className="text-[17px] tabular-nums">{money.format(cart.value / 100)}</span>
              </li>
            </ul>

            {/* Coupon: capsules instead of a dropdown */}
            {coupons.length > 0 && (
              <section className="space-y-2">
                <p className="px-1 text-[13px] font-semibold text-muted-foreground">{tr("تضيف كود خصم؟")}</p>
                <div role="radiogroup" aria-label={tr("تضيف كود خصم؟")} className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
                  {[{ code: NO_COUPON, label: tr("من غير خصم") }, ...coupons].map((c) => {
                    const on = coupon === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          setCoupon(c.code);
                          setEdited(null);
                        }}
                        className={cn(
                          "apple-press shrink-0 rounded-full px-3.5 py-1.5 text-[13px] whitespace-nowrap transition-colors",
                          on ? "bg-primary text-primary-foreground" : "bg-(--fill-3) text-foreground hover:bg-(--fill-3)/70",
                        )}
                      >
                        {c.code === NO_COUPON ? (
                          c.label
                        ) : (
                          <>
                            <span className="font-mono font-semibold" dir="ltr">
                              {c.code}
                            </span>{" "}
                            · {c.label}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="px-1 text-[13px] text-muted-foreground">{tr("الكود بيتطبق لوحده لما يفتح اللينك.")}</p>
              </section>
            )}

            {/* Message, as the chat bubble the customer will get */}
            <section className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label htmlFor="recover-message" className="text-[13px] font-semibold text-muted-foreground">
                  {tr("الرسالة")}
                </label>
                {edited !== null && (
                  <button type="button" className="text-[13px] text-primary" onClick={() => setEdited(null)}>
                    {tr("رجّع الرسالة الأصلية")}
                  </button>
                )}
              </div>
              <div className="rounded-[18px] bg-[#efeae2] p-3 dark:bg-[#0b141a]">
                {linkError ? (
                  <p className="rounded-[12px] bg-card p-3 text-[15px] text-muted-foreground">{linkError}</p>
                ) : !token ? (
                  <div className="ms-auto h-40 w-4/5 animate-pulse rounded-[14px] bg-[#d9fdd3]/70 dark:bg-[#005c4b]/60" />
                ) : (
                  <textarea
                    id="recover-message"
                    rows={8}
                    value={message}
                    onChange={(e) => setEdited(e.target.value)}
                    dir="auto"
                    className="ms-auto block w-[88%] resize-none rounded-[14px] rounded-se-[4px] bg-[#d9fdd3] p-3 text-[15px] leading-6 text-[#111b21] shadow-sm outline-none focus:ring-2 focus:ring-[#25D366]/50 dark:bg-[#005c4b] dark:text-[#e9edef]"
                  />
                )}
              </div>
            </section>

            {/* Actions */}
            <div className="space-y-2">
              {cart.phone && (
                <button
                  type="button"
                  onClick={sendWhatsApp}
                  disabled={!token || pending}
                  className="apple-press inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-[17px] font-semibold text-white hover:bg-[#1ebe5b] disabled:opacity-50"
                >
                  <WhatsAppIcon className="size-5" />
                  {tr("ابعت على واتساب")}
                </button>
              )}
              <div className={cn("grid gap-2", cart.phone ? "grid-cols-3" : "grid-cols-2")}>
                <button type="button" className={cn(appleButton.tinted, "h-11 text-primary")} disabled={!token} onClick={() => copy(message, "msg")}>
                  {copied === "msg" ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {tr("انسخ الرسالة")}
                </button>
                <button type="button" className={cn(appleButton.tinted, "h-11 text-primary")} disabled={!token} onClick={() => copy(link, "link")}>
                  {copied === "link" ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {tr("اللينك بس")}
                </button>
                {cart.phone && (
                  <a href={`tel:${cart.phone}`} onClick={markContacted} className={cn(appleButton.tinted, "h-11 text-primary")}>
                    <Phone className="size-4" />
                    {tr("اتصال")}
                  </a>
                )}
              </div>
            </div>
            {!cart.phone && token && (
              <button type="button" className="block w-full text-center text-[13px] text-primary" onClick={markContacted}>
                {tr("بعتهاله بطريقة تانية؟ علّمها إنك تواصلت")}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
