"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

export function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() =>
        navigator.clipboard
          ?.writeText(value)
          .then(() => {
            setCopied(true);
            toast.success(tr("اتنسخ"));
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => toast.error(tr("مقدرناش ننسخ")))
      }
      className={cn(
        "apple-press grid size-8 shrink-0 place-items-center rounded-full bg-muted text-primary hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {copied ? <Check className="size-4 text-(--sys-green)" strokeWidth={2.6} /> : <Copy className="size-4" />}
    </button>
  );
}

/** The one-time view of a fresh key: the raw value, a copy button and a ready curl line. */
export function KeyReveal({ rawKey, name, baseUrl }: { rawKey: string; name: string; baseUrl: string }) {
  const curl = `curl ${baseUrl}/orders \\\n  -H "Authorization: Bearer ${rawKey}"`;
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="grid size-14 place-items-center rounded-[16px] bg-linear-to-b from-[#4cd964] to-(--sys-green) text-white shadow-[0_6px_18px_rgba(52,199,89,0.3)]">
          <KeyRound className="size-7" strokeWidth={2} />
        </span>
        <p className="text-[22px] leading-7 font-bold">{tr("المفتاح جاهز")}</p>
        <p className="max-w-sm text-[15px] text-muted-foreground">
          {tr("ده \"{0}\". انسخه دلوقتي — مش هنقدر نعرضه تاني بعد ما تقفل.", name)}
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-[14px] bg-(--fill-3)/60 py-2 ps-4 pe-2">
        <code dir="ltr" className="min-w-0 flex-1 font-mono text-[13px] break-all select-all">
          {rawKey}
        </code>
        <CopyButton value={rawKey} label={tr("نسخ المفتاح")} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <p className="text-[13px] font-semibold text-muted-foreground">{tr("جرّبه")}</p>
          <CopyButton value={curl.replace("\\\n  ", "")} label={tr("نسخ الأمر")} className="size-7" />
        </div>
        <pre dir="ltr" className="overflow-x-auto rounded-[14px] bg-[#1c1c1e] p-4 font-mono text-[12px] leading-5 text-[#f5f5f7]">
          {curl}
        </pre>
      </div>
    </div>
  );
}
