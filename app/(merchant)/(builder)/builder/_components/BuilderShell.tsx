"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Eye, Hand, MousePointerClick, X } from "lucide-react";
import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { useBuilder, type PreviewDevice } from "./BuilderContext";
import BuilderTopBar, { PublishControl, SaveStatus } from "./BuilderTopBar";
import BuilderPreviewFrame from "./BuilderPreviewFrame";
import StudioNavigator from "./StudioNavigator";
import { PopupEditorDialog } from "./popups/popup-editor";
import { tdir, tr } from "@/lib/i18n/dashboard";

const DEVICE_KEYS: Record<string, PreviewDevice> = { "1": "mobile", "2": "tablet", "3": "desktop" };

/** ⌘/Ctrl+Z undo · ⌘/Ctrl+⇧Z (or Y) redo · 1/2/3 device · E edit/browse · R reload — ignored while typing. */
function useShortcuts() {
  const { setPreviewDevice, reloadPreview, undo, redo, status, editMode, setEditMode } = useBuilder();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true], [role=combobox], [role=dialog]")) return;
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        if (key === "z" && !e.shiftKey && status.canUndo) {
          e.preventDefault();
          void undo();
        } else if (((key === "z" && e.shiftKey) || key === "y") && status.canRedo) {
          e.preventDefault();
          void redo();
        }
        return;
      }
      if (e.altKey || e.metaKey || e.ctrlKey) return;
      if (DEVICE_KEYS[e.key]) setPreviewDevice(DEVICE_KEYS[e.key]);
      else if (key === "e" || key === "ث") setEditMode(!editMode);
      else if (key === "r" || key === "ق") reloadPreview();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPreviewDevice, reloadPreview, undo, redo, status.canUndo, status.canRedo, editMode, setEditMode]);
}

const DESKTOP = "(min-width: 1024px)";
/** One layout at a time — two would mount two canvases fighting over one iframe ref. */
function useIsDesktop() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(DESKTOP);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(DESKTOP).matches,
    () => true,
  );
}

/** Phone & small tablets: settings full screen; the store opens in a sheet. */
function CompactStudio() {
  const { panel, editMode, setEditMode } = useBuilder();
  const [previewOpen, setPreviewOpen] = useState(false);

  // Picking a section inside the preview opens its settings — close the sheet to show them.
  const [lastPanel, setLastPanel] = useState(panel);
  if (panel !== lastPanel) {
    setLastPanel(panel);
    if (previewOpen) setPreviewOpen(false);
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between gap-2 px-3 pt-[max(env(safe-area-inset-top),12px)] pb-1">
        <Link
          href="/dashboard"
          className="apple-press inline-flex h-9 items-center gap-0.5 rounded-full pe-3 ps-1.5 text-[15px] text-primary hover:bg-primary/8"
        >
          <ChevronRight className="size-5 ltr:-scale-x-100" strokeWidth={2.2} />
          {tr("لوحة التحكم")}
        </Link>
        <SaveStatus compact />
      </header>

      <StudioNavigator bottomInset />

      {/* Floating toolbar (Liquid Glass) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="apple-glass pointer-events-auto flex items-center gap-1.5 rounded-full p-1.5">
          <button type="button" className={cn(appleButton.tinted, "h-10 bg-transparent text-primary")} onClick={() => setPreviewOpen(true)}>
            <Eye className="size-4" />
            {tr("شوف المتجر")}
          </button>
          <PublishControl className="h-10" />
        </div>
      </div>

      <AnimatePresence>
        {previewOpen && (
          <motion.div
            key="preview"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            className="fixed inset-0 z-40 flex flex-col bg-background"
            dir={tdir()}
          >
            <div className="flex items-center justify-between gap-2 px-3 pt-[max(env(safe-area-inset-top),10px)] pb-2">
              <div className="flex rounded-full bg-(--sys-gray)/14 p-[3px]" role="radiogroup" aria-label={tr("وضع المعاينة")}>
                {(
                  [
                    [true, MousePointerClick, tr("تعديل")],
                    [false, Hand, tr("تصفّح")],
                  ] as const
                ).map(([on, Icon, label]) => (
                  <button
                    key={String(on)}
                    type="button"
                    role="radio"
                    aria-checked={editMode === on}
                    onClick={() => setEditMode(on)}
                    className={cn(
                      "flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px]",
                      editMode === on ? "bg-card font-semibold shadow-[0_3px_8px_rgba(0,0,0,0.12)]" : "text-foreground/60",
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-label={tr("اقفل المعاينة")}
                onClick={() => setPreviewOpen(false)}
                className="apple-press grid size-9 place-items-center rounded-full bg-(--sys-gray)/14"
              >
                <X className="size-[18px]" />
              </button>
            </div>
            <BuilderPreviewFrame fill />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BuilderShell() {
  const { editingPopup, storeId, coupons, theme } = useBuilder();
  const desktop = useIsDesktop();
  useShortcuts();

  return (
    <div className="apple-ui relative h-dvh overflow-hidden bg-background text-foreground" dir={tdir()}>
      {desktop ? (
        // ── Desktop: toolbar · settings column · canvas ───────────────────
        <div className="flex h-dvh flex-col">
          <BuilderTopBar />
          <div className="flex min-h-0 flex-1 gap-3 p-3">
            <aside className="flex w-[24rem] shrink-0 flex-col overflow-hidden rounded-[22px] bg-(--sys-gray)/8 ring-1 ring-black/3">
              <StudioNavigator />
            </aside>
            <BuilderPreviewFrame />
          </div>
        </div>
      ) : (
        <CompactStudio />
      )}

      {editingPopup && (
        <PopupEditorDialog
          key={editingPopup.id ?? "new"}
          storeId={storeId}
          popup={editingPopup}
          coupons={coupons}
          themeVars={{
            "--store-primary": theme.tokens.primary,
            "--store-primary-foreground": theme.tokens.primaryForeground,
            "--store-background": theme.tokens.background,
            "--store-card": theme.tokens.card,
            "--store-card-foreground": theme.tokens.cardForeground,
            "--store-muted": theme.tokens.muted,
            "--store-muted-foreground": theme.tokens.mutedForeground,
            "--store-border": theme.tokens.border,
            fontFamily: theme.fontFamily,
          }}
        />
      )}
    </div>
  );
}
