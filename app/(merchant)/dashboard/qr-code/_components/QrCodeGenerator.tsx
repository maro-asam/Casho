"use client";

import { useEffect, useRef, useState } from "react";
import QRCodeStyling, { type Options } from "qr-code-styling";
import { Download, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DotType = "square" | "dots" | "rounded" | "classy" | "classy-rounded" | "extra-rounded";
type CornerType = "square" | "dot" | "extra-rounded";

interface StyleOption<T extends string> {
  value: T;
  label: string;
  preview: string;
}

const DOT_STYLES: StyleOption<DotType>[] = [
  { value: "square", label: "مربعات", preview: "■" },
  { value: "dots", label: "نقاط", preview: "●" },
  { value: "rounded", label: "مدوّر", preview: "▣" },
  { value: "classy", label: "كلاسيك", preview: "◈" },
  { value: "classy-rounded", label: "كلاسيك مدوّر", preview: "◉" },
  { value: "extra-rounded", label: "دائري تام", preview: "⬤" },
];

const CORNER_STYLES: StyleOption<CornerType>[] = [
  { value: "square", label: "مربع", preview: "□" },
  { value: "dot", label: "دائري", preview: "○" },
  { value: "extra-rounded", label: "مدوّر", preview: "◯" },
];

const PRESETS = [
  { label: "كلاسيك أسود", fg: "#000000", bg: "#ffffff" },
  { label: "أزرق عصري", fg: "#1d4ed8", bg: "#eff6ff" },
  { label: "أخضر نعناع", fg: "#15803d", bg: "#f0fdf4" },
  { label: "بنفسجي", fg: "#7c3aed", bg: "#f5f3ff" },
  { label: "أحمر طوارئ", fg: "#dc2626", bg: "#fef2f2" },
  { label: "ذهبي فاخر", fg: "#92400e", bg: "#fffbeb" },
];

export default function QrCodeGenerator({ storeUrl, storeName }: { storeUrl: string; storeName: string }) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);

  const [dotStyle, setDotStyle] = useState<DotType>("rounded");
  const [cornerStyle, setCornerStyle] = useState<CornerType>("extra-rounded");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size] = useState(300);

  const qrOptions: Options = {
    width: size,
    height: size,
    data: storeUrl,
    image: undefined,
    dotsOptions: { type: dotStyle, color: fgColor },
    cornersSquareOptions: { type: cornerStyle, color: fgColor },
    cornersDotOptions: { type: cornerStyle === "dot" ? "dot" : undefined, color: fgColor },
    backgroundOptions: { color: bgColor },
    qrOptions: { errorCorrectionLevel: "M" },
  };

  useEffect(() => {
    qrInstance.current = new QRCodeStyling(qrOptions);
    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      qrInstance.current.append(qrRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    qrInstance.current?.update(qrOptions);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dotStyle, cornerStyle, fgColor, bgColor]);

  const download = (ext: "png" | "svg") => {
    qrInstance.current?.download({ name: `${storeName}-qr`, extension: ext });
  };

  const applyPreset = (fg: string, bg: string) => {
    setFgColor(fg);
    setBgColor(bg);
  };

  return (
    <div dir="rtl" className="grid gap-6 lg:grid-cols-5">
      {/* QR Preview */}
      <div className="flex flex-col items-center gap-4 lg:col-span-2">
        <div
          className="rounded-2xl border bg-white p-4 shadow-sm"
          style={{ backgroundColor: bgColor }}
        >
          <div ref={qrRef} />
        </div>
        <p className="text-sm text-muted-foreground text-center truncate max-w-[280px]">{storeUrl}</p>
        <div className="flex gap-2 w-full">
          <Button className="flex-1 gap-2" onClick={() => download("png")}>
            <Download className="size-4" />
            PNG
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={() => download("svg")}>
            <Download className="size-4" />
            SVG
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-6 lg:col-span-3">
        {/* Dot style */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">شكل النقاط</Label>
          <div className="grid grid-cols-3 gap-2">
            {DOT_STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => setDotStyle(s.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition-all",
                  dotStyle === s.value
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "hover:border-muted-foreground/40"
                )}
              >
                <span className="text-2xl">{s.preview}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Corner style */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">شكل الزوايا</Label>
          <div className="grid grid-cols-3 gap-2">
            {CORNER_STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => setCornerStyle(s.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition-all",
                  cornerStyle === s.value
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "hover:border-muted-foreground/40"
                )}
              >
                <span className="text-2xl">{s.preview}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color presets */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">باليت الألوان</Label>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.fg, p.bg)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border p-2.5 text-sm transition-all",
                  fgColor === p.fg && bgColor === p.bg
                    ? "border-primary ring-1 ring-primary"
                    : "hover:border-muted-foreground/40"
                )}
              >
                <span
                  className="size-5 rounded-full border shrink-0"
                  style={{ backgroundColor: p.fg }}
                />
                <span className="truncate">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom colors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>لون الكود</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="h-9 w-9 cursor-pointer rounded-lg border"
              />
              <Input
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>لون الخلفية</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-9 w-9 cursor-pointer rounded-lg border"
              />
              <Input
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Reset */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={() => { setDotStyle("rounded"); setCornerStyle("extra-rounded"); setFgColor("#000000"); setBgColor("#ffffff"); }}
        >
          <RefreshCw className="size-4" />
          إعادة تعيين
        </Button>
      </div>
    </div>
  );
}
