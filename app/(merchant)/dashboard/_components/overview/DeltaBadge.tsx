import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent } from "./format";

/**
 * Period-over-period change; `null` means there was nothing to compare with.
 * `invert` for metrics where going down is good (cancel rate, returns).
 */
export default function DeltaBadge({
  value,
  className,
  invert = false,
}: {
  value: number | null;
  className?: string;
  invert?: boolean;
}) {
  if (value === null) {
    return (
      <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground", className)}>
        <Minus className="size-3" />
        جديد
      </span>
    );
  }

  const rounded = Math.round(value * 10) / 10;
  const up = rounded > 0;
  const down = rounded < 0;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  const good = invert ? down : up;
  const bad = invert ? up : down;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        good && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        bad && "bg-rose-500/10 text-rose-700 dark:text-rose-400",
        !up && !down && "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="size-3" />
      {formatPercent(Math.abs(rounded))}
    </span>
  );
}
