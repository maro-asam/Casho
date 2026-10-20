"use client";

import { useState } from "react";
import { Plus, Trash2, Layers } from "lucide-react";
import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tr } from "@/lib/i18n/dashboard";

export type BundleItem = {
  productId: string;
  productName: string;
  quantity: number;
  image: string;
};

type AvailableProduct = {
  id: string;
  name: string;
  image: string;
};

type Props = {
  products: AvailableProduct[];
  initialItems?: BundleItem[];
  initialType?: string;
};

export default function BundleItemsInput({ products, initialItems = [], initialType = "SIMPLE" }: Props) {
  const [type, setType] = useState<"SIMPLE" | "BUNDLE">(
    initialType === "BUNDLE" ? "BUNDLE" : "SIMPLE",
  );
  const [items, setItems] = useState<BundleItem[]>(initialItems);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { productId: "", productName: "", quantity: 1, image: "" },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof BundleItem, value: string | number) {
    setItems((prev) => {
      const next = [...prev];
      if (field === "productId") {
        const product = products.find((p) => p.id === value);
        next[index] = {
          ...next[index],
          productId: String(value),
          productName: product?.name ?? "",
          image: product?.image ?? "",
        };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="type" value={type} />
      <input
        type="hidden"
        name="bundleItems"
        value={type === "BUNDLE" ? JSON.stringify(items) : "[]"}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="px-1 text-[13px] font-medium text-foreground/80">{tr("نوع المنتج")}</span>
        {/* Segmented control */}
        <div role="radiogroup" aria-label={tr("نوع المنتج")} className="inline-flex rounded-full bg-(--sys-gray)/14 p-[3px]">
          {(["SIMPLE", "BUNDLE"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={type === value}
              onClick={() => setType(value)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-full px-4 text-[13px] transition-[background-color,box-shadow,color] duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                type === value
                  ? "bg-card font-semibold text-foreground shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]"
                  : "text-foreground/70 hover:text-foreground",
              )}
            >
              {value === "BUNDLE" && <Layers className="size-3.5" />}
              {value === "BUNDLE" ? tr("باقة") : tr("منتج عادي")}
            </button>
          ))}
        </div>
      </div>

      {type === "BUNDLE" && (
        <div className="space-y-3 rounded-2xl bg-background p-4">
          <p className="text-[13px] text-muted-foreground">
            {tr("حدد المنتجات المشمولة في الباقة وكميتها")}
          </p>

          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select
                value={item.productId}
                onValueChange={(val) => updateItem(i, "productId", val)}
              >
                <SelectTrigger className="min-w-0 flex-1 bg-card!">
                  <SelectValue placeholder={tr("اختر منتج")} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <span className="text-[12px] whitespace-nowrap text-muted-foreground">{tr("كمية:")}</span>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                  className="w-16 bg-card! text-center tabular-nums"
                />
              </div>

              <button
                type="button"
                aria-label={tr("حذف")}
                className="apple-press grid size-9 shrink-0 place-items-center rounded-full text-(--sys-red) hover:bg-(--sys-red)/10"
                onClick={() => removeItem(i)}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}

          <button type="button" className={cn(appleButton.plain, "mx-0 -ms-2")} onClick={addItem}>
            <Plus className="size-4" strokeWidth={2.4} />
            {tr("إضافة منتج للباقة")}
          </button>
        </div>
      )}
    </div>
  );
}
