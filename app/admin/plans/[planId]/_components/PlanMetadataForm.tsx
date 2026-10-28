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
import { UpdatePlanAction } from "@/actions/admin/admin-plans.actions";
import type { Plan } from "@prisma/client";
import { Panel } from "../../../_components/admin-ui";
import { egpToPiasters, piastersToEgpInput } from "../../_components/money";

/** Plan name, copy, prices (edited in EGP, stored in piasters) and visibility. */
export function PlanMetadataForm({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description ?? "");
  const [monthly, setMonthly] = useState(piastersToEgpInput(plan.monthlyPrice));
  const [yearly, setYearly] = useState(piastersToEgpInput(plan.yearlyPrice));
  const [origMonthly, setOrigMonthly] = useState(piastersToEgpInput(plan.originalMonthlyPrice));
  const [origYearly, setOrigYearly] = useState(piastersToEgpInput(plan.originalYearlyPrice));
  const [discount, setDiscount] = useState(plan.discountPercent?.toString() ?? "");
  const [sortOrder, setSortOrder] = useState(String(plan.sortOrder));
  const [isActive, setIsActive] = useState(plan.isActive);
  const [pricingConfigured, setPricingConfigured] = useState(plan.pricingConfigured);

  const monthlyP = egpToPiasters(monthly);
  const yearlyP = egpToPiasters(yearly);
  const optional = (v: string) => (v.trim() === "" ? null : egpToPiasters(v));
  const origMonthlyP = optional(origMonthly);
  const origYearlyP = optional(origYearly);
  const discountN = discount.trim() === "" ? null : Number(discount);
  const sortN = Number(sortOrder);

  const errors = {
    monthly: monthlyP === null,
    yearly: yearlyP === null,
    origMonthly: origMonthly.trim() !== "" && origMonthlyP === null,
    origYearly: origYearly.trim() !== "" && origYearlyP === null,
    discount: discountN !== null && (!Number.isInteger(discountN) || discountN < 0 || discountN > 100),
    sort: !Number.isInteger(sortN),
    name: !name.trim(),
  };
  const valid = !Object.values(errors).some(Boolean);
  // Monthly ×12 vs yearly — a quick sanity check for the yearly discount.
  const yearlySaving = monthlyP && yearlyP !== null ? Math.round((1 - yearlyP / (monthlyP * 12)) * 100) : null;

  async function handleSave() {
    if (!valid) return;
    setSaving(true);
    try {
      const result = await UpdatePlanAction(plan.id, {
        name: name.trim(),
        description: description.trim() || null,
        monthlyPrice: monthlyP!,
        yearlyPrice: yearlyP!,
        currency: plan.currency,
        originalMonthlyPrice: origMonthlyP,
        originalYearlyPrice: origYearlyP,
        discountPercent: discountN,
        isActive,
        sortOrder: sortN,
        pricingConfigured,
      });
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else toast.error(result.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="بيانات الباقة" description="الأسعار بالجنيه. السعر الجديد بيطبق على التجديدات اللي جاية، مش على الاشتراكات الحالية.">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pm-name">الاسم</Label>
            <Input id="pm-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={errors.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pm-sort">ترتيب العرض</Label>
            <Input id="pm-sort" dir="ltr" inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} aria-invalid={errors.sort} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pm-desc">الوصف</Label>
          <Textarea id="pm-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="سطر بيظهر تحت اسم الباقة في صفحة الأسعار" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pm-monthly">السعر الشهري (جنيه)</Label>
            <Input id="pm-monthly" dir="ltr" inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} aria-invalid={errors.monthly} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pm-yearly">السعر السنوي (جنيه)</Label>
            <Input id="pm-yearly" dir="ltr" inputMode="decimal" value={yearly} onChange={(e) => setYearly(e.target.value)} aria-invalid={errors.yearly} />
            {yearlySaving !== null && Number.isFinite(yearlySaving) && (
              <p className="text-xs text-muted-foreground">{yearlySaving > 0 ? `السنوي بيوفّر ${yearlySaving}٪ عن ١٢ شهر` : "السنوي مش أرخص من ١٢ شهر"}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pm-orig-m">السعر قبل الخصم — شهري (اختياري)</Label>
            <Input id="pm-orig-m" dir="ltr" inputMode="decimal" value={origMonthly} onChange={(e) => setOrigMonthly(e.target.value)} aria-invalid={errors.origMonthly} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pm-orig-y">السعر قبل الخصم — سنوي (اختياري)</Label>
            <Input id="pm-orig-y" dir="ltr" inputMode="decimal" value={origYearly} onChange={(e) => setOrigYearly(e.target.value)} aria-invalid={errors.origYearly} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pm-discount">شارة الخصم ٪ (اختياري)</Label>
            <Input id="pm-discount" dir="ltr" inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value)} aria-invalid={errors.discount} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-3 rounded-[12px] bg-(--fill-3) p-3">
            <span>
              <span className="block text-sm font-medium">ظاهرة للتجار</span>
              <span className="block text-xs text-muted-foreground">لو مخفية محدش يقدر يختارها</span>
            </span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-[12px] bg-(--fill-3) p-3">
            <span>
              <span className="block text-sm font-medium">السعر مؤكد</span>
              <span className="block text-xs text-muted-foreground">شيل علامة «مبدئي» من الباقة</span>
            </span>
            <Switch checked={pricingConfigured} onCheckedChange={setPricingConfigured} />
          </label>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !valid}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            حفظ التعديلات
          </Button>
        </div>
      </form>
    </Panel>
  );
}
