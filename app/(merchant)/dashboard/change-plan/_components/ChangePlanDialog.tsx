"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Check, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatMoneyFromPiasters } from "@/lib/subscriptions";
import {
  PreviewPlanChangeAction,
  ConfirmPlanChangeAction,
} from "@/actions/subscription/change-plan.actions";
import type { PlanChangePreview } from "@/lib/entitlements";
import type { PlanForUI } from "./PlanCard";

export function ChangePlanDialog({
  open,
  onOpenChange,
  targetPlan,
  billingCycle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPlan: PlanForUI | null;
  billingCycle: "MONTHLY" | "YEARLY";
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<PlanChangePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open || !targetPlan) {
      setPreview(null);
      return;
    }
    setLoading(true);
    PreviewPlanChangeAction(targetPlan.id)
      .then((result) => {
        if (result.success) setPreview(result.preview);
        else toast.error(result.message);
      })
      .finally(() => setLoading(false));
  }, [open, targetPlan]);

  if (!targetPlan) return null;

  const price = billingCycle === "YEARLY" ? targetPlan.yearlyPrice : targetPlan.monthlyPrice;
  const isDowngrade = preview?.direction === "downgrade";

  async function handleConfirm() {
    setConfirming(true);
    try {
      const result = await ConfirmPlanChangeAction(targetPlan!.id, billingCycle);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } finally {
      setConfirming(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isDowngrade ? "تخفيض إلى" : "ترقية إلى"} {targetPlan.name}
          </DialogTitle>
          <DialogDescription>
            {formatMoneyFromPiasters(price)} / {billingCycle === "YEARLY" ? "سنة" : "شهر"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : preview ? (
          <div className="space-y-4">
            {preview.featuresGained.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">سوف تحصل على:</p>
                <ul className="space-y-1.5">
                  {preview.featuresGained.map((f) => (
                    <li key={f.key} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      {f.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {preview.featuresLost.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">سوف تفقد الوصول إلى:</p>
                <ul className="space-y-1.5">
                  {preview.featuresLost.map((f) => (
                    <li key={f.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <X className="size-4 shrink-0 text-destructive" />
                      {f.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {preview.overages.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-500/10 p-4 text-amber-800 dark:border-amber-900 dark:text-amber-400">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <AlertTriangle className="size-4 shrink-0" />
                  تنبيه: أنت متجاوز حدود هذه الباقة حاليًا
                </div>
                <ul className="space-y-1 text-sm">
                  {preview.overages.map((o) => (
                    <li key={o.key}>
                      لديك {o.current.toLocaleString("ar-EG")} {o.unit ?? ""} من &quot;{o.name}&quot;، وباقة {targetPlan.name} تسمح
                      بحد أقصى {o.newLimit.toLocaleString("ar-EG")}. لن يتم حذف أي بيانات، لكن لن تتمكن من إضافة المزيد
                      حتى تقلل العدد إلى الحد المسموح.
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={confirming}>
            إلغاء
          </Button>
          <Button onClick={handleConfirm} disabled={loading || confirming}>
            {confirming ? (
              <>
                <Loader2 className="ms-2 size-4 animate-spin" />
                جاري التنفيذ...
              </>
            ) : (
              <>
                <ArrowLeft className="ms-2 size-4" />
                تأكيد {isDowngrade ? "التخفيض" : "الترقية"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
