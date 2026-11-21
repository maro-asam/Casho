/**
 * Lead notices to reps, through the Sales dashboard's existing channel
 * (lib/sales/notify.ts → bell + email, each key sent once):
 *   - a super admin assigned them leads
 *   - a follow-up is due within the hour (the hourly renew-subscriptions cron)
 * Never throws.
 */
import { SalesRepStatus } from "@prisma/client";
import { inBackground } from "@/lib/notifications/email/deliver";
import { prisma } from "@/lib/prisma";
import { sendRepNotice, type RepNotice } from "@/lib/sales/notify";
import { fmtDateTime, fmtNum, fmtWhen } from "@/lib/sales/format";
import { STATUS_META } from "./constants";
import { REMINDER_LEAD_MS } from "./follow-ups";

type Rep = { userId: string; email: string; name: string | null };

async function activeRep(salesRepId: string): Promise<Rep | null> {
  const rep = await prisma.salesRep.findUnique({
    where: { id: salesRepId },
    select: { status: true, user: { select: { id: true, email: true, name: true } } },
  });
  return rep && rep.status === SalesRepStatus.ACTIVE ? { userId: rep.user.id, email: rep.user.email, name: rep.user.name } : null;
}

export function assignmentNotice(batchKey: string, leads: { id: string; businessName: string; ownerName: string | null; phone: string }[]): RepNotice {
  if (leads.length === 1) {
    const [l] = leads;
    return {
      key: `lead-assigned:${batchKey}`,
      title: "اتسندلك ليد جديد",
      message: `${l.businessName}${l.ownerName ? ` (${l.ownerName})` : ""} — كلّمه في أقرب وقت.`,
      href: `/sales/leads/${l.id}`,
      email: {
        subject: `ليد جديد ليك: ${l.businessName}`,
        rows: [
          { label: "النشاط", value: l.businessName },
          { label: "صاحب النشاط", value: l.ownerName },
          { label: "الموبايل", value: l.phone, ltr: true },
        ],
        cta: "افتح الليد",
      },
    };
  }
  return {
    key: `lead-assigned:${batchKey}`,
    title: `اتسندلك ${fmtNum(leads.length)} ليد جديد`,
    message: `أولهم ${leads[0].businessName}. هتلاقيهم كلهم في «ليداتي».`,
    href: "/sales/leads?status=ASSIGNED",
    email: {
      subject: `${fmtNum(leads.length)} ليد جديد ليك`,
      rows: leads.slice(0, 5).map((l, i) => ({ label: `${fmtNum(i + 1)}`, value: l.businessName })),
      cta: "افتح ليداتي",
    },
  };
}

export function followUpNotice(f: { id: string; dueAt: Date; note: string | null; lead: { id: string; businessName: string; status: keyof typeof STATUS_META } }, now: Date): RepNotice {
  const late = f.dueAt.getTime() < now.getTime();
  return {
    key: `lead-followup:${f.id}`,
    title: late ? `متابعة متأخرة: ${f.lead.businessName}` : `متابعة ${fmtWhen(f.dueAt, now)}: ${f.lead.businessName}`,
    message: f.note?.trim() || `الليد حالته «${STATUS_META[f.lead.status].label}». سجّل اللي حصل بعد ما تكلمه.`,
    href: `/sales/leads/${f.lead.id}`,
    email: {
      subject: late ? `متابعة متأخرة: ${f.lead.businessName}` : `متابعة قربت: ${f.lead.businessName}`,
      rows: [
        { label: "الليد", value: f.lead.businessName },
        { label: "الميعاد", value: fmtDateTime(f.dueAt) },
        { label: "ملاحظة", value: f.note },
      ],
      cta: "افتح الليد",
    },
  };
}

/** After an assignment commits: one notice per batch to the new rep. */
export function queueLeadAssignedNotice(salesRepId: string, leadIds: string[], batchKey: string) {
  if (leadIds.length === 0) return;
  inBackground(async () => {
    const rep = await activeRep(salesRepId);
    if (!rep) return;
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds.slice(0, 500) }, assignedRepId: salesRepId, deletedAt: null },
      select: { id: true, businessName: true, ownerName: true, phone: true },
      orderBy: { createdAt: "asc" },
    });
    if (leads.length) await sendRepNotice(rep, assignmentNotice(batchKey, leads));
  });
}

/**
 * Hourly: one reminder per pending follow-up, an hour before it's due (or as
 * soon as the cron runs, if it was missed). Only reps get them — a super
 * admin's own follow-ups are counted on the Leads badge instead.
 */
export async function sweepLeadFollowUpReminders(now = new Date()) {
  const due = await prisma.leadFollowUp.findMany({
    where: {
      status: "PENDING",
      reminderSentAt: null,
      dueAt: { lte: new Date(now.getTime() + REMINDER_LEAD_MS) },
      salesRepId: { not: null },
      salesRep: { status: SalesRepStatus.ACTIVE },
      lead: { deletedAt: null, archivedAt: null },
    },
    orderBy: { dueAt: "asc" },
    take: 500,
    select: {
      id: true,
      dueAt: true,
      note: true,
      salesRepId: true,
      lead: { select: { id: true, businessName: true, status: true, assignedRepId: true } },
      salesRep: { select: { user: { select: { id: true, email: true, name: true } } } },
    },
  });

  const totals = { reminded: 0, failed: 0 };
  for (const f of due) {
    try {
      // A follow-up on a lead that moved to someone else isn't theirs to call any more.
      if (f.salesRepId && f.lead.assignedRepId === f.salesRepId && f.salesRep) {
        const u = f.salesRep.user;
        await sendRepNotice({ userId: u.id, email: u.email, name: u.name }, followUpNotice(f, now));
        totals.reminded += 1;
      }
      await prisma.leadFollowUp.updateMany({ where: { id: f.id, reminderSentAt: null }, data: { reminderSentAt: now } });
    } catch (error) {
      totals.failed += 1;
      console.error("[leads] follow-up reminder", f.id, error);
    }
  }
  return totals;
}
