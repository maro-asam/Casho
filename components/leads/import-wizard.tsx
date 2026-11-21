"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadDuplicateMode, LeadSource } from "@prisma/client";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { appleButton } from "@/components/saas-page";
import { analyzeLeadImportAction, appendLeadImportRowsAction, createLeadImportAction } from "@/actions/leads/lead-import.actions";
import { DUPLICATE_MODE_LABELS, LEAD_SOURCES, SOURCE_LABELS } from "@/lib/leads/constants";
import {
  IMPORT_FIELDS,
  IMPORT_LIMITS,
  applyMapping,
  autoMapColumns,
  checkImportRow,
  fileTypeOf,
  inFileDuplicates,
  mappingProblems,
  type ColumnMapping,
  type ImportFieldKey,
  type ImportFileType,
} from "@/lib/leads/import";
import { cn } from "@/lib/utils";
import type { RepOption } from "./admin-lead-actions";

type Parsed = { fileName: string; fileType: ImportFileType; hash: string; headers: string[]; rows: Record<string, string>[] };

const NONE = "__none";
const nf = new Intl.NumberFormat("ar-EG");

async function sha256(buf: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Parse in the browser — the server never runs a spreadsheet parser on an uploaded file. */
async function parseFile(file: File): Promise<Parsed> {
  const fileType = fileTypeOf(file.name);
  if (!fileType) throw new Error("نوع الملف لازم يكون CSV أو XLSX أو XLS");
  if (file.size > IMPORT_LIMITS.maxFileSize) throw new Error("الملف أكبر من ٥ ميجا — قسّمه لملفات أصغر");
  if (file.size === 0) throw new Error("الملف فاضي");

  const buf = await file.arrayBuffer();
  const XLSX = await import("xlsx");
  const wb =
    fileType === "csv"
      ? XLSX.read(new TextDecoder("utf-8").decode(buf).replace(/^﻿/, ""), { type: "string", raw: true, cellFormula: false, cellHTML: false })
      : XLSX.read(buf, { type: "array", cellFormula: false, cellHTML: false, cellStyles: false, bookVBA: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error("الملف مفيهوش شيتات");

  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false, blankrows: false });
  if (grid.length < 2) throw new Error("الملف لازم يكون فيه صف عناوين وصف بيانات واحد على الأقل");
  const rawHeaders = (grid[0] ?? []).map((h) => String(h ?? "").trim());
  if (rawHeaders.length > IMPORT_LIMITS.maxColumns) throw new Error(`أعمدة كتير (${rawHeaders.length}) — الحد ${IMPORT_LIMITS.maxColumns}`);
  // Unique, non-empty headers ("عمود 3" for blanks, "الاسم (2)" for repeats).
  const seen = new Map<string, number>();
  const headers = rawHeaders.map((h, i) => {
    const base = h.slice(0, 80) || `عمود ${i + 1}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base} (${n})`;
  });
  const body = grid.slice(1).filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
  if (body.length === 0) throw new Error("مفيش صفوف بيانات تحت العناوين");
  if (body.length > IMPORT_LIMITS.maxRows) throw new Error(`الملف فيه ${nf.format(body.length)} صف — الحد ${nf.format(IMPORT_LIMITS.maxRows)}. قسّمه.`);
  const rows = body.map((r) => Object.fromEntries(headers.map((h, i) => [h, String(r[i] ?? "").slice(0, IMPORT_LIMITS.maxCellLength)])));

  return { fileName: file.name, fileType, hash: await sha256(buf), headers, rows };
}

export function ImportWizard({ reps }: { reps: RepOption[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [mode, setMode] = useState<LeadDuplicateMode>("SKIP");
  const [source, setSource] = useState<string>("");
  const [rep, setRep] = useState<string>("");
  const [progress, setProgress] = useState<{ done: number; total: number; stage: string } | null>(null);
  const [repeatOf, setRepeatOf] = useState<{ id: string; createdAt: Date; fileName: string } | null>(null);
  const [dragging, setDragging] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setParsing(true);
    try {
      const p = await parseFile(file);
      setParsed(p);
      setMapping(autoMapColumns(p.headers));
      setRepeatOf(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "مقدرناش نقرا الملف — اتأكد إنه CSV أو Excel سليم");
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  // Client-side preview of what the server will decide (it re-checks everything).
  const preview = useMemo(() => {
    if (!parsed) return null;
    const checks = parsed.rows.map((r) => {
      const values = applyMapping(r, mapping);
      const c = checkImportRow(values);
      return { values, c };
    });
    // Same rule as the server: only valid rows take part in duplicate detection.
    const dupes = inFileDuplicates(checks.map(({ c }) => (c.ok ? { normalizedPhone: c.normalizedPhone, email: c.lead.email } : { normalizedPhone: null, email: null })));
    const invalid = checks.filter((x) => !x.c.ok).length;
    return { checks, invalid, fileDupes: dupes.size, valid: checks.length - invalid - dupes.size, dupes };
  }, [parsed, mapping]);

  const problems = parsed ? mappingProblems(mapping) : [];

  async function upload(confirmRepeat = false) {
    if (!parsed || problems.length) return;
    setProgress({ done: 0, total: parsed.rows.length, stage: "بنجهّز الاستيراد…" });
    try {
      const created = await createLeadImportAction({
        fileName: parsed.fileName,
        fileHash: parsed.hash,
        fileType: parsed.fileType,
        totalRows: parsed.rows.length,
        mapping,
        duplicateMode: mode,
        assignRepId: rep || null,
        defaultSource: (source || null) as LeadSource | null,
        confirmRepeat,
      });
      if (!created.success || !created.importId) {
        if (created.repeatOf) setRepeatOf(created.repeatOf);
        else toast.error(created.message);
        setProgress(null);
        return;
      }
      const importId = created.importId;
      for (let i = 0; i < parsed.rows.length; i += IMPORT_LIMITS.chunkSize) {
        const chunk = parsed.rows.slice(i, i + IMPORT_LIMITS.chunkSize).map((r, j) => ({ rowNumber: i + j + 1, values: applyMapping(r, mapping) as Record<string, string> }));
        // One retry per chunk — appends are idempotent on (import, row number).
        let res = await appendLeadImportRowsAction({ importId, rows: chunk });
        if (!res.success) res = await appendLeadImportRowsAction({ importId, rows: chunk });
        if (!res.success) throw new Error(res.message);
        setProgress({ done: Math.min(parsed.rows.length, i + chunk.length), total: parsed.rows.length, stage: "بنرفع الصفوف…" });
      }
      setProgress({ done: parsed.rows.length, total: parsed.rows.length, stage: "بنشوف المكرر…" });
      const analyzed = await analyzeLeadImportAction({ importId });
      if (!analyzed.success) throw new Error(analyzed.message);
      router.push(`/admin/leads/imports/${importId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "الرفع وقف — جرّب تاني");
      setProgress(null);
    }
  }

  if (!parsed) {
    return (
      <section className="apple-card space-y-4 p-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void onFile(e.dataTransfer.files?.[0]);
          }}
          className={cn("flex flex-col items-center gap-3 rounded-[18px] border-2 border-dashed border-border px-6 py-10 text-center transition-colors", dragging && "border-primary bg-primary/5")}
        >
          <FileSpreadsheet className="size-10 text-(--label-3)" strokeWidth={1.4} />
          <div className="space-y-1">
            <p className="text-[17px] font-semibold">ارفع ملف الليدز</p>
            <p className="text-[14px] text-muted-foreground">CSV أو Excel (xlsx / xls) — لحد {nf.format(IMPORT_LIMITS.maxRows)} صف و٥ ميجا. أول شيت بس.</p>
          </div>
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="sr-only" id="lead-file" onChange={(e) => void onFile(e.target.files?.[0])} />
          <label htmlFor="lead-file" className={cn(appleButton.filled, "cursor-pointer")}>
            {parsing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {parsing ? "بنقرا الملف…" : "اختار ملف"}
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[14px]">
          <span className="text-muted-foreground">قالب كاشو للاستيراد:</span>
          <a href="/api/admin/leads/template?format=xlsx" className={appleButton.plain}>
            <Download className="size-4" />
            Excel
          </a>
          <a href="/api/admin/leads/template?format=csv" className={appleButton.plain}>
            <Download className="size-4" />
            CSV
          </a>
        </div>
      </section>
    );
  }

  const sample = (header: string) => parsed.rows.find((r) => r[header]?.trim())?.[header] ?? "";
  const firstRows = preview!.checks.slice(0, 8);

  return (
    <div className="space-y-4">
      <section className="apple-card flex items-center gap-3 p-4">
        <FileSpreadsheet className="size-8 shrink-0 text-(--sys-green)" strokeWidth={1.5} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold" dir="auto">
            {parsed.fileName}
          </p>
          <p className="text-[13px] text-muted-foreground">
            {nf.format(parsed.rows.length)} صف · {nf.format(parsed.headers.length)} عمود
          </p>
        </div>
        <button type="button" onClick={() => setParsed(null)} disabled={!!progress} className={appleButton.tinted}>
          <X className="size-4" />
          ملف تاني
        </button>
      </section>

      <section className="apple-card overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-[17px] font-semibold">١. وصّل الأعمدة</h2>
          <p className="text-[13px] text-muted-foreground">خمّنا من أسماء الأعمدة. غيّر اللي محتاج، أو سيبه «متجاهل».</p>
        </div>
        <ul className="apple-rows border-t-[0.5px] border-border">
          {parsed.headers.map((h) => (
            <li key={h} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium" dir="auto">
                  {h}
                </p>
                <p className="truncate text-[12px] text-muted-foreground" dir="auto">
                  مثال: {sample(h) || "—"}
                </p>
              </div>
              <Select value={mapping[h] || NONE} onValueChange={(v) => setMapping((m) => ({ ...m, [h]: v === NONE ? "" : (v as ImportFieldKey) }))} dir="rtl">
                <SelectTrigger aria-label={`حقل العمود ${h}`} className={cn("h-10 w-full rounded-[10px] sm:w-56", !mapping[h] && "text-muted-foreground")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>متجاهل</SelectItem>
                  {IMPORT_FIELDS.map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      {f.label}
                      {f.required ? " *" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
          ))}
        </ul>
        {problems.length > 0 && (
          <div role="alert" className="flex gap-2 border-t-[0.5px] border-border bg-(--sys-red)/6 px-5 py-3 text-[14px] text-(--sys-red)">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {problems.join(" · ")}
          </div>
        )}
      </section>

      <section className="apple-card space-y-4 p-5">
        <h2 className="text-[17px] font-semibold">٢. الإعدادات</h2>
        <div role="radiogroup" aria-label="المكرر" className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(DUPLICATE_MODE_LABELS) as LeadDuplicateMode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={cn("rounded-[14px] px-4 py-3 text-start transition-colors", mode === m ? "bg-primary/10 ring-2 ring-primary" : "bg-(--fill-3)")}
            >
              <p className="text-[15px] font-semibold">{DUPLICATE_MODE_LABELS[m].label}</p>
              <p className="text-[13px] text-muted-foreground">{DUPLICATE_MODE_LABELS[m].hint}</p>
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-muted-foreground">المصدر للصفوف اللي مفيهاش مصدر</p>
            <Select value={source || NONE} onValueChange={(v) => setSource(v === NONE ? "" : v)} dir="rtl">
              <SelectTrigger className="h-11 w-full rounded-[10px]" aria-label="المصدر الافتراضي">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>من غير مصدر</SelectItem>
                {LEAD_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SOURCE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-muted-foreground">اسند الليدز الجديدة لمندوب (اختياري)</p>
            <Select value={rep || NONE} onValueChange={(v) => setRep(v === NONE ? "" : v)} dir="rtl">
              <SelectTrigger className="h-11 w-full rounded-[10px]" aria-label="المندوب">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>من غير مندوب</SelectItem>
                {reps
                  .filter((r) => r.active)
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="apple-card overflow-hidden">
        <div className="flex flex-col gap-2 px-5 pt-5 pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[17px] font-semibold">٣. معاينة</h2>
            <p className="text-[13px] text-muted-foreground">أول ٨ صفوف. التكرار مع ليدز كاشو الموجودة بيبان بعد الرفع.</p>
          </div>
          <p className="text-[14px] tabular-nums">
            <span className="text-(--sys-green)">{nf.format(preview!.valid)} سليم</span>
            <span className="text-muted-foreground"> · </span>
            <span className={preview!.invalid ? "text-(--sys-red)" : "text-muted-foreground"}>{nf.format(preview!.invalid)} فيه غلط</span>
            <span className="text-muted-foreground"> · </span>
            <span className={preview!.fileDupes ? "text-(--sys-orange)" : "text-muted-foreground"}>{nf.format(preview!.fileDupes)} متكرر</span>
          </p>
        </div>
        <ul className="apple-rows border-t-[0.5px] border-border">
          {firstRows.map(({ values, c }, i) => (
            <li key={i} className="flex items-start gap-3 px-5 py-2.5 text-[14px]">
              <span className="w-8 shrink-0 pt-0.5 text-[12px] tabular-nums text-muted-foreground">{nf.format(i + 2)}</span>
              {c.ok && !preview!.dupes.has(i) ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-(--sys-green)" />
              ) : (
                <AlertTriangle className={cn("mt-0.5 size-4 shrink-0", c.ok ? "text-(--sys-orange)" : "text-(--sys-red)")} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium" dir="auto">
                  {values.businessName || "—"} <span className="font-normal text-muted-foreground" dir="ltr">{values.phone}</span>
                </p>
                {!c.ok && <p className="text-[13px] text-(--sys-red)">{c.errors.join(" · ")}</p>}
                {c.ok && preview!.dupes.has(i) && <p className="text-[13px] text-(--sys-orange)">متكرر مع صف قبله في الملف</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {repeatOf && (
        <div role="alert" className="apple-card flex flex-col gap-3 border-s-4 border-(--sys-orange) p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-[14px]">
            <span className="font-semibold">الملف ده نفسه اترفع قبل كده</span> ({new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(repeatOf.createdAt))}). الليدز المكررة مش هتتضاف تاني في كل الأحوال.
          </p>
          <button type="button" onClick={() => upload(true)} className={appleButton.tinted}>
            ارفعه تاني برضه
          </button>
        </div>
      )}

      <div className="sticky bottom-4 z-10">
        <div className="apple-glass flex flex-col gap-3 rounded-[22px] p-3 sm:flex-row sm:items-center">
          {progress ? (
            <div className="min-w-0 flex-1 space-y-1.5 px-2">
              <p className="text-[14px]">
                {progress.stage} <span className="tabular-nums text-muted-foreground">{nf.format(progress.done)} / {nf.format(progress.total)}</span>
              </p>
              <Progress value={(100 * progress.done) / Math.max(1, progress.total)} />
            </div>
          ) : (
            <p className="min-w-0 flex-1 px-2 text-[14px] text-muted-foreground">بعد الرفع هتشوف الملخص الكامل وتأكد قبل ما أي ليد يتضاف.</p>
          )}
          <button type="button" onClick={() => upload(false)} disabled={!!progress || problems.length > 0 || preview!.valid === 0} className={appleButton.filled}>
            {progress ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            ارفع وحلّل
          </button>
        </div>
      </div>
    </div>
  );
}
