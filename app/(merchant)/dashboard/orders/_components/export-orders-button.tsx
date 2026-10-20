"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { appleButton } from "@/components/saas-page";

type Format = "xlsx" | "csv";

const FILTER_KEYS = ["q", "status", "source"];

function fileNameFrom(disposition: string | null, fallback: string) {
  const match = disposition?.match(/filename\*=UTF-8''([^;]+)/i);
  return match ? decodeURIComponent(match[1]) : fallback;
}

/**
 * Downloads via fetch instead of a plain link: a link to a file never
 * "finishes navigating", which left the top loading bar spinning forever,
 * and it hid errors like the plan not including exports.
 */
export function ExportOrdersButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [exporting, setExporting] = useState<Format | null>(null);
  const hasFilters = FILTER_KEYS.some((key) => searchParams.has(key));

  async function exportAs(format: Format) {
    setExporting(format);
    try {
      const query = new URLSearchParams({ format });
      for (const key of FILTER_KEYS) {
        const value = searchParams.get(key);
        if (value) query.set(key, value);
      }

      const res = await fetch(`/api/export/orders?${query}`, { cache: "no-store" });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { code?: string; error?: string } | null;
        if (body?.code === "FEATURE_NOT_AVAILABLE") {
          toast.error(tr("تصدير الطلبات مش متاح في باقتك الحالية"), {
            action: { label: tr("ترقية الباقة"), onClick: () => router.push("/change-plan") },
          });
        } else {
          toast.error(body?.error ?? tr("مقدرناش نجهّز الملف، جرّب تاني."));
        }
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameFrom(res.headers.get("Content-Disposition"), `orders.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(format === "xlsx" ? tr("تم تنزيل ملف Excel") : tr("تم تنزيل ملف CSV"));
    } catch {
      toast.error(tr("حصلت مشكلة في الاتصال، اتأكد من النت وجرّب تاني."));
    } finally {
      setExporting(null);
    }
  }

  return (
    <DropdownMenu dir={tdir()} modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" className={appleButton.gray} disabled={exporting !== null}>
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {exporting ? tr("جاري التجهيز...") : tr("تصدير")}
          {!exporting && <ChevronDown className="size-4 text-muted-foreground" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5">
        <DropdownMenuLabel className="text-[12px] leading-4 font-normal text-muted-foreground">
          {hasFilters ? tr("هيتصدّر الطلبات اللي ظاهرة بالفلاتر الحالية") : tr("هيتصدّر كل الطلبات")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => exportAs("xlsx")} className="h-10 gap-2.5 rounded-lg text-[15px]">
          <FileSpreadsheet className="size-4 text-(--sys-green)" />
          <span className="flex-1">Excel</span>
          <span className="text-xs text-muted-foreground" dir="ltr">.xlsx</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => exportAs("csv")} className="h-10 gap-2.5 rounded-lg text-[15px]">
          <FileText className="size-4 text-muted-foreground" />
          <span className="flex-1">CSV</span>
          <span className="text-xs text-muted-foreground" dir="ltr">.csv</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
