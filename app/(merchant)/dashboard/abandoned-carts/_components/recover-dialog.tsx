"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Copy, ExternalLink, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";

import { GetRecoveryLinkTokenAction, MarkCartContactedAction } from "@/actions/store/cart-recovery.actions";
import { WhatsAppIcon } from "@/app/store/[slug]/_components/conversion/WhatsAppButton";
import { StatusPill } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AbandonedCartRow } from "@/lib/cart-recovery/abandoned";
import { toWhatsAppDigits } from "@/lib/conversion/conversion-config";
import { recoveryMeta } from "./recovery-meta";
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
      <DialogContent dir={tdir()} className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
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
    <div className="min-w-0 space-y-5">
      <DialogHeader className="text-start sm:text-start">
        <div className="flex items-center gap-2">
          <DialogTitle>{cart.fullName || (cart.phone ? tr("عميل") : tr("زائر من غير رقم"))}</DialogTitle>
          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
        </div>
        <DialogDescription>
          {cart.phone ? (
            <span className="font-mono" dir="ltr">
              {cart.phone}
            </span>
          ) : (
            tr("مسابش رقمه — تقدر تبعتله اللينك لو بيكلمك على إنستجرام أو ماسنجر.")
          )}
          {cart.contactCount > 0 && tr(" · اتواصلت {0} مرة", cart.contactCount)}
        </DialogDescription>
      </DialogHeader>

      {recovered ? (
        <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
          <p className="font-medium">{tr("رجع وطلب بـ {0} بعد ما تواصلت معاه 🎉", money.format(cart.value / 100))}</p>
          {cart.orderId && (
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href={`/orders/${cart.orderId}`}>
                <ExternalLink className="size-4" />
                {tr("افتح الطلب")}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 p-2.5">
                <span className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="size-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {item.quantity} × {money.format(item.price / 100)}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{tr("الإجمالي")}</span>
              <span className="font-semibold tabular-nums">{money.format(cart.value / 100)}</span>
            </li>
          </ul>

          {coupons.length > 0 && (
            <div className="space-y-2">
              <Label>{tr("تضيف كود خصم؟")}</Label>
              <Select
                value={coupon}
                onValueChange={(v) => {
                  setCoupon(v);
                  setEdited(null);
                }}
                dir={tdir()}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_COUPON}>{tr("من غير خصم")}</SelectItem>
                  {coupons.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="font-mono" dir="ltr">
                        {c.code}
                      </span>{" "}
                      <span className="text-muted-foreground">· {c.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{tr("الكود بيتطبق لوحده لما يفتح اللينك.")}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="recover-message">{tr("الرسالة")}</Label>
              {edited !== null && (
                <button type="button" className="text-xs text-primary hover:underline" onClick={() => setEdited(null)}>
                  {tr("رجّع الرسالة الأصلية")}
                </button>
              )}
            </div>
            {linkError ? (
              <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{linkError}</p>
            ) : !token ? (
              <div className="grid h-40 place-items-center rounded-lg border border-border">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Textarea
                id="recover-message"
                rows={8}
                value={message}
                onChange={(e) => setEdited(e.target.value)}
                className="resize-none text-sm leading-6"
              />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {cart.phone && (
              <Button onClick={sendWhatsApp} disabled={!token || pending} className="gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe5b]">
                <WhatsAppIcon className="size-4" />
                {tr("ابعت على واتساب")}
              </Button>
            )}
            <Button variant="outline" className="gap-1.5" disabled={!token} onClick={() => copy(message, "msg")}>
              {copied === "msg" ? <Check className="size-4" /> : <Copy className="size-4" />}
              {tr("انسخ الرسالة")}
            </Button>
            <Button variant="ghost" className="gap-1.5" disabled={!token} onClick={() => copy(link, "link")}>
              {copied === "link" ? <Check className="size-4" /> : <Copy className="size-4" />}
              {tr("اللينك بس")}
            </Button>
            {cart.phone && (
              <Button asChild variant="ghost" size="icon" aria-label={tr("اتصال")}>
                <a href={`tel:${cart.phone}`} onClick={markContacted}>
                  <Phone className="size-4" />
                </a>
              </Button>
            )}
          </div>
          {!cart.phone && token && (
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground hover:underline" onClick={markContacted}>
              {tr("بعتهاله بطريقة تانية؟ علّمها إنك تواصلت")}
            </button>
          )}
        </>
      )}
    </div>
  );
}
