"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Trash2 } from "lucide-react";
import { CreateAdjustmentAction } from "@/actions/inventory/adjustments.actions";
import { AdjustmentReason } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const REASONS: { value: AdjustmentReason; label: string }[] = [
  { value: "COUNT_CORRECTION", label: "تصحيح جرد" },
  { value: "DAMAGE", label: "تلف" },
  { value: "THEFT", label: "سرقة" },
  { value: "EXPIRY", label: "انتهاء صلاحية" },
  { value: "LOSS", label: "ضياع" },
  { value: "FOUND", label: "عثر عليه" },
  { value: "OTHER", label: "أخرى" },
];

type Product = {
  id: string;
  name: string;
  image: string;
  sku: string | null;
  stock: number;
};

type Branch = {
  id: string;
  name: string;
  isDefault: boolean;
};

type AdjustmentRow = {
  productId: string;
  name: string;
  image: string;
  currentStock: number;
  newQuantity: number;
};

export function NewAdjustmentForm({
  branches,
  products,
}: {
  branches: Branch[];
  products: Product[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState<AdjustmentReason | "">("");
  const [branchId, setBranchId] = useState("");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");
  const [rows, setRows] = useState<AdjustmentRow[]>([]);
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      !rows.find((r) => r.productId === p.id) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())),
  );

  function addProduct(product: Product) {
    setRows((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        image: product.image,
        currentStock: product.stock,
        newQuantity: product.stock,
      },
    ]);
    setSearch("");
  }

  function updateQuantity(productId: string, value: number) {
    setRows((prev) =>
      prev.map((r) => (r.productId === productId ? { ...r, newQuantity: Math.max(0, value) } : r)),
    );
  }

  function removeRow(productId: string) {
    setRows((prev) => prev.filter((r) => r.productId !== productId));
  }

  function handleSubmit() {
    if (!reason) return toast.error("يجب اختيار سبب التسوية");
    if (!rows.length) return toast.error("يجب إضافة منتج واحد على الأقل");

    startTransition(async () => {
      try {
        await CreateAdjustmentAction({
          reason: reason as AdjustmentReason,
          branchId: branchId || undefined,
          notes: notes || undefined,
          reference: reference || undefined,
          items: rows.map((r) => ({ productId: r.productId, newQuantity: r.newQuantity })),
        });
        toast.success("تم حفظ التسوية بنجاح");
        router.push("/dashboard/inventory/adjustments");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "حدث خطأ");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header fields */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">بيانات التسوية</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>سبب التسوية *</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as AdjustmentReason)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر السبب" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {branches.length > 0 && (
            <div className="space-y-1.5">
              <Label>الفرع</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="كل الفروع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">كل الفروع</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} {b.isDefault && "(افتراضي)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>رقم المرجع</Label>
            <Input
              placeholder="مثال: ADJ-001"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>ملاحظات</Label>
            <Textarea
              placeholder="أي تفاصيل إضافية..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Product rows */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">المنتجات</h2>
          <div className="relative mt-3">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pr-9"
              placeholder="ابحث عن منتج للإضافة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-background shadow-lg">
              {filtered.slice(0, 10).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2 text-right text-sm hover:bg-accent"
                  onClick={() => addProduct(p)}
                >
                  <img src={p.image} className="size-8 rounded object-cover" alt={p.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      مخزون: {p.stock} {p.sku && `· ${p.sku}`}
                    </p>
                  </div>
                  <Plus className="size-4 text-primary" />
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">لا توجد نتائج</p>
              )}
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            ابحث عن منتج وأضفه للتسوية
          </p>
        ) : (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[1fr_100px_100px_100px_40px] items-center gap-3 border-b border-border bg-muted/30 px-5 py-2 text-xs font-semibold uppercase text-muted-foreground">
              <span>المنتج</span>
              <span className="text-center">المخزون الحالي</span>
              <span className="text-center">الكمية الجديدة</span>
              <span className="text-center">الفرق</span>
              <span />
            </div>
            {rows.map((row) => {
              const diff = row.newQuantity - row.currentStock;
              return (
                <div
                  key={row.productId}
                  className="grid grid-cols-[1fr_100px_100px_100px_40px] items-center gap-3 px-5 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={row.image} alt={row.name} className="size-9 rounded-md object-cover" />
                    <span className="truncate text-sm font-medium">{row.name}</span>
                  </div>
                  <p className="text-center text-sm tabular-nums text-muted-foreground">
                    {row.currentStock}
                  </p>
                  <Input
                    type="number"
                    min="0"
                    className="h-8 text-center"
                    value={row.newQuantity}
                    onChange={(e) => updateQuantity(row.productId, parseInt(e.target.value) || 0)}
                  />
                  <p
                    className={`text-center text-sm font-semibold tabular-nums ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-muted-foreground"}`}
                  >
                    {diff > 0 ? "+" : ""}
                    {diff}
                  </p>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeRow(row.productId)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={isPending || !rows.length || !reason}>
          {isPending ? "جاري الحفظ..." : "حفظ التسوية"}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          إلغاء
        </Button>
      </div>
    </div>
  );
}
