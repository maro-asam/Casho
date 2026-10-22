"use client";

import { useState } from "react";
import { ExternalLink, FileDown, Link2, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { appleButton } from "@/components/saas-page";
import { cn } from "@/lib/utils";
import { imageSource, uploadFileToCloudinary } from "@/lib/cloudinary-upload";
import { tr } from "@/lib/i18n/dashboard";

const MAX_FILE_MB = 10;

type Props = {
  initialUrl?: string | null;
  initialFileName?: string | null;
  onUploadingChange?: (uploading: boolean) => void;
};

/** The file or link a digital product delivers — an upload or a pasted link, never both. */
export function DigitalInput({ initialUrl, initialFileName, onUploadingChange }: Props) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [fileName, setFileName] = useState(initialFileName ?? "");
  const [mode, setMode] = useState<"file" | "link">(initialUrl && !initialFileName ? "link" : "file");
  const [uploading, setUploading] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    onUploadingChange?.(true);
    try {
      setUrl(await uploadFileToCloudinary(file, "casho/uploads/digital", MAX_FILE_MB));
      setFileName(file.name);
      toast.success(tr("الملف اترفع"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr("فشل رفع الملف"));
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  }

  function clear() {
    setUrl("");
    setFileName("");
  }

  const hasFile = mode === "file" && url && fileName;

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label={tr("طريقة التسليم")} className="inline-flex rounded-full bg-(--sys-gray)/14 p-[3px]">
        {(
          [
            ["file", tr("ملف"), Upload],
            ["link", tr("لينك"), Link2],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => {
              if (mode !== value) clear();
              setMode(value);
            }}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] transition-[background-color,box-shadow] duration-200 ease-(--ease-apple)",
              mode === value ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        hasFile ? (
          <div className="flex items-center gap-3 rounded-xl bg-background px-3 py-2.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-linear-to-b from-[#636366] to-[#48484a] text-white">
              <FileDown className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p dir="auto" className="truncate text-[15px] font-medium">
                {fileName}
              </p>
              <p className="text-[12px] text-muted-foreground">{tr("العميل هينزّله بعد ما يدفع")}</p>
            </div>
            <a href={url} target="_blank" rel="noreferrer" aria-label={tr("افتح الملف")} className={cn(appleButton.more, "size-8")}>
              <ExternalLink className="size-4" />
            </a>
            <button type="button" onClick={clear} aria-label={tr("شيل الملف")} className={cn(appleButton.more, "size-8 text-(--sys-red)")}>
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label
            className={cn(
              "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-(--label-3)/60 bg-background px-6 py-6 text-center transition-colors hover:bg-muted/60 focus-within:ring-2 focus-within:ring-primary/40",
              uploading && "pointer-events-none opacity-70",
            )}
          >
            {uploading ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="size-6 text-primary" strokeWidth={1.7} />
            )}
            <span className="text-[15px] text-primary">{uploading ? tr("بنرفع الملف…") : tr("ارفع الملف")}</span>
            <span className="text-[12px] text-muted-foreground">
              {tr("PDF أو ZIP أو أي ملف · لحد {0} ميجا — الأكبر حطه على Drive واستخدم لينك", MAX_FILE_MB)}
            </span>
            <input type="file" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
          </label>
        )
      ) : (
        <div className="space-y-1.5">
          <Input
            type="url"
            dir="ltr"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setFileName("");
            }}
            placeholder="https://drive.google.com/…"
          />
          <p className="px-1 text-[12px] text-muted-foreground">
            {url.trim() && /^https?:\/\//.test(url.trim())
              ? tr("العميل هيتنقل لـ {0} بعد الدفع.", imageSource(url.trim()))
              : tr("لينك Drive أو Dropbox أو كورس أو أي صفحة — اتأكد إنه مفتوح لأي حد معاه اللينك.")}
          </p>
        </div>
      )}

      <input type="hidden" name="digitalUrl" value={url.trim()} />
      <input type="hidden" name="digitalFileName" value={mode === "file" ? fileName : ""} />
    </div>
  );
}
