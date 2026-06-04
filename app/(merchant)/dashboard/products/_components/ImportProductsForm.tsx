"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, XCircle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ParseImportFileAction,
  ConfirmImportAction,
  type ImportRow,
} from "@/actions/products/import-products.actions";
import { useRouter } from "next/navigation";

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
        toast.error(result.message);
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
        toast.error(result.message);
        return;
      }
      toast.success(`تم استيراد ${result.imported} منتج بنجاح`);
      router.push("/dashboard/products");
    });
  }

  function downloadTemplate() {
    const headers = ["name", "price", "compareAtPrice", "description", "category", "brand", "stock", "tags", "isActive", "isFeatured", "image"];
    const example = ["قميص قطني", "150", "200", "قميص مريح 100% قطن", "ملابس", "Nike", "20", "ملابس,صيف", "1", "0", ""];
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
      <div className="space-y-4">
        <Card className="rounded-xl">
          <CardContent className="p-6">
            <div className="mb-6 rounded-xl border border-dashed bg-muted/30 p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Upload className="size-6 text-primary" />
              </div>
              <p className="mb-1 font-semibold">ارفع ملف CSV أو Excel</p>
              <p className="mb-4 text-sm text-muted-foreground">الحد الأقصى 500 منتج</p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isParsing}
                />
                <Button asChild variant="default" className="rounded-xl" disabled={isParsing}>
                  <span>
                    {isParsing ? (
                      <><Loader2 className="ms-2 size-4 animate-spin" />جاري القراءة...</>
                    ) : (
                      <><FileText className="ms-2 size-4" />اختر ملف</>
                    )}
                  </span>
                </Button>
              </label>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="mb-2 text-sm font-medium">أعمدة الملف المطلوبة:</p>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {["name *", "price *", "category *", "compareAtPrice", "description", "brand", "stock", "tags", "isActive", "isFeatured", "image"].map((col) => (
                  <Badge key={col} variant="outline" className="rounded-lg font-mono">
                    {col}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                * التصنيف يجب أن يكون موجوداً مسبقاً في متجرك · الأعمدة باللغة العربية مدعومة أيضاً
              </p>
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" className="rounded-xl" onClick={downloadTemplate}>
          <Download className="ms-2 size-4" />
          تحميل نموذج CSV
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="gap-1.5 rounded-lg bg-emerald-500 text-sm">
          <CheckCircle2 className="size-3.5" />
          {validCount} منتج صالح
        </Badge>
        {errorCount > 0 && (
          <Badge variant="destructive" className="gap-1.5 rounded-lg text-sm">
            <XCircle className="size-3.5" />
            {errorCount} خطأ
          </Badge>
        )}
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => { setStep("upload"); setRows([]); }}
        >
          رفع ملف آخر
        </Button>
      </div>

      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">معاينة المنتجات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">السطر</TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">التصنيف</TableHead>
                  <TableHead className="text-right">المخزون</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.rowIndex} className={row.error ? "bg-rose-50 dark:bg-rose-950/20" : ""}>
                    <TableCell className="text-muted-foreground">{row.rowIndex}</TableCell>
                    <TableCell className="font-medium">{row.name || "—"}</TableCell>
                    <TableCell>{row.price ? `${row.price} ج` : "—"}</TableCell>
                    <TableCell>{row.category || "—"}</TableCell>
                    <TableCell>{row.stock}</TableCell>
                    <TableCell>
                      {row.error ? (
                        <span className="flex items-center gap-1 text-xs text-rose-600">
                          <XCircle className="size-3.5" />
                          {row.error}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="size-3.5" />
                          صالح
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {validCount > 0 && (
        <Button
          className="rounded-xl"
          onClick={handleImport}
          disabled={isImporting}
        >
          {isImporting ? (
            <><Loader2 className="ms-2 size-4 animate-spin" />جاري الاستيراد...</>
          ) : (
            <>استيراد {validCount} منتج</>
          )}
        </Button>
      )}
    </div>
  );
}
