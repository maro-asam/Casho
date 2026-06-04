"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ReportPeriod } from "../_lib/types";

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: 7, label: "7 أيام" },
  { value: 30, label: "30 يوم" },
  { value: 90, label: "90 يوم" },
  { value: 365, label: "سنة" },
];

export function PeriodSelector({ current }: { current: ReportPeriod }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (period: ReportPeriod) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", String(period));
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
      {PERIODS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => handleChange(value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
            current === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
