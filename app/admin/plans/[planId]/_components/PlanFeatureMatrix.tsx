"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/saas-page";
import { UpsertPlanFeatureAction } from "@/actions/admin/admin-plans.actions";
import type { Feature, PlanFeature } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Panel, th, theadRow } from "../../../_components/admin-ui";

type Row = { feature: Feature; planFeature: PlanFeature | null };
type Value = { enabled: boolean; limitValue: number | null; isUnlimited: boolean };

const same = (a: Value, b: Value) => a.enabled === b.enabled && a.limitValue === b.limitValue && a.isUnlimited === b.isUnlimited;

/** Feature × plan grid. Edits are local until "save", which writes only changed rows. */
export function PlanFeatureMatrix({ planId, rows }: { planId: string; rows: Row[] }) {
  const router = useRouter();
  const initial = useMemo(
    () =>
      new Map<string, Value>(
        rows.map((r) => [
          r.feature.id,
          { enabled: r.planFeature?.enabled ?? false, limitValue: r.planFeature?.limitValue ?? null, isUnlimited: r.planFeature?.isUnlimited ?? false },
        ]),
      ),
    [rows],
  );
  const [state, setState] = useState(initial);
  const [saving, setSaving] = useState(false);

  const dirty = rows.filter((r) => !same(state.get(r.feature.id)!, initial.get(r.feature.id)!)).map((r) => r.feature.id);

  function update(featureId: string, patch: Partial<Value>) {
    setState((prev) => new Map(prev).set(featureId, { ...prev.get(featureId)!, ...patch }));
  }

  async function saveAll() {
    setSaving(true);
    try {
      const results = await Promise.all(dirty.map((id) => UpsertPlanFeatureAction(planId, id, state.get(id)!)));
      const failed = results.filter((r) => !r.success).length;
      if (failed) toast.error(`${failed} ميزة متحفظتش، جرّب تاني`);
      else toast.success(`اتحفظ ${dirty.length} تعديل`);
      router.refresh();
    } catch {
      toast.error("حصل خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel
      title="مميزات الباقة"
      description="فعّل الميزة وحدد الحد الأقصى لو ليها حد. التغيير بيطبق على كل المتاجر اللي على الباقة دي."
      flush
      actions={
        <div className="flex items-center gap-2">
          {dirty.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setState(initial)} disabled={saving}>
              تراجع
            </Button>
          )}
          <Button size="sm" onClick={saveAll} disabled={saving || dirty.length === 0}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {dirty.length ? `احفظ ${dirty.length} تعديل` : "مفيش تعديلات"}
          </Button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={theadRow}>
              <th className={cn(th, "ps-4")}>الميزة</th>
              <th className={cn(th, "w-24")}>مفعّلة</th>
              <th className={cn(th, "w-28")}>غير محدود</th>
              <th className={cn(th, "w-36 pe-4")}>الحد الأقصى</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(({ feature }) => {
              const row = state.get(feature.id)!;
              const changed = dirty.includes(feature.id);
              const numeric = feature.type !== "BOOLEAN"; // boolean features have no limit
              return (
                <tr key={feature.id} className={cn(changed && "bg-amber-500/5")}>
                  <td className="py-3 ps-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{feature.name}</span>
                      {!feature.isActive && <StatusPill tone="neutral">مخفية من المقارنة</StatusPill>}
                      {changed && <StatusPill tone="warning">متغيرة</StatusPill>}
                    </div>
                    {feature.description && <p className="mt-0.5 max-w-md text-xs text-muted-foreground">{feature.description}</p>}
                  </td>
                  <td className="py-3">
                    <Switch checked={row.enabled} onCheckedChange={(v) => update(feature.id, { enabled: v })} aria-label={`تفعيل ${feature.name}`} />
                  </td>
                  <td className="py-3">
                    {numeric ? (
                      <Switch
                        checked={row.isUnlimited}
                        disabled={!row.enabled}
                        onCheckedChange={(v) => update(feature.id, { isUnlimited: v, limitValue: v ? null : row.limitValue })}
                        aria-label={`${feature.name} غير محدود`}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 pe-4">
                    {numeric ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={0}
                          dir="ltr"
                          className="h-8 w-20"
                          disabled={!row.enabled || row.isUnlimited}
                          value={row.limitValue ?? ""}
                          onChange={(e) => update(feature.id, { limitValue: e.target.value ? Math.max(0, Math.floor(Number(e.target.value))) : null })}
                          aria-label={`حد ${feature.name}`}
                        />
                        {feature.unit && <span className="text-xs text-muted-foreground">{feature.unit}</span>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
