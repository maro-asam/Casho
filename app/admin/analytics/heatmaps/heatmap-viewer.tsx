"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2, MousePointerClick } from "lucide-react";

import { SegmentedButtons, Unavailable } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { BUCKET_WIDTH, type DeviceBucket } from "@/lib/analytics/constants";
import { depthReachedBy, scrollReach } from "@/lib/analytics/metrics";
import type { HeatmapData } from "@/lib/analytics/queries/heatmaps";
import { selectorOf } from "@/lib/analytics/sdk/selector";

type Mode = "clicks" | "scroll" | "elements";

const nf = new Intl.NumberFormat("ar-EG");
const pct = new Intl.NumberFormat("ar-EG", { style: "percent", maximumFractionDigits: 0 });
const BUCKET_LABEL: Record<DeviceBucket, string> = { desktop: "كمبيوتر", tablet: "تابلت", mobile: "موبايل" };
const DEFAULT_VH: Record<DeviceBucket, number> = { desktop: 820, tablet: 1080, mobile: 780 };
const LAYER_ID = "casho-heatmap-layer";
const STYLE_ID = "casho-heatmap-style";

/** Sequential warm ramp (yellow → orange → red), alpha grows with density. */
function heatColor(t: number): [number, number, number] {
  const stops: [number, [number, number, number]][] = [
    [0, [250, 204, 21]],
    [0.45, [250, 140, 30]],
    [0.75, [235, 90, 40]],
    [1, [200, 30, 40]],
  ];
  for (let i = 1; i < stops.length; i++) {
    const [p1, c1] = stops[i];
    const [p0, c0] = stops[i - 1];
    if (t <= p1) {
      const k = (t - p0) / (p1 - p0 || 1);
      return [0, 1, 2].map((j) => Math.round(c0[j] + (c1[j] - c0[j]) * k)) as [number, number, number];
    }
  }
  return stops[stops.length - 1][1];
}

const LEGEND = "linear-gradient(to left, rgb(250 204 21 / .35), rgb(250 140 30 / .7), rgb(235 90 40 / .85), rgb(200 30 40))";

type ResolvedElement = { sel: string; rect: { x: number; y: number; w: number; h: number } | null };

function frameDoc(frame: HTMLIFrameElement | null) {
  try {
    return frame?.contentDocument ?? null;
  } catch {
    return null; // cross-origin — shouldn't happen (same-origin URLs only)
  }
}

function docSize(doc: Document) {
  const el = doc.documentElement;
  return {
    w: Math.max(el.scrollWidth, doc.body?.scrollWidth ?? 0),
    h: Math.max(el.scrollHeight, doc.body?.scrollHeight ?? 0),
  };
}

function absRect(el: Element) {
  const r = el.getBoundingClientRect();
  const win = el.ownerDocument.defaultView;
  if (!win || (r.width === 0 && r.height === 0)) return null;
  return { x: r.left + win.scrollX, y: r.top + win.scrollY, w: r.width, h: r.height };
}

function query(doc: Document, sel: string): Element | null {
  try {
    return doc.querySelector(sel);
  } catch {
    return null;
  }
}

export function HeatmapViewer({ data, frameSrc, frameNote }: { data: HeatmapData; frameSrc: string | null; frameNote?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>((params.get("type") as Mode) || "clicks");
  const [onlyDead, setOnlyDead] = useState(false);
  const [scale, setScale] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(frameSrc ? "loading" : "error");
  const [resolvedCount, setResolvedCount] = useState({ matched: 0, fallback: 0 });
  const [ignored, setIgnored] = useState<{ sel: string; label: string }[]>([]);
  const [sections, setSections] = useState<{ label: string; top: number; reached: number }[]>([]);
  const [docH, setDocH] = useState(0);

  const width = BUCKET_WIDTH[data.bucket];
  const vh = Math.min(1200, Math.max(560, data.medianViewportH ?? DEFAULT_VH[data.bucket]));
  const reach = useMemo(() => scrollReach(data.scroll, 5), [data.scroll]);
  const avgScroll = data.scroll.length ? data.scroll.reduce((s, v) => s + v, 0) / data.scroll.length : null;
  const half = depthReachedBy(data.scroll, 0.5);
  const deadCount = data.clicks.filter((c) => c.dead).length;
  const rageCount = data.clicks.filter((c) => c.rage).length;

  // Fit the device-width frame into the available space (the page itself renders at the real width).
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, box.clientWidth / width)));
    ro.observe(box);
    return () => ro.disconnect();
  }, [width]);

  const setUrl = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null) next.delete(k);
        else next.set(k, v);
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  // ── Drawing, inside the framed page so it scrolls (and resizes) with it ──
  const draw = useCallback(() => {
    const doc = frameDoc(frameRef.current);
    if (!doc?.body) return;
    if (!doc.getElementById(STYLE_ID)) {
      const style = doc.createElement("style");
      style.id = STYLE_ID;
      // Finish animations at once (reveals show their end state) and keep the page still.
      style.textContent =
        "*,*::before,*::after{animation-duration:.001s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;scroll-behavior:auto!important}" +
        `#${LAYER_ID}{position:absolute;top:0;left:0;z-index:2147483646;pointer-events:auto;cursor:default}` +
        `#${LAYER_ID} canvas{position:absolute;top:0;left:0;pointer-events:none}` +
        `#${LAYER_ID} .hm-box{position:absolute;border:2px solid rgb(235 90 40);border-radius:6px;background:rgb(235 90 40 / .08)}` +
        `#${LAYER_ID} .hm-badge{position:absolute;top:-11px;inset-inline-start:-2px;font:600 11px/18px system-ui,sans-serif;padding:0 6px;border-radius:9px;background:rgb(200 30 40);color:#fff;white-space:nowrap;direction:ltr}` +
        `#${LAYER_ID} .hm-band{position:absolute;left:0;width:100%}` +
        `#${LAYER_ID} .hm-mark{position:absolute;left:0;width:100%;border-top:2px dashed rgba(0,0,0,.65)}` +
        `#${LAYER_ID} .hm-mark span{position:absolute;top:4px;right:8px;font:600 12px/20px system-ui,sans-serif;padding:0 8px;border-radius:10px;background:rgba(0,0,0,.75);color:#fff}`;
      doc.head.appendChild(style);
    }
    doc.getElementById(LAYER_ID)?.remove();
    const size = docSize(doc);
    setDocH(size.h);
    const layer = doc.createElement("div");
    layer.id = LAYER_ID;
    layer.style.width = `${size.w}px`;
    layer.style.height = `${size.h}px`;
    // Block clicks on the page (links would navigate away); scrolling still works.
    layer.addEventListener("click", (e) => e.preventDefault(), true);

    if (mode === "clicks") {
      const ratio = Math.min(0.5, Math.sqrt(12_000_000 / Math.max(1, size.w * size.h)));
      const canvas = doc.createElement("canvas");
      canvas.width = Math.max(1, Math.round(size.w * ratio));
      canvas.height = Math.max(1, Math.round(size.h * ratio));
      canvas.style.width = `${size.w}px`;
      canvas.style.height = `${size.h}px`;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        const cache = new Map<number, ResolvedElement["rect"]>();
        let matched = 0;
        let fallback = 0;
        const radius = Math.max(6, 22 * ratio);
        for (const c of data.clicks) {
          if (onlyDead && !c.dead) continue;
          let x: number;
          let y: number;
          let rect: ResolvedElement["rect"] | undefined;
          if (c.s >= 0) {
            rect = cache.get(c.s);
            if (rect === undefined) {
              const el = query(doc, data.selectors[c.s]);
              rect = el ? absRect(el) : null;
              cache.set(c.s, rect);
            }
          }
          if (rect && c.ex !== null && c.ey !== null) {
            x = rect.x + c.ex * rect.w;
            y = rect.y + c.ey * rect.h;
            matched += 1;
          } else {
            // Element not on the page any more: the recorded position, scaled to today's page height.
            x = c.x * size.w;
            y = c.dh ? c.y * (size.h / c.dh) : c.y;
            fallback += 1;
          }
          const px = x * ratio;
          const py = y * ratio;
          const g = ctx.createRadialGradient(px, py, 0, px, py, radius);
          g.addColorStop(0, "rgba(0,0,0,0.35)");
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
        }
        setResolvedCount({ matched, fallback });
        // Colorize: alpha → warm ramp, normalised so the hottest spot is the darkest red.
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = img.data;
        let max = 0;
        for (let i = 3; i < px.length; i += 4) if (px[i] > max) max = px[i];
        if (max > 0) {
          for (let i = 0; i < px.length; i += 4) {
            const a = px[i + 3];
            if (!a) continue;
            const t = a / max;
            const [r, g2, b] = heatColor(t);
            px[i] = r;
            px[i + 1] = g2;
            px[i + 2] = b;
            px[i + 3] = Math.round(Math.min(1, 0.25 + t * 0.75) * 235);
          }
          ctx.putImageData(img, 0, 0);
        }
      }
      layer.appendChild(canvas);
    }

    if (mode === "scroll") {
      for (let i = 0; i < reach.length - 1; i++) {
        const band = doc.createElement("div");
        band.className = "hm-band";
        band.style.top = `${(reach[i].depth / 100) * size.h}px`;
        band.style.height = `${(5 / 100) * size.h + 1}px`;
        const [r, g, b] = heatColor(reach[i].reached);
        band.style.background = `rgb(${r} ${g} ${b} / ${0.12 + reach[i].reached * 0.33})`;
        layer.appendChild(band);
      }
      const marks: [number, string][] = [];
      for (const share of [0.75, 0.5, 0.25]) {
        const d = depthReachedBy(data.scroll, share);
        if (d !== null) marks.push([d, `${pct.format(share)} وصلوا هنا`]);
      }
      marks.push([Math.min(100, (vh / Math.max(size.h, 1)) * 100), "آخر الشاشة الأولى (متوسط)"]);
      for (const [depth, text] of marks) {
        const mark = doc.createElement("div");
        mark.className = "hm-mark";
        mark.style.top = `${(depth / 100) * size.h}px`;
        const label = doc.createElement("span");
        label.textContent = text;
        mark.appendChild(label);
        layer.appendChild(mark);
      }
      // Sections and how many views reached their top.
      const found: { label: string; top: number; reached: number }[] = [];
      const nodes = Array.from(doc.querySelectorAll("main section, body > main > div, section, footer")).slice(0, 60);
      const seen = new Set<number>();
      for (const node of nodes) {
        const r = absRect(node);
        if (!r || r.h < 120) continue;
        const top = Math.round(r.y);
        if ([...seen].some((t) => Math.abs(t - top) < 80)) continue;
        seen.add(top);
        const heading = node.querySelector("h1,h2,h3")?.textContent?.replace(/\s+/g, " ").trim().slice(0, 50);
        const label = heading || (node.tagName === "FOOTER" ? "الفوتر" : `قسم على ${nf.format(top)}px`);
        const depth = (top / Math.max(size.h, 1)) * 100;
        found.push({ label, top: depth, reached: data.scroll.length ? data.scroll.filter((v) => v >= depth).length / data.scroll.length : 0 });
      }
      setSections(found.sort((a, b) => a.top - b.top).slice(0, 14));
    }

    if (mode === "elements") {
      const views = Math.max(1, data.views);
      const top = Math.max(1, ...data.elements.map((e) => e.byBucket[data.bucket]));
      const clicked = new Set<string>();
      for (const e of data.elements) {
        clicked.add(e.sel);
        const n = e.byBucket[data.bucket];
        if (!n) continue;
        const el = query(doc, e.sel);
        const r = el ? absRect(el) : null;
        if (!r) continue;
        const box = doc.createElement("div");
        box.className = "hm-box";
        box.style.left = `${r.x}px`;
        box.style.top = `${r.y}px`;
        box.style.width = `${r.w}px`;
        box.style.height = `${r.h}px`;
        box.style.opacity = String(0.45 + 0.55 * (n / top));
        box.title = `${e.label ?? e.tag ?? ""} — ${n} ضغطة`;
        const badge = doc.createElement("span");
        badge.className = "hm-badge";
        badge.textContent = `${nf.format(n)} · ${pct.format(n / views)}`;
        box.appendChild(badge);
        layer.appendChild(box);
      }
      // Ignored: visible links/buttons nobody clicked at this layout.
      const quiet: { sel: string; label: string }[] = [];
      for (const el of Array.from(doc.querySelectorAll("a[href], button, [role=button]")).slice(0, 400)) {
        const r = absRect(el);
        if (!r || r.w < 8 || r.h < 8) continue;
        const sel = selectorOf(el);
        if (clicked.has(sel)) continue;
        const label = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 50);
        if (!label) continue;
        quiet.push({ sel, label });
        if (quiet.length >= 12) break;
      }
      setIgnored(quiet);
    }

    // On <html>, so its (0,0) is the document's — never offset by a positioned or clipped <body>.
    doc.documentElement.appendChild(layer);
  }, [data, mode, onlyDead, reach, vh]);

  // Redraw when the page grows (lazy images, fonts) and on mode changes.
  useEffect(() => {
    if (status !== "ready") return;
    draw();
    const doc = frameDoc(frameRef.current);
    const win = doc?.defaultView;
    if (!doc || !win) return;
    let timer: number | null = null;
    let lastH = docSize(doc).h;
    const ro = new win.ResizeObserver(() => {
      const h = docSize(doc).h;
      if (Math.abs(h - lastH) < 4) return;
      lastH = h;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(draw, 250);
    });
    ro.observe(doc.body);
    return () => {
      ro.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [status, draw]);

  const onLoad = () => {
    const doc = frameDoc(frameRef.current);
    if (!doc?.body) {
      setStatus("error");
      return;
    }
    // Give the page a moment to hydrate and lay out before the first draw.
    window.setTimeout(() => setStatus("ready"), 600);
  };

  const legend =
    mode === "scroll" ? (
      <span className="flex items-center gap-2">
        <span>وصلها ناس أقل</span>
        <span className="h-2 w-24 rounded-full" style={{ background: LEGEND }} aria-hidden />
        <span>وصلها ناس أكتر</span>
      </span>
    ) : mode === "clicks" ? (
      <span className="flex items-center gap-2">
        <span>ضغطات أقل</span>
        <span className="h-2 w-24 rounded-full" style={{ background: LEGEND }} aria-hidden />
        <span>ضغطات أكتر</span>
      </span>
    ) : (
      <span>كل مربع = عنصر اتضغط عليه · الرقم = ضغطات · النسبة = ضغطات لكل مشاهدة</span>
    );

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <section className="apple-card min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-3 sm:px-5">
          <SegmentedButtons
            label="نوع الخريطة"
            role="tablist"
            value={mode}
            onChange={(m) => {
              setMode(m);
              setUrl({ type: m === "clicks" ? null : m });
            }}
            options={[
              ["clicks", "النقرات"],
              ["scroll", "السكرول"],
              ["elements", "العناصر"],
            ]}
          />
          <SegmentedButtons
            label="الجهاز"
            value={data.bucket}
            onChange={(b) => setUrl({ bucket: b === "desktop" ? null : b })}
            options={(["desktop", "tablet", "mobile"] as DeviceBucket[]).map((b) => [b, `${BUCKET_LABEL[b]} ${nf.format(data.viewsByBucket[b])}`] as const)}
          />
          {mode === "clicks" && deadCount > 0 && (
            <label className="ms-auto flex items-center gap-2 text-[13px] text-muted-foreground">
              <input type="checkbox" checked={onlyDead} onChange={(e) => setOnlyDead(e.target.checked)} className="size-4 accent-(--sys-red)" />
              النقرات الميتة بس
            </label>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-3 text-[12px] text-muted-foreground sm:px-5">
          {legend}
          <span>
            عرض {nf.format(width)}px · {BUCKET_LABEL[data.bucket]}
          </span>
        </div>

        <div ref={boxRef} className="relative bg-(--fill-3) px-0 py-4">
          {frameSrc ? (
            <div className="relative mx-auto overflow-hidden rounded-[14px] bg-background shadow-[0_0_0_0.5px_var(--border),0_10px_30px_rgba(0,0,0,0.08)]" style={{ width: width * scale, height: vh * scale }}>
              <iframe
                ref={frameRef}
                key={frameSrc}
                src={frameSrc}
                title={`الصفحة ${data.path} بعرض ${width}px`}
                onLoad={onLoad}
                style={{ width, height: vh, transform: `scale(${scale})`, transformOrigin: "top left", border: 0, display: "block" }}
                className="bg-background"
              />
              {status === "loading" && (
                <div className="absolute inset-0 grid place-items-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          ) : (
            <Unavailable icon={AlertTriangle} title="مش هنقدر نعرض الصفحة دي" description={frameNote ?? "اختار صفحة من القائمة."} className="py-14" />
          )}
        </div>
        <p className="px-4 py-3 text-[12px] text-muted-foreground sm:px-5">
          الصفحة بتتعرض زي ما هي النهارده (نسخة حية، مش صورة). النقرات مترسومة على العنصر اللي اتضغط عليه؛ لو العنصر اتغير أو اختفى بنستخدم مكان النقرة المسجل.
          {mode === "clicks" && resolvedCount.fallback > 0 && ` (${nf.format(resolvedCount.fallback)} نقرة على عناصر مش موجودة دلوقتي)`}
        </p>
      </section>

      <aside className="space-y-4">
        <section className="apple-card space-y-3 p-5">
          <h2 className="text-[15px] font-semibold">{BUCKET_LABEL[data.bucket]} — الأرقام</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
            <div>
              <dt className="text-muted-foreground">مشاهدات</dt>
              <dd className="text-[18px] font-semibold tabular-nums">{nf.format(data.views)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">نقرات بمكانها</dt>
              <dd className="text-[18px] font-semibold tabular-nums">{nf.format(data.totalClicks)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">نقرات ميتة</dt>
              <dd className="text-[18px] font-semibold tabular-nums">{data.clicks.length ? pct.format(deadCount / data.clicks.length) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">نقرات غضب</dt>
              <dd className="text-[18px] font-semibold tabular-nums">{nf.format(rageCount)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">متوسط السكرول</dt>
              <dd className="text-[18px] font-semibold tabular-nums">{avgScroll === null ? "—" : pct.format(avgScroll / 100)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">نص الزوار وقفوا عند</dt>
              <dd className="text-[18px] font-semibold tabular-nums">{half === null ? "—" : pct.format(half / 100)}</dd>
            </div>
          </dl>
          {data.truncated && <p className="text-[12px] text-muted-foreground">معروض أحدث {nf.format(data.clicks.length)} نقرة.</p>}
          <p className="text-[12px] leading-[17px] text-muted-foreground">
            ميتة = ضغطة على حاجة مش تفاعلية ومحصلش بعدها أي تغيير في الصفحة خلال ثانية. غضب = ٣ ضغطات أو أكتر في نفس المكان خلال ثانية.
          </p>
        </section>

        {mode === "scroll" && (
          <section className="apple-card overflow-hidden">
            <h2 className="px-5 pt-5 pb-1 text-[15px] font-semibold">الأقسام: وصلها كام واحد</h2>
            <p className="px-5 pb-2 text-[12px] text-muted-foreground">الأقسام اللي تحت ٢٥٪ محدش تقريبًا بيشوفها.</p>
            {sections.length ? (
              <ol className="apple-rows pb-2 [--row-inset:20px]">
                {sections.map((s, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-5 py-2 text-[13px]">
                    <span className="min-w-0 truncate" dir="auto">
                      {s.label}
                    </span>
                    <span className={cn("shrink-0 font-semibold tabular-nums", s.reached < 0.25 && "text-(--sys-red)")}>{pct.format(s.reached)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-5 pb-5 text-[13px] text-muted-foreground">{data.scroll.length ? "بنقرا أقسام الصفحة…" : "لسه مفيش بيانات سكرول للجهاز ده."}</p>
            )}
            <ol className="space-y-1.5 px-5 pb-5 pt-2">
              {reach.filter((r) => r.depth % 25 === 0).map((r) => (
                <li key={r.depth} className="flex items-center gap-2 text-[12px]">
                  <span className="w-10 text-muted-foreground tabular-nums">{pct.format(r.depth / 100)}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--viz-track)">
                    <span className="block h-full rounded-full bg-(--viz-1)" style={{ width: `${r.reached * 100}%` }} />
                  </span>
                  <span className="w-9 text-end tabular-nums">{pct.format(r.reached)}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="apple-card overflow-hidden">
          <h2 className="px-5 pt-5 pb-1 text-[15px] font-semibold">أكتر العناصر ضغطًا</h2>
          <p className="px-5 pb-2 text-[12px] text-muted-foreground">ضغطات لكل مشاهدة حسب الجهاز</p>
          {data.elements.length ? (
            <ol className="apple-rows pb-2 [--row-inset:20px]">
              {data.elements.slice(0, 12).map((e) => (
                <li key={e.sel} className="space-y-0.5 px-5 py-2 text-[13px]">
                  <p className="truncate font-medium" dir="auto" title={e.sel}>
                    {e.label ?? e.href ?? e.tag ?? e.sel.split(">").pop()}
                    {e.dead > 0 && <span className="ms-1 text-[11px] text-(--sys-red)">· {nf.format(e.dead)} ميتة</span>}
                  </p>
                  <p className="flex gap-3 text-[12px] text-muted-foreground tabular-nums">
                    {(["desktop", "tablet", "mobile"] as DeviceBucket[]).map((b) => (
                      <span key={b} className={cn(b === data.bucket && "font-semibold text-foreground")}>
                        {BUCKET_LABEL[b]} {data.viewsByBucket[b] ? pct.format(e.byBucket[b] / data.viewsByBucket[b]) : "—"}
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <Unavailable icon={MousePointerClick} title="مفيش ضغطات" className="py-8" />
          )}
        </section>

        {mode === "elements" && ignored.length > 0 && (
          <section className="apple-card overflow-hidden">
            <h2 className="px-5 pt-5 pb-1 text-[15px] font-semibold">روابط وأزرار محدش ضغط عليها</h2>
            <p className="px-5 pb-2 text-[12px] text-muted-foreground">ظاهرة على الصفحة دلوقتي ومفيش عليها ولا ضغطة في الفترة دي (على الجهاز ده).</p>
            <ol className="apple-rows pb-2 [--row-inset:20px]">
              {ignored.map((e) => (
                <li key={e.sel} className="truncate px-5 py-2 text-[13px]" dir="auto">
                  {e.label}
                </li>
              ))}
            </ol>
          </section>
        )}
        {docH > 0 && <p className="px-1 text-[11px] text-muted-foreground">طول الصفحة دلوقتي {nf.format(docH)}px{data.medianDocHeight ? ` · وقت الزيارات ${nf.format(data.medianDocHeight)}px` : ""}</p>}
      </aside>
    </div>
  );
}
