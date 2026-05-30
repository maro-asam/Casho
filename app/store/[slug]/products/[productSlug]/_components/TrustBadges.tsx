import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BADGES = [
  {
    icon: ShieldCheck,
    label: "دفع آمن ومشفر",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    icon: Truck,
    label: "توصيل سريع",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    icon: RotateCcw,
    label: "استرداد مضمون",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    icon: Headphones,
    label: "دعم على مدار الساعة",
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30",
  },
];

type TrustBadgesProps = {
  className?: string;
  variant?: "grid" | "row";
};

export default function TrustBadges({
  className,
  variant = "grid",
}: TrustBadgesProps) {
  if (variant === "row") {
    return (
      <div className={cn("flex flex-wrap items-center gap-4", className)}>
        {BADGES.map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon className={cn("size-3.5 shrink-0", color)} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-2.5", className)}>
      {BADGES.map(({ icon: Icon, label, color, bg }) => (
        <div
          key={label}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3 py-2.5",
            bg,
          )}
        >
          <Icon className={cn("size-4 shrink-0", color)} />
          <span className="text-xs font-medium leading-snug">{label}</span>
        </div>
      ))}
    </div>
  );
}
