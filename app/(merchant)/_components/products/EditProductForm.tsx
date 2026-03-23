"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useState } from "react";
import { Loader2, Save, ImageIcon, Star, Eye } from "lucide-react";
import { toast } from "sonner";

import { UpdateProductAction } from "@/actions/products/products.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
};

type Props = {
  product: Product;
  categories: Category[];
};

type FormState = {
  success: boolean;
  message: string;
};

const initialState: FormState = {
  success: false,
  message: "",
};

export default function EditProductForm({ product, categories }: Props) {
  const updateAction = UpdateProductAction.bind(null, product.id);
  const [state, formAction, isPending] = useActionState(
    updateAction,
    initialState
  );

  const [imageValue, setImageValue] = useState(product.image || "");
  const previewImage = useMemo(() => imageValue.trim(), [imageValue]);

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">اسم المنتج</Label>
          <Input
            id="name"
            name="name"
            placeholder="مثال: تيشيرت أسود مطبوع"
            defaultValue={product.name}
            required
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">السعر</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="1"
            step="0.01"
            placeholder="مثال: 299"
            defaultValue={product.price}
            required
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">التصنيف</Label>
          <Select name="categoryId" defaultValue={product.categoryId}>
            <SelectTrigger id="categoryId" className="w-full rounded-xl">
              <SelectValue placeholder="اختر تصنيف المنتج" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="image">رابط صورة المنتج</Label>
          <Input
            id="image"
            name="image"
            placeholder="https://example.com/image.jpg"
            defaultValue={product.image || ""}
            onChange={(e) => setImageValue(e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>

      <Card className="rounded-22xl border-dashed">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <ImageIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">معاينة الصورة</p>
          </div>

          {previewImage ? (
            <div className="relative overflow-hidden rounded-22xl border bg-muted/30">
              <div className="relative aspect-video w-full">
                <Image
                  src={previewImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-48 items-center justify-center rounded-22xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
              لا توجد صورة للمعاينة
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-start gap-3 rounded-22xl border p-4 cursor-pointer">
          <Checkbox
            name="isActive"
            defaultChecked={product.isActive}
            className="mt-1"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <Eye className="size-4" />
              حالة المنتج
            </div>
            <p className="text-sm text-muted-foreground">
              عند التفعيل سيظهر المنتج داخل المتجر للعملاء.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-22xl border p-4 cursor-pointer">
          <Checkbox
            name="isFeatured"
            defaultChecked={product.isFeatured}
            className="mt-1"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <Star className="size-4" />
              منتج مميز
            </div>
            <p className="text-sm text-muted-foreground">
              استخدمها لإبراز المنتجات المهمة أو الأكثر مبيعًا.
            </p>
          </div>
        </label>
      </div>

      <div className="flex justify-start">
        <Button
          type="submit"
          disabled={isPending}
          className="min-w-40 rounded-xl"
        >
          {isPending ? (
            <>
              <Loader2 className="me-2 size-4 animate-spin" />
              جاري حفظ التعديلات...
            </>
          ) : (
            <>
              <Save className="me-2 size-4" />
              حفظ التعديلات
            </>
          )}
        </Button>
      </div>
    </form>
  );
}