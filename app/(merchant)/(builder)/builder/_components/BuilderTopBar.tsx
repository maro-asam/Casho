"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Eye,
  Hand,
  Loader2,
  Monitor,
  MousePointerClick,
  Redo2,
  Smartphone,
  Tablet,
  Undo2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { appleButton } from "@/components/saas-page";
import type { ChangeArea } from "@/lib/studio/appearance";
import { cn } from "@/lib/utils";
import { useBuilder, type PreviewDevice } from "./BuilderContext";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";

const DEVICES: { id: PreviewDevice; icon: typeof Monitor; label: string; key: string }[] = [
  { id: "mobile", icon: Smartphone, get label() { return tr("موبايل"); }, key: "1" },
  { id: "tablet", icon: Tablet, get label() { return tr("تابلت"); }, key: "2" },
  { id: "desktop", icon: Monitor, get label() { return tr("كمبيوتر"); }, key: "3" },
];

export const CHANGE_LABELS: Record<ChangeArea, string> = {
  get theme() { return tr("الثيم"); },
  get colors() { return tr("الألوان"); },
  get fonts() { return tr("الخط واللغة"); },
  get layout() { return tr("شكل العرض"); },
  get sections() { return tr("أقسام الرئيسية"); },
  get content() { return tr("محتوى الأقسام"); },
  get identity() { return tr("الهوية واللوجو"); },
};

const rtf = lazyIntl.relative({ numeric: "auto" });
const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

function useRelativeTime(iso: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 20_000);
    return () => clearInterval(t);
  }, []);
  if (!iso) return null;
  const sec = Math.round((new Date(iso).getTime() - now) / 1000);
  if (Math.abs(sec) < 45) return tr("دلوقتي");
  const min = Math.round(sec / 60);
  return Math.abs(min) < 60 ? rtf.format(min, "minute") : rtf.format(Math.round(min / 60), "hour");
}

export function useStudioPages() {
  const { sampleProductSlug } = useBuilder();
  return [
    { path: "/", label: tr("الصفحة الرئيسية") },
    { path: "/products", label: tr("كل المنتجات") },
    ...(sampleProductSlug ? [{ path: `/products/${sampleProductSlug}`, label: tr("صفحة منتج") }] : []),
    { path: "/categories", label: tr("التصنيفات") },
    { path: "/cart", label: tr("السلة") },
    { path: "/about", label: tr("من نحن") },
    { path: "/contact", label: tr("تواصل معنا") },
  ];
}

/** "Draft · 3 changes" / "Published" + saving spinner. */
export function SaveStatus({ compact }: { compact?: boolean }) {
  const { status, saving } = useBuilder();
  const ago = useRelativeTime(status.updatedAt);
  const changes = status.changes.length;
  if (saving > 0) {
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        {tr("بيتحفظ…")}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
      <span aria-hidden className={cn("size-1.5 rounded-full", changes ? "bg-(--sys-orange)" : "bg-(--sys-green)")} />
      {changes
        ? compact
          ? tr("{0} تعديل مش منشور", changes)
          : tr("مسودة · {0} تعديل مش منشور · اتحفظت {1}", changes, ago ?? "")
        : tr("منشور — ده اللي العملاء شايفينه")}
    </span>
  );
}

/** Publish button + popover listing what changed (and the discard escape hatch). */
export function PublishControl({ className }: { className?: string }) {
  const { status, publish, discard, saving } = useBuilder();
  const [open, setOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [busy, setBusy] = useState<"publish" | "discard" | null>(null);
  const changes = status.changes;

  if (!changes.length) {
    return (
      <span className={cn(appleButton.tinted, "pointer-events-none h-9 bg-card text-[13px] text-muted-foreground", className)}>
        {tr("منشور")}
      </span>
    );
  }

  async function run(kind: "publish" | "discard") {
    setBusy(kind);
    const ok = kind === "publish" ? await publish() : await discard();
    setBusy(null);
    if (ok) {
      setOpen(false);
      setConfirmDiscard(false);
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className={cn(appleButton.filled, "h-9 px-4 text-[14px]", className)} disabled={saving > 0 && !busy}>
            {tr("نشر")}
            <span className="grid min-w-5 place-items-center rounded-full bg-white/25 px-1 text-[11px] tabular-nums">{changes.length}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={10} className="w-80 rounded-[22px] p-0" dir={tdir()}>
          <div className="space-y-1 p-4 pb-3">
            <p className="text-[17px] font-semibold">{tr("تنشر التعديلات؟")}</p>
            <p className="text-[13px] leading-[18px] text-muted-foreground">
              {tr("العملاء لسه شايفين النسخة القديمة. اللي اتغيّر:")}
            </p>
          </div>
          <ul className="mx-4 flex flex-wrap gap-1.5">
            {changes.map((c) => (
              <li key={c} className="rounded-full bg-(--fill-3) px-2.5 py-1 text-[12px]">
                {CHANGE_LABELS[c]}
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t-[0.5px] border-border p-2">
            <button type="button" className={cn(appleButton.filled, "h-11 w-full")} onClick={() => run("publish")} disabled={busy !== null}>
              {busy === "publish" && <Loader2 className="size-4 animate-spin" />}
              {tr("انشر على المتجر")}
            </button>
            <button
              type="button"
              className={cn(appleButton.plain, "mx-0 h-10 w-full text-(--sys-red) hover:bg-(--sys-red)/8")}
              onClick={() => setConfirmDiscard(true)}
              disabled={busy !== null}
            >
              {tr("تجاهل التعديلات")}
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={confirmDiscard} onOpenChange={(o) => !busy && setConfirmDiscard(o)}>
        <AlertDialogContent dir={tdir()} className="rounded-[22px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("تتجاهل كل التعديلات؟")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("هترجع للنسخة المنشورة، والتعديلات اللي مش منشورة هتتمسح ومش هتقدر ترجّعها.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" disabled={busy !== null}>
              {tr("رجوع")}
            </AlertDialogCancel>
            <button type="button" className={appleButton.destructiveFilled} onClick={() => run("discard")} disabled={busy !== null}>
              {busy === "discard" && <Loader2 className="size-4 animate-spin" />}
              {tr("تجاهل التعديلات")}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function IconButton({
  label,
  shortcut,
  onClick,
  disabled,
  children,
  href,
  newTab,
}: {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  href?: string;
  newTab?: boolean;
}) {
  const cls =
    "apple-press grid size-9 place-items-center rounded-full text-foreground/80 hover:bg-foreground/6 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:text-(--label-3)";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href && newTab ? (
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={cls}>
            {children}
          </a>
        ) : href ? (
          <Link href={href} aria-label={label} className={cls}>
            {children}
          </Link>
        ) : (
          <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className={cls}>
            {children}
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent className="rounded-lg">
        {label}
        {shortcut && <kbd className="ms-1.5 font-mono opacity-70">{shortcut}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

export default function BuilderTopBar() {
  const { storeName, previewDevice, setPreviewDevice, previewPath, setPreviewPath, editMode, setEditMode, status, undo, redo, saving } =
    useBuilder();
  const pages = useStudioPages();
  const known = pages.some((p) => p.path === previewPath);
  const mod = isMac() ? "⌘" : "Ctrl+";

  return (
    <TooltipProvider delayDuration={300}>
      <header className="apple-glass relative z-20 mx-3 mt-3 grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-full ps-2 pe-2.5">
        {/* Start: back + store + status */}
        <div className="flex min-w-0 items-center gap-2">
          <IconButton label={tr("رجوع للوحة التحكم")} href="/dashboard">
            <ChevronRight className="size-5 ltr:-scale-x-100" strokeWidth={2.2} />
          </IconButton>
          <div className="min-w-0">
            <p className="truncate text-[15px] leading-5 font-semibold">{storeName}</p>
            <SaveStatus />
          </div>
        </div>

        {/* Center: page + device + edit/browse */}
        <div className="flex items-center gap-2">
          <Select value={known ? previewPath : "__custom"} onValueChange={(v) => v !== "__custom" && setPreviewPath(v)} dir={tdir()}>
            <SelectTrigger aria-label={tr("الصفحة المعروضة")} className="h-9 w-40 rounded-full border-0 bg-foreground/6 text-[13px] shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {pages.map((p) => (
                <SelectItem key={p.path} value={p.path} className="text-[13px]">
                  {p.label}
                </SelectItem>
              ))}
              {!known && (
                <SelectItem value="__custom" className="text-[13px]" disabled>
                  <span dir="ltr">{previewPath}</span>
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <div className="flex rounded-full bg-foreground/6 p-[3px]" role="radiogroup" aria-label={tr("حجم الشاشة")}>
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
                      "grid h-8 w-10 place-items-center rounded-full transition-[background-color,box-shadow,color] duration-200 ease-(--ease-apple)",
                      previewDevice === id
                        ? "bg-card text-foreground shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]"
                        : "text-foreground/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="rounded-lg">
                  {label} <kbd className="ms-1 font-mono opacity-70">{key}</kbd>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <div className="flex rounded-full bg-foreground/6 p-[3px]" role="radiogroup" aria-label={tr("وضع المعاينة")}>
            {(
              [
                [true, MousePointerClick, tr("تعديل بالضغط")],
                [false, Hand, tr("تصفّح المتجر")],
              ] as const
            ).map(([on, Icon, label]) => (
              <Tooltip key={String(on)}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={editMode === on}
                    aria-label={label}
                    onClick={() => setEditMode(on)}
                    className={cn(
                      "flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] transition-[background-color,box-shadow,color] duration-200 ease-(--ease-apple)",
                      editMode === on
                        ? "bg-card font-semibold text-foreground shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]"
                        : "text-foreground/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="hidden xl:inline">{on ? tr("تعديل") : tr("تصفّح")}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="rounded-lg">
                  {label} <kbd className="ms-1 font-mono opacity-70">E</kbd>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* End: history + preview + publish */}
        <div className="flex items-center justify-end gap-0.5">
          <IconButton label={tr("تراجع")} shortcut={`${mod}Z`} onClick={undo} disabled={!status.canUndo || saving > 0}>
            <Undo2 className="size-[18px] ltr:-scale-x-100" />
          </IconButton>
          <IconButton label={tr("إعادة")} shortcut={`${mod}⇧Z`} onClick={redo} disabled={!status.canRedo || saving > 0}>
            <Redo2 className="size-[18px] ltr:-scale-x-100" />
          </IconButton>
          <IconButton label={tr("افتح المعاينة في تاب جديد")} href={`/api/studio/preview?path=${encodeURIComponent(previewPath)}`} newTab>
            <Eye className="size-[18px]" />
          </IconButton>
          <span aria-hidden className="mx-1.5 h-5 w-px bg-border" />
          <PublishControl />
        </div>
      </header>
    </TooltipProvider>
  );
}
