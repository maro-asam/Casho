"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { UpdateThemeAction } from "@/actions/settings/theme.actions";
import { STORE_THEMES, THEME_CATEGORY_LIST, type StoreThemeId } from "@/constants/store-themes";
import { filterThemesByCategory, type ThemeCategoryFilterValue } from "@/components/common/ThemeCategoryFilter";
import { cn } from "@/lib/utils";
import { useBuilder } from "../BuilderContext";
import { Group, PanelBody } from "../studio-ui";
import { THEME_PREVIEWS } from "../theme-previews";
import { tr } from "@/lib/i18n/dashboard";

export default function ThemePanel() {
  const { storeId, theme, save, undo } = useBuilder();
  const [category, setCategory] = useState<ThemeCategoryFilterValue>("all");
  const [applying, setApplying] = useState<StoreThemeId | null>(null);
  const active = theme.presetId as StoreThemeId;
  const all = Object.values(STORE_THEMES);
  const categories = THEME_CATEGORY_LIST.filter((c) => filterThemesByCategory(all, c.id).length > 0);
  const themes = filterThemesByCategory(all, category);

  async function apply(id: StoreThemeId) {
    if (id === active || applying) return;
    setApplying(id);
    const ok = await save(() => UpdateThemeAction({ storeId, themeId: id, target: "draft" }));
    setApplying(null);
    if (ok) {
      toast.success(tr("اتطبق ثيم {0} على المسودة", STORE_THEMES[id].name), {
        action: { label: tr("تراجع"), onClick: () => void undo() },
      });
    }
  }

  return (
    <PanelBody>
      <p className="-mt-1 px-1 text-[13px] leading-[18px] text-muted-foreground">
        {tr("الثيم بيحدد شكل متجرك كله. بتغيّره على المسودة، فجرّب براحتك — اللوجو والمنتجات والكلام اللي كتبته مش بيتغيّروا.")}
      </p>

      {categories.length > 1 && (
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
          <div role="tablist" aria-label={tr("نوع المتجر")} className="flex w-max gap-1.5">
            {[{ id: "all" as const, label: tr("الكل") }, ...categories].map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={category === c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "apple-press h-8 rounded-full px-3.5 text-[13px] transition-colors",
                  category === c.id ? "bg-foreground font-semibold text-background" : "bg-card text-foreground/75 hover:text-foreground",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Group plain>
        <div role="radiogroup" aria-label={tr("الثيمات")} className="grid grid-cols-1 gap-3">
          {themes.map((t) => {
            const isActive = t.id === active;
            const Preview = THEME_PREVIEWS[t.id];
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                disabled={applying !== null}
                onClick={() => apply(t.id)}
                className={cn(
                  "apple-press group relative overflow-hidden rounded-[18px] bg-card p-2.5 text-start transition-shadow duration-200 ease-(--ease-apple) focus-visible:outline-none disabled:opacity-70",
                  isActive ? "ring-2 ring-primary" : "ring-1 ring-transparent hover:ring-foreground/10 focus-visible:ring-primary/50",
                )}
              >
                <div className="pointer-events-none overflow-hidden rounded-[12px] [&>div]:rounded-[12px] [&>div]:border-0">
                  <Preview />
                </div>
                <div className="flex items-start justify-between gap-2 px-1.5 pt-2.5 pb-0.5">
                  <div className="min-w-0">
                    <p className="text-[15px] leading-5 font-semibold">{t.name}</p>
                    <p className="text-[12px] leading-[17px] text-muted-foreground">{t.description}</p>
                  </div>
                  {isActive ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[12px] font-medium text-primary">
                      <Check className="size-3" strokeWidth={3} />
                      {tr("الحالي")}
                    </span>
                  ) : applying === t.id ? (
                    <span className="shrink-0 text-[12px] text-muted-foreground">{tr("بيتطبّق…")}</span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-(--fill-3) px-2.5 py-0.5 text-[12px] text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      {tr("جرّبه")}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Group>
    </PanelBody>
  );
}
