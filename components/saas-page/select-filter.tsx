"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { tdir } from "@/lib/i18n/dashboard";

const ALL = "__all";

type SelectFilterProps = {
  /** Search param to write, e.g. "source". */
  param: string;
  /** Shown when no value is selected, e.g. "كل القنوات". */
  allLabel: string;
  options: { value: string; label: string }[];
  label: string;
  className?: string;
};

/** Secondary filter kept in the URL. Use FilterTabs for the main segmentation. */
export function SelectFilter({ param, allLabel, options, label, className }: SelectFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const current = searchParams.get(param) ?? ALL;

  function onChange(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === ALL) next.delete(param);
    else next.set(param, value);
    next.delete("page");
    const query = next.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  return (
    <Select value={current} onValueChange={onChange} dir={tdir()} disabled={pending}>
      <SelectTrigger aria-label={label} className={cn("h-9 w-full rounded-lg sm:w-44", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
