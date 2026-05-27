import { cn } from "@/lib/utils";

type Props = {
  confidence: number;
  size?: "sm" | "md";
};

export function ConfidenceBadge({ confidence, size = "md" }: Props) {
  const pct = Math.round(confidence * 100);

  const { label, className } =
    pct >= 85
      ? { label: `ثقة ${pct}%`, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" }
      : pct >= 70
        ? { label: `ثقة ${pct}%`, className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" }
        : { label: `ثقة ${pct}%`, className: "bg-rose-500/10 text-rose-700 dark:text-rose-400" };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      {label}
    </span>
  );
}
