"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Trash2 } from "lucide-react";
import { CreateTransferAction } from "@/actions/inventory/transfers.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Branch = { id: string; name: string; isDefault: boolean };
type Product = { id: string; name: string; image: string; sku: string | null; stock: number };
type Row = { productId: string; name: string; image: string; maxQty: number; quantity: number };

export function NewTransferForm({
  branches,
  products,
}: {
  branches: Branch[];
  products: Product[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
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
      { productId: product.id, name: product.name, image: product.image, maxQty: product.stock, quantity: 1 },
    ]);
    setSearch("");
  }

  function handleSubmit() {
    if (!fromBranchId) return toast.error("اختر فرع الإرسال");
    if (!toBranchId) return toast.error("اختر فرع الاستلام");
    if (fromBranchId === toBranchId) return toast.error("لا يمكن التحويل من وإلى نفس الفرع");
    if (!rows.length) return toast.error("أضف منتجاً واحداً على الأقل");

    startTransition(async () => {
      try {
        const transfer = await CreateTransferAction({
          fromBranchId,
          toBranchId,
          notes: notes || undefined,
          reference: reference || undefined,
          items: rows.map((r) => ({ productId: r.productId, requestedQuantity: r.quantity })),
        });
        toast.success("تم إنشاء طلب التحويل");
        router.push(`/dashboard/inventory/transfers/${transfer.id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "حدث خطأ");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">بيانات التحويل</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>من فرع *</Label>
            <Select value={fromBranchId} onValueChange={setFromBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="فرع الإرسال" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id} disabled={b.id === toBranchId}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>إلى فرع *</Label>
            <Select value={toBranchId} onValueChange={setToBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="فرع الاستلام" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id} disabled={b.id === fromBranchId}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>رقم مرجعي</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TRF-001" dir="ltr" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>ملاحظات</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">المنتجات</h2>
          <div className="relative mt-3">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pr-9"
              placeholder="ابحث عن منتج..."
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
                    <p className="text-xs text-muted-foreground">مخزون: {p.stock}</p>
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
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">أضف منتجاً للتحويل</p>
        ) : (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[1fr_100px_120px_40px] items-center gap-3 border-b border-border bg-muted/30 px-5 py-2 text-xs font-semibold uppercase text-muted-foreground">
              <span>المنتج</span>
              <span className="text-center">المتاح</span>
              <span className="text-center">الكمية المحوّلة</span>
              <span />
            </div>
            {rows.map((row) => (
              <div key={row.productId} className="grid grid-cols-[1fr_100px_120px_40px] items-center gap-3 px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <img src={row.image} alt={row.name} className="size-9 rounded-md object-cover" />
                  <span className="truncate text-sm font-medium">{row.name}</span>
                </div>
                <p className="text-center text-sm tabular-nums text-muted-foreground">{row.maxQty}</p>
                <Input
                  type="number"
                  min="1"
                  max={row.maxQty}
                  className="h-8 text-center"
                  value={row.quantity}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r) =>
                        r.productId === row.productId
                          ? { ...r, quantity: Math.min(Math.max(1, parseInt(e.target.value) || 1), r.maxQty) }
                          : r,
                      ),
                    )
                  }
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
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={isPending || !rows.length}>
          {isPending ? "جاري الإنشاء..." : "إنشاء طلب التحويل"}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>إلغاء</Button>
      </div>
    </div>
  );
}
