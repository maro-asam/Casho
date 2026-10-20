"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

/** Number input with the currency suffix. Product prices are entered in pounds. */
export function MoneyInput({ className, ...props }: Omit<ComponentProps<typeof Input>, "type">) {
  return (
    <div className="relative">
      <Input
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="0.00"
        className={cn("pe-12 tabular-nums", className)}
        {...props}
      />
      <span className="pointer-events-none absolute inset-e-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground">
        {tr("ج.م")}
      </span>
    </div>
  );
}
