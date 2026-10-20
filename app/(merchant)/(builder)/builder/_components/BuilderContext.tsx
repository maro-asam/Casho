"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { ConversionConfig, RecentPurchase } from "@/lib/conversion/conversion-config";
import type { StorefrontPopup } from "@/lib/popups/popup-config";
import type { Appearance, StudioStatus } from "@/lib/studio/appearance";
import type { SectionContentMap, ThemeLayout, ThemePresetId, ThemeSections, ThemeTokens } from "@/types/store-theme.types";
import { DiscardStudioDraftAction, PublishStudioDraftAction, StepStudioHistoryAction } from "@/actions/studio/studio.actions";
import type { EditorCoupon, EditorPopup } from "./popups/popup-editor";
import { isPanelId, type PanelId } from "./panel-ids";
import { regionLabel, regionTarget } from "./section-meta";
import { tr, trv } from "@/lib/i18n/dashboard";

// ─── Types ─────────────────────────────────────────────────────────────────────

export { PANEL_IDS, isPanelId, type PanelId } from "./panel-ids";

export type PreviewDevice = "mobile" | "tablet" | "desktop";

export type StudioPopup = {
  id: string;
  name: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  views: number;
  conversions: number;
  popup: StorefrontPopup;
};

/** A step on the "make your store better" list: opens a panel or another page. */
export type ReadinessItem = {
  id: string;
  label: string;
  hint: string;
  done: boolean;
  weight: number;
  panel?: PanelId;
  href?: string;
};

export type StudioTheme = {
  presetId: ThemePresetId;
  presetName: string;
  presetTokens: { primary: string; secondary: string };
  tokens: ThemeTokens;
  layout: ThemeLayout;
  sections: ThemeSections;
  sectionContent: SectionContentMap;
  fontName: string;
  fontFamily: string;
};

type StudioData = {
  storeId: string;
  storeSlug: string;
  storeName: string;
  storeHost: string;
  /** What the Studio is editing: the draft if there is one, else the live store. */
  appearance: Appearance;
  theme: StudioTheme;
  status: StudioStatus;
  popups: StudioPopup[];
  conversion: ConversionConfig;
  whatsappFallback: string | null;
  sampleProductSlug: string | null;
  readiness: ReadinessItem[];
  socialProof: { sample: RecentPurchase[]; recentCount: Record<number, number> } | null;
  editingPopup: EditorPopup | null;
  coupons: EditorCoupon[];
};

type ActionResult = { success: boolean; message: string } | { ok: boolean; message?: string };
const succeeded = (r: ActionResult) => ("success" in r ? r.success : r.ok);

type SaveOptions = {
  /** Toast on success (sales tools are live — say so). Draft edits stay quiet: the toolbar shows "saved". */
  success?: string;
  /** Called with a failed result before the error toast (e.g. to roll back optimistic state). */
  onError?: () => void;
  /** false when the canvas already shows the change (live CSS vars) — skips the reload flash. */
  reloadCanvas?: boolean;
};

type BuilderContextType = StudioData & {
  panel: PanelId;
  /** Sub-view inside a panel (a home section key, "library"…). */
  section: string | null;
  navigate: (panel: PanelId, section?: string | null) => void;
  back: () => void;

  previewDevice: PreviewDevice;
  setPreviewDevice: (device: PreviewDevice) => void;
  /** Store-relative path shown in the canvas ("/", "/products", …). */
  previewPath: string;
  setPreviewPath: (path: string) => void;
  /** Hover + click-to-edit in the canvas (off = browse the store normally). */
  editMode: boolean;
  setEditMode: (on: boolean) => void;
  previewKey: number;
  previewFrameRef: React.RefObject<HTMLIFrameElement | null>;
  /** Refresh server data + the canvas (after any successful save). */
  reloadPreview: () => void;
  sendThemeUpdate: (cssVars: Record<string, string>) => void;
  previewPopup: (popup: StorefrontPopup | null) => void;
  /** Scroll the canvas to a region and flash it. */
  focusRegion: (id: string) => void;

  /** Number of saves in flight (toolbar shows "saving…"). */
  saving: number;
  lastSavedAt: number | null;
  /** Run a server action with the Studio's standard feedback. Resolves to whether it succeeded. */
  save: (run: () => Promise<ActionResult>, options?: SaveOptions) => Promise<boolean>;

  /** Bumped when the draft jumps (undo / redo / discard) so panels re-read their values. */
  revision: number;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  publish: () => Promise<boolean>;
  discard: () => Promise<boolean>;
};

const BuilderContext = createContext<BuilderContextType | null>(null);

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within BuilderProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

type ProviderProps = StudioData & { initialDevice?: PreviewDevice; children: ReactNode };

export function BuilderProvider({ children, initialDevice = "desktop", ...data }: ProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawPanel = searchParams.get("panel");
  const panel: PanelId = isPanelId(rawPanel) ? rawPanel : "home";
  const section = searchParams.get("section");

  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>(initialDevice);
  const [previewPath, setPreviewPath] = useState("/");
  const [editMode, setEditMode] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);
  const [saving, setSaving] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);

  const navigate = useCallback(
    (next: PanelId, nextSection: string | null = null) => {
      const q = new URLSearchParams(searchParams.toString());
      for (const key of ["popup", "template", "name", "starts", "ends"]) q.delete(key);
      if (next === "home") q.delete("panel");
      else q.set("panel", next);
      if (nextSection) q.set("section", nextSection);
      else q.delete("section");
      const query = q.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const back = useCallback(() => (section ? navigate(panel) : navigate("home")), [navigate, panel, section]);

  const reloadPreview = useCallback(() => {
    setPreviewKey((k) => k + 1);
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
  const focusRegion = useCallback((id: string) => post({ type: "CASHO_STUDIO_FOCUS", id }), [post]);

  const save = useCallback(
    async (run: () => Promise<ActionResult>, options: SaveOptions = {}) => {
      setSaving((n) => n + 1);
      try {
        const result = await run();
        if (!succeeded(result)) {
          options.onError?.();
          toast.error(result.message ? trv(result.message) : tr("حصل خطأ، جرّب تاني"));
          return false;
        }
        if (options.success) toast.success(options.success);
        setLastSavedAt(Date.now());
        if (options.reloadCanvas === false) router.refresh();
        else reloadPreview();
        return true;
      } catch {
        options.onError?.();
        toast.error(tr("حصل خطأ غير متوقع، جرّب تاني"));
        return false;
      } finally {
        setSaving((n) => n - 1);
      }
    },
    [reloadPreview, router],
  );

  const step = useCallback(
    async (direction: "undo" | "redo") => {
      if (await save(() => StepStudioHistoryAction(data.storeId, direction))) setRevision((r) => r + 1);
    },
    [data.storeId, save],
  );
  const undo = useCallback(() => step("undo"), [step]);
  const redo = useCallback(() => step("redo"), [step]);
  const publish = useCallback(
    () => save(() => PublishStudioDraftAction(data.storeId), { success: tr("اتنشر — العملاء شايفين الشكل الجديد دلوقتي 🎉") }),
    [data.storeId, save],
  );
  const discard = useCallback(async () => {
    const ok = await save(() => DiscardStudioDraftAction(data.storeId), { success: tr("رجعنا للنسخة المنشورة") });
    if (ok) setRevision((r) => r + 1);
    return ok;
  }, [data.storeId, save]);

  // ── Canvas messages: ready → send edit mode; click → open that region's settings.
  const editModeRef = useRef(editMode);
  editModeRef.current = editMode;
  const sendMode = useCallback(
    (edit: boolean, regions: string[] = []) =>
      post({
        type: "CASHO_STUDIO_MODE",
        edit,
        tint: "#0088ff",
        labels: Object.fromEntries(regions.map((id) => [id, regionLabel(id)])),
      }),
    [post],
  );
  const regionsRef = useRef<string[]>([]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== previewFrameRef.current?.contentWindow) return;
      const data = event.data as { type?: string; id?: string; regions?: string[] };
      if (data?.type === "CASHO_STUDIO_READY") {
        regionsRef.current = Array.isArray(data.regions) ? data.regions : [];
        sendMode(editModeRef.current, regionsRef.current);
      } else if (data?.type === "CASHO_STUDIO_SELECT" && typeof data.id === "string") {
        const target = regionTarget(data.id);
        if (target) navigate(target.panel, target.section);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [navigate, sendMode]);

  useEffect(() => {
    sendMode(editMode, regionsRef.current);
  }, [editMode, sendMode]);

  // Opening a section's settings scrolls the canvas to it.
  useEffect(() => {
    if (panel === "sections" && section && section.startsWith("show")) focusRegion(section);
    if (panel === "identity") focusRegion("header");
  }, [panel, section, focusRegion]);

  const value = useMemo<BuilderContextType>(
    () => ({
      ...data,
      panel,
      section,
      navigate,
      back,
      previewDevice,
      setPreviewDevice,
      previewPath,
      setPreviewPath,
      editMode,
      setEditMode,
      previewKey,
      previewFrameRef,
      reloadPreview,
      sendThemeUpdate,
      previewPopup,
      focusRegion,
      saving,
      lastSavedAt,
      save,
      revision,
      undo,
      redo,
      publish,
      discard,
    }),
    [
      data,
      panel,
      section,
      navigate,
      back,
      previewDevice,
      previewPath,
      editMode,
      previewKey,
      reloadPreview,
      sendThemeUpdate,
      previewPopup,
      focusRegion,
      saving,
      lastSavedAt,
      save,
      revision,
      undo,
      redo,
      publish,
      discard,
    ],
  );

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}
