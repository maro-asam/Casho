"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { appleButton } from "@/components/saas-page";
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
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label={tr("الفترة")} className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-(--sys-gray)/14 p-[3px] [scrollbar-width:none]">
        {RANGE_PRESETS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={preset === value}
            onClick={() => go({ range: value === "30d" ? undefined : value, from: undefined, to: undefined })}
            className={cn(
              "h-8 shrink-0 rounded-full px-3 text-[13px] transition-[background-color,box-shadow,color] duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              preset === value
                ? "bg-card font-semibold text-foreground shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]"
                : "text-foreground/70 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-pressed={preset === "custom"}
            className={cn(appleButton.tinted, "h-[38px] text-[13px]", preset === "custom" ? "bg-primary/12 font-semibold text-primary" : "bg-card")}
          >
            <CalendarRange className="size-4" />
            {tr("فترة مخصصة")}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="apple-form w-76 rounded-[22px] p-4" dir={tdir()}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!from || !to) return;
              setOpen(false);
              go({ range: "custom", from, to });
            }}
          >
            <p className="text-[17px] font-semibold">{tr("اختار الفترة")}</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 px-0.5 text-[12px] text-muted-foreground">
                {tr("من")}
                <Input type="date" value={from} max={to || todayKey} onChange={(e) => setFrom(e.target.value)} className="px-2.5 text-[13px]" required />
              </label>
              <label className="space-y-1 px-0.5 text-[12px] text-muted-foreground">
                {tr("إلى")}
                <Input type="date" value={to} min={from} max={todayKey} onChange={(e) => setTo(e.target.value)} className="px-2.5 text-[13px]" required />
              </label>
            </div>
            <p className="text-[12px] leading-[17px] text-muted-foreground">{tr("أقصى مدة سنة، والمقارنة بنفس عدد الأيام اللي قبلها.")}</p>
            <button type="submit" className={cn(appleButton.filled, "h-10 w-full")}>
              {tr("عرض")}
            </button>
          </form>
        </PopoverContent>
      </Popover>

      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label={tr("جاري التحميل")} />}
    </div>
  );
}
