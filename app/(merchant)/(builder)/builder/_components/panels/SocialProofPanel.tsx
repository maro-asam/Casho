"use client";

import { useState } from "react";
import { Info, Loader2, ShoppingBag, X } from "lucide-react";
import { UpdateConversionConfigAction } from "@/actions/store/conversion.actions";
import { SegmentedButtons, appleButton } from "@/components/saas-page";
import { Slider } from "@/components/ui/slider";
import type { ConversionConfig } from "@/lib/conversion/conversion-config";
import { cn } from "@/lib/utils";
import { useBuilder } from "../BuilderContext";
import { Group, LiveNote, PanelBody, Row, SwitchRow } from "../studio-ui";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

type Config = ConversionConfig["purchaseToasts"];
const nf = lazyIntl.number();
const WINDOWS = [1, 3, 7, 14, 30] as const;

export default function SocialProofPanel() {
  const { storeId, conversion, socialProof, save } = useBuilder();
  const [config, setConfig] = useState<Config>(conversion.purchaseToasts);
  const [saved, setSaved] = useState<Config>(conversion.purchaseToasts);
  const [pending, setPending] = useState(false);
  const set = <K extends keyof Config>(key: K, value: Config[K]) => setConfig((c) => ({ ...c, [key]: value }));
  const dirty = JSON.stringify(config) !== JSON.stringify(saved);
  const available = socialProof?.recentCount[config.lookbackDays];
  const example = socialProof?.sample[0];

  async function persist(next: Config) {
    setPending(true);
    const ok = await save(() => UpdateConversionConfigAction(storeId, "purchaseToasts", next), {
      success: next.enabled ? tr("إشعارات الشراء شغّالة") : tr("اتحفظت الإعدادات"),
    });
    setPending(false);
    if (ok) setSaved(next);
    return ok;
  }

  return (
    <PanelBody>
      <LiveNote />

      <Group>
        <SwitchRow
          label={tr("إظهار إشعارات الشراء")}
          description={tr("بتظهر بهدوء في ركن الشاشة، من طلباتك الحقيقية بس.")}
          checked={config.enabled}
          disabled={pending}
          onCheckedChange={async (v) => {
            setConfig((c) => ({ ...c, enabled: v }));
            if (!(await persist({ ...saved, enabled: v }))) setConfig((c) => ({ ...c, enabled: !v }));
          }}
        />
      </Group>

      {/* Preview from the latest real order */}
      <div className="space-y-1.5">
        <p className="px-4 text-[13px] text-muted-foreground">{example ? tr("من آخر طلب حقيقي عندك") : tr("شكل الإشعار")}</p>
        <div className="relative mx-1 flex items-center gap-3 rounded-[18px] bg-card p-2.5 pe-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-(--fill-3)">
            {example?.productImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={example.productImage} alt="" className="size-full object-cover" />
            ) : (
              <ShoppingBag className="size-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 text-[13px] leading-[18px]">
            <p className="truncate">
              <span className="font-semibold">{config.nameMode === "first" ? (example?.firstName ?? tr("محمد")) : tr("عميل")}</span> {tr("طلب")}
            </p>
            <p className="truncate font-medium">{example?.productName ?? tr("اسم المنتج")}</p>
            <p className="text-[12px] text-muted-foreground">{tr("من ساعتين")}</p>
          </div>
          <X className="absolute end-3 top-3 size-3.5 text-muted-foreground" />
        </div>
      </div>

      <Group
        title={tr("الطلبات من آخر")}
        footer={
          available === undefined ? undefined : available ? (
            tr("عندك {0} طلب في الفترة دي — هيظهر منهم لحد ١٢.", nf.format(available))
          ) : (
            <span className="text-foreground/80">{tr("مفيش طلبات أونلاين في الفترة دي، فمش هيظهر أي إشعار. وسّع المدة.")}</span>
          )
        }
      >
        <div className="px-4 py-3">
          <SegmentedButtons
            label={tr("الطلبات من آخر")}
            value={String(config.lookbackDays)}
            onChange={(v) => set("lookbackDays", Number(v))}
            className="flex w-full [&>button]:flex-1 [&>button]:justify-center"
            options={WINDOWS.map((d) => [String(d), tr("{0} يوم", nf.format(d))] as const)}
          />
        </div>
      </Group>

      <Group title={tr("الإعدادات")}>
        <Row label={tr("اسم العميل")}>
          <SegmentedButtons
            label={tr("اسم العميل")}
            value={config.nameMode}
            onChange={(v) => set("nameMode", v)}
            options={[
              ["first", tr("الأول بس")],
              ["hidden", tr("من غير")],
            ]}
          />
        </Row>
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
        <Row label={tr("كل قد إيه")} value={<span className="tabular-nums">{tr("{0} ث", nf.format(config.intervalSeconds))}</span>} />
        <div className="px-4 pb-3">
          <Slider min={8} max={120} step={1} value={[config.intervalSeconds]} onValueChange={([v]) => set("intervalSeconds", v)} aria-label={tr("كل قد إيه")} />
        </div>
        <Row label={tr("أقصى عدد في الزيارة")} value={<span className="tabular-nums">{nf.format(config.maxPerVisit)}</span>} />
        <div className="px-4 pb-3">
          <Slider min={1} max={10} step={1} value={[config.maxPerVisit]} onValueChange={([v]) => set("maxPerVisit", v)} aria-label={tr("أقصى عدد في الزيارة")} />
        </div>
      </Group>

      <p className="mx-4 flex gap-2 text-[12px] leading-[17px] text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        {tr("مش هنخترع أي طلب. الإشعارات بتتبني من طلبات الأونلاين الحقيقية (غير الملغية) بس — ده بيحميك ويخلّي الثقة حقيقية.")}
      </p>

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
