/**
 * Import Center, server side. Flow:
 *   1. createLeadImport     — file name/hash/size + column mapping → DRAFT
 *   2. appendLeadImportRows — the browser sends mapped rows in chunks; each row
 *                             is validated here (the browser is never trusted)
 *   3. analyzeLeadImport    — duplicates inside the file and against Casho → READY
 *   4. runLeadImportBatch   — called repeatedly (progress bar); each call writes
 *                             one batch in one transaction under an advisory
 *                             lock, so two tabs can't import the same rows.
 *                             Closing the tab just pauses it — the import page resumes.
 * Rows keep their status, so an import is recoverable and re-running a batch
 * never creates a lead twice.
 */
import { randomUUID } from "node:crypto";
import { LeadImportRowStatus, Prisma, SalesRepStatus, type LeadDuplicateMode, type LeadSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cleanText, normalizePhone } from "./normalize";
import { checkImportRow, fillBlanks, FILLABLE_KEYS, IMPORT_FIELDS, IMPORT_LIMITS, mappingProblems, rowKeys, type ColumnMapping, type ImportFieldKey, type ImportedLead } from "./import";
import { queueLeadAssignedNotice } from "./notify";
import { scoreLead } from "./scoring";
import { logActivity, refreshDerived, FIELD_LABELS } from "./service";
import type { AdminLeadActor } from "./access";

type Tx = Prisma.TransactionClient;
export type ImportActionResult = { success: boolean; message: string; importId?: string; repeatOf?: { id: string; createdAt: Date; fileName: string } };

const FIELD_KEYS = new Set<string>(IMPORT_FIELDS.map((f) => f.key));

// ─── 1. Create ──────────────────────────────────────────────────────────────

export async function createLeadImport(
  actor: AdminLeadActor,
  input: {
    fileName: string;
    fileHash: string;
    fileType: string;
    totalRows: number;
    mapping: ColumnMapping;
    duplicateMode: LeadDuplicateMode;
    assignRepId: string | null;
    defaultSource: LeadSource | null;
    confirmRepeat: boolean;
  },
): Promise<ImportActionResult> {
  if (input.totalRows < 1) return { success: false, message: "الملف مفيهوش صفوف" };
  if (input.totalRows > IMPORT_LIMITS.maxRows) return { success: false, message: `الحد الأقصى ${IMPORT_LIMITS.maxRows} صف في الملف الواحد — قسّمه` };
  const problems = mappingProblems(input.mapping);
  if (problems.length) return { success: false, message: problems[0] };
  if (input.assignRepId) {
    const rep = await prisma.salesRep.findFirst({ where: { id: input.assignRepId, status: SalesRepStatus.ACTIVE }, select: { id: true } });
    if (!rep) return { success: false, message: "المندوب ده موقوف أو مش موجود" };
  }

  if (!input.confirmRepeat) {
    const repeat = await prisma.leadImport.findFirst({
      where: { fileHash: input.fileHash, status: { in: ["READY", "RUNNING", "COMPLETED"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, fileName: true },
    });
    if (repeat) return { success: false, message: "الملف ده اترفع قبل كده", repeatOf: repeat };
  }

  // One upload in progress per admin: an abandoned draft is canceled.
  await prisma.leadImport.updateMany({ where: { uploadedById: actor.userId, status: "DRAFT" }, data: { status: "CANCELED" } });

  const created = await prisma.leadImport.create({
    data: {
      fileName: cleanText(input.fileName, 200) ?? "file",
      fileHash: input.fileHash,
      fileType: input.fileType,
      totalRows: input.totalRows,
      mapping: input.mapping,
      duplicateMode: input.duplicateMode,
      assignRepId: input.assignRepId,
      defaultSource: input.defaultSource,
      uploadedById: actor.userId,
    },
    select: { id: true },
  });
  return { success: true, message: "ابدأ رفع الصفوف", importId: created.id };
}

// ─── 2. Rows ────────────────────────────────────────────────────────────────

export async function appendLeadImportRows(
  _actor: AdminLeadActor,
  importId: string,
  rows: { rowNumber: number; values: Record<string, string> }[],
): Promise<ImportActionResult> {
  if (rows.length === 0 || rows.length > IMPORT_LIMITS.chunkSize) return { success: false, message: "دفعة صفوف غير صحيحة" };
  const imp = await prisma.leadImport.findUnique({ where: { id: importId }, select: { status: true, totalRows: true, defaultSource: true } });
  if (!imp || imp.status !== "DRAFT") return { success: false, message: "الاستيراد ده مش في مرحلة الرفع" };

  const data: Prisma.LeadImportRowCreateManyInput[] = [];
  for (const row of rows) {
    if (!Number.isInteger(row.rowNumber) || row.rowNumber < 1 || row.rowNumber > imp.totalRows) return { success: false, message: "رقم صف غير صحيح" };
    // Only known fields, only strings, capped — whatever the browser sent.
    const values: Partial<Record<ImportFieldKey, string>> = {};
    for (const [k, v] of Object.entries(row.values ?? {})) {
      if (FIELD_KEYS.has(k) && typeof v === "string" && v.trim()) values[k as ImportFieldKey] = v.trim().slice(0, IMPORT_LIMITS.maxCellLength);
    }
    if (!values.source && imp.defaultSource) values.source = imp.defaultSource;
    const check = checkImportRow(values);
    data.push(
      check.ok
        ? { importId, rowNumber: row.rowNumber, data: check.lead as Prisma.InputJsonValue, normalizedPhone: check.normalizedPhone, email: check.lead.email, status: "VALID" }
        : { importId, rowNumber: row.rowNumber, data: values, status: "INVALID", errors: check.errors },
    );
  }
  // Retried chunks are no-ops (unique importId + rowNumber).
  await prisma.leadImportRow.createMany({ data, skipDuplicates: true });
  return { success: true, message: "اترفعت" };
}

// ─── 3. Analyze ─────────────────────────────────────────────────────────────

type RowUpdate = { id: string; status: LeadImportRowStatus; error: string | null; existingLeadId?: string | null; leadId?: string | null };

/** One UPDATE per 500 rows instead of one per row. */
async function setRows(db: Tx | typeof prisma, updates: RowUpdate[]) {
  for (let i = 0; i < updates.length; i += 500) {
    const part = updates.slice(i, i + 500);
    const values = Prisma.join(
      part.map((u) => Prisma.sql`(${u.id}::text, ${u.status}::text, ${u.error}::text, ${u.existingLeadId ?? null}::text, ${u.leadId ?? null}::text)`),
    );
    await db.$executeRaw`
      UPDATE "LeadImportRow" AS r
      SET status = v.status::"LeadImportRowStatus",
          errors = CASE WHEN v.error IS NULL THEN r.errors ELSE ARRAY[v.error] END,
          "existingLeadId" = COALESCE(v.existing, r."existingLeadId"),
          "leadId" = COALESCE(v.lead, r."leadId")
      FROM (VALUES ${values}) AS v(id, status, error, existing, lead)
      WHERE r.id = v.id`;
  }
}

/** Live leads matching any of these phones / emails → key ("p:…" / "e:…") → lead. */
async function existingByKeys(db: Tx | typeof prisma, phones: string[], emails: string[]) {
  const found = new Map<string, { id: string; businessName: string }>();
  for (let i = 0; i < Math.max(phones.length, emails.length); i += 1000) {
    const p = phones.slice(i, i + 1000);
    const e = emails.slice(i, i + 1000);
    const or: Prisma.LeadWhereInput[] = [];
    if (p.length) or.push({ normalizedPhone: { in: p } }, { normalizedWhatsapp: { in: p } });
    if (e.length) or.push({ email: { in: e } });
    if (!or.length) continue;
    const leads = await db.lead.findMany({ where: { deletedAt: null, OR: or }, select: { id: true, businessName: true, normalizedPhone: true, normalizedWhatsapp: true, email: true } });
    for (const l of leads) {
      for (const k of [`p:${l.normalizedPhone}`, l.normalizedWhatsapp ? `p:${l.normalizedWhatsapp}` : null, l.email ? `e:${l.email}` : null]) {
        if (k && !found.has(k)) found.set(k, { id: l.id, businessName: l.businessName });
      }
    }
  }
  return found;
}

export async function analyzeLeadImport(_actor: AdminLeadActor, importId: string): Promise<ImportActionResult> {
  const imp = await prisma.leadImport.findUnique({ where: { id: importId }, select: { status: true, totalRows: true } });
  if (!imp || imp.status !== "DRAFT") return { success: false, message: "الاستيراد ده اتحلل قبل كده أو اتلغى" };
  const uploaded = await prisma.leadImportRow.count({ where: { importId } });
  if (uploaded !== imp.totalRows) return { success: false, message: `اترفع ${uploaded} من ${imp.totalRows} صف بس — ارفع الملف تاني` };

  const valid = await prisma.leadImportRow.findMany({
    where: { importId, status: "VALID" },
    orderBy: { rowNumber: "asc" },
    select: { id: true, rowNumber: true, normalizedPhone: true, email: true },
  });

  // Inside the file: the first row with a phone/email wins; later ones point at it.
  const firstRow = new Map<string, number>();
  const updates: RowUpdate[] = [];
  const unique: typeof valid = [];
  for (const r of valid) {
    const keys = rowKeys(r);
    const earlier = keys.map((k) => firstRow.get(k)).find((n) => n !== undefined);
    if (earlier !== undefined) {
      updates.push({ id: r.id, status: "DUPLICATE_FILE", error: `متكرر مع الصف ${earlier}` });
      continue;
    }
    keys.forEach((k) => firstRow.set(k, r.rowNumber));
    unique.push(r);
  }

  // Against Casho.
  const existing = await existingByKeys(
    prisma,
    unique.map((r) => r.normalizedPhone).filter((p): p is string => !!p),
    unique.map((r) => r.email).filter((e): e is string => !!e),
  );
  for (const r of unique) {
    const hit = rowKeys(r).map((k) => existing.get(k)).find(Boolean);
    if (hit) updates.push({ id: r.id, status: "DUPLICATE_EXISTING", error: `موجود قبل كده: ${hit.businessName}`, existingLeadId: hit.id });
  }

  await setRows(prisma, updates);
  const counts = await prisma.leadImportRow.groupBy({ by: ["status"], where: { importId }, _count: { _all: true } });
  const n = (s: LeadImportRowStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;
  await prisma.leadImport.update({
    where: { id: importId },
    data: {
      status: "READY",
      validRows: n("VALID"),
      invalidRows: n("INVALID"),
      fileDuplicateRows: n("DUPLICATE_FILE"),
      existingDuplicateRows: n("DUPLICATE_EXISTING"),
    },
  });
  return { success: true, message: "جاهز للتأكيد", importId };
}

// ─── 4. Run ─────────────────────────────────────────────────────────────────

export type BatchResult = { success: boolean; message: string; done: boolean; busy?: boolean; processed: number; remaining: number };

const LEAD_DATA_KEYS = ["businessName", "ownerName", "phone", "whatsapp", "email", "category", "city", "website", "instagram", "facebook", "businessSize", "source", "sourceDetails"] as const;

export async function runLeadImportBatch(actor: AdminLeadActor, importId: string): Promise<BatchResult> {
  const imp = await prisma.leadImport.findUnique({ where: { id: importId } });
  if (!imp || (imp.status !== "READY" && imp.status !== "RUNNING")) {
    return { success: false, message: imp?.status === "COMPLETED" ? "الاستيراد خلص" : "الاستيراد ده مش جاهز", done: imp?.status === "COMPLETED", processed: 0, remaining: 0 };
  }
  if (imp.status === "READY") await prisma.leadImport.updateMany({ where: { id: importId, status: "READY" }, data: { status: "RUNNING", startedAt: new Date() } });

  const pendingWhere: Prisma.LeadImportRowWhereInput = {
    importId,
    status: { in: imp.duplicateMode === "FILL_BLANKS" ? ["VALID", "DUPLICATE_EXISTING"] : ["VALID"] },
    leadId: null,
    // FILL_BLANKS rows already handled carry the "UPDATED"/"SKIPPED" status, so they drop out.
  };

  let processed = 0;
  let batch: { id: string; rowNumber: number; status: LeadImportRowStatus; data: Prisma.JsonValue; normalizedPhone: string | null; email: string | null; existingLeadId: string | null }[] = [];
  try {
    processed = await prisma.$transaction(
      async (tx) => {
        const [{ locked }] = await tx.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_xact_lock(hashtext(${`lead-import:${importId}`})) AS locked`;
        if (!locked) return -1;

        batch = await tx.leadImportRow.findMany({
          where: pendingWhere,
          orderBy: { rowNumber: "asc" },
          take: IMPORT_LIMITS.batchSize,
          select: { id: true, rowNumber: true, status: true, data: true, normalizedPhone: true, email: true, existingLeadId: true },
        });
        if (batch.length === 0) return 0;

        const now = new Date();
        const updates: RowUpdate[] = [];

        // New rows: re-check against Casho — a lead may have been added since the analysis.
        const fresh = batch.filter((r) => r.status === "VALID");
        const existing = await existingByKeys(
          tx,
          fresh.map((r) => r.normalizedPhone).filter((p): p is string => !!p),
          fresh.map((r) => r.email).filter((e): e is string => !!e),
        );
        const toCreate: { row: (typeof batch)[number]; id: string; lead: ImportedLead }[] = [];
        const fillTargets: { row: (typeof batch)[number]; leadId: string }[] = [];
        for (const r of fresh) {
          const hit = rowKeys(r).map((k) => existing.get(k)).find(Boolean);
          if (hit && imp.duplicateMode === "FILL_BLANKS") fillTargets.push({ row: r, leadId: hit.id });
          else if (hit) updates.push({ id: r.id, status: "SKIPPED", error: `اتضاف من مكان تاني أثناء الاستيراد: ${hit.businessName}`, existingLeadId: hit.id });
          else toCreate.push({ row: r, id: randomUUID(), lead: r.data as unknown as ImportedLead });
        }
        for (const r of batch) if (r.status === "DUPLICATE_EXISTING" && r.existingLeadId) fillTargets.push({ row: r, leadId: r.existingLeadId });

        if (toCreate.length) {
          const status = imp.assignRepId ? "ASSIGNED" : "NEW";
          await tx.lead.createMany({
            data: toCreate.map(({ id, row, lead }): Prisma.LeadCreateManyInput => {
              const s = scoreLead({ ...lead, status, hadDemo: false, responded: false });
              return {
                ...Object.fromEntries(LEAD_DATA_KEYS.map((k) => [k, lead[k] ?? null])),
                id,
                businessName: lead.businessName,
                phone: lead.phone,
                notes: lead.notes,
                normalizedPhone: row.normalizedPhone!,
                normalizedWhatsapp: lead.whatsapp ? normalizePhone(lead.whatsapp) : null,
                status,
                score: s.score,
                priority: s.band,
                assignedRepId: imp.assignRepId,
                assignedAt: imp.assignRepId ? now : null,
                importId,
                createdById: actor.userId,
              };
            }),
          });
          await tx.leadActivity.createMany({
            data: toCreate.flatMap(({ id, row, lead }) => [
              { leadId: id, type: "IMPORTED" as const, description: `${imp.fileName} — صف ${row.rowNumber}${lead.notes ? `\n${lead.notes}` : ""}`, actorUserId: actor.userId, actorRole: "ADMIN" },
              ...(imp.assignRepId ? [{ leadId: id, type: "ASSIGNED" as const, description: "مع الاستيراد", actorUserId: actor.userId, actorRole: "ADMIN" }] : []),
            ]),
          });
          if (imp.assignRepId) {
            await tx.leadAssignment.createMany({ data: toCreate.map(({ id }) => ({ leadId: id, fromRepId: null, toRepId: imp.assignRepId, assignedById: actor.userId, reason: "استيراد" })) });
          }
          for (const { row, id } of toCreate) updates.push({ id: row.id, status: "IMPORTED", error: null, leadId: id });
        }

        // FILL_BLANKS: only the existing lead's empty fields, never an overwrite.
        if (fillTargets.length) {
          const leads = await tx.lead.findMany({ where: { id: { in: fillTargets.map((t) => t.leadId) }, deletedAt: null } });
          const byId = new Map(leads.map((l) => [l.id, l]));
          const touched: string[] = [];
          for (const { row, leadId } of fillTargets) {
            const lead = byId.get(leadId);
            const incoming = row.data as unknown as ImportedLead;
            if (!lead) {
              updates.push({ id: row.id, status: "SKIPPED", error: "الليد الموجود اتمسح" });
              continue;
            }
            const patch = fillBlanks(lead as unknown as Record<string, unknown>, incoming as unknown as Record<string, unknown>, [...FILLABLE_KEYS]);
            const keys = Object.keys(patch);
            if (keys.length === 0) {
              updates.push({ id: row.id, status: "SKIPPED", error: "مفيش بيانات جديدة للّيد الموجود", existingLeadId: leadId });
              continue;
            }
            if (typeof patch.whatsapp === "string") (patch as Record<string, unknown>).normalizedWhatsapp = normalizePhone(patch.whatsapp);
            await tx.lead.update({ where: { id: leadId }, data: patch as Prisma.LeadUpdateInput });
            byId.set(leadId, { ...lead, ...(patch as object) });
            await logActivity(tx, actor, leadId, {
              type: "UPDATED",
              description: `من ملف ${imp.fileName} (صف ${row.rowNumber}): ${keys.filter((k) => k !== "normalizedWhatsapp").map((k) => FIELD_LABELS[k] ?? k).join("، ")}`,
              newValue: JSON.stringify(patch),
            });
            touched.push(leadId);
            updates.push({ id: row.id, status: "UPDATED", error: null, existingLeadId: leadId, leadId });
          }
          await refreshDerived(tx, [...new Set(touched)]);
        }

        await setRows(tx, updates);
        const count = (s: LeadImportRowStatus) => updates.filter((u) => u.status === s).length;
        await tx.leadImport.update({
          where: { id: importId },
          data: { importedRows: { increment: count("IMPORTED") }, updatedRows: { increment: count("UPDATED") }, skippedRows: { increment: count("SKIPPED") } },
        });
        return batch.length;
      },
      { timeout: 60_000, maxWait: 10_000 },
    );
  } catch (error) {
    // A batch that can't be written is marked failed so the import moves on instead of retrying it forever.
    console.error("[leads] import batch failed", importId, error);
    if (batch.length) {
      await setRows(prisma, batch.map((r) => ({ id: r.id, status: "FAILED" as const, error: "حصل خطأ أثناء الإضافة — جرّب الصف ده تاني من ملف جديد" })));
      await prisma.leadImport.update({ where: { id: importId }, data: { failedRows: { increment: batch.length } } });
      processed = batch.length;
    } else {
      return { success: false, message: "حصل خطأ — جرّب تاني", done: false, processed: 0, remaining: await prisma.leadImportRow.count({ where: pendingWhere }) };
    }
  }

  if (processed === -1) return { success: true, message: "في دفعة شغالة دلوقتي", done: false, busy: true, processed: 0, remaining: await prisma.leadImportRow.count({ where: pendingWhere }) };

  const remaining = await prisma.leadImportRow.count({ where: pendingWhere });
  if (remaining === 0) await finishImport(importId);
  return { success: true, message: remaining === 0 ? "خلص الاستيراد" : "كمّل", done: remaining === 0, processed, remaining };
}

async function finishImport(importId: string) {
  const imp = await prisma.leadImport.findUnique({ where: { id: importId }, select: { status: true, assignRepId: true, duplicateMode: true } });
  if (!imp || imp.status !== "RUNNING") return;
  const counts = await prisma.leadImportRow.groupBy({ by: ["status"], where: { importId }, _count: { _all: true } });
  const n = (s: LeadImportRowStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const res = await prisma.leadImport.updateMany({
    where: { id: importId, status: "RUNNING" },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      importedRows: n("IMPORTED"),
      updatedRows: n("UPDATED"),
      failedRows: n("FAILED"),
      // Everything that didn't become a lead or an update, invalid rows aside.
      skippedRows: n("SKIPPED") + n("DUPLICATE_FILE") + (imp.duplicateMode === "SKIP" ? n("DUPLICATE_EXISTING") : 0),
    },
  });
  if (res.count === 1 && imp.assignRepId) {
    const leads = await prisma.lead.findMany({ where: { importId, assignedRepId: imp.assignRepId }, select: { id: true }, take: 500 });
    queueLeadAssignedNotice(imp.assignRepId, leads.map((l) => l.id), `import:${importId}`);
  }
}

export async function cancelLeadImport(_actor: AdminLeadActor, importId: string): Promise<ImportActionResult> {
  const res = await prisma.leadImport.updateMany({ where: { id: importId, status: { in: ["DRAFT", "READY", "RUNNING"] } }, data: { status: "CANCELED", completedAt: new Date() } });
  if (res.count === 0) return { success: false, message: "الاستيراد ده خلص أو اتلغى قبل كده" };
  return { success: true, message: "اتلغى — اللي اتضاف قبل الإلغاء فضل زي ما هو", importId };
}

/** Rows for the error report: everything that didn't become a lead or an update. */
export async function importProblemRows(importId: string) {
  return prisma.leadImportRow.findMany({
    where: { importId, status: { in: ["INVALID", "DUPLICATE_FILE", "DUPLICATE_EXISTING", "SKIPPED", "FAILED"] } },
    orderBy: { rowNumber: "asc" },
    select: { rowNumber: true, status: true, errors: true, data: true },
  });
}
