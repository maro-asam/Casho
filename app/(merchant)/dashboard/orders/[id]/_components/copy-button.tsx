"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

export function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(tr("تم نسخ {0}", label));
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(tr("مقدرناش ننسخ، انسخه يدوي."));
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={tr("نسخ {0}", label)}
      className={cn(
        "apple-press grid size-8 shrink-0 place-items-center rounded-full text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {copied ? <Check className="size-4 text-(--sys-green)" strokeWidth={2.4} /> : <Copy className="size-4" />}
    </button>
  );
}
