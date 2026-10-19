"use client";

import { Droplets, ImageIcon, Keyboard, Layers, LayoutGrid, Palette, Sparkles, Type } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useBuilder, type PanelId } from "./BuilderContext";
import { isRtl, lazyList, tdir, tr } from "@/lib/i18n/dashboard";

const GROUPS: { id: PanelId; icon: React.ElementType; label: string }[][] = [
  [
    { id: "sections", icon: Layers, get label() { return tr("الأقسام"); } },
    { id: "identity", icon: ImageIcon, get label() { return tr("الهوية"); } },
  ],
  [
    { id: "theme", icon: Palette, get label() { return tr("الثيم"); } },
    { id: "colors", icon: Droplets, get label() { return tr("الألوان"); } },
    { id: "fonts", icon: Type, get label() { return tr("الخطوط"); } },
    { id: "layout", icon: LayoutGrid, get label() { return tr("العرض"); } },
  ],
  [{ id: "growth", icon: Sparkles, get label() { return tr("البيع"); } }],
];

const SHORTCUTS = [
  lazyList(["1", "موبايل"]),
  lazyList(["2", "تابلت"]),
  lazyList(["3", "كمبيوتر"]),
  lazyList(["R", "تحديث المعاينة"]),
];

export default function BuilderSidebar() {
  const { activePanel, setActivePanel } = useBuilder();

  return (
    <nav aria-label={tr("أقسام المحرر")} className="flex w-[4.5rem] shrink-0 flex-col items-center border-e border-border bg-muted/20 py-2">
      <div className="flex flex-1 flex-col items-center gap-3">
        {GROUPS.map((group, gi) => (
          <div key={gi} className={cn("flex flex-col gap-1", gi > 0 && "border-t border-border pt-3")}>
            {group.map(({ id, icon: Icon, label }) => {
              const active = activePanel === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActivePanel(id)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-14 flex-col items-center gap-1 rounded-lg py-2 text-[10px] transition-colors",
                    active ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-[1.125rem]" />
                  {label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={tr("اختصارات الكيبورد")}
          >
            <Keyboard className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent side={isRtl() ? "left" : "right"} align="end" className="w-56 p-3" dir={tdir()}>
          <p className="mb-2 text-xs font-semibold">{tr("اختصارات")}</p>
          <ul className="space-y-1.5">
            {SHORTCUTS.map(([key, label]) => (
              <li key={key} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">{key}</kbd>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </nav>
  );
}
