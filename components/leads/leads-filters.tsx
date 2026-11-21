"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, SlidersHorizontal } from "lucide-react";
import { SearchInput, SelectFilter } from "@/components/saas-page";
import { LEAD_SOURCES, PRIORITIES, PRIORITY_META, SOURCE_LABELS } from "@/lib/leads/constants";
import { cn } from "@/lib/utils";

const FOLLOW_UP_OPTIONS = [
  { value: "overdue", label: "متابعة متأخرة" },
  { value: "today", label: "متابعة النهارده" },
  { value: "week", label: "متابعة خلال أسبوع" },
  { value: "none", label: "من غير متابعة" },
];

function DateRange() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  function set(key: "from" | "to", value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }
  const input = "h-9 rounded-lg border-0 bg-(--fill-3) px-2.5 text-[13px] tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className={cn("flex items-center gap-1.5", pending && "opacity-60")}>
      <CalendarRange className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <label className="sr-only" htmlFor="lead-from">
        اتضاف من
      </label>
      <input id="lead-from" type="date" dir="ltr" defaultValue={params.get("from") ?? ""} onChange={(e) => set("from", e.target.value)} className={input} />
      <span className="text-[13px] text-muted-foreground">لـ</span>
      <label className="sr-only" htmlFor="lead-to">
        اتضاف لحد
      </label>
      <input id="lead-to" type="date" dir="ltr" defaultValue={params.get("to") ?? ""} onChange={(e) => set("to", e.target.value)} className={input} />
    </div>
  );
}

/** The list toolbar: search always visible, the rest behind "فلاتر" on phones. */
export function LeadFiltersBar({
  mode,
  reps = [],
  categories = [],
  cities = [],
}: {
  mode: "admin" | "rep";
  reps?: { id: string; label: string }[];
  categories?: string[];
  cities?: string[];
}) {
  const params = useSearchParams();
  const active = ["rep", "category", "city", "source", "priority", "followUp", "from", "to"].filter((k) => params.get(k)).length;
  const [open, setOpen] = useState(active > 0);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2">
        <SearchInput placeholder="ابحث بالاسم أو الموبايل أو الإيميل" className="flex-1" />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={cn("inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[14px]", open || active ? "bg-primary/10 text-primary" : "bg-(--fill-3) text-foreground/80")}
        >
          <SlidersHorizontal className="size-4" />
          فلاتر
          {active > 0 && <span className="tabular-nums">({new Intl.NumberFormat("ar-EG").format(active)})</span>}
        </button>
      </div>
      {open && (
        <div className="flex flex-wrap items-center gap-2">
          {mode === "admin" && (
            <SelectFilter
              param="rep"
              allLabel="كل المندوبين"
              label="المندوب"
              options={[{ value: "none", label: "مش متسند" }, { value: "inactive", label: "مع مندوب موقوف" }, ...reps.map((r) => ({ value: r.id, label: r.label }))]}
            />
          )}
          <SelectFilter param="priority" allLabel="كل الأولويات" label="الأولوية" options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label }))} />
          <SelectFilter param="followUp" allLabel="كل المتابعات" label="المتابعة" options={FOLLOW_UP_OPTIONS} />
          {mode === "admin" && (
            <>
              <SelectFilter param="source" allLabel="كل المصادر" label="المصدر" options={LEAD_SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))} />
              {categories.length > 0 && <SelectFilter param="category" allLabel="كل المجالات" label="المجال" options={categories.map((c) => ({ value: c, label: c }))} />}
              {cities.length > 0 && <SelectFilter param="city" allLabel="كل المدن" label="المدينة" options={cities.map((c) => ({ value: c, label: c }))} />}
              <DateRange />
            </>
          )}
        </div>
      )}
    </div>
  );
}
