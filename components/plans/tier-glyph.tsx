import { Building2, Rocket, Sprout, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Keyed by the internal plan key (SILVER / GOLD / PLATINUM stay the keys);
// the glyphs follow the plan names: Starter → Growth → Scale → Enterprise.
const TIERS: Record<string, { icon: typeof Sprout; bg: string }> = {
  SILVER: { icon: Sprout, bg: "bg-linear-to-br from-[#34c759] to-[#1f9e4a]" },
  GOLD: { icon: TrendingUp, bg: "bg-linear-to-br from-[#4d7cff] to-[#1447e6]" },
  PLATINUM: { icon: Rocket, bg: "bg-linear-to-br from-[#7d7aff] to-[#5e2bff]" },
  ENTERPRISE: { icon: Building2, bg: "bg-linear-to-br from-[#636366] to-[#1d1d1f]" },
};

/** App-icon style tile for a plan tier (squircle, white glyph on a tier gradient). */
export function TierGlyph({ tier, size = "md", className }: { tier?: string | null; size?: "sm" | "md" | "lg"; className?: string }) {
  const t = TIERS[tier ?? ""] ?? { icon: Sprout, bg: "bg-linear-to-br from-primary/80 to-primary" };
  const Icon = t.icon;
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]",
        t.bg,
        size === "sm" && "size-8 rounded-[9px]",
        size === "md" && "size-11 rounded-[12px]",
        size === "lg" && "size-16 rounded-[18px]",
        className,
      )}
    >
      <Icon className={cn(size === "sm" ? "size-4" : size === "md" ? "size-5.5" : "size-8")} strokeWidth={2} />
    </span>
  );
}
