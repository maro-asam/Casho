"use client";

import { Droplets, ImageIcon, Keyboard, Layers, LayoutGrid, Palette, Sparkles, Type } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useBuilder, type PanelId } from "./BuilderContext";

const GROUPS: { id: PanelId; icon: React.ElementType; label: string }[][] = [
  [
    { id: "sections", icon: Layers, label: "الأقسام" },
    { id: "identity", icon: ImageIcon, label: "الهوية" },
  ],
  [
    { id: "theme", icon: Palette, label: "الثيم" },
    { id: "colors", icon: Droplets, label: "الألوان" },
    { id: "fonts", icon: Type, label: "الخطوط" },
    { id: "layout", icon: LayoutGrid, label: "العرض" },
  ],
  [{ id: "growth", icon: Sparkles, label: "البيع" }],
];

const SHORTCUTS = [
  ["1", "موبايل"],
  ["2", "تابلت"],
  ["3", "كمبيوتر"],
  ["R", "تحديث المعاينة"],
];

export default function BuilderSidebar() {
  const { activePanel, setActivePanel } = useBuilder();

  return (
    <nav aria-label="أقسام المحرر" className="flex w-[4.5rem] shrink-0 flex-col items-center border-e border-border bg-muted/20 py-2">
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
            aria-label="اختصارات الكيبورد"
          >
            <Keyboard className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="left" align="end" className="w-56 p-3" dir="rtl">
          <p className="mb-2 text-xs font-semibold">اختصارات</p>
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
