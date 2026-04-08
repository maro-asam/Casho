"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { CreateProductAction } from "@/actions/products/products.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = {
  id: string;
  name: string;
};

type CreateProductFormProps = {
  categories: Category[];
};

const initialState = {
  success: false,
  message: "",
};

export default function CreateProductForm({
  categories,
}: CreateProductFormProps) {
  const [state, formAction, isPending] = useActionState(
    CreateProductAction,
    initialState,
  );

  const [imagePreview, setImagePreview] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    if (!state?.message) return;

    if (state.success) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">اسم المنتج</Label>
          <Input id="name" name="name" placeholder="مثال: تيشيرت أسود" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">وصف المنتج</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="اكتب وصف مختصر وواضح للمنتج..."
            className="min-h-28 resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">السعر الحالي</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="مثال: 299.99"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compareAtPrice">السعر قبل الخصم</Label>
          <Input
            id="compareAtPrice"
            name="compareAtPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder="مثال: 399.99"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">المخزون</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            placeholder="مثال: 15"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">البراند</Label>
          <Input id="brand" name="brand" placeholder="مثال: Nike أو Samsung" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">الوزن (اختياري)</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            step="0.01"
            min="0"
            placeholder="مثال: 0.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">التصنيف</Label>

          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="categoryId" className="w-full">
              <SelectValue placeholder="اختر التصنيف" />
            </SelectTrigger>

            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <input type="hidden" name="categoryId" value={categoryId} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="image">رابط الصورة الأساسية</Label>
          <Input
            id="image"
            name="image"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imagePreview}
            onChange={(e) => setImagePreview(e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="images">
            روابط صور إضافية
            <span className="ms-2 text-xs text-muted-foreground">
              افصل بينهم بفاصلة ,
            </span>
          </Label>
          <Input
            id="images"
            name="images"
            placeholder="https://img1.jpg, https://img2.jpg, https://img3.jpg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sizes">
            المقاسات
            <span className="ms-2 text-xs text-muted-foreground">
              افصل بينهم بفاصلة
            </span>
          </Label>
          <Input id="sizes" name="sizes" placeholder="S, M, L, XL" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="colors">
            الألوان
            <span className="ms-2 text-xs text-muted-foreground">
              افصل بينهم بفاصلة
            </span>
          </Label>
          <Input id="colors" name="colors" placeholder="أسود, أبيض, أزرق" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="tags">
            Tags
            <span className="ms-2 text-xs text-muted-foreground">
              افصل بينهم بفاصلة
            </span>
          </Label>
          <Input
            id="tags"
            name="tags"
            placeholder="صيفي, جديد, الأكثر مبيعًا"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6 md:col-span-2">
          <div className="flex items-center gap-2">
            <Checkbox id="isActive" name="isActive" defaultChecked />
            <Label htmlFor="isActive">نشط</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="isFeatured" name="isFeatured" />
            <Label htmlFor="isFeatured">مميز</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="hasVariants" name="hasVariants" />
            <Label htmlFor="hasVariants">المنتج له خيارات متعددة</Label>
          </div>
        </div>

        <div className="space-y-3 md:col-span-2">
          <Label>معاينة الصورة</Label>

          <div className="flex min-h-65 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/30">
            {imagePreview ? (
              <div className="relative h-65 w-full">
                <Image
                  src={imagePreview}
                  alt="معاينة صورة المنتج"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-background">
                  <ImageIcon className="size-6" />
                </div>
                <p className="text-sm font-medium">لا توجد صورة للمعاينة</p>
                <p className="mt-1 text-xs">
                  أضف رابط الصورة وسيظهر الـ preview هنا
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="me-2 size-4 animate-spin" />
            جاري إنشاء المنتج...
          </>
        ) : (
          "إنشاء المنتج"
        )}
      </Button>
    </form>
  );
}
