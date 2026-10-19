"use client";

import Link from "next/link";
import { Check, Copy, ExternalLink, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { tr } from "@/lib/i18n/dashboard";

export default function OverviewHeader({
  storeUrl,
  today,
}: {
  storeUrl: string;
  today: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      toast.success(tr("تم نسخ لينك المتجر"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(tr("مقدرناش ننسخ اللينك، انسخه يدوي من شريط العنوان."));
    }
  }

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="text-2xl font-bold tracking-tight">{tr("نظرة عامة")}</h1>
        <p className="text-sm text-muted-foreground">{tr("ملخص أداء متجرك في آخر ٣٠ يوم.")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-9 min-w-0 items-center rounded-lg border border-border bg-background">
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            className="flex min-w-0 items-center gap-1.5 px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-3.5 shrink-0" />
            <span className="truncate">{storeUrl.replace(/^https?:\/\//, "")}</span>
          </a>
          <button
            type="button"
            onClick={copyLink}
            aria-label={tr("نسخ لينك المتجر")}
            className="grid h-full w-9 shrink-0 place-items-center border-s border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
          </button>
        </div>

        <Button asChild className="h-9 gap-1.5">
          <Link href="/products/new">
            <Plus className="size-4" />
            {tr("إضافة منتج")}
          </Link>
        </Button>
      </div>
    </header>
  );
}
