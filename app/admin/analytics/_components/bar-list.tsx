import type { ReactNode } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Unavailable } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { fmtNum, fmtPct } from "../_lib/format";

export type BarItem = {
  key: string;
  label: ReactNode;
  value: number;
  /** Small trailing text after the value (rate, revenue…). */
  extra?: ReactNode;
  href?: string;
};

/**
 * Ranked horizontal bars: the label sits on a thin share bar, value + share at
 * the end. One hue (magnitude), text in text colors, sorted by value.
 */
export function BarList({
  items,
  total,
  valueLabel,
  empty = "مفيش بيانات للفترة دي",
  max = 10,
}: {
  items: BarItem[];
  /** Denominator for the share (defaults to the sum). */
  total?: number;
  valueLabel: string;
  empty?: string;
  max?: number;
}) {
  if (!items.length) return <Unavailable icon={BarChart3} title={empty} className="py-10" />;
  const shown = items.slice(0, max);
  const sum = total ?? items.reduce((s, i) => s + i.value, 0);
  const top = Math.max(...shown.map((i) => i.value), 1);
  return (
    <ol className="space-y-1 px-3 pb-3" aria-label={valueLabel}>
      {shown.map((item) => {
        const body = (
          <>
            <span
              aria-hidden
              className="absolute inset-y-1 start-0 rounded-[8px] bg-(--viz-1)/12 transition-[width] duration-500 ease-(--ease-apple)"
              style={{ width: `${Math.max(2, (item.value / top) * 100)}%` }}
            />
            <span className="relative min-w-0 flex-1 truncate">{item.label}</span>
            <span className="relative flex shrink-0 items-baseline gap-2 tabular-nums">
              {item.extra && <span className="text-[12px] text-muted-foreground">{item.extra}</span>}
              <span className="font-semibold">{fmtNum(item.value)}</span>
              <span className="w-10 text-end text-[12px] text-muted-foreground">{fmtPct(sum ? item.value / sum : null)}</span>
            </span>
          </>
        );
        const row = "relative flex min-h-10 items-center gap-3 rounded-[10px] px-2.5 text-[14px]";
        return (
          <li key={item.key}>
            {item.href ? (
              <Link href={item.href} className={cn(row, "apple-press hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}>
                {body}
              </Link>
            ) : (
              <div className={row}>{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
