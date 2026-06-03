"use client";

import { useActionState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBuilder } from "../BuilderContext";
import {
  UpdateStoreIdentityAction,
  type StoreIdentityFormState,
} from "@/actions/store/store-identity.actions";

const initialState: StoreIdentityFormState = { success: false, message: "" };

export default function IdentityPanel() {
  const { storeId, logo, coverImage, description, announcementText, reloadPreview } =
    useBuilder();

  const [state, formAction, isPending] = useActionState(
    UpdateStoreIdentityAction,
    initialState,
  );

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
      reloadPreview();
    } else {
      toast.error(state.message);
    }
  }, [state, reloadPreview]);

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3 bg-background">
        <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <ImageIcon className="size-3.5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">الهوية البصرية</h2>
          <p className="text-[10px] text-muted-foreground">اللوجو والوصف والإعلانات</p>
        </div>
      </div>

      {/* Form */}
      <form action={formAction} className="flex flex-col flex-1 overflow-hidden">
        <input type="hidden" name="storeId" value={storeId} />

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Logo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">رابط اللوجو</Label>
            <Input
              name="logo"
              placeholder="https://example.com/logo.png"
              defaultValue={logo ?? ""}
              dir="ltr"
              className="h-8 text-xs text-left"
            />
            {state.errors?.logo && (
              <p className="text-[10px] text-destructive">{state.errors.logo[0]}</p>
            )}
            {logo && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
                <Image
                  src={logo}
                  alt="Logo"
                  width={36}
                  height={36}
                  className="size-9 rounded-lg border object-cover"
                />
                <p className="text-[10px] text-muted-foreground">معاينة اللوجو الحالي</p>
              </div>
            )}
          </div>

          {/* Cover image */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">رابط صورة الغلاف</Label>
            <Input
              name="coverImage"
              placeholder="https://example.com/cover.jpg"
              defaultValue={coverImage ?? ""}
              dir="ltr"
              className="h-8 text-xs text-left"
            />
            {state.errors?.coverImage && (
              <p className="text-[10px] text-destructive">{state.errors.coverImage[0]}</p>
            )}
            {coverImage && (
              <div className="overflow-hidden rounded-lg border">
                <Image
                  src={coverImage}
                  alt="Cover"
                  width={300}
                  height={80}
                  className="h-16 w-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">وصف المتجر</Label>
            <Textarea
              name="description"
              placeholder="أضف وصفًا قصيرًا لمتجرك..."
              defaultValue={description ?? ""}
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          {/* Announcement text */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">نص الإعلان</Label>
            <Input
              name="announcementText"
              placeholder="مثال: توصيل مجاني للطلبات فوق 200 جنيه 🎉"
              defaultValue={announcementText ?? ""}
              className="h-8 text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              يظهر في شريط الإعلان في أعلى المتجر
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-background px-4 py-3">
          <Button
            type="submit"
            size="sm"
            className="w-full h-8 text-xs gap-1.5"
            disabled={isPending}
          >
            {isPending && <Loader2 className="size-3 animate-spin" />}
            {isPending ? "جاري الحفظ…" : "حفظ الهوية"}
          </Button>
        </div>
      </form>
    </div>
  );
}
