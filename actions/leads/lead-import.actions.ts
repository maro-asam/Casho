"use server";

import { z } from "zod";
import { LeadDuplicateMode, LeadSource } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireLeadAdmin } from "@/lib/leads/access";
import { auditLeads } from "@/lib/leads/audit";
import { prisma } from "@/lib/prisma";
import { IMPORT_EXTENSIONS, IMPORT_FIELDS, IMPORT_LIMITS, type ColumnMapping } from "@/lib/leads/import";
import {
  analyzeLeadImport,
  appendLeadImportRows,
  cancelLeadImport,
  createLeadImport,
  runLeadImportBatch,
  type BatchResult,
  type ImportActionResult,
} from "@/lib/leads/import-server";

const fieldKeys = IMPORT_FIELDS.map((f) => f.key) as [string, ...string[]];
const id = z.string().uuid();

const createSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  fileHash: z.string().regex(/^[a-f0-9]{64}$/, "ملف غير صحيح"),
  fileType: z.enum(IMPORT_EXTENSIONS),
  totalRows: z.number().int().min(1).max(IMPORT_LIMITS.maxRows),
  mapping: z
    .record(z.string().max(IMPORT_LIMITS.maxCellLength), z.union([z.enum(fieldKeys), z.literal("")]))
    .refine((m) => Object.keys(m).length <= IMPORT_LIMITS.maxColumns, "أعمدة كتير"),
  duplicateMode: z.nativeEnum(LeadDuplicateMode),
  assignRepId: id.nullable(),
  defaultSource: z.nativeEnum(LeadSource).nullable(),
  confirmRepeat: z.boolean().default(false),
});

const rowsSchema = z.object({
  importId: id,
  rows: z
    .array(
      z.object({
        rowNumber: z.number().int().min(1).max(IMPORT_LIMITS.maxRows),
        values: z.record(z.string().max(40), z.string().max(IMPORT_LIMITS.maxCellLength * 2)),
      }),
    )
    .min(1)
    .max(IMPORT_LIMITS.chunkSize),
});

const importIdSchema = z.object({ importId: id });

async function run<T extends { success: boolean; message: string }>(body: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await body();
  } catch (error) {
    if (!(error instanceof Error && error.message === "Unauthorized")) console.error("[leads] import action", error);
    return fallback;
  }
}

const refused: ImportActionResult = { success: false, message: "مش مسموح أو حصلت مشكلة — جرّب تاني" };

export async function createLeadImportAction(input: unknown): Promise<ImportActionResult> {
  return run(async () => {
    const admin = await requireLeadAdmin();
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "بيانات الملف غير صحيحة" };
    return createLeadImport(admin, { ...parsed.data, mapping: parsed.data.mapping as ColumnMapping });
  }, refused);
}

export async function appendLeadImportRowsAction(input: unknown): Promise<ImportActionResult> {
  return run(async () => {
    const admin = await requireLeadAdmin();
    const parsed = rowsSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: "دفعة صفوف غير صحيحة" };
    return appendLeadImportRows(admin, parsed.data.importId, parsed.data.rows);
  }, refused);
}

export async function analyzeLeadImportAction(input: unknown): Promise<ImportActionResult> {
  return run(async () => {
    const admin = await requireLeadAdmin();
    const parsed = importIdSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: "طلب غير صحيح" };
    return analyzeLeadImport(admin, parsed.data.importId);
  }, refused);
}

export async function runLeadImportBatchAction(input: unknown): Promise<BatchResult> {
  return run(
    async () => {
      const admin = await requireLeadAdmin();
      const parsed = importIdSchema.safeParse(input);
      if (!parsed.success) return { success: false, message: "طلب غير صحيح", done: false, processed: 0, remaining: 0 };
      const result = await runLeadImportBatch(admin, parsed.data.importId);
      if (result.done && result.processed > 0) {
        revalidatePath("/admin/leads", "layout");
        const imp = await prisma.leadImport.findUnique({ where: { id: parsed.data.importId }, select: { fileName: true, importedRows: true, updatedRows: true } });
        await auditLeads(admin.userId, "LEADS_IMPORTED", { importId: parsed.data.importId, fileName: imp?.fileName ?? null, imported: imp?.importedRows ?? 0, updated: imp?.updatedRows ?? 0 });
      }
      return result;
    },
    { ...refused, done: false, processed: 0, remaining: 0 },
  );
}

export async function cancelLeadImportAction(input: unknown): Promise<ImportActionResult> {
  return run(async () => {
    const admin = await requireLeadAdmin();
    const parsed = importIdSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: "طلب غير صحيح" };
    const result = await cancelLeadImport(admin, parsed.data.importId);
    if (result.success) revalidatePath("/admin/leads", "layout");
    return result;
  }, refused);
}
