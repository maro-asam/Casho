"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AtSign, Camera, Check, Loader2, MessageCircle, Music2, Share2, Sparkles, Truck, X } from "lucide-react";

import {
  UpdateStoreSettingsAction,
  type StoreSettingsFormState,
} from "@/actions/store/settings.actions";
import {
  CheckStoreNameAvailabilityAction,
  type StoreNameAvailabilityResult,
} from "@/actions/store/check-store-name.actions";

import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";
import { Group, IconTile } from "./settings-ui";

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
      message: tr("ده اسم متجرك الحالي"),
    });
  const [isCheckingStoreName, setIsCheckingStoreName] = useState(false);

  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(trv(state.message));
    } else {
      toast.error(trv(state.message));
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
        message: tr("ده اسم متجرك الحالي"),
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
  const slug = storeNameStatus?.suggestedSlug || store.slug;

  return (
    <form action={formAction} className="space-y-8" dir={tdir()}>
      <input type="hidden" name="storeId" value={store.id} />

      {/* ── Store ─────────────────────────────────────────── */}
      <Group id="store" title={tr("بيانات المتجر")} footer={tr("الاسم بيظهر لعملاءك في كل مكان، والرابط بيتعمل منه تلقائي.")}>
        <InlineField label={tr("اسم المتجر")} htmlFor="storeName" error={state.errors?.storeName?.[0]}>
          <input
            id="storeName"
            name="storeName"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder={tr("اكتب اسم متجرك")}
            className={INLINE_INPUT}
          />
        </InlineField>
        <div className="flex min-h-11 items-center justify-between gap-4 px-4 py-3 text-[15px]">
          <span className="shrink-0">{tr("رابط المتجر هيبقى:")}</span>
          <span dir="ltr" className="min-w-0 truncate text-muted-foreground">
            <span className="font-semibold text-primary">{slug}</span>.casho.store
          </span>
        </div>
        {(isCheckingStoreName || storeNameStatus) && (
          <div className="flex items-start gap-2.5 px-4 py-3 text-[13px] leading-5">
            {isCheckingStoreName ? (
              <>
                <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">{tr("جارٍ فحص اسم المتجر...")}</span>
              </>
            ) : storeNameStatus ? (
              <>
                <span
                  className={cn(
                    "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-white",
                    storeNameStatus.available ? "bg-(--sys-green)" : "bg-(--sys-orange)",
                  )}
                >
                  {storeNameStatus.available ? <Check className="size-2.5" strokeWidth={4} /> : <X className="size-2.5" strokeWidth={4} />}
                </span>
                <span className="min-w-0">
                  <span className="text-foreground/85">{trv(storeNameStatus.message)}</span>
                  {!storeNameStatus.available && (
                    <span className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                      <Sparkles className="size-3.5 text-primary" />
                      {tr("الاسم ده متاخد، والبديل المتاح:")}
                      <span className="font-semibold text-foreground" dir="ltr">
                        {storeNameStatus.suggestedSlug}
                      </span>
                    </span>
                  )}
                </span>
              </>
            ) : null}
          </div>
        )}
      </Group>

      {/* ── Shipping ──────────────────────────────────────── */}
      <Group id="shipping" title={tr("الشحن")} footer={tr("السعر اللي هيتضاف تلقائيًا على إجمالي الطلب.")}>
        <InlineField
          label={tr("سعر الشحن")}
          htmlFor="shippingPrice"
          icon={<IconTile icon={Truck} tint="bg-(--sys-orange)" />}
          error={state.errors?.shippingPrice?.[0]}
        >
          <input
            id="shippingPrice"
            name="shippingPrice"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder={tr("مثال: 50")}
            defaultValue={settings?.shippingPrice ?? 0}
            className={cn(INLINE_INPUT, "tabular-nums")}
          />
          <span className="shrink-0 text-[15px] text-muted-foreground">{tr("ج.م")}</span>
        </InlineField>
      </Group>

      {/* ── Contact links ─────────────────────────────────── */}
      <Group id="contact" inset={57} title={tr("روابط التواصل")} footer={tr("بتظهر في فوتر متجرك وصفحة «من نحن».")}>
        <InlineField label={tr("واتساب")} htmlFor="whatsappNumber" icon={<IconTile icon={MessageCircle} tint="bg-(--sys-green)" />}>
          <input id="whatsappNumber" name="whatsappNumber" dir="ltr" inputMode="tel" placeholder="201001234567" defaultValue={settings?.whatsappNumber ?? ""} className={INLINE_INPUT} />
        </InlineField>
        <InlineField label="Instagram" htmlFor="instagram" icon={<IconTile icon={Camera} tint="bg-linear-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5]" />}>
          <input id="instagram" name="instagram" dir="ltr" placeholder="instagram.com/…" defaultValue={settings?.instagram ?? ""} className={INLINE_INPUT} />
        </InlineField>
        <InlineField label="Facebook" htmlFor="facebook" icon={<IconTile icon={Share2} tint="bg-[#1877f2]" />}>
          <input id="facebook" name="facebook" dir="ltr" placeholder="facebook.com/…" defaultValue={settings?.facebook ?? ""} className={INLINE_INPUT} />
        </InlineField>
        <InlineField label="TikTok" htmlFor="tiktok" icon={<IconTile icon={Music2} tint="bg-[#111111]" />}>
          <input id="tiktok" name="tiktok" dir="ltr" placeholder="tiktok.com/@…" defaultValue={settings?.tiktok ?? ""} className={INLINE_INPUT} />
        </InlineField>
        <InlineField label={tr("البريد الإلكتروني")} htmlFor="email" icon={<IconTile icon={AtSign} tint="bg-primary" />}>
          <input id="email" name="email" type="email" dir="ltr" placeholder="you@example.com" defaultValue={settings?.email ?? ""} className={INLINE_INPUT} />
        </InlineField>
      </Group>

      {/* Floating save bar (functional layer, glass). */}
      <div className="sticky bottom-4 z-20 flex justify-end">
        <div className="apple-glass flex items-center gap-3 rounded-full p-1.5 ps-4">
          <span className="text-[13px] text-muted-foreground">{tr("بيانات المتجر والشحن والتواصل")}</span>
          <button type="submit" disabled={isPending} className={cn(appleButton.filled, "h-10")}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPending ? tr("جاري الحفظ...") : tr("حفظ الإعدادات")}
          </button>
        </div>
      </div>
    </form>
  );
}

const INLINE_INPUT =
  "h-11 min-w-0 flex-1 bg-transparent text-end text-[15px] text-muted-foreground outline-none placeholder:text-(--label-3) focus:text-foreground";

/** iOS form row: label leading, borderless value field trailing. */
function InlineField({
  label,
  htmlFor,
  icon,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4">
      <div className="flex min-h-11 items-center gap-3">
        {icon}
        <label htmlFor={htmlFor} className="shrink-0 text-[15px]">
          {label}
        </label>
        <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
      </div>
      {error && <p className="pb-2.5 text-[13px] text-(--sys-red)">{trv(error)}</p>}
    </div>
  );
}
