"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Tablet, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuilder, type PreviewDevice } from "./BuilderContext";

// ─── Device specs ─────────────────────────────────────────────────────────────

const DEVICE_SPECS: Record<
  PreviewDevice,
  { width: number | null; height: number | null; label: string; icon: React.ElementType }
> = {
  mobile: {
    width: 390,
    height: 844,
    label: "iPhone 15 Pro — 390×844",
    icon: Smartphone,
  },
  tablet: {
    width: 768,
    height: 1024,
    label: "iPad — 768×1024",
    icon: Tablet,
  },
  desktop: {
    width: null,
    height: null,
    label: "Desktop",
    icon: Monitor,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BuilderPreviewFrame() {
  const { storeSlug, previewDevice, previewKey, previewFrameRef } = useBuilder();
  const spec = DEVICE_SPECS[previewDevice];
  const DeviceIcon = spec.icon;
  const previewUrl = `/store/${storeSlug}`;

  const isDesktop = previewDevice === "desktop";
  const isMobile = previewDevice === "mobile";
  const isTablet = previewDevice === "tablet";

  return (
    <div className="relative flex flex-1 flex-col items-center overflow-auto bg-neutral-100 dark:bg-neutral-900 p-3 pb-6 gap-3">
      {/* ── Device label ──────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-2 pt-1">
        <DeviceIcon className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{spec.label}</span>
      </div>

      {/* ── Device frame ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={previewDevice}
          initial={{ opacity: 0, scale: 0.96, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "overflow-hidden shadow-2xl",
            isMobile && "rounded-[2.5rem] ring-[8px] ring-neutral-800 dark:ring-neutral-700",
            isTablet && "rounded-[1.75rem] ring-4 ring-neutral-300 dark:ring-neutral-600",
            isDesktop && "rounded-xl ring-1 ring-border w-full max-w-full",
          )}
          style={spec.width ? { width: spec.width, maxWidth: "100%" } : { width: "100%" }}
        >
          {/* Mobile notch bar */}
          {isMobile && (
            <div className="flex h-8 items-center justify-center bg-neutral-800 dark:bg-neutral-700">
              <div className="h-4 w-24 rounded-full bg-neutral-900 dark:bg-neutral-800" />
            </div>
          )}

          {/* Tablet camera bar */}
          {isTablet && (
            <div className="flex h-6 items-center justify-center bg-neutral-300 dark:bg-neutral-600">
              <div className="size-2 rounded-full bg-neutral-400 dark:bg-neutral-700" />
            </div>
          )}

          {/* Desktop browser chrome */}
          {isDesktop && (
            <div className="flex h-9 items-center gap-2 border-b bg-muted/60 px-3">
              <div className="flex gap-1.5">
                <div className="size-2.5 rounded-full bg-red-400/60" />
                <div className="size-2.5 rounded-full bg-yellow-400/60" />
                <div className="size-2.5 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 rounded-md bg-background/70 h-5 px-2 flex items-center">
                <span className="text-[10px] text-muted-foreground truncate">
                  {storeSlug}.casho.store
                </span>
              </div>
            </div>
          )}

          {/* The actual iframe */}
          <iframe
            ref={previewFrameRef}
            key={previewKey}
            src={previewUrl}
            className={cn(
              "w-full border-0 bg-white",
              isMobile && "h-[780px]",
              isTablet && "h-[980px]",
              isDesktop && "min-h-[800px]",
            )}
            style={isDesktop ? { height: "calc(100vh - 12rem)" } : undefined}
            title="معاينة المتجر"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
