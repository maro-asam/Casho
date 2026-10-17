"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { UpdateFeatureAction } from "@/actions/admin/admin-plans.actions";
import type { Feature } from "@prisma/client";
import { cn } from "@/lib/utils";
import { FEATURE_TYPE_LABELS } from "./feature-meta";

export function FeatureRow({ feature, planCount }: { feature: Feature; planCount: number }) {
  const router = useRouter();
  const initial = {
    name: feature.name,
    description: feature.description ?? "",
    unit: feature.unit ?? "",
    isActive: feature.isActive,
    sortOrder: String(feature.sortOrder),
  };
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const dirty = (Object.keys(initial) as (keyof typeof initial)[]).some((k) => form[k] !== initial[k]);
  const valid = form.name.trim() !== "" && Number.isInteger(Number(form.sortOrder));

  async function save() {
    setSaving(true);
    try {
      const result = await UpdateFeatureAction(feature.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        unit: form.unit.trim() || null,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder),
      });
      if (result.success) {
        toast.success(`اتحفظت «${form.name.trim()}»`);
        router.refresh();
      } else toast.error(result.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className={cn("align-top", dirty && "bg-amber-500/5")}>
      <td className="py-3 ps-4">
        <p className="font-mono text-xs" dir="ltr">
          <span className="block text-right">{feature.key}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {FEATURE_TYPE_LABELS[feature.type]} · في {planCount} باقة
        </p>
      </td>
      <td className="py-3">
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-8 min-w-40" aria-label="الاسم" aria-invalid={!form.name.trim()} />
      </td>
      <td className="hidden py-3 lg:table-cell">
        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-8 min-w-56" aria-label="الوصف" />
      </td>
      <td className="py-3">
        <Input
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          className="h-8 w-20"
          aria-label="الوحدة"
          disabled={feature.type === "BOOLEAN"}
        />
      </td>
      <td className="py-3">
        <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} aria-label="ظاهرة في المقارنة" className="mt-1.5" />
      </td>
      <td className="py-3">
        <Input dir="ltr" inputMode="numeric" className="h-8 w-16" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} aria-label="الترتيب" />
      </td>
      <td className="py-3 pe-4">
        <Button size="sm" variant={dirty ? "default" : "ghost"} onClick={save} disabled={saving || !dirty || !valid} className="h-8">
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          احفظ
        </Button>
      </td>
    </tr>
  );
}
