"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UpdateConversionConfigAction } from "@/actions/store/conversion.actions";
import { SegmentedButtons, appleButton } from "@/components/saas-page";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ConversionConfig } from "@/lib/conversion/conversion-config";
import { cn } from "@/lib/utils";
import { useBuilder } from "../BuilderContext";
import { Field, Group, LiveNote, PanelBody, Row, SwitchRow } from "../studio-ui";
import { tr } from "@/lib/i18n/dashboard";

type Config = ConversionConfig["whatsapp"];

export default function WhatsAppPanel() {
  const { storeId, storeHost, conversion, whatsappFallback, save } = useBuilder();
  const [config, setConfig] = useState<Config>(conversion.whatsapp);
  const [saved, setSaved] = useState<Config>(conversion.whatsapp);
  const [pending, setPending] = useState(false);
  const set = <K extends keyof Config>(key: K, value: Config[K]) => setConfig((c) => ({ ...c, [key]: value }));

  const phone = config.phone || whatsappFallback || "";
  const phoneOk = phone.replace(/\D/g, "").length >= 10;
  const dirty = JSON.stringify(config) !== JSON.stringify(saved);

  // Live tool: saved on demand (text) or instantly (the main switch).
  async function persist(next: Config) {
    if (next.enabled && !(next.phone || whatsappFallback)) {
      toast.error(tr("اكتب رقم الواتساب الأول."));
      return false;
    }
    setPending(true);
    const ok = await save(() => UpdateConversionConfigAction(storeId, "whatsapp", next), {
      success: next.enabled ? tr("زر الواتساب شغّال في متجرك") : tr("اتحفظت الإعدادات"),
    });
    setPending(false);
    if (ok) setSaved(next);
    return ok;
  }

  const message = `${config.greeting}${config.attachPage ? tr("\nتيشيرت قطن أوفر سايز\nhttps://{0}/products/oversized-tee", storeHost) : ""}`;

  return (
    <PanelBody>
      <LiveNote />

      <Group>
        <SwitchRow
          label={tr("إظهار الزر في المتجر")}
          description={tr("زر أخضر عائم في كل الصفحات (ما عدا الدفع).")}
          checked={config.enabled}
          disabled={pending}
          onCheckedChange={async (v) => {
            const next = { ...saved, enabled: v };
            setConfig((c) => ({ ...c, enabled: v }));
            if (!(await persist(next))) setConfig((c) => ({ ...c, enabled: !v }));
          }}
        />
      </Group>

      <Group title={tr("الرسالة")}>
        <Field
          label={tr("رقم الواتساب")}
          htmlFor="wa-phone"
          error={config.enabled && !phoneOk ? tr("الرقم ناقص — اكتبه كامل بكود البلد أو 01…") : null}
          hint={
            config.phone
              ? tr("الرسايل هتوصل على الرقم ده.")
              : whatsappFallback
                ? tr("فاضي = هنستخدم رقم الواتساب اللي في الإعدادات.")
                : tr("مفيش رقم واتساب في الإعدادات — اكتبه هنا.")
          }
        >
          <Input
            id="wa-phone"
            dir="ltr"
            inputMode="tel"
            value={config.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder={whatsappFallback ?? "01xxxxxxxxx"}
            className="text-right"
          />
        </Field>
        <Field label={tr("أول رسالة")} htmlFor="wa-greeting">
          <Textarea
            id="wa-greeting"
            rows={2}
            maxLength={300}
            value={config.greeting}
            onChange={(e) => set("greeting", e.target.value)}
            className="min-h-0 resize-none px-3.5 py-2.5"
          />
        </Field>
        <SwitchRow
          label={tr("ابعت لينك الصفحة مع الرسالة")}
          description={tr("هتعرف العميل بيسأل عن أنهي منتج من غير ما تسأله.")}
          checked={config.attachPage}
          onCheckedChange={(v) => set("attachPage", v)}
        />
      </Group>

      {/* What the merchant receives */}
      <div className="mx-1 rounded-[18px] bg-[#efeae2] p-3 dark:bg-[#0b141a]">
        <p className="mb-2 text-center text-[11px] text-black/50 dark:text-white/50">{tr("الرسالة اللي هتوصلك")}</p>
        <div className="ms-auto max-w-[85%] whitespace-pre-line break-words rounded-xl rounded-se-sm bg-[#d9fdd3] px-3 py-2 text-[13px] text-black shadow-sm dark:bg-[#005c4b] dark:text-white">
          {message}
        </div>
      </div>

      <Group title={tr("الشكل والمكان")}>
        <Row label={tr("المكان")}>
          <SegmentedButtons
            label={tr("المكان")}
            value={config.position}
            onChange={(v) => set("position", v)}
            options={[
              ["start", tr("يمين")],
              ["end", tr("شمال")],
            ]}
          />
        </Row>
        <Row label={tr("يظهر على")}>
          <SegmentedButtons
            label={tr("يظهر على")}
            value={config.devices}
            onChange={(v) => set("devices", v)}
            options={[
              ["all", tr("الكل")],
              ["mobile", tr("موبايل")],
              ["desktop", tr("كمبيوتر")],
            ]}
          />
        </Row>
        <SwitchRow label={tr("نص جنب الأيقونة")} description={tr("على الشاشات الكبيرة بس.")} checked={config.showLabel} onCheckedChange={(v) => set("showLabel", v)} />
        {config.showLabel && (
          <Field>
            <Input value={config.label} maxLength={30} onChange={(e) => set("label", e.target.value)} aria-label={tr("نص الزر")} />
          </Field>
        )}
      </Group>

      {dirty && (
        <div className="sticky bottom-3 z-10 flex justify-center">
          <div className="apple-glass flex items-center gap-1 rounded-full p-1.5">
            <button type="button" className={cn(appleButton.plain, "mx-0 h-10 px-4")} onClick={() => setConfig(saved)} disabled={pending}>
              {tr("تراجع")}
            </button>
            <button type="button" className={cn(appleButton.filled, "h-10")} onClick={() => persist(config)} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {tr("حفظ ونشر")}
            </button>
          </div>
        </div>
      )}
    </PanelBody>
  );
}
