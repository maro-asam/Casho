"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuilder, type PreviewDevice } from "./BuilderContext";
import { tr } from "@/lib/i18n/dashboard";

/** Real viewport sizes the store is rendered at, then scaled to fit the canvas. */
const DEVICE_SPECS: Record<PreviewDevice, { width: number; height: number | null; label: string }> = {
  mobile: { width: 390, height: 844, get label() { return tr("موبايل · ٣٩٠"); } },
  tablet: { width: 820, height: 1180, get label() { return tr("تابلت · ٨٢٠"); } },
  desktop: { width: 1440, height: null, get label() { return tr("كمبيوتر · ١٤٤٠"); } },
};

const PAD = 32;

export default function BuilderPreviewFrame() {
  const { storeSlug, previewDevice, previewKey, previewFrameRef, previewPath, setPreviewPath } = useBuilder();
  const canvas = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const spec = DEVICE_SPECS[previewDevice];
  const prefix = `/store/${storeSlug}`;

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBox({ width: entry.contentRect.width, height: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fit width (and height for framed devices); never upscale.
  const availW = Math.max(1, box.width - PAD * 2);
  const availH = Math.max(1, box.height - PAD - 24);
  const scale = Math.min(1, availW / spec.width, spec.height ? availH / spec.height : 1);
  const frameHeight = spec.height ? spec.height * scale : availH;
  const viewportH = spec.height ?? availH / scale;

  const src = `${prefix}${previewPath === "/" ? "" : previewPath}`;
  const frameKey = `${previewKey}-${previewDevice}-${src}`;
  const loading = loadedKey !== frameKey;

  function onLoad() {
    setLoadedKey(frameKey);
    // Keep the page switcher in sync when the merchant clicks around inside the store.
    try {
      const path = previewFrameRef.current?.contentWindow?.location.pathname;
      if (path?.startsWith(prefix)) {
        const storePath = path.slice(prefix.length) || "/";
        if (storePath !== previewPath) setPreviewPath(storePath);
      }
    } catch {
      // cross-origin — ignore
    }
  }

  return (
    <div ref={canvas} className="relative flex min-w-0 flex-1 flex-col items-center overflow-hidden bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1px)] bg-muted/40 [background-size:16px_16px]">
      <p className="mt-3 h-6 shrink-0 text-[11px] tabular-nums text-muted-foreground">
        {spec.label}
        {scale < 0.999 && tr(" · {0}٪", Math.round(scale * 100))}
      </p>

      {box.width > 0 && (
        <div
          className={cn(
            "relative shrink-0 overflow-hidden bg-background shadow-2xl transition-[width,height] duration-300",
            previewDevice === "mobile" && "rounded-[2.25rem] ring-[7px] ring-neutral-900",
            previewDevice === "tablet" && "rounded-[1.5rem] ring-[6px] ring-neutral-800",
            previewDevice === "desktop" && "rounded-lg ring-1 ring-border",
          )}
          style={{ width: spec.width * scale, height: frameHeight }}
        >
          <iframe
            ref={previewFrameRef}
            key={frameKey}
            src={src}
            title={tr("معاينة المتجر")}
            onLoad={onLoad}
            className="absolute end-0 top-0 origin-top-left border-0 bg-white"
            style={{ width: spec.width, height: viewportH, transform: `scale(${scale})` }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
          {loading && (
            <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-[1px]">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
