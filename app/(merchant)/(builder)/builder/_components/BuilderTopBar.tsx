"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink, Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";
import { useBuilder, type PreviewDevice } from "./BuilderContext";

const DEVICES: { id: PreviewDevice; icon: React.ElementType; label: string; key: string }[] = [
  { id: "mobile", icon: Smartphone, label: "موبايل", key: "1" },
  { id: "tablet", icon: Tablet, label: "تابلت", key: "2" },
  { id: "desktop", icon: Monitor, label: "كمبيوتر", key: "3" },
];

const rtf = new Intl.RelativeTimeFormat("ar-EG", { numeric: "auto" });

function useRelativeTime(ts: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!ts) return;
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, [ts]);
  if (!ts) return null;
  const sec = Math.round((ts - now) / 1000);
  return Math.abs(sec) < 45 ? "دلوقتي" : rtf.format(Math.round(sec / 60), "minute");
}

export default function BuilderTopBar() {
  const { storeSlug, storeName, previewDevice, setPreviewDevice, previewPath, setPreviewPath, reloadPreview, lastSavedAt, sampleProductSlug } =
    useBuilder();
  const savedAgo = useRelativeTime(lastSavedAt);

  const pages = [
    { path: "/", label: "الصفحة الرئيسية" },
    { path: "/products", label: "كل المنتجات" },
    ...(sampleProductSlug ? [{ path: `/products/${sampleProductSlug}`, label: "صفحة منتج" }] : []),
    { path: "/categories", label: "التصنيفات" },
    { path: "/cart", label: "السلة" },
    { path: "/about", label: "من نحن" },
    { path: "/contact", label: "تواصل معنا" },
  ];
  const known = pages.some((p) => p.path === previewPath);

  return (
    <TooltipProvider delayDuration={300}>
      <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border bg-background px-3">
        {/* Start: back + store + save status */}
        <div className="flex min-w-0 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild className="size-8 shrink-0">
                <Link href="/customization" aria-label="رجوع للتخصيص">
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>رجوع للتخصيص</TooltipContent>
          </Tooltip>
          <div className="min-w-0 border-s border-border ps-3">
            <p className="truncate text-sm font-semibold leading-tight">{storeName}</p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Check className="size-3 text-emerald-600" />
              {savedAgo ? `اتحفظ ${savedAgo} · ظاهر للعملاء` : "التعديلات بتتحفظ وتتنشر تلقائي"}
            </p>
          </div>
        </div>

        {/* Center: page + device */}
        <div className="flex items-center gap-2">
          <Select value={known ? previewPath : "__custom"} onValueChange={(v) => v !== "__custom" && setPreviewPath(v)} dir="rtl">
            <SelectTrigger className="h-8 w-44 text-xs" aria-label="الصفحة المعروضة">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pages.map((p) => (
                <SelectItem key={p.path} value={p.path} className="text-xs">
                  {p.label}
                </SelectItem>
              ))}
              {!known && (
                <SelectItem value="__custom" className="text-xs" disabled>
                  <span dir="ltr">{previewPath}</span>
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <div className="flex rounded-lg bg-muted p-0.5" role="radiogroup" aria-label="حجم الشاشة">
            {DEVICES.map(({ id, icon: Icon, label, key }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={previewDevice === id}
                    aria-label={label}
                    onClick={() => setPreviewDevice(id)}
                    className={cn(
                      "grid h-7 w-9 place-items-center rounded-md transition-colors",
                      previewDevice === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {label} <kbd className="ms-1 font-mono">{key}</kbd>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* End: actions */}
        <div className="flex items-center justify-end gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={reloadPreview} className="size-8 text-muted-foreground" aria-label="تحديث المعاينة">
                <RefreshCw className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              تحديث المعاينة <kbd className="ms-1 font-mono">R</kbd>
            </TooltipContent>
          </Tooltip>
          <Button size="sm" asChild className="h-8 gap-1.5">
            <a href={buildStoreUrl(storeSlug, previewPath === "/" ? "" : previewPath)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" />
              افتح المتجر
            </a>
          </Button>
        </div>
      </header>
    </TooltipProvider>
  );
}
