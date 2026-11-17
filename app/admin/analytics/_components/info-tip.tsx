"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** "How is this calculated?" — a small ⓘ that opens the metric's definition. */
export function InfoTip({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`طريقة حساب ${title}`}
          className="apple-press -m-1.5 grid size-7 shrink-0 place-items-center rounded-full text-(--label-3) hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="size-[15px]" strokeWidth={2} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 rounded-2xl p-4 text-right text-[13px] leading-[19px]" dir="rtl">
        <p className="mb-1 text-[15px] font-semibold">{title}</p>
        <div className="space-y-1.5 text-muted-foreground">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
