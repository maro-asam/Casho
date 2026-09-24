import { Check, Minus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatMoneyFromPiasters } from "@/lib/subscriptions";

export type PlanFeatureForUI = {
  key: string;
  name: string;
  unit: string | null;
  enabled: boolean;
  isUnlimited: boolean;
  limitValue: number | null;
};

export type PlanForUI = {
  id: string;
  key: string;
  slug: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  originalMonthlyPrice: number | null;
  originalYearlyPrice: number | null;
  discountPercent: number | null;
  sortOrder: number;
  features: PlanFeatureForUI[];
};

function featureValueLabel(feature: PlanFeatureForUI) {
  if (!feature.enabled) return null;
  if (feature.isUnlimited) return "غير محدود";
  if (feature.limitValue !== null) return `${feature.limitValue.toLocaleString("ar-EG")} ${feature.unit ?? ""}`.trim();
  return null;
}

export function PlanCard({
  plan,
  billingCycle,
  isCurrent,
  direction,
  onSelect,
  pending,
}: {
  plan: PlanForUI;
  billingCycle: "MONTHLY" | "YEARLY";
  isCurrent: boolean;
  direction: "upgrade" | "downgrade" | "same";
  onSelect: () => void;
  pending: boolean;
}) {
  const price = billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
  const originalPrice = billingCycle === "YEARLY" ? plan.originalYearlyPrice : plan.originalMonthlyPrice;
  const highlighted = plan.key === "GOLD";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
        highlighted ? "border-primary shadow-lg shadow-primary/10" : "border-border",
      )}
    >
      {highlighted && (
        <Badge className="absolute -top-3 right-6 gap-1 bg-primary text-primary-foreground">
          <Sparkles className="size-3" />
          الأكثر طلبًا
        </Badge>
      )}

      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">باقة</p>
        <h3 className="text-xl font-bold">{plan.name}</h3>
        {plan.description && <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>}
      </div>

      <div className="mb-5 flex items-end gap-2">
        <span className="text-4xl font-extrabold tracking-tight">{formatMoneyFromPiasters(price)}</span>
        <span className="mb-1 text-sm text-muted-foreground">/ {billingCycle === "YEARLY" ? "سنة" : "شهر"}</span>
      </div>
      {originalPrice && originalPrice > price && (
        <div className="mb-4 -mt-3 flex items-center gap-2">
          <span className="text-sm text-muted-foreground line-through">{formatMoneyFromPiasters(originalPrice)}</span>
          {plan.discountPercent && <Badge variant="secondary">خصم {plan.discountPercent}%</Badge>}
        </div>
      )}

      <div className="mb-5 h-px bg-border" />

      <ul className="mb-6 flex-1 space-y-2.5">
        {plan.features.map((feature) => {
          const valueLabel = featureValueLabel(feature);
          return (
            <li key={feature.key} className="flex items-start gap-2.5 text-sm">
              {feature.enabled ? (
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3" />
                </span>
              ) : (
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Minus className="size-3" />
                </span>
              )}
              <span className={cn(!feature.enabled && "text-muted-foreground")}>
                {feature.name}
                {valueLabel && <span className="text-muted-foreground"> — {valueLabel}</span>}
              </span>
            </li>
          );
        })}
      </ul>

      <Button
        className="w-full"
        variant={isCurrent ? "outline" : highlighted ? "default" : "secondary"}
        disabled={isCurrent || pending}
        onClick={onSelect}
      >
        {isCurrent ? "الباقة الحالية" : direction === "upgrade" ? `ترقية إلى ${plan.name}` : `تخفيض إلى ${plan.name}`}
      </Button>
    </div>
  );
}
