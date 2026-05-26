"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Search, Globe, Share2, Settings2, ImageIcon, Loader2 } from "lucide-react";

import {
  UpdateStoreSeoAction,
  type SeoSettingsState,
} from "@/actions/settings/seo.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

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

const initialState: SeoSettingsState = { success: false, message: "" };

function CharCount({
  value,
  soft,
  hard,
}: {
  value: string;
  soft: number;
  hard: number;
}) {
  const len = value.length;
  return (
    <span
      className={cn(
        "tabular-nums text-xs transition-colors",
        len > hard
          ? "font-semibold text-destructive"
          : len >= soft
            ? "text-emerald-600"
            : "text-muted-foreground",
      )}
    >
      {len} / {hard}
    </span>
  );
}

export default function SEOSettingsForm({
  storeId,
  storeName,
  storeSlug,
  defaultValues,
}: SEOSettingsFormProps) {
  const action = UpdateStoreSeoAction.bind(null, storeId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [title, setTitle] = useState(defaultValues.seoTitle);
  const [desc, setDesc] = useState(defaultValues.seoDescription);
  const [ogTitle, setOgTitle] = useState(defaultValues.ogTitle);
  const [ogDesc, setOgDesc] = useState(defaultValues.ogDescription);
  const [ogImage, setOgImage] = useState(defaultValues.ogImage);

  useEffect(() => {
    if (!state.message) return;
    if (state.success) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  const googleTitle = title || `${storeName} | Casho`;
  const googleDesc =
    desc || "اكتشف منتجات المتجر واطلب بسهولة بأفضل تجربة شراء أونلاين.";
  const ogPreviewTitle = ogTitle || title || `${storeName} | Casho`;
  const ogPreviewDesc =
    ogDesc || desc || "اكتشف منتجات المتجر واطلب بسهولة بأفضل تجربة شراء أونلاين.";

  return (
    <form action={formAction} className="space-y-6" dir="rtl">
      {/* ── Google Search ── */}
      <Card>
        <CardContent className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Search className="size-4" />
            </div>
            <div>
              <h2 className="font-semibold">الظهور في جوجل</h2>
              <p className="text-xs text-muted-foreground">
                بيانات بتظهر في نتائج البحث وتساعد الناس يفهموا متجرك بسرعة
              </p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="seoTitle">عنوان الـ SEO</Label>
                <CharCount value={title} soft={50} hard={60} />
              </div>
              <Input
                id="seoTitle"
                name="seoTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`مثال: ${storeName} | أفضل منتجات بأفضل سعر`}
              />
              {state.errors?.seoTitle && (
                <p className="text-xs text-destructive">{state.errors.seoTitle[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="seoDescription">وصف الـ SEO</Label>
                <CharCount value={desc} soft={140} hard={160} />
              </div>
              <Textarea
                id="seoDescription"
                name="seoDescription"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="اكتب وصف واضح وقصير عن متجرك ومنتجاتك"
                rows={3}
              />
              {state.errors?.seoDescription && (
                <p className="text-xs text-destructive">{state.errors.seoDescription[0]}</p>
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
                افصل بين الكلمات بفاصلة
              </p>
              {state.errors?.seoKeywords && (
                <p className="text-xs text-destructive">{state.errors.seoKeywords[0]}</p>
              )}
            </div>
          </div>

          {/* Google SERP Live Preview */}
          <div className="rounded-2xl border bg-background p-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="size-3.5" />
              <span>معاينة نتيجة جوجل</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-primary">
                G
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{storeSlug}.casho.store</span>
                  <span>›</span>
                  <span>{storeName}</span>
                </div>
                <p className="text-base font-medium text-blue-600 line-clamp-1 leading-snug">
                  {googleTitle}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {googleDesc}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Social Share ── */}
      <Card>
        <CardContent className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Share2 className="size-4" />
            </div>
            <div>
              <h2 className="font-semibold">المشاركة على السوشيال</h2>
              <p className="text-xs text-muted-foreground">
                ده اللي بيظهر لما حد يبعت لينك متجرك على واتساب أو فيسبوك
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ogTitle">عنوان المشاركة</Label>
                  <CharCount value={ogTitle} soft={50} hard={65} />
                </div>
                <Input
                  id="ogTitle"
                  name="ogTitle"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  placeholder={`مثال: ${storeName} — تسوق الآن`}
                />
                {state.errors?.ogTitle && (
                  <p className="text-xs text-destructive">{state.errors.ogTitle[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ogDescription">وصف المشاركة</Label>
                  <CharCount value={ogDesc} soft={100} hard={200} />
                </div>
                <Textarea
                  id="ogDescription"
                  name="ogDescription"
                  value={ogDesc}
                  onChange={(e) => setOgDesc(e.target.value)}
                  placeholder="وصف يظهر وقت مشاركة الرابط"
                  rows={3}
                />
                {state.errors?.ogDescription && (
                  <p className="text-xs text-destructive">{state.errors.ogDescription[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ogImage">رابط صورة المشاركة</Label>
                <Input
                  id="ogImage"
                  name="ogImage"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="https://example.com/og.jpg"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">
                  الأبعاد المثالية: 1200 × 630 بكسل
                </p>
                {state.errors?.ogImage && (
                  <p className="text-xs text-destructive">{state.errors.ogImage[0]}</p>
                )}
              </div>
            </div>

            {/* OG Card Live Preview */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">معاينة بطاقة المشاركة</p>
              <div className="overflow-hidden rounded-2xl border shadow-sm">
                <div className="relative flex aspect-[1200/630] items-center justify-center overflow-hidden bg-muted">
                  {ogImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ogImage}
                      alt="OG Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                      <ImageIcon className="size-8" />
                      <span className="text-xs">لا توجد صورة</span>
                    </div>
                  )}
                </div>
                <div className="border-t bg-muted/30 p-3.5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {storeSlug}.casho.store
                  </p>
                  <p className="mt-1 font-semibold leading-snug line-clamp-1">
                    {ogPreviewTitle}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                    {ogPreviewDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Advanced ── */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Settings2 className="size-4" />
            </div>
            <div>
              <h2 className="font-semibold">إعدادات متقدمة</h2>
              <p className="text-xs text-muted-foreground">
                تحكم في ظهور متجرك في محركات البحث
              </p>
            </div>
          </div>

          <label
            htmlFor="isIndexed"
            className="flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors hover:bg-muted/40"
          >
            <Checkbox
              id="isIndexed"
              name="isIndexed"
              defaultChecked={defaultValues.isIndexed}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <p className="font-medium leading-none">
                السماح بظهور المتجر في جوجل
              </p>
              <p className="text-sm text-muted-foreground">
                لو أوقفت الخيار ده، هيتم إضافة{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">noindex</code>{" "}
                للمتجر ومش هيظهر في نتائج البحث
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-start">
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isPending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>
    </form>
  );
}
