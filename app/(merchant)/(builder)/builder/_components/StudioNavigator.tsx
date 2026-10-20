"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useBuilder, type PanelId } from "./BuilderContext";
import { SECTION_META, isSectionKey } from "./section-meta";
import HomePanel from "./panels/HomePanel";
import ThemePanel from "./panels/ThemePanel";
import ColorsPanel from "./panels/ColorsPanel";
import FontsPanel from "./panels/FontsPanel";
import LayoutPanel from "./panels/LayoutPanel";
import IdentityPanel from "./panels/IdentityPanel";
import SectionsPanel from "./panels/SectionsPanel";
import PopupsPanel from "./panels/PopupsPanel";
import WhatsAppPanel from "./panels/WhatsAppPanel";
import SocialProofPanel from "./panels/SocialProofPanel";
import { cn } from "@/lib/utils";
import { isRtl, tr } from "@/lib/i18n/dashboard";

const PANELS: Record<PanelId, React.ComponentType> = {
  home: HomePanel,
  theme: ThemePanel,
  colors: ColorsPanel,
  fonts: FontsPanel,
  layout: LayoutPanel,
  identity: IdentityPanel,
  sections: SectionsPanel,
  popups: PopupsPanel,
  whatsapp: WhatsAppPanel,
  "social-proof": SocialProofPanel,
};

export const PANEL_TITLES: Record<PanelId, string> = {
  get home() { return tr("تخصيص المتجر"); },
  get theme() { return tr("الثيم"); },
  get colors() { return tr("الألوان"); },
  get fonts() { return tr("الخط واللغة"); },
  get layout() { return tr("شكل العرض"); },
  get identity() { return tr("الهوية واللوجو"); },
  get sections() { return tr("أقسام الرئيسية"); },
  get popups() { return tr("النوافذ المنبثقة"); },
  get whatsapp() { return tr("زر واتساب"); },
  get "social-proof"() { return tr("إشعارات الشراء"); },
};

function screenTitle(panel: PanelId, section: string | null) {
  if (panel === "sections" && section === "library") return tr("إضافة قسم");
  if (panel === "sections" && isSectionKey(section)) return SECTION_META[section].label;
  return PANEL_TITLES[panel];
}

/**
 * The Studio's settings column: a navigation stack (home → panel → detail)
 * with iOS-style push/pop transitions and a large title per screen.
 */
/** `bottomInset`: leave room for the floating toolbar on phones. */
export default function StudioNavigator({ bottomInset = false }: { bottomInset?: boolean }) {
  const { panel, section, back, revision } = useBuilder();
  const reduceMotion = useReducedMotion();
  const depth = panel === "home" ? 0 : section ? 2 : 1;
  // Push vs. pop decides the slide direction.
  const [nav, setNav] = useState({ depth, forward: true });
  if (nav.depth !== depth) setNav({ depth, forward: depth > nav.depth });
  const forward = nav.depth !== depth ? depth > nav.depth : nav.forward;

  const Panel = PANELS[panel];
  const parentTitle = section ? PANEL_TITLES[panel] : PANEL_TITLES.home;
  // Pushed screens come from the trailing edge (the left in RTL).
  const offset = (forward ? 1 : -1) * (isRtl() ? -28 : 28);
  const key = `${panel}:${section ?? ""}:${revision}`;

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={key}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: offset }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -offset / 2 }}
          transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.8 }}
          className={cn("absolute inset-0 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]", bottomInset && "pb-24")}
        >
          <div className="px-4 pt-3 pb-2">
            {depth > 0 ? (
              <button
                type="button"
                onClick={back}
                className="apple-press -ms-2 mb-1 inline-flex h-8 items-center gap-0.5 rounded-full pe-2.5 ps-1 text-[15px] text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronRight className="size-5 ltr:-scale-x-100" strokeWidth={2.2} />
                {parentTitle}
              </button>
            ) : (
              <div className="h-1" />
            )}
            <h1 className="text-[28px] leading-[34px] font-bold ltr:tracking-[-0.02em]">{screenTitle(panel, section)}</h1>
          </div>
          <Panel />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
