import type { MonthlyTrend } from "@/lib/sales/queries";
import { fmtMoney, fmtMonthName, fmtNum } from "@/lib/sales/format";
import { cn } from "@/lib/utils";

/** Screen Time–style monthly bars: commissions per month, the current month tinted, a dashed average line. */
export function MonthBars({ trend }: { trend: MonthlyTrend }) {
  const total = trend.reduce((s, t) => s + t.commissions, 0);
  const average = total / Math.max(trend.length, 1);
  const max = Math.max(...trend.map((t) => t.commissions), 1);
  const lastIndex = trend.length - 1;

  return (
    <>
      <div className="relative h-44">
        {average > 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-(--sys-gray)/60"
            style={{ bottom: `${(average / max) * 100}%` }}
          />
        )}

        <ol className="flex h-full items-end gap-2 border-b-[0.5px] border-border sm:gap-3">
          {trend.map((t, i) => {
            const pct = t.commissions > 0 ? Math.max(4, (t.commissions / max) * 100) : 0;
            const label = `${fmtMonthName(t.month)}: ${fmtMoney(t.commissions)}، ${fmtNum(t.signups)} تسجيل، ${fmtNum(t.acquired)} دفعوا`;
            return (
              <li
                key={t.month}
                tabIndex={0}
                aria-label={label}
                className="group relative flex h-full flex-1 flex-col items-center justify-end rounded-t-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* Tooltip: hit target is the whole column, bigger than the mark. */}
                <div
                  role="tooltip"
                  className={cn(
                    "pointer-events-none absolute z-20 mb-1 w-max -translate-y-1 rounded-xl bg-popover px-3 py-2 text-start text-[12px] opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.12),0_0_0_0.5px_var(--border)] transition duration-200 ease-(--ease-apple) group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
                    // Columns near the trailing edge open inward so the card doesn't clip them.
                    i >= trend.length - 2 ? "end-0" : "start-0",
                  )}
                  style={{ bottom: `${Math.max(pct, 2)}%` }}
                >
                  <p className="font-semibold">{fmtMonthName(t.month)}</p>
                  <p className="tabular-nums">{fmtMoney(t.commissions)}</p>
                  <p className="text-muted-foreground tabular-nums">
                    {fmtNum(t.signups)} تسجيل · {fmtNum(t.acquired)} دفعوا
                  </p>
                </div>
                {pct > 0 ? (
                  <span
                    aria-hidden
                    className={cn(
                      "apple-grow-y block w-full max-w-10 rounded-t-[4px] transition-opacity group-hover:opacity-80",
                      i === lastIndex ? "bg-primary" : "bg-primary/40",
                    )}
                    style={{ height: `${pct}%`, animationDelay: `${i * 60}ms` }}
                  />
                ) : (
                  <span aria-hidden className="block h-[3px] w-full max-w-10 rounded-full bg-(--fill-3)" />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div aria-hidden className="mt-2 flex gap-2 sm:gap-3">
        {trend.map((t, i) => (
          <span
            key={t.month}
            className={cn("flex-1 truncate text-center text-[11px]", i === lastIndex ? "font-semibold text-foreground" : "text-muted-foreground")}
          >
            {fmtMonthName(t.month)}
          </span>
        ))}
      </div>
    </>
  );
}
