"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type QRCodeStyling from "qr-code-styling";
import type { Options } from "qr-code-styling";
import { Check, Copy, Download, MessageCircle, Share } from "lucide-react";
import { toast } from "sonner";
import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";

const INK = "#111111";

const qrOptions = (data: string, size: number, type: "svg" | "canvas"): Options => ({
  width: size,
  height: size,
  type,
  data,
  margin: type === "canvas" ? Math.round(size * 0.06) : 0,
  qrOptions: { errorCorrectionLevel: "M" },
  dotsOptions: { type: "rounded", color: INK },
  cornersSquareOptions: { type: "extra-rounded", color: INK },
  cornersDotOptions: { type: "dot", color: INK },
  backgroundOptions: { color: "#ffffff" },
});

const STEPS = ["ابعت الرابط أو خلّي التاجر يصوّر الـQR", "يسجّل ويجرّب كاشو ببلاش", "أول ما يدفع اشتراكه تاخد عمولتك"];

const subscribeNoop = () => () => {};
const canShareSnapshot = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

/**
 * The rep's main tool: their code, the link, one prominent Copy action, and a
 * QR to scan off the phone when meeting a merchant in person.
 */
export function ReferralCard({ link, code, repName }: { link: string; code: string; repName: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(subscribeNoop, canShareSnapshot, () => false);
  const message = `ابدأ متجرك الأونلاين على كاشو في دقايق — سجّل من الرابط ده وأنا (${repName}) معاك خطوة بخطوة:\n${link}`;

  useEffect(() => {
    let cancelled = false;
    import("qr-code-styling").then(({ default: QR }) => {
      if (cancelled || !box.current) return;
      box.current.innerHTML = "";
      new QR(qrOptions(link, 264, "svg")).append(box.current);
    });
    return () => {
      cancelled = true;
    };
  }, [link]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("اتنسخ الرابط");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("مقدرناش ننسخ — انسخه يدويًا");
    }
  }

  async function share() {
    try {
      await navigator.share({ title: "كاشو", text: message });
    } catch {
      // Dismissed the share sheet — nothing to do.
    }
  }

  async function downloadQr() {
    try {
      const { default: QR } = await import("qr-code-styling");
      const big: QRCodeStyling = new QR(qrOptions(link, 1024, "canvas"));
      await big.download({ name: `casho-${code}`, extension: "png" });
    } catch {
      toast.error("مقدرناش نحمّل الـQR");
    }
  }

  return (
    <section aria-labelledby="referral-title" className="apple-card overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h2 id="referral-title" className="text-[17px] leading-[22px] font-semibold">
          رابط الإحالة بتاعك
        </h2>
        <p className="text-[13px] leading-[18px] text-muted-foreground">أي تاجر يسجل منه بيتنسب ليك تلقائيًا</p>
      </div>

      <div className="flex flex-col gap-5 px-5 pb-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="text-[13px] text-muted-foreground">كودك</p>
            <p dir="ltr" className="text-right font-mono text-[30px] leading-[38px] font-bold tracking-[0.14em]">
              {code}
            </p>
          </div>

          <div className="flex h-11 items-center rounded-[12px] bg-(--fill-3) px-3.5">
            <span dir="ltr" className="min-w-0 flex-1 truncate text-left text-[14px] text-foreground/80 select-all">
              {link.replace(/^https?:\/\//, "")}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className={appleButton.filled}>
              {copied ? <Check className="size-[18px]" strokeWidth={2.4} /> : <Copy className="size-[18px]" />}
              {copied ? "اتنسخ" : "نسخ الرابط"}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
              className={cn(appleButton.tinted, "h-11 px-4")}
            >
              <MessageCircle className="size-[18px] text-[#248a3d] dark:text-(--sys-green)" />
              واتساب
            </a>
            {canShare && (
              <button type="button" onClick={share} className={cn(appleButton.tinted, "h-11 px-4")}>
                <Share className="size-[18px]" />
                مشاركة
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 self-center">
          {/* Always dark-on-white so it scans in dark mode too. */}
          <div className="rounded-[20px] bg-white p-3 shadow-[0_0_0_0.5px_rgba(0,0,0,0.1),0_6px_20px_rgba(0,0,0,0.06)]">
            <div ref={box} role="img" aria-label="QR لرابط الإحالة" className="size-[132px] [&_svg]:size-full" />
          </div>
          <button type="button" onClick={downloadQr} className={cn(appleButton.plain, "mx-0 text-[13px]")}>
            <Download className="size-4" />
            تحميل الـQR
          </button>
        </div>
      </div>

      {/* How it works, in three beats — so a new rep gets it at a glance. */}
      <ol className="grid grid-cols-1 border-t-[0.5px] border-border sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step}
            className="flex items-center gap-2.5 px-5 py-3 text-[13px] leading-[18px] text-muted-foreground max-sm:not-first:border-t-[0.5px] sm:not-first:border-s-[0.5px] border-border"
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-(--fill-3) text-[12px] font-semibold text-foreground">
              {"١٢٣"[i]}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
