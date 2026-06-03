"use client";

import { motion } from "framer-motion";
import { Layers, Palette, Droplets, LayoutGrid, Type, ImageIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useBuilder, type PanelId } from "./BuilderContext";

// ─── Panel nav items ──────────────────────────────────────────────────────────

const NAV_ITEMS: { id: PanelId; icon: React.ElementType; label: string }[] = [
  { id: "sections", icon: Layers,     label: "الأقسام" },
  { id: "theme",    icon: Palette,    label: "الثيم" },
  { id: "colors",   icon: Droplets,   label: "الألوان" },
  { id: "layout",   icon: LayoutGrid, label: "التصميم" },
  { id: "fonts",    icon: Type,       label: "الخطوط" },
  { id: "identity", icon: ImageIcon,  label: "الهوية" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function BuilderSidebar() {
  const { activePanel, setActivePanel } = useBuilder();

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r bg-muted/10 py-2">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = activePanel === id;
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActivePanel(id)}
                  className={cn(
                    "relative flex size-9 items-center justify-center rounded-lg transition-colors",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  aria-label={label}
                  aria-pressed={isActive}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-bg"
                      className="absolute inset-0 rounded-lg bg-primary"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
                    />
                  )}
                  <span className="relative z-10">
                    <Icon className="size-4" />
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={6}>
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
