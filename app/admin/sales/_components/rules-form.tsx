"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateCommissionRulesAction } from "@/actions/admin/sales.actions";

type Rule = {
  starterRateBps: number;
  growthRateBps: number;
  proRateBps: number;
  renewalRateBps: number;
  starterMaxPosition: number;
  growthMaxPosition: number;
  eligibilityMonths: number;
};

const FIELDS: { name: string; label: string; step?: string; from: (r: Rule) => number }[] = [
  { name: "starterRate", label: "نسبة المستوى 1 (%)", step: "0.01", from: (r) => r.starterRateBps / 100 },
  { name: "starterMaxPosition", label: "آخر عميل في المستوى 1", from: (r) => r.starterMaxPosition },
  { name: "growthRate", label: "نسبة المستوى 2 (%)", step: "0.01", from: (r) => r.growthRateBps / 100 },
  { name: "growthMaxPosition", label: "آخر عميل في المستوى 2", from: (r) => r.growthMaxPosition },
  { name: "proRate", label: "نسبة المستوى 3 (%)", step: "0.01", from: (r) => r.proRateBps / 100 },
  { name: "renewalRate", label: "نسبة التجديد (%)", step: "0.01", from: (r) => r.renewalRateBps / 100 },
  { name: "eligibilityMonths", label: "مدة الأهلية (شهور تقويمية)", from: (r) => r.eligibilityMonths },
];

export function RulesForm({ rule }: { rule: Rule }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const input = Object.fromEntries(new FormData(e.currentTarget).entries());
        startTransition(async () => {
          const res = await updateCommissionRulesAction(input).catch(() => ({ success: false, message: "مش مسموح أو حصلت مشكلة", fieldErrors: undefined }));
          setErrors(res.fieldErrors ?? {});
          if (!res.success) return void toast.error(res.message);
          toast.success(res.message);
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.name} className="space-y-1.5">
            <Label htmlFor={f.name}>{f.label}</Label>
            <Input id={f.name} name={f.name} type="number" step={f.step ?? "1"} dir="ltr" defaultValue={f.from(rule)} required />
            {errors[f.name] && <p className="text-xs text-destructive">{errors[f.name]}</p>}
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note">سبب التغيير</Label>
        <Textarea id="note" name="note" rows={2} required minLength={5} />
        {errors.note && <p className="text-xs text-destructive">{errors.note}</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        القواعد الجديدة بتنطبق على الدفعات اللي بعد الحفظ بس. العمولات المسجلة وتواريخ أهلية العملاء الحاليين مبتتغيرش.
      </p>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        حفظ كنسخة جديدة
      </Button>
    </form>
  );
}
