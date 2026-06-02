"use client";

import { useActionState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Save, ImageIcon, FileText } from "lucide-react";

import {
  UpdateStoreIdentityAction,
  type StoreIdentityFormState,
} from "@/actions/store/store-identity.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

type Props = {
  storeId: string;
  logo?: string | null;
  coverImage?: string | null;
  description?: string | null;
  announcementText?: string | null;
};

const initialState: StoreIdentityFormState = { success: false, message: "" };

export default function StoreIdentitySection({
  storeId,
  logo,
  coverImage,
  description,
  announcementText,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    UpdateStoreIdentityAction,
    initialState,
  );

  useEffect(() => {
    if (!state.message) return;
    if (state.success) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-8" dir="rtl">
      <input type="hidden" name="storeId" value={storeId} />

      {/* Images & Identity */}
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <ImageIcon className="size-4 text-primary" />
          <h3 className="text-base font-semibold">الصور والهوية</h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="logo">رابط اللوجو</Label>
            <Input
              id="logo"
              name="logo"
              placeholder="https://example.com/logo.png"
              defaultValue={logo ?? ""}
              dir="ltr"
              className="text-left"
            />
            {state.errors?.logo && (
              <p className="text-sm text-destructive">{state.errors.logo[0]}</p>
            )}
            {logo && (
              <div className="rounded-xl border p-3">
                <p className="mb-2 text-sm text-muted-foreground">معاينة اللوجو</p>
                <Image
                  width={80}
                  height={80}
                  src={logo}
                  alt="Logo Preview"
                  className="h-20 w-20 rounded-xl border object-cover"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImage">رابط صورة الغلاف</Label>
            <Input
              id="coverImage"
              name="coverImage"
              placeholder="https://example.com/cover.jpg"
              defaultValue={coverImage ?? ""}
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

      {/* Store Content */}
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h3 className="text-base font-semibold">محتوى المتجر</h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2 w-full">
          <div className="space-y-2">
            <Label htmlFor="description">وصف المتجر</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="مثال: متجر متخصص في بيع الملابس الكاجوال بأفضل جودة وسعر"
              defaultValue={description ?? ""}
              className="min-h-28 resize-none"
            />
            {state.errors?.description && (
              <p className="text-sm text-destructive">
                {state.errors.description[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcementText">النص العلوي</Label>
            <Textarea
              id="announcementText"
              name="announcementText"
              placeholder="مثال: شحن مجاني للطلبات فوق 500 جنيه"
              defaultValue={announcementText ?? ""}
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

      <div className="flex justify-start">
        <Button type="submit" disabled={isPending} className="min-w-45 gap-2">
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="size-4" />
              حفظ
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
