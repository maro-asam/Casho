"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { WhatsAppIcon } from "@/app/store/[slug]/_components/conversion/WhatsAppButton";
import { appleButton } from "@/components/saas-page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toWhatsAppDigits } from "@/lib/conversion/conversion-config";
import { cn } from "@/lib/utils";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";

const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 0 });

export type ConfirmTarget = {
  fullName: string;
  phone: string;
  /** Piasters. */
  total: number;
  items: { name: string; quantity: number }[];
  /** Products beyond `items`, summarized as "و{n} منتج تاني". */
  moreCount?: number;
  confirmUrl: string;
};

function buildMessage(order: ConfirmTarget, storeName: string) {
  const first = order.fullName.trim().split(/\s+/)[0];
  const lines = order.items.map((i) => `• ${i.name}${i.quantity > 1 ? ` (×${i.quantity})` : ""}`);
  if (order.moreCount) lines.push(tr("• و{0} منتج تاني", order.moreCount));
  return [
    tr("أهلاً{0} 👋", first ? ` ${first}` : ""),
    tr("معاك {0}، وصلنا طلبك:", storeName),
    ...lines,
    tr("الإجمالي: {0}", money.format(order.total / 100)),
    tr("\nأكّد طلبك من هنا عشان نبدأ نجهّزه 👇\n{0}", order.confirmUrl),
  ].join("\n");
}

/** Opens WhatsApp from the merchant's own number with a ready message and the confirmation link. */
export function WhatsAppConfirmButton({
  order,
  storeName,
  variant = "button",
}: {
  order: ConfirmTarget;
  storeName: string;
  variant?: "button" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  function show() {
    setMessage(buildMessage(order, storeName));
    setOpen(true);
  }

  function send() {
    window.open(`https://wa.me/${toWhatsAppDigits(order.phone)}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    setOpen(false);
    toast.success(tr("اتفتح الواتساب — أول ما العميل يأكّد، الطلب هيتعلّم هنا"));
  }

  function copyLink() {
    navigator.clipboard?.writeText(order.confirmUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={show}
          aria-label={tr("تأكيد طلب {0} على واتساب", order.fullName)}
          title={tr("تأكيد على واتساب")}
          className="apple-press relative z-10 grid size-9 place-items-center rounded-full bg-[#25d366]/12 text-[#1da851] hover:bg-[#25d366]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <WhatsAppIcon className="size-[18px]" />
        </button>
      ) : (
        <button type="button" onClick={show} className={cn(appleButton.filled, "w-full bg-[#25d366] text-white hover:bg-[#25d366]/90")}>
          <WhatsAppIcon className="size-5" />
          {tr("ابعت تأكيد على واتساب")}
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir={tdir()} className="apple-ui gap-0 bg-background p-0 text-foreground sm:max-w-md">
          <DialogHeader className="items-center gap-1.5 px-6 pt-8 pb-5 text-center sm:text-center">
            <span className="mb-2 grid size-14 place-items-center rounded-[16px] bg-[#25d366] text-white">
              <WhatsAppIcon className="size-7" />
            </span>
            <DialogTitle className="text-[22px] font-bold">{tr("تأكيد الطلب على واتساب")}</DialogTitle>
            <DialogDescription className="text-[15px]">
              {order.fullName} ·{" "}
              <span dir="ltr" className="tabular-nums">
                {order.phone}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-6">
            <label className="block">
              <span className="sr-only">{tr("الرسالة")}</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={9}
                dir="auto"
                className="w-full resize-none rounded-[14px] bg-card px-4 py-3 text-[15px] leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <p className="text-[13px] leading-[18px] text-muted-foreground">
              {tr("العميل هيدوس على اللينك ويأكّد أو يلغي. لو لغى، الطلب هيتلغى لوحده والمخزون يرجع.")}
            </p>
            <button type="button" onClick={copyLink} className={cn(appleButton.plain, "mx-0 -ms-2 h-8 text-[13px]")}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? tr("اتنسخ") : tr("انسخ لينك التأكيد بس")}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 px-6 pb-6">
            <button type="button" onClick={() => setOpen(false)} className={cn(appleButton.gray, "w-full")}>
              {tr("إلغاء")}
            </button>
            <button
              type="button"
              onClick={send}
              disabled={!message.includes(order.confirmUrl)}
              className={cn(appleButton.filled, "w-full bg-[#25d366] text-white hover:bg-[#25d366]/90 disabled:opacity-50")}
            >
              <WhatsAppIcon className="size-4" />
              {tr("افتح واتساب")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
