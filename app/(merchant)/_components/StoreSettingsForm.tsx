"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Palette,
  Image as ImageLucide,
  Phone,
  FileText,
} from "lucide-react";

import {
  UpdateStoreSettingsAction,
  type StoreSettingsFormState,
} from "@/actions/store/settings.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

type Props = {
  store: {
    id: string;
    name: string;
    slug: string;
    settings: {
      id: string;
      storeId: string;
      logo: string | null;
      coverImage: string | null;
      primaryColor: string | null;
      secondaryColor: string | null;
      announcementText: string | null;
      description: string | null; // ✅ الجديد
      whatsappNumber: string | null;
      tiktok: string | null;
      instagram: string | null;
      facebook: string | null;
      email: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  };
};

const initialState: StoreSettingsFormState = {
  success: false,
  message: "",
};

export default function StoreSettingsForm({ store }: Props) {
  const [state, formAction, isPending] = useActionState(
    UpdateStoreSettingsAction,
    initialState,
  );

  useEffect(() => {
    if (!state.message) return;

    if (state.success) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  const settings = store.settings;

  return (
    <form action={formAction} className="space-y-8" dir="rtl">
      {/* ================= الصور ================= */}
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <ImageLucide className="size-4 text-primary" />
          <h3 className="text-base font-semibold">الصور والهوية</h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* logo */}
          <div className="space-y-2">
            <Label htmlFor="logo">رابط اللوجو</Label>
            <Input
              id="logo"
              name="logo"
              placeholder="https://example.com/logo.png"
              defaultValue={settings?.logo ?? ""}
              dir="ltr"
              className="text-left"
            />

            {state.errors?.logo && (
              <p className="text-sm text-destructive">{state.errors.logo[0]}</p>
            )}

            {settings?.logo && (
              <div className="rounded-xl border p-3">
                <p className="mb-2 text-sm text-muted-foreground">
                  معاينة اللوجو
                </p>
                <Image
                  width={1000}
                  height={1000}
                  src={settings.logo}
                  alt="Logo Preview"
                  className="h-20 w-20 rounded-lg object-cover border"
                />
              </div>
            )}
          </div>

          {/* cover */}
          <div className="space-y-2">
            <Label htmlFor="coverImage">رابط صورة الغلاف</Label>
            <Input
              id="coverImage"
              name="coverImage"
              placeholder="https://example.com/cover.jpg"
              defaultValue={settings?.coverImage ?? ""}
              dir="ltr"
              className="text-left"
            />

            {state.errors?.coverImage && (
              <p className="text-sm text-destructive">
                {state.errors.coverImage[0]}
              </p>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* ================= وصف المتجر + الإعلان ================= */}
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h3 className="text-base font-semibold">محتوى المتجر</h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* وصف المتجر */}
          <div className="space-y-2">
            <Label htmlFor="description">وصف المتجر</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="مثال: متجر متخصص في بيع الملابس الكاجوال بأفضل جودة وسعر"
              defaultValue={settings?.description ?? ""}
              className="min-h-28 resize-none"
            />
            {state.errors?.description && (
              <p className="text-sm text-destructive">
                {state.errors.description[0]}
              </p>
            )}
          </div>

          {/* النص العلوي */}
          <div className="space-y-2">
            <Label htmlFor="announcementText">النص العلوي</Label>
            <Textarea
              id="announcementText"
              name="announcementText"
              placeholder="مثال: شحن مجاني للطلبات فوق 500 جنيه"
              defaultValue={settings?.announcementText ?? ""}
              className="min-h-28 resize-none"
            />
            {state.errors?.announcementText && (
              <p className="text-sm text-destructive">
                {state.errors.announcementText[0]}
              </p>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* ================= الألوان ================= */}
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-primary" />
          <h3 className="text-base font-semibold">ألوان المتجر</h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* primary */}
          <div className="space-y-2">
            <Label htmlFor="primaryColor">اللون الأساسي</Label>
            <div className="flex items-center gap-3">
              <Input
                id="primaryColor"
                name="primaryColor"
                placeholder="#000000"
                defaultValue={settings?.primaryColor ?? ""}
                dir="ltr"
                className="text-left"
              />

              <input
                type="color"
                defaultValue={settings?.primaryColor ?? "#000000"}
                onChange={(e) => {
                  const input = document.getElementById(
                    "primaryColor",
                  ) as HTMLInputElement;
                  input.value = e.target.value;
                }}
                className="h-10 w-14 cursor-pointer rounded-md border"
              />
            </div>
          </div>

          {/* secondary */}
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">اللون الثانوي</Label>
            <div className="flex items-center gap-3">
              <Input
                id="secondaryColor"
                name="secondaryColor"
                placeholder="#ffffff"
                defaultValue={settings?.secondaryColor ?? ""}
                dir="ltr"
                className="text-left"
              />

              <input
                type="color"
                defaultValue={settings?.secondaryColor ?? "#ffffff"}
                onChange={(e) => {
                  const input = document.getElementById(
                    "secondaryColor",
                  ) as HTMLInputElement;
                  input.value = e.target.value;
                }}
                className="h-10 w-14 cursor-pointer rounded-md border"
              />
            </div>
          </div>
        </div>
      </section>


      <Separator />

      {/* ================= التواصل ================= */}
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Phone className="size-4 text-primary" />
          <h3 className="text-base font-semibold">روابط التواصل</h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Input name="whatsappNumber" placeholder="201001234567" />
          <Input name="instagram" placeholder="Instagram link" />
          <Input name="facebook" placeholder="Facebook link" />
          <Input name="tiktok" placeholder="Tiktok link" />
          <Input
            name="email"
            placeholder="your-email@example.com"
            className="md:col-span-2"
          />
        </div>
      </section>

      {/* ================= submit ================= */}
      <div className="flex justify-start">
        <Button
          type="submit"
          disabled={isPending}
          className="min-w-45 gap-2 rounded-xl"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="size-4" />
              حفظ الإعدادات
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
