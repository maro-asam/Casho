import type { SalesTier } from "@/lib/sales/rules";
import { cn } from "@/lib/utils";

/* Tiers: one hue each, used on marks only (text stays in label colors).
   `color` sets `--tier` so dots, rings and fills can read it. */
export const TIER: Record<SalesTier, { name: string; number: string; color: string }> = {
  STARTER: { name: "Starter", number: "المستوى ١", color: "[--tier:var(--sys-teal)]" },
  GROWTH: { name: "Growth", number: "المستوى ٢", color: "[--tier:var(--primary)]" },
  PRO: { name: "Pro", number: "المستوى ٣", color: "[--tier:#cb30e0] dark:[--tier:#db34f2]" },
};

export const TIER_ORDER: SalesTier[] = ["STARTER", "GROWTH", "PRO"];

/** Tinted capsule: dot in the tier hue, label in the text color. `compact` drops the English name. */
export function TierTag({ tier, compact = false, className }: { tier: SalesTier; compact?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-(--tier)/14 font-semibold whitespace-nowrap text-foreground/90",
        compact ? "h-6 px-2.5 text-[12px]" : "h-7 px-3 text-[13px]",
        TIER[tier].color,
        className,
      )}
    >
      <span aria-hidden className="size-2 rounded-full bg-(--tier)" />
      {compact ? TIER[tier].number : `${TIER[tier].number} — ${TIER[tier].name}`}
    </span>
  );
}
