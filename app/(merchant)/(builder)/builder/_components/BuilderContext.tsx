"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import type { ThemeLayout, ThemeSections, SectionContentMap } from "@/types/store-theme.types";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PanelId = "sections" | "theme" | "colors" | "layout" | "fonts" | "identity";
export type PreviewDevice = "mobile" | "tablet" | "desktop";

type BuilderStore = {
  storeId: string;
  storeSlug: string;
  currentThemeId: string;
  currentFontId: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  currentLayout: ThemeLayout;
  currentSections: ThemeSections;
  sectionContent: SectionContentMap;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  announcementText: string | null;
};

type BuilderContextType = BuilderStore & {
  activePanel: PanelId;
  setActivePanel: (panel: PanelId) => void;
  previewDevice: PreviewDevice;
  setPreviewDevice: (device: PreviewDevice) => void;
  previewKey: number;
  reloadPreview: () => void;
  previewFrameRef: React.RefObject<HTMLIFrameElement | null>;
  sendThemeUpdate: (cssVars: Record<string, string>) => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const BuilderContext = createContext<BuilderContextType | null>(null);

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within BuilderProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

type ProviderProps = BuilderStore & { children: ReactNode };

export function BuilderProvider({ children, ...store }: ProviderProps) {
  const [activePanel, setActivePanel] = useState<PanelId>("sections");
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [previewKey, setPreviewKey] = useState(0);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);

  const reloadPreview = useCallback(() => {
    setPreviewKey((k) => k + 1);
  }, []);

  const sendThemeUpdate = useCallback((cssVars: Record<string, string>) => {
    try {
      previewFrameRef.current?.contentWindow?.postMessage(
        { type: "CASHO_THEME_UPDATE", cssVars },
        "*",
      );
    } catch {
      // cross-origin — silently ignore
    }
  }, []);

  return (
    <BuilderContext.Provider
      value={{
        ...store,
        activePanel,
        setActivePanel,
        previewDevice,
        setPreviewDevice,
        previewKey,
        reloadPreview,
        previewFrameRef,
        sendThemeUpdate,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}
