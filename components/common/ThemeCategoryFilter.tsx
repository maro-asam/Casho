"use client";

import {
  THEME_CATEGORY_LIST,
  type StoreTheme,
  type ThemeCategoryId,
} from "@/constants/store-themes";
import { cn } from "@/lib/utils";

export type ThemeCategoryFilterValue = ThemeCategoryId | "all";

export function filterThemesByCategory<T extends Pick<StoreTheme, "categories">>(
  themes: T[],
  category: ThemeCategoryFilterValue,
): T[] {
  if (category === "all") return themes;
  return themes.filter((theme) => theme.categories.includes(category));
}

type ThemeCategoryFilterProps = {
  themes: Pick<StoreTheme, "categories">[];
  value: ThemeCategoryFilterValue;
  onChange: (value: ThemeCategoryFilterValue) => void;
  compact?: boolean;
};

export default function ThemeCategoryFilter({
  themes,
  value,
  onChange,
  compact,
}: ThemeCategoryFilterProps) {
  const options = [
    { id: "all" as const, label: "الكل", count: themes.length },
    ...THEME_CATEGORY_LIST.map((category) => ({
      id: category.id,
      label: category.label,
      count: filterThemesByCategory(themes, category.id).length,
    })).filter((option) => option.count > 0),
  ];

  // Nothing to filter until there are at least two themes to choose between.
  if (themes.length < 2) return null;

  return (
    <div className={cn("flex flex-wrap", compact ? "gap-1" : "gap-1.5")} role="tablist">
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors",
              compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {option.label}
            <span
              className={cn(
                "tabular-nums",
                isActive ? "text-primary-foreground/70" : "text-muted-foreground/70",
              )}
            >
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
