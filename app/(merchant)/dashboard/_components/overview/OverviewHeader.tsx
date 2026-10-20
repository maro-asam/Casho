"use client";

import Link from "next/link";
import { Check, Copy, ExternalLink, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
    <header className="flex flex-col gap-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-muted-foreground">{today}</p>
        <h1 className="text-[34px] leading-[41px] font-bold ltr:tracking-[-0.02em]">{tr("نظرة عامة")}</h1>
        <p className="text-[15px] text-muted-foreground">{tr("ملخص أداء متجرك في آخر ٣٠ يوم.")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Gray capsule: secondary actions on the store link. */}
        <div className="flex h-11 min-w-0 items-center rounded-full bg-card ps-1">
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            className="apple-press flex h-9 min-w-0 items-center gap-1.5 rounded-full px-3 text-[15px] text-foreground/80 hover:text-foreground"
          >
            <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{storeUrl.replace(/^https?:\/\//, "")}</span>
          </a>
          <button
            type="button"
            onClick={copyLink}
            aria-label={tr("نسخ لينك المتجر")}
            className="apple-press me-1 grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied ? <Check className="size-4 text-(--sys-green)" /> : <Copy className="size-4" />}
          </button>
        </div>

        {/* The one prominent action on the page. */}
        <Link
          href="/products/new"
          className="apple-press flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="size-4" strokeWidth={2.4} />
          {tr("إضافة منتج")}
        </Link>
      </div>
    </header>
  );
}
