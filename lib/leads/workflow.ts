/**
 * Who may do what to a lead, and how the pipeline moves (pure, unit-tested).
 * The server re-checks every rule here on every action; the UI only uses it
 * to decide which buttons to show.
 *
 *   super admin  everything: create, import, edit, assign, any status (except
 *                CONVERTED, which only a paid conversion sets), archive, delete,
 *                link a Casho account, export, global analytics
 *   rep          only leads assigned to them, not archived/deleted: view, change
 *                status, log interactions and notes, schedule/complete follow-ups.
 *                Never: edit identity/contact data, (re)assign, export, other reps' leads.
 */
import type { LeadStatus } from "@prisma/client";
import type { InteractionType } from "./constants";

export type LeadActor = { kind: "admin"; userId: string } | { kind: "rep"; userId: string; salesRepId: string };

export type LeadAccessFacts = {
  assignedRepId: string | null;
  status: LeadStatus;
  archivedAt: Date | null;
  deletedAt: Date | null;
};

export const actorRole = (actor: LeadActor) => (actor.kind === "admin" ? "ADMIN" : "SALES");

/** A rep's lead: assigned to them and still live. Another rep's lead is indistinguishable from a missing one. */
export function ownsLead(actor: LeadActor, lead: LeadAccessFacts): boolean {
  return actor.kind === "rep" && lead.assignedRepId === actor.salesRepId && !lead.archivedAt && !lead.deletedAt;
}

export function canViewLead(actor: LeadActor, lead: LeadAccessFacts): boolean {
  return actor.kind === "admin" || ownsLead(actor, lead);
}

/** Identity + contact data, source, assignment, archive/delete, linking: super admin only. */
export const canManageLead = (actor: LeadActor) => actor.kind === "admin";

/** Notes, calls, follow-ups: the admin, or the rep who owns it. Deleted leads are frozen. */
export function canWorkLead(actor: LeadActor, lead: LeadAccessFacts): boolean {
  if (lead.deletedAt) return false;
  return actor.kind === "admin" || ownsLead(actor, lead);
}

const RANK: Record<LeadStatus, number> = {
  NEW: 0,
  ASSIGNED: 1,
  CONTACTED: 2,
  INTERESTED: 3,
  DEMO_SCHEDULED: 4,
  NEGOTIATION: 5,
  CONVERTED: 6,
  LOST: 6,
};

/** Statuses a rep can pick for their own lead. */
export const REP_STATUS_TARGETS: LeadStatus[] = ["CONTACTED", "INTERESTED", "DEMO_SCHEDULED", "NEGOTIATION", "LOST"];

export type TransitionCheck = { ok: true } | { ok: false; reason: string };

export function checkStatusChange(actor: LeadActor, lead: LeadAccessFacts, to: LeadStatus): TransitionCheck {
  if (!canWorkLead(actor, lead)) return { ok: false, reason: "الليد ده مش متاح لك" };
  if (lead.status === to) return { ok: false, reason: "دي حالته بالفعل" };
  if (to === "CONVERTED") return { ok: false, reason: "التحويل بيتسجل لوحده لما التاجر يدفع اشتراك — أو اربطه بحسابه من صفحة الليد" };
  if (lead.status === "CONVERTED") return { ok: false, reason: "الليد اتحوّل لعميل — فك الربط بحسابه الأول لو ده غلط" };

  if (actor.kind === "rep") {
    if (!REP_STATUS_TARGETS.includes(to)) return { ok: false, reason: "الحالة دي بتتحدد من الإدارة" };
    return { ok: true };
  }
  if (to === "NEW" && lead.assignedRepId) return { ok: false, reason: "الليد متسند لمندوب — شيله من المندوب الأول" };
  if (to === "ASSIGNED" && !lead.assignedRepId) return { ok: false, reason: "اسند الليد لمندوب الأول" };
  return { ok: true };
}

/** After (re)assignment: an untouched lead follows its owner; one already being worked keeps its stage. */
export function statusAfterAssignment(status: LeadStatus, hasRep: boolean): LeadStatus {
  if (hasRep && status === "NEW") return "ASSIGNED";
  if (!hasRep && status === "ASSIGNED") return "NEW";
  return status;
}

/**
 * Logging an interaction moves an early lead forward on its own: someone who
 * answered is at least CONTACTED; a demo puts it at DEMO_SCHEDULED. It never
 * moves a lead back, and never touches LOST / CONVERTED.
 */
export function statusAfterInteraction(status: LeadStatus, type: InteractionType, reached: boolean | null): LeadStatus {
  if (status === "LOST" || status === "CONVERTED") return status;
  const target: LeadStatus | null =
    type === "DEMO" ? "DEMO_SCHEDULED" : type === "MEETING" || ((type === "CALL" || type === "WHATSAPP" || type === "EMAIL") && reached) ? "CONTACTED" : null;
  return target && RANK[target] > RANK[status] ? target : status;
}

/** Interactions that set lastContactedAt — every attempt counts (a missed call still means someone tried). Notes don't. */
export const countsAsContact = (type: InteractionType) => type !== "NOTE";
