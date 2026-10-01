"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ConversionConfig } from "@/lib/conversion/conversion-config";
import type { StorefrontPopup } from "@/lib/popups/popup-config";
import type { SectionContentMap, ThemeLayout, ThemeSections } from "@/types/store-theme.types";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PanelId = "sections" | "theme" | "colors" | "layout" | "fonts" | "identity" | "growth";
export type PreviewDevice = "mobile" | "tablet" | "desktop";
export type SaveState = "idle" | "saved";

export type BuilderPopup = { id: string; name: string; isActive: boolean; popup: StorefrontPopup };

type BuilderStore = {
  storeId: string;
  storeSlug: string;
  storeName: string;
  currentThemeId: string;
  currentFontId: string;
  storeLanguage: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  currentLayout: ThemeLayout;
  currentSections: ThemeSections;
  sectionContent: SectionContentMap;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  announcementText: string | null;
  popups: BuilderPopup[];
  conversion: ConversionConfig;
  whatsappFallback: string | null;
  sampleProductSlug: string | null;
};

type BuilderContextType = BuilderStore & {
  activePanel: PanelId;
  setActivePanel: (panel: PanelId) => void;
  previewDevice: PreviewDevice;
  setPreviewDevice: (device: PreviewDevice) => void;
  /** Store-relative path shown in the canvas ("/", "/products", …). */
  previewPath: string;
  setPreviewPath: (path: string) => void;
  previewKey: number;
  /** Call after any successful save: refreshes server data + the canvas. */
  reloadPreview: () => void;
  saveState: SaveState;
  lastSavedAt: number | null;
  previewFrameRef: React.RefObject<HTMLIFrameElement | null>;
  sendThemeUpdate: (cssVars: Record<string, string>) => void;
  /** Open a popup inside the canvas (null closes it). */
  previewPopup: (popup: StorefrontPopup | null) => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const BuilderContext = createContext<BuilderContextType | null>(null);

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within BuilderProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

type ProviderProps = BuilderStore & { initialDevice?: PreviewDevice; children: ReactNode };

export function BuilderProvider({ children, initialDevice = "desktop", ...store }: ProviderProps) {
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<PanelId>("sections");
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>(initialDevice);
  const [previewPath, setPreviewPath] = useState("/");
  const [previewKey, setPreviewKey] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);

  const reloadPreview = useCallback(() => {
    setPreviewKey((k) => k + 1);
    setSaveState("saved");
    setLastSavedAt(Date.now());
    // Panels read their "current" values from server props — keep them fresh.
    router.refresh();
  }, [router]);

  const post = useCallback((message: unknown) => {
    try {
      previewFrameRef.current?.contentWindow?.postMessage(message, window.location.origin);
    } catch {
      // frame not ready — ignore
    }
  }, []);

  const sendThemeUpdate = useCallback((cssVars: Record<string, string>) => post({ type: "CASHO_THEME_UPDATE", cssVars }), [post]);
  const previewPopup = useCallback((popup: StorefrontPopup | null) => post({ type: "CASHO_PREVIEW_POPUP", popup }), [post]);

  return (
    <BuilderContext.Provider
      value={{
        ...store,
        activePanel,
        setActivePanel,
        previewDevice,
        setPreviewDevice,
        previewPath,
        setPreviewPath,
        previewKey,
        reloadPreview,
        saveState,
        lastSavedAt,
        previewFrameRef,
        sendThemeUpdate,
        previewPopup,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}
