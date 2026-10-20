"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Download, FileText, Loader2, Upload, XCircle } from "lucide-react";
import { Card, Tag, appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import {
  ParseImportFileAction,
  ConfirmImportAction,
  type ImportRow,
} from "@/actions/products/import-products.actions";
import { useRouter } from "next/navigation";
import { tr, trv } from "@/lib/i18n/dashboard";

type Step = "upload" | "preview";

export default function ImportProductsForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [isParsing, startParsing] = useTransition();
  const [isImporting, startImporting] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    startParsing(async () => {
      const result = await ParseImportFileAction(form);
      if (!result.success) {
        toast.error(trv(result.message));
        return;
      }
      setRows(result.rows);
      setValidCount(result.validCount);
      setErrorCount(result.errorCount);
      setStep("preview");
    });
  }

  function handleImport() {
    startImporting(async () => {
      const result = await ConfirmImportAction(rows);
      if (!result.success) {
        toast.error(trv(result.message));
        return;
      }
      toast.success(tr("تم استيراد {0} منتج بنجاح", result.imported));
      router.push("/dashboard/products");
    });
  }

  function downloadTemplate() {
    const headers = ["name", "price", "compareAtPrice", "description", "category", "brand", "stock", "tags", "isActive", "isFeatured", "image"];
    const example = [tr("قميص قطني"), "150", "200", tr("قميص مريح 100% قطن"), tr("ملابس"), "Nike", "20", tr("ملابس,صيف"), "1", "0", ""];
    const csv = [headers.join(","), example.join(",")].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "casho-products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (step === "upload") {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card title={tr("ارفع ملف CSV أو Excel")} subtitle={tr("الحد الأقصى 500 منتج")} className="lg:col-span-2">
          <div className="px-5 pb-5">
            <label
              className={cn(
                "flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-(--label-3)/60 bg-background px-6 py-10 text-center transition-colors duration-200 ease-(--ease-apple) hover:bg-muted/60 focus-within:ring-2 focus-within:ring-primary/40",
                isParsing && "pointer-events-none opacity-70",
              )}
            >
              <input type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={handleFileChange} disabled={isParsing} />
              {isParsing ? (
                <Loader2 className="size-10 animate-spin text-primary" strokeWidth={1.6} />
              ) : (
                <Upload className="size-10 text-primary" strokeWidth={1.5} />
              )}
              <span className="text-[17px] font-semibold">{isParsing ? tr("جاري القراءة...") : tr("اختر ملف")}</span>
              <span className="text-[13px] text-muted-foreground" dir="ltr">
                .csv · .xlsx · .xls
              </span>
              {!isParsing && (
                <span className={cn(appleButton.filled, "pointer-events-none mt-1 h-10")}>
                  <FileText className="size-4" />
                  {tr("اختر ملف")}
                </span>
              )}
            </label>
          </div>
        </Card>

        <Card title={tr("أعمدة الملف المطلوبة:")}>
          <div className="space-y-4 px-5 pb-5">
            <div className="flex flex-wrap gap-1.5">
              {["name *", "price *", "category *", "compareAtPrice", "description", "brand", "stock", "tags", "isActive", "isFeatured", "image"].map((col) => (
                <span key={col} className="inline-flex h-7 items-center rounded-full bg-background px-3 font-mono text-[12px]" dir="ltr">
                  {col}
                </span>
              ))}
            </div>
            <p className="text-[12px] leading-[17px] text-muted-foreground">
              {tr("* التصنيف يجب أن يكون موجوداً مسبقاً في متجرك · الأعمدة باللغة العربية مدعومة أيضاً")}
            </p>
            <button type="button" className={cn(appleButton.tinted, "w-full text-primary")} onClick={downloadTemplate}>
              <Download className="size-4" />
              {tr("تحميل نموذج CSV")}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card
        title={tr("معاينة المنتجات")}
        subtitle={
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            <Tag tone="success">{tr("{0} منتج صالح", validCount)}</Tag>
            {errorCount > 0 && <Tag tone="danger">{tr("{0} خطأ", errorCount)}</Tag>}
          </span>
        }
        action={
          <button
            type="button"
            className={cn(appleButton.tinted, "text-primary")}
            onClick={() => {
              setStep("upload");
              setRows([]);
            }}
          >
            {tr("رفع ملف آخر")}
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-[15px]">
            <thead>
              <tr className="[&>th]:h-9 [&>th]:px-3 [&>th]:pb-2 [&>th]:text-start [&>th]:align-bottom [&>th]:text-[12px] [&>th]:font-medium [&>th]:whitespace-nowrap [&>th]:text-muted-foreground">
                <th className="ps-5!">{tr("السطر")}</th>
                <th>{tr("الاسم")}</th>
                <th>{tr("السعر")}</th>
                <th>{tr("التصنيف")}</th>
                <th>{tr("المخزون")}</th>
                <th className="pe-5!">{tr("الحالة")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.rowIndex}
                  className={cn(
                    "[&>td]:border-t-[0.5px] [&>td]:border-border [&>td]:px-3 [&>td]:py-2.5",
                    row.error && "bg-(--sys-red)/6",
                  )}
                >
                  <td className="ps-5! text-muted-foreground tabular-nums">{row.rowIndex}</td>
                  <td>{row.name || "—"}</td>
                  <td className="tabular-nums">{row.price ? tr("{0} ج", row.price) : "—"}</td>
                  <td className="text-muted-foreground">{row.category || "—"}</td>
                  <td className="tabular-nums">{row.stock}</td>
                  <td className="pe-5!">
                    {row.error ? (
                      <span className="flex items-center gap-1.5 text-[13px]">
                        <XCircle className="size-4 shrink-0 text-(--sys-red)" />
                        {row.error}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[13px]">
                        <CheckCircle2 className="size-4 shrink-0 text-(--sys-green)" />
                        {tr("صالح")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {validCount > 0 && (
        <div className="pointer-events-none sticky bottom-4 z-20 flex justify-center">
          <div className="apple-glass pointer-events-auto rounded-full p-1.5">
            <button type="button" className={cn(appleButton.filled, "h-10")} onClick={handleImport} disabled={isImporting}>
              {isImporting && <Loader2 className="size-4 animate-spin" />}
              {isImporting ? tr("جاري الاستيراد...") : tr("استيراد {0} منتج", validCount)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
