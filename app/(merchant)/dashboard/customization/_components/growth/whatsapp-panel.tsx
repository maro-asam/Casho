"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { UpdateConversionConfigAction } from "@/actions/store/conversion.actions";
import { WhatsAppIcon } from "@/app/store/[slug]/_components/conversion/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ConversionConfig } from "@/lib/conversion/conversion-config";
import { cn } from "@/lib/utils";
import { Segmented, SettingRow } from "./controls";
import { tr, trv } from "@/lib/i18n/dashboard";

type Config = ConversionConfig["whatsapp"];

export function WhatsAppPanel({
  storeId,
  storeHost,
  initial,
  fallbackPhone,
}: {
  storeId: string;
  storeHost: string;
  initial: Config;
  fallbackPhone: string | null;
}) {
  const router = useRouter();
  const [config, setConfig] = useState<Config>(initial);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof Config>(key: K, value: Config[K]) => setConfig((c) => ({ ...c, [key]: value }));

  const phone = config.phone || fallbackPhone || "";
  const phoneOk = phone.replace(/\D/g, "").length >= 10;
  const dirty = JSON.stringify(config) !== JSON.stringify(initial);

  function save(next = config) {
    if (next.enabled && !(next.phone || fallbackPhone)) return toast.error(tr("اكتب رقم الواتساب الأول."));
    startTransition(async () => {
      const result = await UpdateConversionConfigAction(storeId, "whatsapp", next);
      if (!result.ok) {
        toast.error(trv(result.message));
        return;
      }
      toast.success(next.enabled ? tr("زر الواتساب شغّال في متجرك") : tr("اتحفظت الإعدادات"));
      router.refresh();
    });
  }

  const message = `${config.greeting}${config.attachPage ? tr("\nتيشيرت قطن أوفر سايز\nhttps://{0}/products/oversized-tee", storeHost) : ""}`;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <SettingRow
          title={tr("إظهار الزر في المتجر")}
          description={tr("زر أخضر عائم في كل صفحات المتجر (ما عدا الدفع).")}
          control={
            <Switch
              checked={config.enabled}
              onCheckedChange={(v) => {
                const next = { ...config, enabled: v };
                setConfig(next);
                save(next);
              }}
              disabled={pending}
              aria-label={tr("تشغيل زر الواتساب")}
            />
          }
        />

        <section className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="space-y-2">
            <Label htmlFor="wa-phone">{tr("رقم الواتساب")}</Label>
            <Input
              id="wa-phone"
              dir="ltr"
              inputMode="tel"
              value={config.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder={fallbackPhone ?? "01xxxxxxxxx"}
              className="h-10 text-right"
            />
            <p className={cn("text-xs", phoneOk || !config.enabled ? "text-muted-foreground" : "text-destructive")}>
              {config.phone
                ? tr("الرسايل هتوصل على الرقم ده.")
                : fallbackPhone
                  ? tr("فاضي = هنستخدم رقم الواتساب اللي في الإعدادات.")
                  : tr("مفيش رقم واتساب في الإعدادات — اكتبه هنا.")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wa-greeting">{tr("أول رسالة")}</Label>
            <Textarea
              id="wa-greeting"
              rows={2}
              maxLength={300}
              value={config.greeting}
              onChange={(e) => set("greeting", e.target.value)}
              className="resize-none"
            />
          </div>

          <SettingRow
            bare
            title={tr("ابعت لينك الصفحة مع الرسالة")}
            description={tr("لما العميل يسأل من صفحة منتج، هتعرف هو بيسأل عن إيه من غير ما تسأله.")}
            control={<Switch checked={config.attachPage} onCheckedChange={(v) => set("attachPage", v)} aria-label={tr("إرفاق لينك الصفحة")} />}
          />
        </section>

        <section className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{tr("المكان")}</Label>
            <Segmented
              value={config.position}
              onChange={(v) => set("position", v)}
              options={[
                { value: "start", label: tr("يمين") },
                { value: "end", label: tr("شمال") },
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label>{tr("يظهر على")}</Label>
            <Segmented
              value={config.devices}
              onChange={(v) => set("devices", v)}
              options={[
                { value: "all", label: tr("الكل") },
                { value: "mobile", label: tr("موبايل") },
                { value: "desktop", label: tr("كمبيوتر") },
              ]}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="wa-label">{tr("نص بجانب الأيقونة")}</Label>
              <Switch checked={config.showLabel} onCheckedChange={(v) => set("showLabel", v)} aria-label={tr("إظهار النص")} />
            </div>
            <Input
              id="wa-label"
              value={config.label}
              maxLength={30}
              disabled={!config.showLabel}
              onChange={(e) => set("label", e.target.value)}
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">{tr("بيظهر على الشاشات الكبيرة بس، عشان ميغطّيش على الموبايل.")}</p>
          </div>
        </section>

        <div className="flex gap-2">
          <Button onClick={() => save()} disabled={!dirty || pending} className="gap-1.5">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {tr("حفظ")}
          </Button>
          {dirty && (
            <Button variant="ghost" onClick={() => setConfig(initial)} disabled={pending}>
              {tr("تراجع")}
            </Button>
          )}
        </div>
      </div>

      {/* Preview: the store corner + the message the merchant receives */}
      <aside className="space-y-3 xl:sticky xl:top-20 xl:self-start">
        <p className="text-xs font-medium text-muted-foreground">{tr("المعاينة")}</p>
        <div className="relative h-56 overflow-hidden rounded-xl border border-border bg-muted/40">
          <div className="space-y-2 p-4">
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-2 w-2/3 rounded-full bg-muted" />
            <div className="h-2 w-1/3 rounded-full bg-muted" />
          </div>
          <span
            className={cn(
              "absolute bottom-4 flex items-center gap-2 rounded-full bg-[#25D366] p-2.5 text-white shadow-lg",
              config.position === "start" ? "start-4" : "end-4",
            )}
          >
            <WhatsAppIcon className="size-5" />
            {config.showLabel && config.label && <span className="pe-1 text-xs font-semibold">{config.label}</span>}
          </span>
        </div>
        <div className="rounded-xl border border-border bg-[#efeae2] p-3 dark:bg-[#0b141a]">
          <p className="mb-2 text-center text-[10px] text-black/50 dark:text-white/50">{tr("الرسالة اللي هتوصلك")}</p>
          <div className="ms-auto max-w-[85%] whitespace-pre-line break-words rounded-lg rounded-se-none bg-[#d9fdd3] px-2.5 py-1.5 text-xs text-black shadow-sm dark:bg-[#005c4b] dark:text-white">
            {message}
          </div>
        </div>
      </aside>
    </div>
  );
}
