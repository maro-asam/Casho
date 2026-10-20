import { Gem, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const TIERS: Record<string, { icon: typeof Sparkles; bg: string }> = {
  SILVER: { icon: ShieldCheck, bg: "bg-linear-to-br from-[#a1a1a6] to-[#6e6e73]" },
  GOLD: { icon: Sparkles, bg: "bg-linear-to-br from-[#ffb340] to-[#ff7a00]" },
  PLATINUM: { icon: Gem, bg: "bg-linear-to-br from-[#7d7aff] to-[#5e2bff]" },
};

/** App-icon style tile for a plan tier (squircle, white glyph on a tier gradient). */
export function TierGlyph({ tier, size = "md", className }: { tier?: string | null; size?: "sm" | "md" | "lg"; className?: string }) {
  const t = TIERS[tier ?? ""] ?? { icon: ShieldCheck, bg: "bg-linear-to-br from-primary/80 to-primary" };
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
