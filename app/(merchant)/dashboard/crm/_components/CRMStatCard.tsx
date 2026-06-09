import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label?: string };
  color?: "default" | "green" | "amber" | "red" | "blue" | "purple";
}

const colorMap = {
  default: "bg-primary/10 text-primary",
  green: "bg-emerald-500/10 text-emerald-500",
  amber: "bg-amber-500/10 text-amber-500",
  red: "bg-rose-500/10 text-rose-500",
  blue: "bg-blue-500/10 text-blue-500",
  purple: "bg-violet-500/10 text-violet-500",
};

export function CRMStatCard({ title, value, subtitle, icon: Icon, trend, color = "default" }: Props) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="mt-1.5 flex items-center gap-1">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.value > 0 ? "text-emerald-500" : trend.value < 0 ? "text-rose-500" : "text-muted-foreground"
                )}
              >
                {trend.value > 0 ? "+" : ""}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", colorMap[color])}>
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}
