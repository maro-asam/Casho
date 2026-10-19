"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Monitor } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useBuilder, type PanelId, type PreviewDevice } from "./BuilderContext";
import BuilderTopBar from "./BuilderTopBar";
import BuilderSidebar from "./BuilderSidebar";
import BuilderPreviewFrame from "./BuilderPreviewFrame";
import SectionsPanel from "./panels/SectionsPanel";
import ThemePanel from "./panels/ThemePanel";
import ColorsPanel from "./panels/ColorsPanel";
import LayoutPanel from "./panels/LayoutPanel";
import FontsPanel from "./panels/FontsPanel";
import IdentityPanel from "./panels/IdentityPanel";
import GrowthPanel from "./panels/GrowthPanel";
import { tdir, tr } from "@/lib/i18n/dashboard";

const PANELS: Record<PanelId, React.ComponentType> = {
  sections: SectionsPanel,
  theme: ThemePanel,
  colors: ColorsPanel,
  layout: LayoutPanel,
  fonts: FontsPanel,
  identity: IdentityPanel,
  growth: GrowthPanel,
};

const DEVICE_KEYS: Record<string, PreviewDevice> = { "1": "mobile", "2": "tablet", "3": "desktop" };

/** Keyboard: 1/2/3 switch device, R reloads — ignored while typing. */
function useShortcuts() {
  const { setPreviewDevice, reloadPreview } = useBuilder();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true], [role=combobox]")) return;
      if (DEVICE_KEYS[e.key]) setPreviewDevice(DEVICE_KEYS[e.key]);
      else if (e.key.toLowerCase() === "r" || e.key === "ق") reloadPreview();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPreviewDevice, reloadPreview]);
}

export default function BuilderShell() {
  const { activePanel } = useBuilder();
  const Panel = PANELS[activePanel];
  useShortcuts();

  return (
    <div className="flex h-screen flex-col overflow-hidden" dir={tdir()}>
      {/* ── Small screens ────────────────────────────────────────────────── */}
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center lg:hidden">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Monitor className="size-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{tr("المحرر محتاج شاشة أكبر")}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            {tr("افتحه من الكمبيوتر عشان تشوف المتجر والإعدادات جنب بعض. كل الإعدادات موجودة كمان في صفحة التخصيص.")}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/customization">{tr("صفحة التخصيص")}</Link>
        </Button>
      </div>

      {/* ── Editor ───────────────────────────────────────────────────────── */}
      <div className="hidden h-screen flex-col overflow-hidden lg:flex">
        <BuilderTopBar />
        <div className="flex min-h-0 flex-1">
          <BuilderSidebar />
          <div className="relative w-[22rem] shrink-0 overflow-hidden border-e border-border bg-background">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                className="absolute inset-0 overflow-y-auto"
              >
                <Panel />
              </motion.div>
            </AnimatePresence>
          </div>
          <BuilderPreviewFrame />
        </div>
      </div>
    </div>
  );
}
