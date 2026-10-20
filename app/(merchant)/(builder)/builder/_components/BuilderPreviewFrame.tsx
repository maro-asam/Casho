"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuilder, type PreviewDevice } from "./BuilderContext";
import { tr } from "@/lib/i18n/dashboard";

/** Real viewport sizes the store is rendered at, then scaled to fit the canvas. */
const DEVICE_SPECS: Record<PreviewDevice, { width: number; height: number | null }> = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1440, height: null },
};

const PAD = 28;

/**
 * The live store, rendered through /api/studio/preview (draft mode) so the owner
 * sees their unpublished draft. `fill` = full width, no device frame (mobile sheet).
 */
export default function BuilderPreviewFrame({ fill = false }: { fill?: boolean }) {
  const { storeSlug, previewDevice, previewKey, previewFrameRef, previewPath, setPreviewPath, editMode } = useBuilder();
  const canvas = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const prefix = `/store/${storeSlug}`;

  // What the iframe should load vs. where the merchant has clicked to inside it:
  // following in-store navigation must not reload the frame a second time.
  const [observedPath, setObservedPath] = useState(previewPath);
  const [srcPath, setSrcPath] = useState(previewPath);
  const [requested, setRequested] = useState({ path: previewPath, key: previewKey });
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  if (requested.path !== previewPath || requested.key !== previewKey) {
    setRequested({ path: previewPath, key: previewKey });
    // Picked from the page switcher → load it; a reload → reload where the merchant is now.
    if (previewPath !== observedPath) setSrcPath(previewPath);
    else if (requested.key !== previewKey) setSrcPath(observedPath);
  }

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBox({ width: entry.contentRect.width, height: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const spec = fill ? { width: box.width, height: null } : DEVICE_SPECS[previewDevice];
  const availW = Math.max(1, box.width - (fill ? 0 : PAD * 2));
  const availH = Math.max(1, box.height - (fill ? 0 : PAD * 2));
  const scale = fill ? 1 : Math.min(1, availW / spec.width, spec.height ? availH / spec.height : 1);
  const frameHeight = spec.height ? spec.height * scale : availH;
  const viewportH = spec.height ?? availH / scale;

  const frameKey = `${previewKey}-${srcPath}`;
  const loading = loadedKey !== frameKey;
  const src = `/api/studio/preview?path=${encodeURIComponent(srcPath)}`;

  function onLoad() {
    setLoadedKey(frameKey);
    // Keep the page switcher in sync when the merchant browses inside the store.
    try {
      const path = previewFrameRef.current?.contentWindow?.location.pathname;
      if (path?.startsWith(prefix)) {
        const storePath = path.slice(prefix.length) || "/";
        setObservedPath(storePath);
        if (storePath !== previewPath) setPreviewPath(storePath);
      }
    } catch {
      // cross-origin (e.g. an external link) — ignore
    }
  }

  return (
    <div
      ref={canvas}
      className={cn(
        "relative flex min-h-0 min-w-0 flex-1 items-start justify-center overflow-hidden",
        !fill && "bg-[radial-gradient(circle,var(--label-3)_0.75px,transparent_0.75px)] bg-size-[18px_18px] pt-7",
      )}
    >
      {box.width > 0 && (
        <div
          className={cn(
            "relative shrink-0 overflow-hidden bg-white transition-[width,height,border-radius] duration-500 ease-(--ease-apple)",
            !fill && previewDevice === "mobile" && "rounded-[48px] shadow-[0_0_0_10px_#1c1c1e,0_0_0_11px_#3a3a3c,0_30px_80px_rgba(0,0,0,0.25)]",
            !fill && previewDevice === "tablet" && "rounded-[32px] shadow-[0_0_0_10px_#1c1c1e,0_0_0_11px_#3a3a3c,0_30px_80px_rgba(0,0,0,0.22)]",
            !fill && previewDevice === "desktop" && "rounded-[14px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.12),0_24px_70px_rgba(0,0,0,0.16)]",
          )}
          style={{ width: spec.width * scale, height: frameHeight }}
        >
          <iframe
            ref={previewFrameRef}
            key={frameKey}
            src={src}
            title={tr("معاينة المتجر")}
            onLoad={onLoad}
            className="absolute top-0 left-0 origin-top-left border-0 bg-white"
            style={{ width: spec.width, height: viewportH, transform: `scale(${scale})` }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
          {loading && (
            <div className="absolute inset-0 grid place-items-center bg-white/60 backdrop-blur-[2px] transition-opacity">
              <Loader2 className="size-6 animate-spin text-(--sys-gray)" />
            </div>
          )}
        </div>
      )}

      {!fill && editMode && !loading && (
        <p className="apple-glass pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] text-foreground/80">
          <MousePointerClick className="size-3.5" />
          {tr("اضغط على أي قسم في المعاينة عشان تعدّله")}
        </p>
      )}
    </div>
  );
}
