"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Monitor } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useBuilder, type PanelId } from "./BuilderContext";
import BuilderTopBar from "./BuilderTopBar";
import BuilderSidebar from "./BuilderSidebar";
import BuilderPreviewFrame from "./BuilderPreviewFrame";
import SectionsPanel from "./panels/SectionsPanel";
import ThemePanel from "./panels/ThemePanel";
import ColorsPanel from "./panels/ColorsPanel";
import LayoutPanel from "./panels/LayoutPanel";
import FontsPanel from "./panels/FontsPanel";
import IdentityPanel from "./panels/IdentityPanel";

// ─── Panel registry ───────────────────────────────────────────────────────────

const PANELS: Record<PanelId, React.ComponentType> = {
  sections: SectionsPanel,
  theme: ThemePanel,
  colors: ColorsPanel,
  layout: LayoutPanel,
  fonts: FontsPanel,
  identity: IdentityPanel,
};

// ─── Shell ─────────────────────────────────────────────────────────────────────

export default function BuilderShell() {
  const { activePanel } = useBuilder();
  const Panel = PANELS[activePanel];

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* ── Mobile block ─────────────────────────────────────────────────── */}
      <div className="flex lg:hidden h-screen flex-col items-center justify-center gap-6 p-8 text-center bg-background" dir="rtl">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Monitor className="size-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">يتطلب شاشة أكبر</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            محرر المتجر المرئي مخصص للاستخدام على الحاسوب. يرجى فتحه من جهاز حاسوب للحصول على أفضل تجربة.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/customization">العودة للتخصيص</Link>
        </Button>
      </div>

      {/* ── Desktop builder ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex h-screen flex-col overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <BuilderTopBar />

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Icon activity bar */}
        <BuilderSidebar />

        {/* Active control panel */}
        <div className="relative w-[340px] shrink-0 overflow-hidden border-r bg-background">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              className="absolute inset-0 overflow-y-auto"
            >
              <Panel />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Preview canvas */}
        <BuilderPreviewFrame />
      </div>
      </div>
    </div>
  );
}
