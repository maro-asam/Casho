"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";

/**
 * Copies `value`. The glyph swaps to a checkmark for a moment (state change, no extra toast);
 * `iconOnly` renders a 36pt circle for dense rows.
 */
export function CopyButton({
  value,
  label = "نسخ",
  iconOnly = false,
  className,
}: {
  value: string;
  label?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("مقدرناش ننسخ — انسخه يدويًا");
    }
  }

  const Icon = copied ? Check : Copy;
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      className={cn(iconOnly ? cn(appleButton.more, "size-9") : cn(appleButton.tinted, "text-primary"), className)}
    >
      <Icon className={cn("size-4", copied && "text-(--sys-green)")} strokeWidth={2} />
      {!iconOnly && (copied ? "اتنسخ" : label)}
      <span className="sr-only" aria-live="polite">
        {copied ? "اتنسخ" : ""}
      </span>
    </button>
  );
}

/** A read-only link in a filled field with its copy action; the link itself is LTR. */
export function LinkField({ link, label = "نسخ الرابط" }: { link: string; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <code
        dir="ltr"
        className="flex h-11 min-w-0 flex-1 items-center truncate rounded-[12px] bg-(--fill-3) px-3.5 text-left font-mono text-[13px] text-foreground/85"
      >
        {link}
      </code>
      <CopyButton value={link} label={label} className="h-11 px-4" />
    </div>
  );
}

/** Referral link with a copy action, and the code under it. */
export function ReferralLinkBox({ link, code }: { link: string; code: string }) {
  return (
    <div className="space-y-1.5">
      <LinkField link={link} />
      <p className="text-[13px] text-muted-foreground">
        كود الإحالة{" "}
        <span dir="ltr" className="font-mono font-semibold text-foreground">
          {code}
        </span>
      </p>
    </div>
  );
}
