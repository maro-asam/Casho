import { ArrowLeft, Check, Gem, Minus, ShieldCheck, Sparkles } from "lucide-react";
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

// Tier visual language — kept restrained: Silver is neutral, Gold gets a
// primary-tinted border + ribbon, Platinum gets the strongest (filled icon
// chip, richer border/shadow) but no competing ribbon of its own.
const TIER_STYLES = {
  SILVER: {
    icon: ShieldCheck,
    card: "border-border",
    iconChip: "bg-muted text-foreground",
    topBar: "bg-border",
    button: "outline" as const,
  },
  GOLD: {
    icon: Sparkles,
    card: "border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/10",
    iconChip: "bg-primary/10 text-primary",
    topBar: "bg-gradient-to-r from-primary via-primary to-primary/30",
    button: "default" as const,
  },
  PLATINUM: {
    icon: Gem,
    card: "border-primary/30 bg-gradient-to-b from-card to-primary/[0.04] shadow-xl shadow-primary/10",
    iconChip: "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground",
    topBar: "bg-gradient-to-r from-primary/60 via-primary to-primary/60",
    button: "default" as const,
  },
} satisfies Record<string, { icon: typeof Sparkles; card: string; iconChip: string; topBar: string; button: "default" | "outline" }>;

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
  const tier = TIER_STYLES[plan.key as keyof typeof TIER_STYLES] ?? TIER_STYLES.SILVER;
  const highlighted = plan.key === "GOLD";
  const Icon = tier.icon;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border bg-card p-6 transition-all duration-300 sm:p-7",
        "motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl",
        tier.card,
        isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1", tier.topBar)} />

      {highlighted && (
        <Badge className="absolute top-4 left-4 gap-1 rounded-full bg-primary px-3 py-1 text-primary-foreground shadow-sm">
          <Sparkles className="size-3" />
          الأكثر طلبًا
        </Badge>
      )}
      {isCurrent && (
        <Badge variant="secondary" className="absolute top-4 left-4 gap-1 rounded-full px-3 py-1">
          <Check className="size-3" />
          باقتك الحالية
        </Badge>
      )}

      <div className="mb-5 flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 motion-safe:group-hover:scale-105",
            tier.iconChip,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">باقة</p>
          <h3 className="text-xl font-bold leading-tight">{plan.name}</h3>
        </div>
      </div>

      {plan.description && <p className="mb-5 text-sm leading-6 text-muted-foreground">{plan.description}</p>}

      <div key={`${plan.id}-${billingCycle}`} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
        <div className="flex items-end gap-1.5">
          <span className="text-4xl font-extrabold tracking-tight tabular-nums sm:text-[2.75rem]">
            {formatMoneyFromPiasters(price)}
          </span>
          <span className="mb-1.5 text-sm text-muted-foreground">/ {billingCycle === "YEARLY" ? "سنة" : "شهر"}</span>
        </div>
        {originalPrice && originalPrice > price && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sm text-muted-foreground line-through">{formatMoneyFromPiasters(originalPrice)}</span>
            {plan.discountPercent && (
              <Badge variant="secondary" className="text-emerald-600 dark:text-emerald-400">
                خصم {plan.discountPercent}%
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="my-6 h-px bg-border" />

      <ul className="mb-7 flex-1 space-y-3">
        {plan.features.map((feature) => {
          const valueLabel = featureValueLabel(feature);
          return (
            <li key={feature.key} className="flex items-start gap-3 text-sm">
              {feature.enabled ? (
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-200 motion-safe:group-hover:scale-110">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              ) : (
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground/60">
                  <Minus className="size-3" />
                </span>
              )}
              <span className={cn("leading-5", !feature.enabled && "text-muted-foreground")}>
                {feature.name}
                {valueLabel && <span className="text-muted-foreground"> — {valueLabel}</span>}
              </span>
            </li>
          );
        })}
      </ul>

      <Button
        className={cn(
          "h-11 w-full rounded-xl text-sm font-bold transition-all",
          highlighted && "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35",
        )}
        variant={isCurrent ? "outline" : tier.button}
        disabled={isCurrent || pending}
        onClick={onSelect}
      >
        {isCurrent ? (
          "الباقة الحالية"
        ) : (
          <>
            {direction === "upgrade" ? `ترقية إلى ${plan.name}` : `تخفيض إلى ${plan.name}`}
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5 rtl:scale-x-[-1] rtl:group-hover:translate-x-0.5" />
          </>
        )}
      </Button>
    </div>
  );
}
