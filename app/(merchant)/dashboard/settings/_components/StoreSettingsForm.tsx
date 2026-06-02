"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Phone,
  Store as StoreIcon,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
} from "lucide-react";

import {
  UpdateStoreSettingsAction,
  type StoreSettingsFormState,
} from "@/actions/store/settings.actions";
import {
  CheckStoreNameAvailabilityAction,
  type StoreNameAvailabilityResult,
} from "@/actions/store/check-store-name.actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Props = {
  store: {
    id: string;
    name: string;
    slug: string;
    poweredByRemovalEnabled: boolean;
    settings: {
      id: string;
      storeId: string;
      primaryColor: string | null;
      secondaryColor: string | null;
      shippingPrice: number;
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

  const [storeName, setStoreName] = useState(store.name);
  const [storeNameStatus, setStoreNameStatus] =
    useState<StoreNameAvailabilityResult | null>({
      success: true,
      available: true,
      normalizedSlug: store.slug,
      suggestedSlug: store.slug,
      message: "ده اسم متجرك الحالي",
    });
  const [isCheckingStoreName, setIsCheckingStoreName] = useState(false);

  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  useEffect(() => {
    const value = storeName.trim();

    if (!value || value.length < 2) {
      setStoreNameStatus(null);
      setIsCheckingStoreName(false);
      return;
    }

    if (value === store.name.trim()) {
      setStoreNameStatus({
        success: true,
        available: true,
        normalizedSlug: store.slug,
        suggestedSlug: store.slug,
        message: "ده اسم متجرك الحالي",
      });
      setIsCheckingStoreName(false);
      return;
    }

    setIsCheckingStoreName(true);
    const currentRequestId = ++requestIdRef.current;

    const timer = setTimeout(async () => {
      try {
        const result = await CheckStoreNameAvailabilityAction(store.id, value);

        if (requestIdRef.current !== currentRequestId) return;

        setStoreNameStatus(result);
      } catch (error) {
        console.error(error);

        if (requestIdRef.current !== currentRequestId) return;

        setStoreNameStatus(null);
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setIsCheckingStoreName(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [store.id, store.name, store.slug, storeName]);

  const settings = store.settings;

  return (
    <form action={formAction} className="space-y-8" dir="rtl">
      <input type="hidden" name="storeId" value={store.id} />

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <StoreIcon className="size-4 text-primary" />
          <h3 className="text-base font-semibold">بيانات المتجر</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="storeName">اسم المتجر</Label>
          <Input
            id="storeName"
            name="storeName"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="اكتب اسم متجرك"
          />

          {state.errors?.storeName && (
            <p className="text-sm text-destructive">
              {state.errors.storeName[0]}
            </p>
          )}

          {(isCheckingStoreName || storeNameStatus) && (
            <div className="rounded-xl border bg-muted/40 p-4">
              {isCheckingStoreName ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>جارٍ فحص اسم المتجر...</span>
                </div>
              ) : storeNameStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    {storeNameStatus.available ? (
                      <>
                        <CheckCircle2 className="size-4 text-green-600" />
                        <span className="font-medium">
                          {storeNameStatus.message}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="size-4 text-amber-600" />
                        <span className="font-medium">
                          {storeNameStatus.message}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">رابط المتجر هيبقى:</p>
                    <div
                      dir="ltr"
                      className="rounded-xl border bg-primary/10 px-3 py-2 font-medium"
                    >
                      <span className="text-primary text-lg">
                        {storeNameStatus.suggestedSlug || store.slug}
                      </span>
                      .casho.store
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      الاسم بعد التحويل للرابط:
                    </p>
                    <div
                      dir="ltr"
                      className="rounded-xl border bg-primary/10 px-3 py-2"
                    >
                      {storeNameStatus.normalizedSlug || store.slug}
                    </div>
                  </div>

                  {!storeNameStatus.available && (
                    <div className="flex items-start gap-2 rounded-xl border border-dashed bg-background px-3 py-2 text-sm">
                      <Sparkles className="mt-0.5 size-4 text-primary" />
                      <p className="text-muted-foreground">
                        الاسم ده متاخد، والبديل المتاح:
                        <span
                          className="mx-1 font-semibold text-foreground"
                          dir="ltr"
                        >
                          {storeNameStatus.suggestedSlug}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <Separator />

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h3 className="text-base font-semibold">الشحن</h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="shippingPrice">سعر الشحن</Label>
            <Input
              id="shippingPrice"
              name="shippingPrice"
              type="number"
              min={0}
              step={1}
              placeholder="مثال: 50"
              defaultValue={settings?.shippingPrice ?? 0}
            />

            {state.errors?.shippingPrice && (
              <p className="text-sm text-destructive">
                {state.errors.shippingPrice[0]}
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              السعر اللي هيتضاف تلقائيًا على إجمالي الطلب.
            </p>
          </div>
        </div>
      </section>
      <Separator />

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Phone className="size-4 text-primary" />
          <h3 className="text-base font-semibold">روابط التواصل</h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Input
            name="whatsappNumber"
            placeholder="201001234567"
            defaultValue={settings?.whatsappNumber ?? ""}
          />
          <Input
            name="instagram"
            placeholder="Instagram link"
            defaultValue={settings?.instagram ?? ""}
          />
          <Input
            name="facebook"
            placeholder="Facebook link"
            defaultValue={settings?.facebook ?? ""}
          />
          <Input
            name="tiktok"
            placeholder="Tiktok link"
            defaultValue={settings?.tiktok ?? ""}
          />
          <Input
            name="email"
            placeholder="your-email@example.com"
            className="md:col-span-2"
            defaultValue={settings?.email ?? ""}
          />
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
              حفظ الإعدادات
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
