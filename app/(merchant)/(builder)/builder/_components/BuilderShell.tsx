"use client";

import { AnimatePresence, motion } from "framer-motion";
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
  );
}
