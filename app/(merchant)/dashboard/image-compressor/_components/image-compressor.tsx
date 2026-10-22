"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Download, ImageDown, ImagePlus, Images, Loader2, Lock, MoveHorizontal, Scale, X } from "lucide-react";

import { SegmentedButtons, appleButton } from "@/components/saas-page";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ONE_MB, compressImage, isCompressible, type CompressFormat } from "@/lib/image-compress";
import { cn } from "@/lib/utils";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";

type Target = "300" | "500" | "1000";
type Settings = { target: Target; format: CompressFormat };

type Item = {
  id: string;
  original: File;
  previewUrl: string;
  status: "working" | "done" | "error";
  result?: File;
  resultUrl?: string;
  error?: string;
};

const nf = lazyIntl.number({ maximumFractionDigits: 1 });
const pf = lazyIntl.number({ style: "percent", maximumFractionDigits: 0 });

function formatBytes(bytes: number) {
  return bytes >= ONE_MB ? `${nf.format(bytes / ONE_MB)} MB` : `${nf.format(Math.max(1, Math.round(bytes / 1024)))} KB`;
}

// 1000 KB rather than 1024, so "1 MB" holds by either definition.
const targetBytes = (t: Target) => Number(t) * 1000;

const glassChip = "bg-black/45 text-white backdrop-blur-md";

function FilePicker({ onFiles }: { onFiles: (files: File[]) => void }) {
  return (
    <input
      type="file"
      accept="image/*"
      multiple
      className="sr-only"
      onChange={(e) => {
        onFiles(Array.from(e.target.files ?? []));
        e.target.value = "";
      }}
    />
  );
}

/** Photos-style compressor: drop anywhere, a grid of results, settings on a floating glass bar. */
export function ImageCompressor() {
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettings] = useState<Settings>({ target: "1000", format: "image/jpeg" });
  const [dragging, setDragging] = useState(false);
  const [comparing, setComparing] = useState<string | null>(null);
  // Bumped on every settings change so results from older settings are dropped.
  const generation = useRef(0);
  const urls = useRef(new Set<string>());
  const addRef = useRef<(files: File[]) => void>(() => {});

  const track = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    urls.current.add(url);
    return url;
  };
  const release = (url?: string) => {
    if (url && urls.current.delete(url)) URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const all = urls.current;
    return () => all.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // The whole page is a drop target, like dropping onto Photos.
  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: DragEvent) => Boolean(e.dataTransfer?.types.includes("Files"));
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth++;
      setDragging(true);
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const over = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      addRef.current(Array.from(e.dataTransfer?.files ?? []));
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
    };
  }, []);

  async function run(batch: Item[], s: Settings) {
    const gen = generation.current;
    // One at a time keeps memory flat with big camera photos.
    for (const item of batch) {
      let patch: Partial<Item>;
      try {
        const result = await compressImage(item.original, { maxBytes: targetBytes(s.target), format: s.format });
        patch = { status: "done", result, error: undefined };
      } catch (err) {
        patch = { status: "error", result: undefined, error: err instanceof Error ? err.message : tr("حصلت مشكلة") };
      }
      if (gen !== generation.current) return;
      const resultUrl = patch.result ? track(patch.result) : undefined;
      setItems((list) =>
        list.map((it) => {
          if (it.id !== item.id) return it;
          release(it.resultUrl);
          return { ...it, ...patch, resultUrl };
        }),
      );
    }
  }

  function add(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    const fresh: Item[] = images.map((file) => ({
      id: crypto.randomUUID(),
      original: file,
      previewUrl: track(file),
      status: "working",
    }));
    setItems((list) => [...list, ...fresh]);
    run(fresh, settings);
  }
  useEffect(() => {
    addRef.current = add;
  });

  function changeSettings(next: Settings) {
    setSettings(next);
    generation.current++;
    const redo = items.map((it) => ({ ...it, status: "working" as const }));
    setItems(redo);
    run(redo, next);
  }

  function remove(id: string) {
    setItems((list) => {
      const gone = list.find((it) => it.id === id);
      release(gone?.previewUrl);
      release(gone?.resultUrl);
      return list.filter((it) => it.id !== id);
    });
  }

  function clear() {
    generation.current++;
    items.forEach((it) => {
      release(it.previewUrl);
      release(it.resultUrl);
    });
    setItems([]);
  }

  const done = items.filter((it) => it.status === "done" && it.result && it.resultUrl);
  const workingCount = items.filter((it) => it.status === "working").length;
  const before = done.reduce((sum, it) => sum + it.original.size, 0);
  const after = done.reduce((sum, it) => sum + it.result!.size, 0);
  const compared = items.find((it) => it.id === comparing && it.resultUrl);

  function download(it: Item) {
    const a = document.createElement("a");
    a.href = it.resultUrl!;
    a.download = it.result!.name;
    a.click();
  }

  function downloadAll() {
    // Staggered clicks; browsers may ask once to allow multiple downloads.
    done.forEach((it, i) => setTimeout(() => download(it), i * 250));
  }

  return (
    <div className="space-y-5">
      {items.length === 0 ? (
        <EmptyHero onFiles={add} />
      ) : (
        <>
          <Summary
            count={items.length}
            doneCount={done.length}
            working={workingCount}
            before={before}
            after={after}
            onClear={clear}
          />

          <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((it) => (
              <Tile
                key={it.id}
                item={it}
                onCompare={() => setComparing(it.id)}
                onDownload={() => download(it)}
                onRemove={() => remove(it.id)}
              />
            ))}
            <li>
              <label className="apple-press flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-(--label-3)/45 text-primary transition-colors duration-200 ease-(--ease-apple) focus-within:ring-2 focus-within:ring-ring hover:bg-primary/6">
                <ImagePlus className="size-7" strokeWidth={1.6} />
                <span className="text-[15px]">{tr("ضيف صور")}</span>
                <FilePicker onFiles={add} />
              </label>
            </li>
          </ul>
        </>
      )}

      <p className="px-1 text-center text-[13px] leading-[18px] text-muted-foreground">
        {settings.format === "image/webp"
          ? tr("WEBP أصغر بنفس الجودة وبيحافظ على الخلفية الشفافة.")
          : tr("JPG بيفتح في أي مكان. الخلفية الشفافة بتبقى بيضا.")}
      </p>

      {/* Functional layer: settings + the one prominent action float over the content. */}
      <div className="pointer-events-none sticky bottom-4 z-20 flex justify-center pb-[env(safe-area-inset-bottom)]">
        <div className="apple-glass pointer-events-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 rounded-[26px] p-1.5 sm:flex-nowrap sm:rounded-full">
          <SegmentedButtons
            label={tr("أقصى حجم")}
            value={settings.target}
            onChange={(target) => changeSettings({ ...settings, target })}
            className="bg-transparent"
            options={[
              ["300", "300 KB"],
              ["500", "500 KB"],
              ["1000", "1 MB"],
            ]}
          />
          <span aria-hidden className="hidden h-5 w-px bg-border sm:block" />
          <SegmentedButtons
            label={tr("الصيغة")}
            value={settings.format}
            onChange={(format) => changeSettings({ ...settings, format })}
            className="bg-transparent"
            options={[
              ["image/jpeg", "JPG"],
              ["image/webp", "WEBP"],
            ]}
          />
          {done.length > 0 && (
            <button
              type="button"
              onClick={downloadAll}
              disabled={workingCount > 0}
              className={cn(appleButton.filled, "h-9 px-4 animate-in fade-in zoom-in-95 duration-300 disabled:opacity-50")}
            >
              <Download className="size-4" />
              {done.length === 1 ? tr("تنزيل") : tr("تنزيل الكل ({0})", nf.format(done.length))}
            </button>
          )}
        </div>
      </div>

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-background/55 p-6 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-[28px] border-2 border-dashed border-primary bg-primary/6 px-8 py-14 text-center motion-safe:animate-in motion-safe:zoom-in-95">
            <ImageDown className="size-12 text-primary" strokeWidth={1.4} />
            <p className="text-[22px] leading-7 font-bold">{tr("افلت الصور هنا")}</p>
            <p className="text-[15px] text-muted-foreground">{tr("هنضغطها على جهازك على طول")}</p>
          </div>
        </div>
      )}

      <Dialog open={Boolean(compared)} onOpenChange={(o) => !o && setComparing(null)}>
        <DialogContent dir={tdir()} showCloseButton={false} className="apple-ui gap-0 overflow-hidden bg-background p-0 text-foreground sm:max-w-3xl">
          {compared && <Compare item={compared} onDownload={() => download(compared)} onDone={() => setComparing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyHero({ onFiles }: { onFiles: (files: File[]) => void }) {
  const facts = [
    { icon: Lock, text: tr("على جهازك — مش بتترفع لأي مكان") },
    { icon: Scale, text: tr("لحد 1 ميجا من غير ما الجودة تبان") },
    { icon: Images, text: tr("كذا صورة مرة واحدة") },
  ];
  return (
    <section className="apple-card flex flex-col items-center px-6 pt-14 pb-8 text-center sm:pt-20">
      <span className="grid size-[72px] place-items-center rounded-[20px] bg-linear-to-b from-primary/75 to-primary text-primary-foreground shadow-[0_8px_24px_-10px_var(--primary)]">
        <ImageDown className="size-9" strokeWidth={1.7} />
      </span>
      <h2 className="mt-6 text-[28px] leading-[34px] font-bold ltr:tracking-[-0.015em]">{tr("اسحب صورك لأي حتة في الصفحة")}</h2>
      <p className="mt-2 max-w-md text-[17px] leading-[22px] text-muted-foreground">
        {tr("هنصغّرها للحجم اللي تختاره تحت، وتنزّلها جاهزة للرفع على متجرك.")}
      </p>
      <label className={cn(appleButton.filled, "mt-7 h-[50px] cursor-pointer px-7 text-[17px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2")}>
        <ImagePlus className="size-5" />
        {tr("اختار صور")}
        <FilePicker onFiles={onFiles} />
      </label>
      <p className="mt-3 text-[13px] text-muted-foreground">JPG · PNG · WEBP</p>

      <ul className="mt-14 grid w-full max-w-2xl grid-cols-1 gap-4 border-t-[0.5px] border-border pt-6 sm:grid-cols-3">
        {facts.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2.5 text-start text-[13px] leading-[18px] text-muted-foreground sm:flex-col sm:text-center">
            <Icon className="size-5 shrink-0 text-foreground/70" strokeWidth={1.6} />
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Summary({
  count,
  doneCount,
  working,
  before,
  after,
  onClear,
}: {
  count: number;
  doneCount: number;
  working: number;
  before: number;
  after: number;
  onClear: () => void;
}) {
  const saved = before ? 1 - after / before : 0;
  const progress = count ? (count - working) / count : 0;
  return (
    <section className="apple-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted-foreground">{working ? tr("بنضغط…") : tr("وفّرت")}</p>
          {working ? (
            <p className="mt-1 text-[34px] leading-[41px] font-bold tabular-nums ltr:tracking-[-0.02em]">
              {tr("{0} من {1}", nf.format(count - working), nf.format(count))}
            </p>
          ) : (
            <p className="mt-1 text-[48px] leading-[52px] font-bold tabular-nums ltr:tracking-[-0.025em]">{pf.format(saved)}</p>
          )}
          {doneCount > 0 && (
            <p className="mt-1 text-[15px] text-muted-foreground">
              <span dir="ltr" className="tabular-nums">
                {formatBytes(before)} → {formatBytes(after)}
              </span>
              <span className="text-(--label-3)"> · </span>
              {tr("{0} صورة", nf.format(doneCount))}
            </p>
          )}
        </div>
        <button type="button" onClick={onClear} className={cn(appleButton.plain, "mx-0 shrink-0")}>
          {tr("مسح الكل")}
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {working ? (
          <Bar fraction={progress} className="bg-primary" label={tr("التقدم")} />
        ) : (
          <>
            <Bar fraction={1} className="bg-(--sys-gray)/45" label={tr("قبل")} value={formatBytes(before)} />
            <Bar fraction={before ? after / before : 0} className="bg-(--sys-green)" label={tr("بعد")} value={formatBytes(after)} />
          </>
        )}
      </div>
    </section>
  );
}

function Bar({ fraction, className, label, value }: { fraction: number; className: string; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3 text-[13px]">
      <span className="w-10 shrink-0 text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-(--fill-3)">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 ease-(--ease-apple)", className)}
          style={{ width: `${Math.max(fraction * 100, fraction > 0 ? 2 : 0)}%` }}
        />
      </div>
      {value && (
        <span dir="ltr" className="w-16 shrink-0 text-end tabular-nums text-muted-foreground">
          {value}
        </span>
      )}
    </div>
  );
}

function Tile({
  item,
  onCompare,
  onDownload,
  onRemove,
}: {
  item: Item;
  onCompare: () => void;
  onDownload: () => void;
  onRemove: () => void;
}) {
  const { original, result, status } = item;
  const unchanged = result === original;
  const saved = result ? 1 - result.size / original.size : 0;
  const ready = status === "done" && result && item.resultUrl;

  return (
    <li className="group min-w-0 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300">
      <div className="relative aspect-square overflow-hidden rounded-[18px] bg-muted">
        <button
          type="button"
          onClick={onCompare}
          disabled={!ready || unchanged}
          aria-label={tr("قارن قبل وبعد: {0}", original.name)}
          className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-default"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img
            src={item.resultUrl ?? item.previewUrl}
            alt=""
            className={cn(
              "size-full object-cover transition-[transform,filter] duration-500 ease-(--ease-apple)",
              status === "working" && "scale-105 blur-sm brightness-90",
              ready && !unchanged && "group-hover:scale-[1.03]",
            )}
          />
        </button>

        {status === "working" && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className={cn("grid size-11 place-items-center rounded-full", glassChip)}>
              <Loader2 className="size-5 animate-spin" />
            </span>
          </div>
        )}

        {status === "error" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/55 px-3 text-center text-white">
            <AlertCircle className="size-6" />
            <span className="line-clamp-3 text-[12px] leading-4">{item.error}</span>
          </div>
        )}

        {ready && (
          <span
            className={cn(
              "pointer-events-none absolute bottom-2 inset-s-2 rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums",
              unchanged ? glassChip : "bg-(--sys-green) text-white",
            )}
          >
            {unchanged ? (isCompressible(original) ? tr("صغيرة أصلًا") : tr("زي ما هي")) : `−${pf.format(saved)}`}
          </span>
        )}

        {ready && !unchanged && (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute bottom-2 inset-e-2 grid size-7 place-items-center rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100",
              glassChip,
            )}
          >
            <MoveHorizontal className="size-3.5" />
          </span>
        )}

        <button
          type="button"
          onClick={onRemove}
          aria-label={tr("شيل {0}", original.name)}
          className={cn(
            "apple-press absolute top-2 inset-e-2 grid size-8 place-items-center rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
            glassChip,
          )}
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-2 flex items-start gap-2 px-0.5">
        <div className="min-w-0 flex-1">
          <p dir="auto" className="truncate text-[13px] leading-[18px] font-medium">
            {result?.name ?? original.name}
          </p>
          <p dir="ltr" className="truncate text-[12px] leading-4 text-muted-foreground tabular-nums rtl:text-right">
            {ready && !unchanged ? `${formatBytes(original.size)} → ${formatBytes(result.size)}` : formatBytes(original.size)}
          </p>
        </div>
        {ready && (
          <button
            type="button"
            onClick={onDownload}
            aria-label={tr("تنزيل {0}", result.name)}
            className={cn(appleButton.more, "-mt-0.5 size-9 shrink-0")}
          >
            <Download className="size-4" />
          </button>
        )}
      </div>
    </li>
  );
}

function Compare({ item, onDownload, onDone }: { item: Item; onDownload: () => void; onDone: () => void }) {
  const [split, setSplit] = useState(50);
  const result = item.result!;

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
        <div className="min-w-0">
          <DialogTitle dir="auto" className="truncate text-[17px] font-semibold">
            {result.name}
          </DialogTitle>
          <DialogDescription dir="ltr" className="text-[13px] tabular-nums rtl:text-right">
            {formatBytes(item.original.size)} → {formatBytes(result.size)}
          </DialogDescription>
        </div>
      </div>

      {/* Always LTR so "before" stays on the left of the divider. */}
      <div dir="ltr" className="relative mx-5 overflow-hidden rounded-[14px] bg-[repeating-conic-gradient(var(--fill-3)_0_25%,transparent_0_50%)] bg-size-[16px_16px] select-none">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
        <img src={item.previewUrl} alt={tr("قبل")} className="mx-auto block max-h-[62vh] w-full object-contain" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
        <img
          src={item.resultUrl}
          alt={tr("بعد")}
          className="absolute inset-0 size-full object-contain"
          style={{ clipPath: `inset(0 0 0 ${split}%)` }}
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_8px_rgb(0_0_0/0.35)]" style={{ left: `${split}%` }}>
          <span className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow-lg">
            <MoveHorizontal className="size-4" />
          </span>
        </div>
        <span className={cn("pointer-events-none absolute top-3 left-3 rounded-full px-2.5 py-1 text-[12px] font-medium", glassChip)}>{tr("قبل")}</span>
        <span className={cn("pointer-events-none absolute top-3 right-3 rounded-full px-2.5 py-1 text-[12px] font-medium", glassChip)}>{tr("بعد")}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          aria-label={tr("حرّك عشان تقارن")}
          className="absolute inset-0 size-full cursor-ew-resize opacity-0"
        />
      </div>
      <p className="px-5 pt-3 text-center text-[13px] text-muted-foreground">{tr("حرّك الخط عشان تشوف الفرق")}</p>

      <div className="mt-4 grid grid-cols-2 border-t-[0.5px] border-border">
        <button type="button" onClick={onDone} className="h-12 text-[17px] text-primary hover:bg-(--fill-3)/60">
          {tr("تم")}
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex h-12 items-center justify-center gap-1.5 border-s-[0.5px] border-border text-[17px] font-semibold text-primary hover:bg-(--fill-3)/60"
        >
          <Download className="size-4" />
          {tr("تنزيل")}
        </button>
      </div>
    </>
  );
}
