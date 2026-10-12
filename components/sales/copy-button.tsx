"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({ value, label = "نسخ", className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("اتنسخ");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("مقدرناش ننسخ — انسخه يدويًا");
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} className={cn("gap-1.5", className)}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {label}
    </Button>
  );
}

/** Referral link with a copy action; the link itself is LTR. */
export function ReferralLinkBox({ link, code }: { link: string; code: string }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code dir="ltr" className="min-w-0 flex-1 truncate rounded-lg border bg-muted/40 px-3 py-2 text-left font-mono text-xs">
          {link}
        </code>
        <CopyButton value={link} label="نسخ الرابط" />
      </div>
      <p className="text-xs text-muted-foreground">
        كود الإحالة:{" "}
        <span dir="ltr" className="font-mono font-medium text-foreground">
          {code}
        </span>
      </p>
    </div>
  );
}
