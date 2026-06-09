import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  onClick?: () => void;
  href?: string;
}

export function InventoryStatCard({ title, value, subtext, icon: Icon, iconColor, onClick }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow",
        onClick && "cursor-pointer hover:shadow-md",
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
          {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
        </div>
        <div className={cn("rounded-lg p-2", iconColor ?? "bg-primary/10")}>
          <Icon className={cn("size-5", iconColor ? "text-white" : "text-primary")} />
        </div>
      </div>
    </div>
  );
}
