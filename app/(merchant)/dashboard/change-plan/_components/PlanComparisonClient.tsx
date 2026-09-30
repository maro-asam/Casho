"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PlanCard, type PlanForUI } from "./PlanCard";
import { ChangePlanDialog } from "./ChangePlanDialog";

export function PlanComparisonClient({
  plans,
  currentPlanId,
  currentSortOrder,
  initialBillingCycle,
}: {
  plans: PlanForUI[];
  currentPlanId: string | null;
  currentSortOrder: number;
  initialBillingCycle: "MONTHLY" | "YEARLY";
}) {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">(initialBillingCycle);
  const [targetPlan, setTargetPlan] = useState<PlanForUI | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
          {(["MONTHLY", "YEARLY"] as const).map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => setBillingCycle(cycle)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 motion-safe:active:scale-95",
                billingCycle === cycle ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {cycle === "MONTHLY" ? "شهري" : "سنوي"}
            </button>
          ))}
        </div>
        {billingCycle === "YEARLY" && (
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            وفّر أكتر مع الاشتراك السنوي
          </span>
        )}
      </div>

      <div className="grid items-stretch gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            isCurrent={plan.id === currentPlanId}
            direction={plan.sortOrder > currentSortOrder ? "upgrade" : plan.sortOrder < currentSortOrder ? "downgrade" : "same"}
            pending={false}
            onSelect={() => setTargetPlan(plan)}
          />
        ))}
      </div>

      <ChangePlanDialog
        open={targetPlan !== null}
        onOpenChange={(open) => {
          if (!open) setTargetPlan(null);
        }}
        targetPlan={targetPlan}
        billingCycle={billingCycle}
      />
    </div>
  );
}
