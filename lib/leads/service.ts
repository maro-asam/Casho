/**
 * Every lead mutation. Each one checks the actor against lib/leads/workflow.ts
 * on rows loaded through the actor's scope, writes inside a transaction and
 * records what happened in LeadActivity. Server actions (actions/leads/*) are
 * thin wrappers around these.
 */
import { randomUUID } from "node:crypto";
import { LeadStatus, Prisma, SalesRepStatus, type LeadPriority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { LeadFields } from "@/validations/leads.schema";
import { ACTIVITY_LABELS, LOST_REASONS, STATUS_META, lostReasonLabel, type InteractionType } from "./constants";
import { validateDueAt } from "./follow-ups";
import { IMPORT_FIELDS } from "./import";
import { normalizePhone } from "./normalize";
import { queueLeadAssignedNotice } from "./notify";
import { effectivePriority, scoreLead } from "./scoring";
import { leadScopeFor } from "./scope";
import {
  actorRole,
  canWorkLead,
  checkStatusChange,
  countsAsContact,
  statusAfterAssignment,
  statusAfterInteraction,
  type LeadActor,
} from "./workflow";

type Tx = Prisma.TransactionClient;
type Db = Tx | typeof prisma;

export type LeadDuplicate = { id: string; businessName: string; status: LeadStatus; repName: string | null; archived: boolean };

export type LeadActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  leadId?: string;
  duplicates?: LeadDuplicate[];
  /** Bulk actions: how many rows actually changed / were skipped. */
  changed?: number;
  skipped?: number;
};

const ok = (message: string, extra: Partial<LeadActionResult> = {}): LeadActionResult => ({ success: true, message, ...extra });
const fail = (message: string, extra: Partial<LeadActionResult> = {}): LeadActionResult => ({ success: false, message, ...extra });

const NOT_FOUND = "الليد ده مش موجود أو مش متاح لك";
const CHUNK = 200;

export const FIELD_LABELS: Record<string, string> = Object.fromEntries(IMPORT_FIELDS.map((f) => [f.key, f.label]));

// ─── Shared helpers ─────────────────────────────────────────────────────────

type ActivityInput = {
  type: Prisma.LeadActivityCreateManyInput["type"];
  description?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  reached?: boolean | null;
};

function activityRow(actor: LeadActor | "SYSTEM", leadId: string, a: ActivityInput, at?: Date): Prisma.LeadActivityCreateManyInput {
  return {
    leadId,
    type: a.type,
    description: a.description ?? null,
    previousValue: a.previousValue ?? null,
    newValue: a.newValue ?? null,
    reached: a.reached ?? null,
    actorUserId: actor === "SYSTEM" ? null : actor.userId,
    actorRole: actor === "SYSTEM" ? "SYSTEM" : actorRole(actor),
    ...(at ? { createdAt: at } : {}),
  };
}

export function logActivity(tx: Tx, actor: LeadActor | "SYSTEM", leadId: string, a: ActivityInput) {
  return tx.leadActivity.create({ data: activityRow(actor, leadId, a) });
}

/** Recomputes score, auto priority and the next follow-up for these leads (after any change that feeds them). */
export async function refreshDerived(tx: Tx, leadIds: string[]) {
  if (leadIds.length === 0) return;
  const [leads, demos, responses, next] = await Promise.all([
    tx.lead.findMany({
      where: { id: { in: leadIds } },
      select: { id: true, instagram: true, website: true, whatsapp: true, businessSize: true, status: true, priority: true, priorityLocked: true, score: true, nextFollowUpAt: true },
    }),
    tx.leadActivity.groupBy({ by: ["leadId"], where: { leadId: { in: leadIds }, type: "DEMO" }, _count: { _all: true } }),
    tx.leadActivity.groupBy({
      by: ["leadId"],
      where: { leadId: { in: leadIds }, OR: [{ type: { in: ["CALL", "WHATSAPP", "EMAIL"] }, reached: true }, { type: { in: ["MEETING", "DEMO"] } }] },
      _count: { _all: true },
    }),
    tx.leadFollowUp.groupBy({ by: ["leadId"], where: { leadId: { in: leadIds }, status: "PENDING" }, _min: { dueAt: true } }),
  ]);
  const hadDemo = new Set(demos.map((d) => d.leadId));
  const responded = new Set(responses.map((d) => d.leadId));
  const nextDue = new Map(next.map((n) => [n.leadId, n._min.dueAt]));

  for (const l of leads) {
    const s = scoreLead({ ...l, hadDemo: hadDemo.has(l.id), responded: responded.has(l.id) });
    const priority = effectivePriority(l.priorityLocked, l.priority, s.score);
    const nextFollowUpAt = nextDue.get(l.id) ?? null;
    if (s.score === l.score && priority === l.priority && (nextFollowUpAt?.getTime() ?? null) === (l.nextFollowUpAt?.getTime() ?? null)) continue;
    await tx.lead.update({ where: { id: l.id }, data: { score: s.score, priority, nextFollowUpAt } });
  }
}

/** Live leads with the same phone / WhatsApp / email (the add form and the importer refuse these). */
export async function findDuplicateLeads(
  db: Db,
  keys: { normalizedPhone: string; normalizedWhatsapp?: string | null; email?: string | null },
  excludeId?: string,
): Promise<LeadDuplicate[]> {
  const or: Prisma.LeadWhereInput[] = [{ normalizedPhone: keys.normalizedPhone }, { normalizedWhatsapp: keys.normalizedPhone }];
  if (keys.normalizedWhatsapp) or.push({ normalizedPhone: keys.normalizedWhatsapp });
  if (keys.email) or.push({ email: keys.email });
  const rows = await db.lead.findMany({
    where: { deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}), OR: or },
    select: { id: true, businessName: true, status: true, archivedAt: true, assignedRep: { select: { user: { select: { name: true, email: true } } } } },
    take: 5,
  });
  return rows.map((r) => ({
    id: r.id,
    businessName: r.businessName,
    status: r.status,
    archived: !!r.archivedAt,
    repName: r.assignedRep ? (r.assignedRep.user.name ?? r.assignedRep.user.email) : null,
  }));
}

async function repNames(db: Db, ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  if (unique.length === 0) return new Map<string, string>();
  const reps = await db.salesRep.findMany({ where: { id: { in: unique } }, select: { id: true, user: { select: { name: true, email: true } } } });
  return new Map(reps.map((r) => [r.id, r.user.name ?? r.user.email]));
}

const ACCESS_SELECT = { id: true, status: true, assignedRepId: true, archivedAt: true, deletedAt: true } as const;

/** A lead through the actor's scope (another rep's lead → null, exactly like a missing one). */
async function loadForActor(actor: LeadActor, leadId: string) {
  return prisma.lead.findFirst({ where: { id: leadId, ...leadScopeFor(actor) }, select: ACCESS_SELECT });
}

/** Reps: 40 logged actions a minute is plenty for a human; more is a script. */
export async function repRateLimited(actor: LeadActor) {
  if (actor.kind !== "rep") return false;
  const n = await prisma.leadActivity.count({ where: { actorUserId: actor.userId, createdAt: { gte: new Date(Date.now() - 60_000) } } });
  return n >= 40;
}
const RATE_LIMITED = "استنى دقيقة — اتسجلت حاجات كتير ورا بعض";

const normalizedOf = (f: Pick<LeadFields, "phone" | "whatsapp">) => ({
  normalizedPhone: normalizePhone(f.phone)!,
  normalizedWhatsapp: f.whatsapp ? normalizePhone(f.whatsapp) : null,
});

async function activeRepOrNull(salesRepId: string | null) {
  if (!salesRepId) return null;
  return prisma.salesRep.findFirst({ where: { id: salesRepId, status: SalesRepStatus.ACTIVE }, select: { id: true } });
}

// ─── Create / edit (super admin) ────────────────────────────────────────────

const EDITABLE = [
  "businessName",
  "ownerName",
  "phone",
  "whatsapp",
  "email",
  "category",
  "city",
  "website",
  "instagram",
  "facebook",
  "businessSize",
  "source",
  "sourceDetails",
] as const satisfies readonly (keyof LeadFields)[];

export type CreateLeadInput = LeadFields & { notes: string | null; priority: LeadPriority | "AUTO"; assignRepId: string | null };

export async function createLead(actor: LeadActor, input: CreateLeadInput): Promise<LeadActionResult> {
  if (actor.kind !== "admin") return fail(NOT_FOUND);
  const keys = normalizedOf(input);
  const duplicates = await findDuplicateLeads(prisma, { ...keys, email: input.email });
  if (duplicates.length) return fail("الليد ده موجود قبل كده — نفس الرقم أو الإيميل", { duplicates });

  const rep = await activeRepOrNull(input.assignRepId);
  if (input.assignRepId && !rep) return fail("المندوب ده موقوف أو مش موجود", { fieldErrors: { assignRepId: "اختار مندوب نشط" } });

  const { notes, priority } = input;
  const fields = Object.fromEntries(EDITABLE.map((k) => [k, input[k] ?? null])) as Pick<LeadFields, (typeof EDITABLE)[number]>;
  const id = randomUUID();
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.lead.create({
      data: {
        ...fields,
        ...keys,
        id,
        notes,
        status: rep ? "ASSIGNED" : "NEW",
        assignedRepId: rep?.id ?? null,
        assignedAt: rep ? now : null,
        priority: priority === "AUTO" ? "LOW" : priority,
        priorityLocked: priority !== "AUTO",
        createdById: actor.userId,
      },
    });
    await logActivity(tx, actor, id, { type: "CREATED", description: notes });
    if (rep) {
      const names = await repNames(tx, [rep.id]);
      await tx.leadAssignment.create({ data: { leadId: id, fromRepId: null, toRepId: rep.id, assignedById: actor.userId } });
      await logActivity(tx, actor, id, { type: "ASSIGNED", newValue: names.get(rep.id) ?? null });
    }
    await refreshDerived(tx, [id]);
  });
  if (rep) queueLeadAssignedNotice(rep.id, [id], id);
  return ok("اتضاف الليد", { leadId: id });
}



export async function updateLead(actor: LeadActor, leadId: string, input: LeadFields): Promise<LeadActionResult> {
  if (actor.kind !== "admin") return fail(NOT_FOUND);
  const lead = await prisma.lead.findFirst({ where: { id: leadId, deletedAt: null } });
  if (!lead) return fail(NOT_FOUND);

  const keys = normalizedOf(input);
  const duplicates = await findDuplicateLeads(prisma, { ...keys, email: input.email }, leadId);
  if (duplicates.length) return fail("في ليد تاني بنفس الرقم أو الإيميل", { duplicates });

  const changed = EDITABLE.filter((k) => (lead[k] ?? null) !== (input[k] ?? null));
  if (changed.length === 0) return ok("مفيش تغيير");

  const before = Object.fromEntries(changed.map((k) => [k, lead[k] ?? null]));
  const after = Object.fromEntries(changed.map((k) => [k, input[k] ?? null]));
  await prisma.$transaction(async (tx) => {
    await tx.lead.update({ where: { id: leadId }, data: { ...Object.fromEntries(changed.map((k) => [k, input[k] ?? null])), ...keys } });
    await logActivity(tx, actor, leadId, {
      type: "UPDATED",
      description: changed.map((k) => FIELD_LABELS[k] ?? k).join("، "),
      previousValue: JSON.stringify(before),
      newValue: JSON.stringify(after),
    });
    await refreshDerived(tx, [leadId]);
  });
  return ok("اتحفظت التعديلات", { leadId });
}

// ─── Assignment (super admin) ───────────────────────────────────────────────

export async function assignLeads(actor: LeadActor, leadIds: string[], salesRepId: string | null, reason: string | null): Promise<LeadActionResult> {
  if (actor.kind !== "admin") return fail(NOT_FOUND);
  if (salesRepId && !(await activeRepOrNull(salesRepId))) return fail("المندوب ده موقوف أو مش موجود", { fieldErrors: { salesRepId: "اختار مندوب نشط" } });

  const ids = [...new Set(leadIds)];
  const now = new Date();
  const batchKey = randomUUID();
  const moved: string[] = [];

  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const done = await prisma.$transaction(
      async (tx) => {
        // Lock the rows so two admins assigning at once can't interleave.
        await tx.$queryRaw`SELECT id FROM "Lead" WHERE id IN (${Prisma.join(chunk)}) FOR UPDATE`;
        const current = await tx.lead.findMany({ where: { id: { in: chunk }, deletedAt: null }, select: { id: true, assignedRepId: true, status: true } });
        const changing = current.filter((l) => l.assignedRepId !== salesRepId);
        if (changing.length === 0) return [] as string[];

        const names = await repNames(tx, [salesRepId, ...changing.map((l) => l.assignedRepId)]);
        const byStatus = new Map<LeadStatus, string[]>();
        for (const l of changing) byStatus.set(l.status, [...(byStatus.get(l.status) ?? []), l.id]);
        for (const [status, group] of byStatus) {
          const next = statusAfterAssignment(status, !!salesRepId);
          await tx.lead.updateMany({
            where: { id: { in: group } },
            data: { assignedRepId: salesRepId, assignedAt: salesRepId ? now : null, ...(next !== status ? { status: next, statusChangedAt: now } : {}) },
          });
        }

        await tx.leadAssignment.createMany({
          data: changing.map((l) => ({ leadId: l.id, fromRepId: l.assignedRepId, toRepId: salesRepId, assignedById: actor.userId, reason })),
        });
        const activities: Prisma.LeadActivityCreateManyInput[] = [];
        for (const l of changing) {
          activities.push(
            activityRow(actor, l.id, {
              type: !l.assignedRepId ? "ASSIGNED" : salesRepId ? "REASSIGNED" : "UNASSIGNED",
              previousValue: l.assignedRepId ? (names.get(l.assignedRepId) ?? null) : null,
              newValue: salesRepId ? (names.get(salesRepId) ?? null) : null,
              description: reason,
            }),
          );
          const next = statusAfterAssignment(l.status, !!salesRepId);
          if (next !== l.status) activities.push(activityRow(actor, l.id, { type: "STATUS_CHANGED", previousValue: l.status, newValue: next, description: "مع الإسناد" }));
        }
        await tx.leadActivity.createMany({ data: activities });
        // Open follow-ups go with the lead; the new owner gets their own reminder.
        await tx.leadFollowUp.updateMany({
          where: { leadId: { in: changing.map((l) => l.id) }, status: "PENDING" },
          data: { salesRepId, reminderSentAt: null },
        });
        return changing.map((l) => l.id);
      },
      { timeout: 30_000 },
    );
    moved.push(...done);
  }

  if (salesRepId && moved.length) queueLeadAssignedNotice(salesRepId, moved, batchKey);
  const skipped = ids.length - moved.length;
  if (moved.length === 0) return fail(salesRepId ? "الليدز دي عند المندوب ده بالفعل" : "الليدز دي مش متسندة لحد", { changed: 0, skipped });
  const what = salesRepId ? "اتسند" : "اتشال من المندوب";
  return ok(moved.length === 1 ? `${what} الليد` : `${what} ${moved.length} ليد${skipped ? ` — ${skipped} كانوا كده بالفعل` : ""}`, {
    changed: moved.length,
    skipped,
  });
}

// ─── Status & priority ──────────────────────────────────────────────────────

type LostInput = { lostReason: string | null; lostNote: string | null };

function statusData(to: LeadStatus, lost: LostInput, now: Date): Prisma.LeadUpdateManyMutationInput {
  return to === "LOST"
    ? { status: to, statusChangedAt: now, lostReason: lost.lostReason, lostNote: lost.lostReason === "OTHER" ? lost.lostNote : (lost.lostNote ?? null), lostAt: now }
    : { status: to, statusChangedAt: now, lostReason: null, lostNote: null, lostAt: null };
}

function statusActivity(actor: LeadActor, leadId: string, from: LeadStatus, to: LeadStatus, lost: LostInput) {
  if (to === "LOST") return activityRow(actor, leadId, { type: "LOST", previousValue: from, newValue: to, description: lostReasonLabel(lost.lostReason, lost.lostNote) });
  return activityRow(actor, leadId, { type: from === "LOST" ? "REOPENED" : "STATUS_CHANGED", previousValue: from, newValue: to });
}

/** A lost or deleted lead shouldn't keep reminding anyone. */
async function cancelOpenFollowUps(tx: Tx, actor: LeadActor, leadIds: string[], why: string, now: Date) {
  const open = await tx.leadFollowUp.groupBy({ by: ["leadId"], where: { leadId: { in: leadIds }, status: "PENDING" }, _count: { _all: true } });
  if (open.length === 0) return;
  await tx.leadFollowUp.updateMany({
    where: { leadId: { in: open.map((o) => o.leadId) }, status: "PENDING" },
    data: { status: "CANCELED", closedAt: now, closedById: actor.userId, outcome: why },
  });
  await tx.leadActivity.createMany({
    data: open.map((o) => activityRow(actor, o.leadId, { type: "FOLLOW_UP_CANCELED", description: `${why} (${o._count._all})` })),
  });
}

export async function changeLeadStatus(actor: LeadActor, leadId: string, to: LeadStatus, lost: LostInput): Promise<LeadActionResult> {
  const lead = await loadForActor(actor, leadId);
  if (!lead) return fail(NOT_FOUND);
  const check = checkStatusChange(actor, lead, to);
  if (!check.ok) return fail(check.reason);
  if (await repRateLimited(actor)) return fail(RATE_LIMITED);

  const now = new Date();
  const changed = await prisma.$transaction(async (tx) => {
    // Optimistic: the status the actor saw must still be the status.
    const res = await tx.lead.updateMany({ where: { id: leadId, status: lead.status, ...leadScopeFor(actor) }, data: statusData(to, lost, now) });
    if (res.count === 0) return false;
    await tx.leadActivity.create({ data: statusActivity(actor, leadId, lead.status, to, lost) });
    if (to === "LOST") await cancelOpenFollowUps(tx, actor, [leadId], "الليد اتقفل خسارة", now);
    await refreshDerived(tx, [leadId]);
    return true;
  });
  if (!changed) return fail("الليد اتغير من شوية — حدّث الصفحة وجرّب تاني");
  return ok(to === "LOST" ? "اتسجل إننا خسرناه" : `الحالة بقت «${STATUS_META[to].label}»`, { leadId });
}

/** Super admin, from the table or the Kanban. Leads a rule doesn't allow are skipped and counted. */
export async function bulkChangeLeadStatus(actor: LeadActor, leadIds: string[], to: LeadStatus, lost: LostInput): Promise<LeadActionResult> {
  if (actor.kind !== "admin") return fail(NOT_FOUND);
  const ids = [...new Set(leadIds)];
  const now = new Date();
  let changed = 0;
  let firstReason: string | null = null;

  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    changed += await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Lead" WHERE id IN (${Prisma.join(chunk)}) FOR UPDATE`;
        const current = await tx.lead.findMany({ where: { id: { in: chunk } }, select: ACCESS_SELECT });
        const allowed = current.filter((l) => {
          const c = checkStatusChange(actor, l, to);
          if (!c.ok) firstReason ??= c.reason;
          return c.ok;
        });
        if (allowed.length === 0) return 0;
        const byStatus = new Map<LeadStatus, string[]>();
        for (const l of allowed) byStatus.set(l.status, [...(byStatus.get(l.status) ?? []), l.id]);
        for (const group of byStatus.values()) await tx.lead.updateMany({ where: { id: { in: group } }, data: statusData(to, lost, now) });
        await tx.leadActivity.createMany({ data: allowed.map((l) => statusActivity(actor, l.id, l.status, to, lost)) });
        if (to === "LOST") await cancelOpenFollowUps(tx, actor, allowed.map((l) => l.id), "الليد اتقفل خسارة", now);
        await refreshDerived(tx, allowed.map((l) => l.id));
        return allowed.length;
      },
      { timeout: 30_000 },
    );
  }
  const skipped = ids.length - changed;
  if (changed === 0) return fail(firstReason ?? "مفيش ليد اتغير", { changed, skipped });
  return ok(`اتغيرت حالة ${changed} ليد${skipped ? ` — ${skipped} اتسابوا (${firstReason ?? "مش مسموح"})` : ""}`, { changed, skipped });
}

export async function changeLeadPriority(actor: LeadActor, leadId: string, priority: LeadPriority | "AUTO"): Promise<LeadActionResult> {
  if (actor.kind !== "admin") return fail(NOT_FOUND);
  const lead = await prisma.lead.findFirst({ where: { id: leadId, deletedAt: null }, select: { priority: true, priorityLocked: true } });
  if (!lead) return fail(NOT_FOUND);
  await prisma.$transaction(async (tx) => {
    await tx.lead.update({ where: { id: leadId }, data: priority === "AUTO" ? { priorityLocked: false } : { priority, priorityLocked: true } });
    await logActivity(tx, actor, leadId, {
      type: "PRIORITY_CHANGED",
      previousValue: lead.priorityLocked ? lead.priority : "AUTO",
      newValue: priority,
    });
    await refreshDerived(tx, [leadId]);
  });
  return ok(priority === "AUTO" ? "الأولوية بقت تلقائية حسب التقييم" : "الأولوية اتغيرت");
}

// ─── Interactions & notes (admin or the owning rep) ─────────────────────────

export async function logLeadInteraction(
  actor: LeadActor,
  input: { leadId: string; type: InteractionType; description: string | null; reached: boolean | null },
): Promise<LeadActionResult> {
  const lead = await loadForActor(actor, input.leadId);
  if (!lead || !canWorkLead(actor, lead)) return fail(NOT_FOUND);
  if (await repRateLimited(actor)) return fail(RATE_LIMITED);

  const reached = ["CALL", "WHATSAPP", "EMAIL"].includes(input.type) ? input.reached : null;
  const next = statusAfterInteraction(lead.status, input.type, reached);
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await logActivity(tx, actor, lead.id, { type: input.type, description: input.description, reached });
    const data: Prisma.LeadUpdateInput = {};
    if (countsAsContact(input.type)) data.lastContactedAt = now;
    if (next !== lead.status) {
      Object.assign(data, { status: next, statusChangedAt: now });
      await logActivity(tx, actor, lead.id, { type: "STATUS_CHANGED", previousValue: lead.status, newValue: next, description: `تلقائي بعد ${ACTIVITY_LABELS[input.type]}` });
    }
    if (Object.keys(data).length) await tx.lead.update({ where: { id: lead.id }, data });
    await refreshDerived(tx, [lead.id]);
  });
  return ok(input.type === "NOTE" ? "اتضافت الملاحظة" : `اتسجلت ${ACTIVITY_LABELS[input.type]}`, { leadId: lead.id });
}

// ─── Follow-ups ─────────────────────────────────────────────────────────────

export async function scheduleFollowUp(actor: LeadActor, leadId: string, dueAt: Date, note: string | null): Promise<LeadActionResult> {
  const lead = await loadForActor(actor, leadId);
  if (!lead || !canWorkLead(actor, lead)) return fail(NOT_FOUND);
  const bad = validateDueAt(dueAt, new Date());
  if (bad) return fail(bad, { fieldErrors: { dueAt: bad } });
  if (await repRateLimited(actor)) return fail(RATE_LIMITED);
  const open = await prisma.leadFollowUp.count({ where: { leadId, status: "PENDING" } });
  if (open >= 10) return fail("الليد ده عليه 10 متابعات مفتوحة — خلّص أو الغي واحدة الأول");

  await prisma.$transaction(async (tx) => {
    await tx.leadFollowUp.create({ data: { leadId, salesRepId: lead.assignedRepId, dueAt, note, createdById: actor.userId } });
    await logActivity(tx, actor, leadId, { type: "FOLLOW_UP_SCHEDULED", newValue: dueAt.toISOString(), description: note });
    await refreshDerived(tx, [leadId]);
  });
  return ok("اتحددت المتابعة", { leadId });
}

async function loadFollowUpForActor(actor: LeadActor, followUpId: string) {
  return prisma.leadFollowUp.findFirst({
    where: { id: followUpId, lead: leadScopeFor(actor) },
    select: { id: true, status: true, dueAt: true, leadId: true, lead: { select: ACCESS_SELECT } },
  });
}

export async function completeFollowUp(
  actor: LeadActor,
  input: { followUpId: string; outcome: string | null; nextDueAt: Date | null; nextNote: string | null },
): Promise<LeadActionResult> {
  const f = await loadFollowUpForActor(actor, input.followUpId);
  if (!f || !canWorkLead(actor, f.lead)) return fail("المتابعة دي مش موجودة أو مش متاحة لك");
  if (f.status !== "PENDING") return fail("المتابعة دي اتقفلت قبل كده");
  const now = new Date();
  if (input.nextDueAt) {
    const bad = validateDueAt(input.nextDueAt, now);
    if (bad) return fail(bad, { fieldErrors: { nextDueAt: bad } });
  }
  if (await repRateLimited(actor)) return fail(RATE_LIMITED);

  const done = await prisma.$transaction(async (tx) => {
    const res = await tx.leadFollowUp.updateMany({
      where: { id: f.id, status: "PENDING" },
      data: { status: "DONE", closedAt: now, closedById: actor.userId, outcome: input.outcome },
    });
    if (res.count === 0) return false;
    await logActivity(tx, actor, f.leadId, { type: "FOLLOW_UP_COMPLETED", description: input.outcome, previousValue: f.dueAt.toISOString() });
    if (input.nextDueAt) {
      await tx.leadFollowUp.create({ data: { leadId: f.leadId, salesRepId: f.lead.assignedRepId, dueAt: input.nextDueAt, note: input.nextNote, createdById: actor.userId } });
      await logActivity(tx, actor, f.leadId, { type: "FOLLOW_UP_SCHEDULED", newValue: input.nextDueAt.toISOString(), description: input.nextNote });
    }
    await refreshDerived(tx, [f.leadId]);
    return true;
  });
  if (!done) return fail("المتابعة دي اتقفلت قبل كده");
  return ok(input.nextDueAt ? "خلصت المتابعة واتحددت اللي بعدها" : "خلصت المتابعة", { leadId: f.leadId });
}

export async function rescheduleFollowUp(actor: LeadActor, followUpId: string, dueAt: Date, reason: string | null): Promise<LeadActionResult> {
  const f = await loadFollowUpForActor(actor, followUpId);
  if (!f || !canWorkLead(actor, f.lead)) return fail("المتابعة دي مش موجودة أو مش متاحة لك");
  if (f.status !== "PENDING") return fail("المتابعة دي اتقفلت قبل كده");
  const bad = validateDueAt(dueAt, new Date());
  if (bad) return fail(bad, { fieldErrors: { dueAt: bad } });
  if (await repRateLimited(actor)) return fail(RATE_LIMITED);

  await prisma.$transaction(async (tx) => {
    await tx.leadFollowUp.update({ where: { id: f.id }, data: { dueAt, reminderSentAt: null } });
    await logActivity(tx, actor, f.leadId, { type: "FOLLOW_UP_RESCHEDULED", previousValue: f.dueAt.toISOString(), newValue: dueAt.toISOString(), description: reason });
    await refreshDerived(tx, [f.leadId]);
  });
  return ok("اتغير ميعاد المتابعة", { leadId: f.leadId });
}

export async function cancelFollowUp(actor: LeadActor, followUpId: string, reason: string | null): Promise<LeadActionResult> {
  const f = await loadFollowUpForActor(actor, followUpId);
  if (!f || !canWorkLead(actor, f.lead)) return fail("المتابعة دي مش موجودة أو مش متاحة لك");
  if (f.status !== "PENDING") return fail("المتابعة دي اتقفلت قبل كده");
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.leadFollowUp.update({ where: { id: f.id }, data: { status: "CANCELED", closedAt: now, closedById: actor.userId, outcome: reason } });
    await logActivity(tx, actor, f.leadId, { type: "FOLLOW_UP_CANCELED", previousValue: f.dueAt.toISOString(), description: reason });
    await refreshDerived(tx, [f.leadId]);
  });
  return ok("اتلغت المتابعة", { leadId: f.leadId });
}

// ─── Archive / delete (super admin; both reversible) ────────────────────────

export async function archiveLead(actor: LeadActor, leadId: string, reason: string | null, restore = false): Promise<LeadActionResult> {
  if (actor.kind !== "admin") return fail(NOT_FOUND);
  const lead = await prisma.lead.findFirst({ where: { id: leadId, deletedAt: null }, select: { archivedAt: true } });
  if (!lead) return fail(NOT_FOUND);
  if (restore ? !lead.archivedAt : lead.archivedAt) return fail(restore ? "الليد مش في الأرشيف" : "الليد في الأرشيف بالفعل");
  await prisma.$transaction(async (tx) => {
    await tx.lead.update({ where: { id: leadId }, data: restore ? { archivedAt: null, archivedById: null } : { archivedAt: new Date(), archivedById: actor.userId } });
    await logActivity(tx, actor, leadId, { type: restore ? "RESTORED" : "ARCHIVED", description: reason ?? (restore ? "من الأرشيف" : null) });
  });
  return ok(restore ? "الليد رجع من الأرشيف" : "الليد اتأرشف — مش هيظهر للمندوب", { leadId });
}

export async function deleteLead(actor: LeadActor, leadId: string, reason: string | null, restore = false): Promise<LeadActionResult> {
  if (actor.kind !== "admin") return fail(NOT_FOUND);
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { deletedAt: true, convertedAt: true } });
  if (!lead) return fail(NOT_FOUND);
  if (restore ? !lead.deletedAt : lead.deletedAt) return fail(restore ? "الليد مش ممسوح" : "الليد ممسوح بالفعل");
  if (!restore && lead.convertedAt) return fail("ليد اتحوّل لعميل مينفعش يتمسح — أرشفه، أو فك الربط الأول لو التحويل غلط");
  if (restore) {
    const full = await prisma.lead.findUniqueOrThrow({ where: { id: leadId }, select: { normalizedPhone: true, normalizedWhatsapp: true, email: true } });
    const duplicates = await findDuplicateLeads(prisma, full, leadId);
    if (duplicates.length) return fail("في ليد تاني شغال بنفس الرقم أو الإيميل", { duplicates });
  }
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.lead.update({ where: { id: leadId }, data: restore ? { deletedAt: null, deletedById: null } : { deletedAt: now, deletedById: actor.userId } });
    if (!restore) await cancelOpenFollowUps(tx, actor, [leadId], "الليد اتمسح", now);
    await logActivity(tx, actor, leadId, { type: restore ? "RESTORED" : "DELETED", description: reason ?? (restore ? "من المحذوفات" : null) });
    if (restore) await refreshDerived(tx, [leadId]);
  });
  return ok(restore ? "الليد رجع" : "الليد اتمسح — تقدر ترجعه من «المحذوفة»", { leadId });
}

export const LOST_REASON_OPTIONS = Object.entries(LOST_REASONS).map(([value, label]) => ({ value, label }));
