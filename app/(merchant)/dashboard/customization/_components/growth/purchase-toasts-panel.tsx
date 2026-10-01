"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info, Loader2, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";

import { UpdateConversionConfigAction } from "@/actions/store/conversion.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { ConversionConfig, RecentPurchase } from "@/lib/conversion/conversion-config";
import { Segmented, SettingRow } from "./controls";

type Config = ConversionConfig["purchaseToasts"];
const nf = new Intl.NumberFormat("ar-EG");

export function PurchaseToastsPanel({
  storeId,
  initial,
  sample,
  recentCount,
}: {
  storeId: string;
  initial: Config;
  /** Real recent orders (last 30 days) for the preview. */
  sample: RecentPurchase[];
  recentCount: Record<number, number>;
}) {
  const router = useRouter();
  const [config, setConfig] = useState<Config>(initial);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof Config>(key: K, value: Config[K]) => setConfig((c) => ({ ...c, [key]: value }));
  const dirty = JSON.stringify(config) !== JSON.stringify(initial);
  const available = recentCount[config.lookbackDays] ?? 0;
  const example = sample[0];

  function save(next = config) {
    startTransition(async () => {
      const result = await UpdateConversionConfigAction(storeId, "purchaseToasts", next);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(next.enabled ? "إشعارات الشراء شغّالة" : "اتحفظت الإعدادات");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <SettingRow
          title="إظهار إشعارات الشراء"
          description="بتظهر بهدوء في ركن الشاشة كل شوية، من طلبات متجرك الحقيقية بس."
          control={
            <Switch
              checked={config.enabled}
              onCheckedChange={(v) => {
                const next = { ...config, enabled: v };
                setConfig(next);
                save(next);
              }}
              disabled={pending}
              aria-label="تشغيل إشعارات الشراء"
            />
          }
        />

        <div className="flex gap-3 rounded-xl border border-border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            مش هنخترع أي طلب. الإشعارات بتتبني من طلبات الأونلاين الحقيقية (غير الملغية) في الفترة اللي تختارها — ولو
            مفيش طلبات، مش هيظهر حاجة. ده بيحميك من أي شكوى ويخلّي الثقة حقيقية.
          </p>
        </div>

        <section className="space-y-5 rounded-xl border border-border bg-card p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>الطلبات من آخر</Label>
              <span className="text-sm font-medium tabular-nums">{nf.format(config.lookbackDays)} يوم</span>
            </div>
            <Segmented
              value={String(config.lookbackDays)}
              onChange={(v) => set("lookbackDays", Number(v))}
              options={[1, 3, 7, 14, 30].map((d) => ({ value: String(d), label: `${nf.format(d)} يوم` }))}
            />
            <p className={available ? "text-xs text-muted-foreground" : "text-xs text-amber-600"}>
              {available
                ? `عندك ${nf.format(available)} طلب في الفترة دي — هيظهر منهم لحد ١٢.`
                : "مفيش طلبات أونلاين في الفترة دي، فمش هيظهر أي إشعار. وسّع المدة."}
            </p>
          </div>

          <div className="space-y-2">
            <Label>اسم العميل</Label>
            <Segmented
              value={config.nameMode}
              onChange={(v) => set("nameMode", v)}
              options={[
                { value: "first", label: "الاسم الأول بس" },
                { value: "hidden", label: "من غير أسماء" },
              ]}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>كل قد إيه</Label>
                <span className="text-sm tabular-nums">{nf.format(config.intervalSeconds)} ث</span>
              </div>
              <Slider min={8} max={120} step={1} value={[config.intervalSeconds]} onValueChange={([v]) => set("intervalSeconds", v)} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>أقصى عدد في الزيارة</Label>
                <span className="text-sm tabular-nums">{nf.format(config.maxPerVisit)}</span>
              </div>
              <Slider min={1} max={10} step={1} value={[config.maxPerVisit]} onValueChange={([v]) => set("maxPerVisit", v)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>المكان</Label>
            <Segmented
              value={config.position}
              onChange={(v) => set("position", v)}
              options={[
                { value: "start", label: "يمين تحت" },
                { value: "end", label: "شمال تحت" },
              ]}
            />
          </div>
        </section>

        <div className="flex gap-2">
          <Button onClick={() => save()} disabled={!dirty || pending} className="gap-1.5">
            {pending && <Loader2 className="size-4 animate-spin" />}
            حفظ
          </Button>
          {dirty && (
            <Button variant="ghost" onClick={() => setConfig(initial)} disabled={pending}>
              تراجع
            </Button>
          )}
        </div>
      </div>

      <aside className="space-y-2 xl:sticky xl:top-20 xl:self-start">
        <p className="text-xs font-medium text-muted-foreground">{example ? "من آخر طلب حقيقي عندك" : "شكل الإشعار"}</p>
        <div className="relative flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5 pe-8 shadow-lg">
          <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
            {example?.productImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={example.productImage} alt="" className="size-full object-cover" />
            ) : (
              <ShoppingBag className="m-auto mt-4 size-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 text-sm">
            <p className="truncate">
              <span className="font-semibold">
                {config.nameMode === "first" ? (example?.firstName ?? "محمد") : "عميل"}
              </span>{" "}
              طلب
            </p>
            <p className="truncate font-medium">{example?.productName ?? "اسم المنتج"}</p>
            <p className="text-xs text-muted-foreground">من ساعتين</p>
          </div>
          <X className="absolute end-2 top-2 size-3.5 text-muted-foreground" />
        </div>
      </aside>
    </div>
  );
}
