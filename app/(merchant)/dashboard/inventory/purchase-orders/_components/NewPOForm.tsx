"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Trash2 } from "lucide-react";
import { CreatePurchaseOrderAction } from "@/actions/inventory/purchase-orders.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Supplier = { id: string; name: string };
type Branch = { id: string; name: string; isDefault: boolean };
type Product = { id: string; name: string; image: string; sku: string | null; stock: number; costPrice: number | null };

type PORow = {
  productId: string;
  name: string;
  image: string;
  currentStock: number;
  quantity: number;
  unitCost: number; // piasters
};

export function NewPOForm({
  suppliers,
  branches,
  products,
}: {
  suppliers: Supplier[];
  branches: Branch[];
  products: Product[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [supplierId, setSupplierId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [notes, setNotes] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [rows, setRows] = useState<PORow[]>([]);
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      !rows.find((r) => r.productId === p.id) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())),
  );

  function addProduct(product: Product) {
    const defaultCost = product.costPrice ? Math.round(product.costPrice * 100) : 0;
    setRows((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        image: product.image,
        currentStock: product.stock,
        quantity: 1,
        unitCost: defaultCost,
      },
    ]);
    setSearch("");
  }

  function updateRow(productId: string, field: "quantity" | "unitCost", value: number) {
    setRows((prev) =>
      prev.map((r) => (r.productId === productId ? { ...r, [field]: Math.max(0, value) } : r)),
    );
  }

  const total = rows.reduce((s, r) => s + r.quantity * r.unitCost, 0);

  function handleSubmit() {
    if (!rows.length) return toast.error("يجب إضافة منتج واحد على الأقل");
    for (const r of rows) {
      if (r.quantity <= 0) return toast.error(`الكمية يجب أن تكون أكبر من صفر: ${r.name}`);
    }

    startTransition(async () => {
      try {
        const po = await CreatePurchaseOrderAction({
          supplierId: supplierId && supplierId !== "none" ? supplierId : undefined,
          branchId: branchId && branchId !== "none" ? branchId : undefined,
          notes: notes || undefined,
          expectedDate: expectedDate ? new Date(expectedDate) : undefined,
          items: rows.map((r) => ({
            productId: r.productId,
            quantity: r.quantity,
            unitCost: r.unitCost,
          })),
        });
        toast.success(`تم إنشاء طلب الشراء ${po.orderNumber}`);
        router.push(`/dashboard/inventory/purchase-orders/${po.id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "حدث خطأ");
      }
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">بيانات الطلب</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>المورد</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر مورداً (اختياري)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون مورد</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {branches.length > 0 && (
            <div className="space-y-1.5">
              <Label>الفرع</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">غير محدد</SelectItem>
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
            <Label>تاريخ الاستلام المتوقع</Label>
            <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} dir="ltr" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="أي ملاحظات..." />
          </div>
        </div>
      </div>

      {/* Products */}
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
            ابحث عن منتج وأضفه للطلب
          </p>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_90px_110px_110px_40px] items-center gap-3 border-b border-border bg-muted/30 px-5 py-2 text-xs font-semibold uppercase text-muted-foreground">
              <span>المنتج</span>
              <span className="text-center">مخزون حالي</span>
              <span className="text-center">الكمية</span>
              <span className="text-center">سعر الوحدة (ق)</span>
              <span />
            </div>
            {rows.map((row) => (
              <div
                key={row.productId}
                className="grid grid-cols-[1fr_90px_110px_110px_40px] items-center gap-3 border-b border-border px-5 py-3 last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <img src={row.image} alt={row.name} className="size-9 rounded-md object-cover" />
                  <span className="truncate text-sm font-medium">{row.name}</span>
                </div>
                <p className="text-center text-sm tabular-nums text-muted-foreground">{row.currentStock}</p>
                <Input
                  type="number"
                  min="1"
                  className="h-8 text-center"
                  value={row.quantity}
                  onChange={(e) => updateRow(row.productId, "quantity", parseInt(e.target.value) || 0)}
                />
                <Input
                  type="number"
                  min="0"
                  className="h-8 text-center"
                  value={row.unitCost}
                  onChange={(e) => updateRow(row.productId, "unitCost", parseInt(e.target.value) || 0)}
                />
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setRows((prev) => prev.filter((r) => r.productId !== row.productId))}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <div className="flex justify-end border-t border-border px-5 py-3">
              <p className="text-sm font-semibold">
                الإجمالي:{" "}
                <span className="text-base">
                  {new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(total / 100)}
                </span>
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={isPending || !rows.length}>
          {isPending ? "جاري الإنشاء..." : "إنشاء طلب الشراء"}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>إلغاء</Button>
      </div>
    </div>
  );
}
