"use client";

import { useState } from "react";
import { Plus, Trash2, Layers } from "lucide-react";
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

      <div className="flex items-center gap-3">
        <Label>نوع المنتج</Label>
        <div className="flex rounded-xl border overflow-hidden">
          <button
            type="button"
            onClick={() => setType("SIMPLE")}
            className={`px-4 py-1.5 text-sm transition-colors ${
              type === "SIMPLE"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            منتج عادي
          </button>
          <button
            type="button"
            onClick={() => setType("BUNDLE")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm transition-colors ${
              type === "BUNDLE"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            <Layers className="size-3.5" />
            باقة
          </button>
        </div>
      </div>

      {type === "BUNDLE" && (
        <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            حدد المنتجات المشمولة في الباقة وكميتها
          </p>

          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select
                value={item.productId}
                onValueChange={(val) => updateItem(i, "productId", val)}
              >
                <SelectTrigger className="rounded-xl flex-1">
                  <SelectValue placeholder="اختر منتج" />
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
                <Label className="text-xs text-muted-foreground whitespace-nowrap">كمية:</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                  className="w-16 rounded-xl text-center"
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeItem(i)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5"
            onClick={addItem}
          >
            <Plus className="size-3.5" />
            إضافة منتج للباقة
          </Button>
        </div>
      )}
    </div>
  );
}
