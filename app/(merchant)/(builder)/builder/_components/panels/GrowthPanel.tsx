"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, MessageCircle, Pencil, Plus, ShoppingBag, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { UpdateConversionConfigAction } from "@/actions/store/conversion.actions";
import { SetPopupActiveAction } from "@/actions/store/popups.actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { POPUP_TYPE_META, triggerLabel } from "@/lib/popups/popup-config";
import { cn } from "@/lib/utils";
import { useBuilder, type BuilderPopup } from "../BuilderContext";

export default function GrowthPanel() {
  const { popups, conversion, whatsappFallback, storeId, reloadPreview, previewPopup } = useBuilder();
  const [previewing, setPreviewing] = useState<string | null>(null);

  function preview(item: BuilderPopup) {
    previewPopup(item.popup);
    setPreviewing(item.id);
  }

  function stopPreview() {
    previewPopup(null);
    setPreviewing(null);
  }

  return (
    <div className="flex h-full flex-col" dir="rtl">
      <div className="flex items-center gap-2 border-b bg-background px-4 py-3">
        <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-3.5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">أدوات البيع</h2>
          <p className="text-[10px] text-muted-foreground">شغّلها وشوف شكلها على متجرك حالًا</p>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* Popups */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">النوافذ المنبثقة</p>
            <Button asChild variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px]">
              <Link href="/customization?tab=popups&popup=new">
                <Plus className="size-3.5" />
                جديدة
              </Link>
            </Button>
          </div>

          {popups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-center">
              <p className="text-xs text-muted-foreground">مفيش نوافذ لسه. ابدأ بقالب &quot;خصم أول طلب&quot;.</p>
              <Button asChild size="sm" className="mt-3 h-8 text-xs">
                <Link href="/customization?tab=popups">اختار قالب</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {popups.map((item) => (
                <PopupRow
                  key={item.id}
                  item={item}
                  storeId={storeId}
                  previewing={previewing === item.id}
                  onPreview={() => preview(item)}
                  onSaved={reloadPreview}
                />
              ))}
            </ul>
          )}

          {previewing && (
            <Button variant="outline" size="sm" className="h-8 w-full gap-1.5 text-xs" onClick={stopPreview}>
              <X className="size-3.5" />
              اقفل المعاينة
            </Button>
          )}
          <p className="text-[11px] leading-5 text-muted-foreground">
            &quot;جرّب&quot; بتعرض النافذة فورًا في المعاينة من غير ما تستنى توقيتها — ومن غير ما تتحسب في الإحصائيات.
          </p>
        </section>

        {/* WhatsApp */}
        <ToggleCard
          icon={MessageCircle}
          title="زر واتساب"
          description={
            conversion.whatsapp.phone || whatsappFallback
              ? "زر عائم بيبعت لينك الصفحة مع الرسالة."
              : "محتاج رقم واتساب الأول."
          }
          checked={conversion.whatsapp.enabled}
          disabled={!(conversion.whatsapp.phone || whatsappFallback)}
          settingsHref="/customization?tab=whatsapp"
          onToggle={(enabled) => UpdateConversionConfigAction(storeId, "whatsapp", { ...conversion.whatsapp, enabled })}
          onSaved={reloadPreview}
        />

        {/* Purchase toasts */}
        <ToggleCard
          icon={ShoppingBag}
          title="إشعارات الشراء"
          description="من طلباتك الحقيقية بس — بتظهر بعد ٧ ثواني من فتح الصفحة."
          checked={conversion.purchaseToasts.enabled}
          settingsHref="/customization?tab=social-proof"
          onToggle={(enabled) => UpdateConversionConfigAction(storeId, "purchaseToasts", { ...conversion.purchaseToasts, enabled })}
          onSaved={reloadPreview}
        />
      </div>
    </div>
  );
}

function PopupRow({
  item,
  storeId,
  previewing,
  onPreview,
  onSaved,
}: {
  item: BuilderPopup;
  storeId: string;
  previewing: boolean;
  onPreview: () => void;
  onSaved: () => void;
}) {
  const [active, setActive] = useState(item.isActive);
  const [pending, startTransition] = useTransition();

  return (
    <li className={cn("space-y-2 p-3", previewing && "bg-primary/5")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {POPUP_TYPE_META[item.popup.type].label} · {triggerLabel(item.popup.config.trigger)}
          </p>
        </div>
        <Switch
          checked={active}
          disabled={pending}
          aria-label={`تشغيل ${item.name}`}
          onCheckedChange={(next) => {
            setActive(next);
            startTransition(async () => {
              const result = await SetPopupActiveAction(item.id, storeId, next);
              if (!result.ok) {
                setActive(!next);
                toast.error(result.message);
                return;
              }
              toast.success(next ? "النافذة شغّالة" : "النافذة اتوقفت");
              onSaved();
            });
          }}
        />
      </div>
      <div className="flex gap-1.5">
        <Button variant={previewing ? "default" : "outline"} size="sm" className="h-7 flex-1 gap-1 text-[11px]" onClick={onPreview}>
          <Eye className="size-3.5" />
          جرّب في المعاينة
        </Button>
        <Button asChild variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px]">
          <Link href={`/customization?tab=popups&popup=${item.id}`}>
            <Pencil className="size-3.5" />
            تعديل
          </Link>
        </Button>
      </div>
    </li>
  );
}

function ToggleCard({
  icon: Icon,
  title,
  description,
  checked,
  disabled,
  settingsHref,
  onToggle,
  onSaved,
}: {
  icon: typeof MessageCircle;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  settingsHref: string;
  onToggle: (enabled: boolean) => Promise<{ ok: true } | { ok: false; message: string }>;
  onSaved: () => void;
}) {
  const [on, setOn] = useState(checked);
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-xl border border-border p-3">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-[11px] leading-5 text-muted-foreground">{description}</p>
        </div>
        <Switch
          checked={on}
          disabled={pending || (disabled && !on)}
          aria-label={title}
          onCheckedChange={(next) => {
            setOn(next);
            startTransition(async () => {
              const result = await onToggle(next);
              if (!result.ok) {
                setOn(!next);
                toast.error(result.message);
                return;
              }
              toast.success(next ? `${title} شغّال` : `${title} اتقفل`);
              onSaved();
            });
          }}
        />
      </div>
      <Link href={settingsHref} className="mt-2 inline-block text-[11px] font-medium text-primary hover:underline">
        كل الإعدادات
      </Link>
    </section>
  );
}
