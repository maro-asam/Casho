"use client";

import { useState } from "react";
import { CreateProductAction } from "@/actions/products/products.actions";

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

type Category = { id: string; name: string };

export default function CreateProductForm({
  categories,
}: {
  categories: Category[];
}) {
  const [categoryId, setCategoryId] = useState("");

  return (
    <form action={CreateProductAction} className="space-y-4">
      {/* اسم المنتج */}
      <div className="space-y-2">
        <Label htmlFor="name">اسم المنتج</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          placeholder="مثال: تيشيرت قطن"
        />
      </div>

      {/* السعر */}
      <div className="space-y-2">
        <Label htmlFor="price">السعر</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          required
          placeholder="مثال: 199.99"
        />
      </div>

      {/* رابط الصورة */}
      <div className="space-y-2">
        <Label htmlFor="image">رابط الصورة</Label>
        <Input
          id="image"
          name="image"
          type="text"
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-xs text-muted-foreground">
          لو معندكش صورة دلوقتي سيبه فاضي.
        </p>
      </div>

      {/* التصنيف */}
      <div className="space-y-2">
        <Label>التصنيف</Label>

        {/* hidden input عشان الفورم يبعت القيمة للـ server action */}
        <input type="hidden" name="categoryId" value={categoryId} />

        <Select
          value={categoryId}
          onValueChange={(v) => setCategoryId(v)}
          disabled={categories.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر تصنيف" />
          </SelectTrigger>

          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">
            لازم تعمل تصنيف واحد على الأقل قبل ما تضيف منتج.
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={!categoryId}>
        إنشاء المنتج
      </Button>
    </form>
  );
}