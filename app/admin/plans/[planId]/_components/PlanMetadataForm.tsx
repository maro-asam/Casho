"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UpdatePlanAction, type PlanFormInput } from "@/actions/admin/admin-plans.actions";
import type { Plan } from "@prisma/client";

export function PlanMetadataForm({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PlanFormInput>({
    name: plan.name,
    description: plan.description,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    currency: plan.currency,
    originalMonthlyPrice: plan.originalMonthlyPrice,
    originalYearlyPrice: plan.originalYearlyPrice,
    discountPercent: plan.discountPercent,
    isActive: plan.isActive,
    sortOrder: plan.sortOrder,
    pricingConfigured: plan.pricingConfigured,
  });

  async function handleSave() {
    setSaving(true);
    try {
      const result = await UpdatePlanAction(plan.id, form);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>معلومات الباقة</CardTitle>
        <CardDescription>الاسم، الوصف، والأسعار — بالقروش (1 جنيه = 100 قرش).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>الاسم</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>العملة</Label>
            <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>الوصف</Label>
          <Textarea
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value || null })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>السعر الشهري (قرش)</Label>
            <Input
              type="number"
              value={form.monthlyPrice}
              onChange={(e) => setForm({ ...form, monthlyPrice: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>السعر السنوي (قرش)</Label>
            <Input
              type="number"
              value={form.yearlyPrice}
              onChange={(e) => setForm({ ...form, yearlyPrice: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>السعر الأصلي الشهري (اختياري)</Label>
            <Input
              type="number"
              value={form.originalMonthlyPrice ?? ""}
              onChange={(e) =>
                setForm({ ...form, originalMonthlyPrice: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>نسبة الخصم % (اختياري)</Label>
            <Input
              type="number"
              value={form.discountPercent ?? ""}
              onChange={(e) => setForm({ ...form, discountPercent: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>ترتيب العرض</Label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>مفعّلة</Label>
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>السعر مؤكد</Label>
            <Switch
              checked={form.pricingConfigured}
              onCheckedChange={(v) => setForm({ ...form, pricingConfigured: v })}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="ms-2 size-4 animate-spin" /> : <Save className="ms-2 size-4" />}
          حفظ
        </Button>
      </CardContent>
    </Card>
  );
}
