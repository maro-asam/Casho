"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { appleButton } from "@/components/saas-page";
import { TIER } from "@/components/sales/tier";
import { updateCommissionRulesAction } from "@/actions/admin/sales.actions";
import type { SalesTier } from "@/lib/sales/rules";
import { cn } from "@/lib/utils";

type Rule = {
  starterRateBps: number;
  growthRateBps: number;
  proRateBps: number;
  renewalRateBps: number;
  starterMaxPosition: number;
  growthMaxPosition: number;
  eligibilityMonths: number;
};

type FieldDef = { name: string; label: string; step?: string; from: (r: Rule) => number };

/** One group per tier (rate + where it ends), then renewal; each group reads as a Settings section. */
const GROUPS: { title: string; tier?: SalesTier; fields: FieldDef[] }[] = [
  {
    title: "المستوى ١",
    tier: "STARTER",
    fields: [
      { name: "starterRate", label: "النسبة %", step: "0.01", from: (r) => r.starterRateBps / 100 },
      { name: "starterMaxPosition", label: "لحد العميل رقم", from: (r) => r.starterMaxPosition },
    ],
  },
  {
    title: "المستوى ٢",
    tier: "GROWTH",
    fields: [
      { name: "growthRate", label: "النسبة %", step: "0.01", from: (r) => r.growthRateBps / 100 },
      { name: "growthMaxPosition", label: "لحد العميل رقم", from: (r) => r.growthMaxPosition },
    ],
  },
  {
    title: "المستوى ٣",
    tier: "PRO",
    fields: [{ name: "proRate", label: "النسبة % (كل اللي بعده)", step: "0.01", from: (r) => r.proRateBps / 100 }],
  },
  {
    title: "التجديد",
    fields: [
      { name: "renewalRate", label: "النسبة %", step: "0.01", from: (r) => r.renewalRateBps / 100 },
      { name: "eligibilityMonths", label: "مدة الأهلية (شهور)", from: (r) => r.eligibilityMonths },
    ],
  },
];

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-[13px] text-(--sys-red)">{message}</p> : null;
}

export function RulesForm({ rule }: { rule: Rule }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form
      className="space-y-5 px-5 pb-5"
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
      <div className="space-y-4">
        {GROUPS.map((group) => (
          <fieldset key={group.title} className={cn("space-y-2", group.tier && TIER[group.tier].color)}>
            <legend className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
              <span aria-hidden className={cn("size-2.5 rounded-full", group.tier ? "bg-(--tier)" : "border-[1.5px] border-(--sys-gray)")} />
              {group.title}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {group.fields.map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <Label htmlFor={f.name} className="text-[13px] font-medium text-muted-foreground">
                    {f.label}
                  </Label>
                  <Input id={f.name} name={f.name} type="number" step={f.step ?? "1"} dir="ltr" defaultValue={f.from(rule)} required className="tabular-nums" />
                  <FieldError message={errors[f.name]} />
                </div>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note" className="text-[13px] font-medium text-muted-foreground">
          سبب التغيير
        </Label>
        <Textarea id="note" name="note" rows={2} required minLength={5} placeholder="مثلًا: رفع نسبة المستوى ٢ لشهر رمضان" />
        <FieldError message={errors.note} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-[18px] text-muted-foreground">
          بتنطبق على الدفعات اللي بعد الحفظ بس. العمولات المسجلة وأهلية العملاء الحاليين مبتتغيرش.
        </p>
        <button type="submit" disabled={pending} className={appleButton.filled}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "بيتحفظ…" : "حفظ كنسخة جديدة"}
        </button>
      </div>
    </form>
  );
}
