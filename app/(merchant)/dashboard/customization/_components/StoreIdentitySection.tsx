"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Save, ImageIcon, FileText, Upload, X } from "lucide-react";

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

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  if (!cloudName || !uploadPreset) throw new Error("إعدادات Cloudinary مفقودة");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  fd.append("folder", folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: fd,
  });
  const data = await res.json();
  if (!res.ok || !data.secure_url) throw new Error(data?.error?.message || "فشل رفع الصورة");
  return data.secure_url as string;
}

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

  const [logoUrl, setLogoUrl] = useState(logo ?? "");
  const [coverUrl, setCoverUrl] = useState(coverImage ?? "");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state.message) return;
    if (state.success) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      const url = await uploadToCloudinary(file, "casho/uploads/logos");
      setLogoUrl(url);
      toast.success("تم رفع اللوجو");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل رفع اللوجو");
    } finally {
      setIsUploadingLogo(false);
      e.target.value = "";
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCover(true);
      const url = await uploadToCloudinary(file, "casho/uploads/covers");
      setCoverUrl(url);
      toast.success("تم رفع صورة الغلاف");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل رفع صورة الغلاف");
    } finally {
      setIsUploadingCover(false);
      e.target.value = "";
    }
  }

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
          {/* Logo */}
          <div className="space-y-2">
            <Label>اللوجو</Label>
            <input type="hidden" name="logo" value={logoUrl} />
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            {logoUrl ? (
              <div className="rounded-xl border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">معاينة اللوجو</p>
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <Image
                  width={80}
                  height={80}
                  src={logoUrl}
                  alt="Logo Preview"
                  className="h-20 w-20 rounded-xl border object-cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  تغيير اللوجو
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30 disabled:opacity-50"
              >
                {isUploadingLogo ? (
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="size-6 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isUploadingLogo ? "جاري الرفع..." : "اضغط لرفع اللوجو"}
                </span>
              </button>
            )}
            {state.errors?.logo && (
              <p className="text-sm text-destructive">{state.errors.logo[0]}</p>
            )}
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label>صورة الغلاف</Label>
            <input type="hidden" name="coverImage" value={coverUrl} />
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
            {coverUrl ? (
              <div className="rounded-xl border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">معاينة الغلاف</p>
                  <button
                    type="button"
                    onClick={() => setCoverUrl("")}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <Image
                  width={400}
                  height={120}
                  src={coverUrl}
                  alt="Cover Preview"
                  className="h-28 w-full rounded-xl border object-cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                >
                  {isUploadingCover ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  تغيير الغلاف
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30 disabled:opacity-50"
              >
                {isUploadingCover ? (
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="size-6 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isUploadingCover ? "جاري الرفع..." : "اضغط لرفع صورة الغلاف"}
                </span>
              </button>
            )}
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
