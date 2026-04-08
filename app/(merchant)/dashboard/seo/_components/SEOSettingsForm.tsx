"use client";

import { useActionState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Save, Search, Globe, Share2 } from "lucide-react";

import {
  UpdateStoreSeoAction,
  type SeoSettingsState,
} from "@/actions/settings/seo.actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type SEOSettingsFormProps = {
  storeId: string;
  storeName: string;
  storeSlug: string;
  defaultValues: {
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    isIndexed: boolean;
  };
};

const initialState: SeoSettingsState = {
  success: false,
  message: "",
};

export default function SEOSettingsForm({
  storeId,
  storeName,
  storeSlug,
  defaultValues,
}: SEOSettingsFormProps) {
  const action = UpdateStoreSeoAction.bind(null, storeId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const googlePreviewTitle = useMemo(() => {
    return defaultValues.seoTitle || `${storeName} | Casho`;
  }, [defaultValues.seoTitle, storeName]);

  const googlePreviewDescription = useMemo(() => {
    return (
      defaultValues.seoDescription ||
      "اكتشف منتجات المتجر واطلب بسهولة بأفضل تجربة شراء أونلاين."
    );
  }, [defaultValues.seoDescription]);

  return (
    <form action={formAction} className="space-y-6 " dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 ">
            <Search className="size-5" />
            إعدادات الظهور في جوجل
          </CardTitle>
          <CardDescription>
            البيانات دي بتظهر في نتائج البحث وتساعد الناس يفهموا متجرك بسرعة.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="seoTitle">عنوان الـ SEO</Label>
            <Input
              id="seoTitle"
              name="seoTitle"
              placeholder={`مثال: ${storeName} | أفضل منتجات بأفضل سعر`}
              defaultValue={defaultValues.seoTitle}
            />
            {state.errors?.seoTitle && (
              <p className="text-sm text-destructive">
                {state.errors.seoTitle[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoDescription">وصف الـ SEO</Label>
            <Textarea
              id="seoDescription"
              name="seoDescription"
              placeholder="اكتب وصف واضح وقصير عن متجرك ومنتجاتك"
              defaultValue={defaultValues.seoDescription}
              rows={4}
            />
            {state.errors?.seoDescription && (
              <p className="text-sm text-destructive">
                {state.errors.seoDescription[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoKeywords">الكلمات المفتاحية</Label>
            <Input
              id="seoKeywords"
              name="seoKeywords"
              placeholder="ملابس رجالي, تيشيرتات, شحن لجميع المحافظات"
              defaultValue={defaultValues.seoKeywords}
            />
            <p className="text-xs text-muted-foreground">
              افصل بين كل كلمة والتانية بفاصلة
            </p>
            {state.errors?.seoKeywords && (
              <p className="text-sm text-destructive">
                {state.errors.seoKeywords[0]}
              </p>
            )}
          </div>

          <div className="rounded-xl border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Globe className="size-4" />
              معاينة شكل البحث
            </div>

            <div className="space-y-1">
              <p className="text-base font-medium text-blue-600">
                {googlePreviewTitle}
              </p>
              <p className="text-xs text-green-700">
                {`https://${storeSlug}.casho.store`}
              </p>
              <p className="text-sm text-muted-foreground">
                {googlePreviewDescription}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="size-5" />
            إعدادات المشاركة على السوشيال
          </CardTitle>
          <CardDescription>
            دي اللي بتظهر لما حد يبعت لينك المتجر على واتساب أو فيسبوك.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="ogTitle">عنوان المشاركة</Label>
            <Input
              id="ogTitle"
              name="ogTitle"
              placeholder="عنوان مخصص للسوشيال"
              defaultValue={defaultValues.ogTitle}
            />
            {state.errors?.ogTitle && (
              <p className="text-sm text-destructive">
                {state.errors.ogTitle[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogDescription">وصف المشاركة</Label>
            <Textarea
              id="ogDescription"
              name="ogDescription"
              placeholder="وصف يظهر وقت مشاركة الرابط"
              defaultValue={defaultValues.ogDescription}
              rows={4}
            />
            {state.errors?.ogDescription && (
              <p className="text-sm text-destructive">
                {state.errors.ogDescription[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogImage">رابط صورة المشاركة</Label>
            <Input
              id="ogImage"
              name="ogImage"
              placeholder="https://example.com/og-image.jpg"
              defaultValue={defaultValues.ogImage}
            />
            {state.errors?.ogImage && (
              <p className="text-sm text-destructive">
                {state.errors.ogImage[0]}
              </p>
            )}
          </div>

          {defaultValues.ogImage ? (
            <div className="overflow-hidden rounded-xl border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={defaultValues.ogImage}
                alt="OG Preview"
                className="h-52 w-full object-cover"
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات متقدمة</CardTitle>
          <CardDescription>تحكم في ظهور متجرك في محركات البحث.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-start gap-3 rounded-xl border p-4">
            <Checkbox
              id="isIndexed"
              name="isIndexed"
              defaultChecked={defaultValues.isIndexed}
            />
            <div className="space-y-1">
              <Label htmlFor="isIndexed">السماح بظهور المتجر في جوجل</Label>
              <p className="text-sm text-muted-foreground">
                لو قفلت الاختيار ده، هيتم إضافة noindex للمتجر.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          <Save className="size-4" />
          {isPending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>
    </form>
  );
}
