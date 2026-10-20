import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent } from "./format";
import { tr } from "@/lib/i18n/dashboard";

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
      <span className={cn("inline-flex items-center gap-0.5 text-[13px] text-muted-foreground", className)}>
        <Minus className="size-3" />
        {tr("جديد")}
      </span>
    );
  }

  const rounded = Math.round(value * 10) / 10;
  const up = rounded > 0;
  const down = rounded < 0;
  const Icon = up ? ArrowUp : down ? ArrowDown : Minus;
  const good = invert ? down : up;
  const bad = invert ? up : down;

  // Color is paired with an arrow so the direction never relies on color alone.
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums",
        good && "bg-(--sys-green)/12 text-[#248a3d] dark:text-(--sys-green)",
        bad && "bg-(--sys-red)/12 text-[#d70015] dark:text-(--sys-red)",
        !up && !down && "bg-muted text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {formatPercent(Math.abs(rounded))}
    </span>
  );
}
