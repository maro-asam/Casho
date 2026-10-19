"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { RANGE_PRESETS, type RangePreset } from "../_lib/range";
import { tdir, tr } from "@/lib/i18n/dashboard";

type Props = { preset: RangePreset; fromKey: string; toKey: string; todayKey: string };

export function RangePicker({ preset, fromKey, toKey, todayKey }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(fromKey);
  const [to, setTo] = useState(toKey);

  const go = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("period"); // legacy param
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label={tr("الفترة")} className="flex items-center gap-0.5 overflow-x-auto rounded-lg border border-border bg-muted/40 p-0.5">
        {RANGE_PRESETS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={preset === value}
            onClick={() => go({ range: value === "30d" ? undefined : value, from: undefined, to: undefined })}
            className={cn(
              "shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              preset === value ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant={preset === "custom" ? "secondary" : "outline"} size="sm" className="h-8 gap-1.5 text-xs">
            <CalendarRange className="size-3.5" />
            {tr("فترة مخصصة")}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72" dir={tdir()}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!from || !to) return;
              setOpen(false);
              go({ range: "custom", from, to });
            }}
          >
            <p className="text-sm font-semibold">{tr("اختار الفترة")}</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-xs text-muted-foreground">
                {tr("من")}
                <Input type="date" value={from} max={to || todayKey} onChange={(e) => setFrom(e.target.value)} className="h-9" required />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                {tr("إلى")}
                <Input type="date" value={to} min={from} max={todayKey} onChange={(e) => setTo(e.target.value)} className="h-9" required />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">{tr("أقصى مدة سنة، والمقارنة بنفس عدد الأيام اللي قبلها.")}</p>
            <Button type="submit" size="sm" className="w-full">
              {tr("عرض")}
            </Button>
          </form>
        </PopoverContent>
      </Popover>

      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label={tr("جاري التحميل")} />}
    </div>
  );
}
