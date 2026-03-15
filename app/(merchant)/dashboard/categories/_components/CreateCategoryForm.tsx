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
    if (typeof name !== "string") {
      toast.error("اسم التصنيف غير صالح");
      return;
    }

    startTransition(async () => {
      const result = await CreateCategoryAction(storeId, name);

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
          className="h-11 rounded-xl"
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full rounded-xl">
        {isPending ? "جاري الإنشاء..." : "إنشاء التصنيف"}
      </Button>
    </form>
  );
}
