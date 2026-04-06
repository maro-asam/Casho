"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CreateCategoryAction } from "@/actions/admin/categories.actions";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateCategoryForm({ storeId }: { storeId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const name = formData.get("name");
    const image = formData.get("image");

    if (typeof name !== "string") {
      toast.error("اسم التصنيف غير صالح");
      return;
    }

    startTransition(async () => {
      const result = await CreateCategoryAction(
        storeId,
        name,
        typeof image === "string" ? image : undefined,
      );

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("تم إنشاء التصنيف بنجاح");
      router.push("/dashboard/categories");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">اسم التصنيف</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="مثال: ملابس رجالي"
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">لينك الصورة</Label>
        <Input
          id="image"
          name="image"
          type="url"
          placeholder="https://example.com/category.jpg"
          className="h-11"
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "جاري الإنشاء..." : "إنشاء التصنيف"}
      </Button>
    </form>
  );
}