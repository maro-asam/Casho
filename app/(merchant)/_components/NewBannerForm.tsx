"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";

import { CreateBannerAction } from "@/actions/admin/banner.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

type NewBannerFormProps = {
  storeId: string;
};

export default function NewBannerForm({ storeId }: NewBannerFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [isPending, startTransition] = useTransition();

  const isDisabled = useMemo(() => {
    return !title.trim() || !image.trim() || isPending;
  }, [title, image, isPending]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    startTransition(async () => {
      await CreateBannerAction(storeId, title, image);
      router.push("/dashboard/banners");
      router.refresh();
    });
  }

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <Card className="rounded-22xl shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">بيانات البانر</CardTitle>
          <CardDescription className="leading-6">
            أدخل اسم البانر ورابط الصورة التي تريد عرضها داخل المتجر.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p className="leading-6">
                يفضّل استخدام صورة أفقية بجودة جيدة حتى يظهر البانر بشكل أفضل
                داخل واجهة المتجر.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">اسم البانر</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="مثال: تخفيضات الصيف"
                className="rounded-xl"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">رابط صورة البانر</Label>
              <Input
                id="image"
                name="image"
                required
                placeholder="https://example.com/banner.jpg"
                className="rounded-xl"
                dir="ltr"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="rounded-xl sm:min-w-40"
                disabled={isDisabled}
              >
                {isPending ? "جاري الإنشاء..." : "إنشاء البانر"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}