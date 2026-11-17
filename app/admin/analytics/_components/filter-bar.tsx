"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Check, ChevronDown, Download, Monitor, Store as StoreIcon } from "lucide-react";

import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { appleMenu } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { DEVICE_OPTIONS, RANGE_OPTIONS, SCOPE_OPTIONS } from "@/lib/analytics/filters";

export type StoreOption = { id: string; name: string; slug: string };

const pill =
  "apple-press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 text-[14px] text-foreground shadow-[0_0_0_0.5px_var(--border)] hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

const COMPARE = [
  { value: "previous", label: "الفترة اللي قبلها" },
  { value: "year", label: "نفس الفترة السنة اللي فاتت" },
  { value: "none", label: "من غير مقارنة" },
];

/**
 * The view's filters, all in the URL (linkable, back-button friendly): date
 * range (+ custom), comparison, scope (Casho site / dashboard / storefronts
 * / all, or one store), device. `exportReport` adds CSV / Excel downloads.
 */
export function FilterBar({
  stores,
  rangeLabel,
  exportReport,
  hideScope = false,
  hideDevice = false,
  live = false,
}: {
  stores: StoreOption[];
  rangeLabel: string;
  exportReport?: string;
  hideScope?: boolean;
  /** Real-time view: no date range or comparison. */
  live?: boolean;
  /** Heatmaps pick their layout themselves. */
  hideDevice?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [customOpen, setCustomOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);

  const range = params.get("range") ?? "30d";
  const compare = params.get("compare") ?? "previous";
  const store = params.get("store");
  const scope = store ? "storefront" : (params.get("scope") ?? "marketing");
  const device = params.get("device") ?? "all";
  const storeName = stores.find((s) => s.id === store)?.name;

  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");

  function apply(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  const rangeText = range === "custom" ? rangeLabel : (RANGE_OPTIONS.find((r) => r.value === range)?.label ?? "آخر ٣٠ يوم");
  const exportHref = (format: "csv" | "xlsx") => {
    const p = new URLSearchParams(params.toString());
    p.set("report", exportReport ?? "overview");
    p.set("format", format);
    return `/api/admin/analytics/export?${p.toString()}`;
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2 transition-opacity", pending && "opacity-60")} aria-busy={pending}>
      {!live && (
      <>
      {/* Date range (the custom-range popover anchors on the same pill) */}
      <Popover open={customOpen} onOpenChange={setCustomOpen}>
      <PopoverAnchor asChild>
      <span className="inline-flex">
      <DropdownMenu>
        <DropdownMenuTrigger className={pill}>
          <CalendarDays className="size-4 text-muted-foreground" />
          {rangeText}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={appleMenu} dir="rtl">
          <DropdownMenuRadioGroup value={range} onValueChange={(v) => apply({ range: v === "30d" ? null : v, from: null, to: null })}>
            {RANGE_OPTIONS.map((r) => (
              <DropdownMenuRadioItem key={r.value} value={r.value}>
                {r.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCustomOpen(true)}>فترة مخصصة…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </span>
      </PopoverAnchor>
        <PopoverContent align="start" className="w-72 rounded-2xl p-4" dir="rtl">
          <form
            className="apple-form space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!from || !to) return;
              setCustomOpen(false);
              apply({ range: "custom", from, to });
            }}
          >
            <p className="text-[15px] font-semibold">فترة مخصصة</p>
            <label className="block space-y-1 text-[13px] text-muted-foreground">
              من
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required className="apple-field block h-11 w-full px-3 text-foreground" />
            </label>
            <label className="block space-y-1 text-[13px] text-muted-foreground">
              إلى
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} required className="apple-field block h-11 w-full px-3 text-foreground" />
            </label>
            <button type="submit" className="apple-press h-10 w-full rounded-full bg-primary text-[15px] font-semibold text-primary-foreground">
              عرض
            </button>
          </form>
        </PopoverContent>
      </Popover>

      {/* Comparison */}
      <DropdownMenu>
        <DropdownMenuTrigger className={pill}>
          <span className="text-muted-foreground">مقارنة:</span>
          {COMPARE.find((c) => c.value === compare)?.label}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={appleMenu} dir="rtl">
          <DropdownMenuRadioGroup value={compare} onValueChange={(v) => apply({ compare: v === "previous" ? null : v })}>
            {COMPARE.map((c) => (
              <DropdownMenuRadioItem key={c.value} value={c.value}>
                {c.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      </>
      )}

      {!hideScope && (
        <>
          {/* Scope */}
          <DropdownMenu>
            <DropdownMenuTrigger className={pill}>
              {store ? "متجر واحد" : SCOPE_OPTIONS.find((s) => s.value === scope)?.label}
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={cn(appleMenu, "w-64")} dir="rtl">
              <DropdownMenuLabel className="text-[12px] font-normal text-muted-foreground">أنهي جزء من كاشو؟</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={store ? "store" : scope} onValueChange={(v) => apply({ scope: v === "marketing" ? null : v, store: null })}>
                {SCOPE_OPTIONS.map((s) => (
                  <DropdownMenuRadioItem key={s.value} value={s.value} className="h-auto! py-1.5">
                    <span className="flex flex-col">
                      <span>{s.label}</span>
                      <span className="text-[12px] text-muted-foreground">{s.hint}</span>
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* One store */}
          {scope === "storefront" && (
            <Popover open={storeOpen} onOpenChange={setStoreOpen}>
              <PopoverTrigger className={pill}>
                <StoreIcon className="size-4 text-muted-foreground" />
                <span className="max-w-40 truncate">{storeName ?? "كل المتاجر"}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 overflow-hidden rounded-2xl p-0" dir="rtl">
                <Command>
                  <CommandInput placeholder="ابحث باسم المتجر أو الرابط…" />
                  <CommandList className="max-h-72">
                    <CommandEmpty>مفيش متجر بالاسم ده</CommandEmpty>
                    <CommandItem
                      value="__all"
                      onSelect={() => {
                        setStoreOpen(false);
                        apply({ store: null, scope: "storefront" });
                      }}
                    >
                      <Check className={cn("size-4", store ? "opacity-0" : "opacity-100")} />
                      كل المتاجر
                    </CommandItem>
                    {stores.map((s) => (
                      <CommandItem
                        key={s.id}
                        value={`${s.name} ${s.slug}`}
                        onSelect={() => {
                          setStoreOpen(false);
                          apply({ store: s.id, scope: null });
                        }}
                      >
                        <Check className={cn("size-4", store === s.id ? "opacity-100" : "opacity-0")} />
                        <span className="min-w-0 flex-1 truncate">{s.name}</span>
                        <span className="text-[12px] text-muted-foreground" dir="ltr">
                          {s.slug}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </>
      )}

      {/* Device */}
      {!hideDevice && (
      <DropdownMenu>
        <DropdownMenuTrigger className={pill}>
          <Monitor className="size-4 text-muted-foreground" />
          {DEVICE_OPTIONS.find((d) => d.value === device)?.label}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={appleMenu} dir="rtl">
          <DropdownMenuRadioGroup value={device} onValueChange={(v) => apply({ device: v === "all" ? null : v })}>
            {DEVICE_OPTIONS.map((d) => (
              <DropdownMenuRadioItem key={d.value} value={d.value}>
                {d.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      )}

      {exportReport && (
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(pill, "ms-auto")}>
            <Download className="size-4 text-muted-foreground" />
            تصدير
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={appleMenu} dir="rtl">
            <DropdownMenuItem asChild>
              <a href={exportHref("csv")} download>
                ملف CSV
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={exportHref("xlsx")} download>
                ملف Excel
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
