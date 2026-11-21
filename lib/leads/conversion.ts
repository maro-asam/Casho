/**
 * Lead → Casho customer. Rules (pure) in conversion-rules.ts; this file is the
 * DB side. A conversion only ever *links* a lead to the merchant's existing
 * User + Store — it never creates an account, a store, a SalesAttribution or a
 * commission. The sales engine (lib/sales/engine.ts) stays the only source of
 * commissions, and the referral attribution stays authoritative: the lead's
 * rep is shown next to the attributed rep, never written over it.
 *
 * Idempotent: Lead.customerUserId and Lead.conversionTxId are unique, every
 * write is conditional (`customerUserId: null` / `convertedAt: null`), and the
 * hourly cron re-runs it as a safety net for any missed billing hook.
 */
import { BalanceTransactionType, Prisma, UserRole } from "@prisma/client";
import { addDays } from "@/lib/subscriptions";
import { prisma } from "@/lib/prisma";
import { decideMatch, linkSourceFor, MATCH_REASONS, type MatchCandidate } from "./conversion-rules";
import { normalizePhone } from "./normalize";
import { logActivity, refreshDerived, type LeadActionResult } from "./service";
import type { LeadActor } from "./workflow";

type Tx = Prisma.TransactionClient;

const isUniqueViolation = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002";

/** The account's first-ever subscription charge, on any store it owns — the moment it became a paying customer. */
async function firstCharge(db: Tx | typeof prisma, userId: string) {
  return db.balanceTransaction.findFirst({
    where: { type: BalanceTransactionType.SUBSCRIPTION_CHARGE, store: { userId } },
    orderBy: { createdAt: "asc" },
    select: { id: true, storeId: true, createdAt: true },
  });
}

/** Marks a linked lead converted from that charge. No-op when already converted. */
async function convertLinked(tx: Tx, leadId: string, charge: { id: string; storeId: string; createdAt: Date }) {
  const lead = await tx.lead.findUnique({ where: { id: leadId }, select: { status: true, convertedAt: true, customerStoreId: true } });
  if (!lead || lead.convertedAt) return false;
  const res = await tx.lead.updateMany({
    where: { id: leadId, convertedAt: null },
    data: {
      status: "CONVERTED",
      statusChangedAt: new Date(),
      convertedAt: charge.createdAt,
      conversionTxId: charge.id,
      customerStoreId: lead.customerStoreId ?? charge.storeId,
      lostReason: null,
      lostNote: null,
      lostAt: null,
    },
  });
  if (res.count === 0) return false;
  await logActivity(tx, "SYSTEM", leadId, { type: "CONVERTED", previousValue: lead.status, newValue: "CONVERTED", description: "أول خصم اشتراك من رصيد المتجر" });
  await refreshDerived(tx, [leadId]);
  return true;
}

/**
 * Billing hook — call after a subscription charge (next to
 * recordSalesCommissionsForStore). Never throws: leads must not break billing.
 */
export async function recordLeadConversionForStore(storeId: string): Promise<void> {
  try {
    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { userId: true } });
    if (store) await syncLeadConversionForUser(store.userId);
  } catch (error) {
    if (isUniqueViolation(error)) return; // a concurrent run linked it
    console.error("[leads] conversion sync failed", { storeId, error });
  }
}

export type ConversionSync = "none" | "converted" | "linked" | "review" | "skipped";

export async function syncLeadConversionForUser(userId: string): Promise<ConversionSync> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true, googleId: true, phone_number: true, role: true, lead: { select: { id: true, convertedAt: true, deletedAt: true } } },
  });
  if (!user || user.role !== UserRole.USER) return "skipped";
  const charge = await firstCharge(prisma, user.id);
  if (!charge) return "none"; // signed up or on trial — not a conversion

  // 1) A lead already linked to this account (by an admin, or an earlier match) converts now.
  if (user.lead) {
    if (user.lead.convertedAt || user.lead.deletedAt) return "none";
    const done = await prisma.$transaction((tx) => convertLinked(tx, user.lead!.id, charge));
    return done ? "converted" : "none";
  }

  // 2) Otherwise look for the lead this merchant came from.
  const phone = normalizePhone(user.phone_number);
  const emailVerified = user.emailVerified || !!user.googleId;
  const or: Prisma.LeadWhereInput[] = [];
  if (phone) or.push({ normalizedPhone: phone }, { normalizedWhatsapp: phone });
  if (emailVerified) or.push({ email: user.email.toLowerCase() });
  if (or.length === 0) return "none";

  const candidates = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      customerUserId: null,
      convertedAt: null,
      // A lead added after the merchant already paid didn't bring them in.
      createdAt: { lte: charge.createdAt },
      // A super admin already said "not this one" (dismissed, or unlinked by hand).
      matches: { none: { userId: user.id, status: "DISMISSED" } },
      OR: or,
    },
    select: { id: true, normalizedPhone: true, normalizedWhatsapp: true, email: true },
    take: 10,
  });
  if (candidates.length === 0) return "none";

  const phoneSharedWithOthers = phone ? (await prisma.user.count({ where: { phone_number: phone, id: { not: user.id } } })) > 0 : false;
  const decision = decideMatch(
    { userId: user.id, email: user.email, emailVerified, phone, phoneSharedWithOthers },
    candidates.map((c): MatchCandidate => ({ leadId: c.id, normalizedPhone: c.normalizedPhone, normalizedWhatsapp: c.normalizedWhatsapp, email: c.email })),
  );

  if (decision.kind === "none") return "none";
  if (decision.kind === "review") {
    await prisma.leadConversionMatch.createMany({
      data: decision.matches.map((m) => ({ leadId: m.leadId, userId: user.id, storeId: charge.storeId, matchedBy: m.matchedBy, reason: m.reason })),
      skipDuplicates: true, // a dismissed match stays dismissed
    });
    return "review";
  }

  const linked = await prisma.$transaction(async (tx) => {
    const res = await tx.lead.updateMany({
      where: { id: decision.leadId, customerUserId: null, deletedAt: null },
      data: { customerUserId: user.id, customerStoreId: charge.storeId, linkSource: linkSourceFor(decision.matchedBy), linkedAt: new Date() },
    });
    if (res.count === 0) return false;
    await logActivity(tx, "SYSTEM", decision.leadId, {
      type: "LINKED",
      newValue: user.email,
      description: decision.matchedBy === "PHONE" ? "مطابقة رقم التسجيل" : "مطابقة الإيميل المتأكد منه",
    });
    await convertLinked(tx, decision.leadId, charge);
    await tx.leadConversionMatch.updateMany({ where: { userId: user.id, status: "OPEN" }, data: { status: "DISMISSED", resolvedAt: new Date() } });
    return true;
  });
  return linked ? "linked" : "none";
}

/**
 * Hourly safety net (renew-subscriptions cron): accounts with a subscription
 * charge in the last `days` days that aren't linked to a lead yet, plus leads
 * an admin linked before the merchant paid.
 */
export async function sweepLeadConversions(opts: { now?: Date; days?: number } = {}) {
  const now = opts.now ?? new Date();
  const since = addDays(now, -(opts.days ?? 35));
  const totals = { checked: 0, converted: 0, linked: 0, review: 0, failed: 0 };

  // Skip the whole sweep when nobody has leads yet.
  if ((await prisma.lead.count({ where: { deletedAt: null, convertedAt: null } })) === 0) return totals;

  const [recentPayers, linkedUnconverted] = await Promise.all([
    prisma.store.findMany({
      where: { balanceTransactions: { some: { type: BalanceTransactionType.SUBSCRIPTION_CHARGE, createdAt: { gte: since } } }, user: { lead: { is: null } } },
      select: { userId: true },
      take: 2000,
    }),
    prisma.lead.findMany({ where: { customerUserId: { not: null }, convertedAt: null, deletedAt: null }, select: { customerUserId: true }, take: 2000 }),
  ]);
  const userIds = [...new Set([...recentPayers.map((s) => s.userId), ...linkedUnconverted.map((l) => l.customerUserId!)])];
  for (const userId of userIds) {
    totals.checked += 1;
    try {
      const r = await syncLeadConversionForUser(userId);
      if (r === "converted") totals.converted += 1;
      if (r === "linked") totals.linked += 1;
      if (r === "review") totals.review += 1;
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      totals.failed += 1;
      console.error("[leads] conversion sweep", userId, error);
    }
  }
  return totals;
}

// ─── Manual linking (super admin) ───────────────────────────────────────────

export type AccountHit = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: Date;
  stores: { id: string; name: string; slug: string }[];
  paidAt: Date | null;
  linkedLead: { id: string; businessName: string } | null;
};

/** Merchant accounts by email, phone, or store name / slug — for the link dialog. */
export async function findMerchantAccounts(query: string): Promise<AccountHit[]> {
  const q = query.trim();
  const phone = normalizePhone(q);
  const or: Prisma.UserWhereInput[] = [
    { email: { contains: q.toLowerCase() } },
    { name: { contains: q, mode: "insensitive" } },
    { stores: { some: { OR: [{ slug: { contains: q.toLowerCase() } }, { name: { contains: q, mode: "insensitive" } }] } } },
  ];
  if (phone) or.push({ phone_number: phone });
  const users = await prisma.user.findMany({
    where: { role: UserRole.USER, OR: or },
    take: 8,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone_number: true,
      createdAt: true,
      stores: { select: { id: true, name: true, slug: true }, take: 3 },
      lead: { select: { id: true, businessName: true } },
    },
  });
  const charges = await prisma.balanceTransaction.groupBy({
    by: ["storeId"],
    where: { type: BalanceTransactionType.SUBSCRIPTION_CHARGE, store: { userId: { in: users.map((u) => u.id) } } },
    _min: { createdAt: true },
  });
  const paidByStore = new Map(charges.map((c) => [c.storeId, c._min.createdAt]));
  return users.map((u) => {
    const paid = u.stores.map((s) => paidByStore.get(s.id)).filter((d): d is Date => !!d);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone_number,
      createdAt: u.createdAt,
      stores: u.stores,
      paidAt: paid.length ? new Date(Math.min(...paid.map((d) => d.getTime()))) : null,
      linkedLead: u.lead,
    };
  });
}

/** Casho accounts that already use this phone / email — a warning on the add form, never a block. */
export async function existingAccountsFor(keys: { normalizedPhone: string; email: string | null }) {
  const or: Prisma.UserWhereInput[] = [{ phone_number: keys.normalizedPhone }];
  if (keys.email) or.push({ email: keys.email });
  return prisma.user.findMany({
    where: { role: UserRole.USER, OR: or },
    take: 3,
    select: { id: true, email: true, stores: { select: { name: true, slug: true }, take: 1 } },
  });
}

export async function linkLeadToAccount(actor: LeadActor, leadId: string, userId: string): Promise<LeadActionResult> {
  if (actor.kind !== "admin") return { success: false, message: "الليد ده مش متاح لك" };
  const [lead, user] = await Promise.all([
    prisma.lead.findFirst({ where: { id: leadId, deletedAt: null }, select: { id: true, customerUserId: true, status: true } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, lead: { select: { id: true } }, stores: { select: { id: true }, orderBy: { createdAt: "asc" }, take: 1 } },
    }),
  ]);
  if (!lead) return { success: false, message: "الليد ده مش موجود" };
  if (lead.customerUserId) return { success: false, message: "الليد مربوط بحساب بالفعل — فك الربط الأول" };
  if (!user || user.role !== UserRole.USER) return { success: false, message: "الحساب ده مش حساب تاجر" };
  if (user.lead) return { success: false, message: "الحساب ده مربوط بليد تاني بالفعل" };
  if (user.stores.length === 0) return { success: false, message: "الحساب ده ملوش متجر" };

  try {
    const converted = await prisma.$transaction(async (tx) => {
      const charge = await firstCharge(tx, user.id);
      await tx.lead.update({
        where: { id: leadId },
        data: { customerUserId: user.id, customerStoreId: charge?.storeId ?? user.stores[0].id, linkSource: "ADMIN", linkedAt: new Date(), linkedById: actor.userId },
      });
      await logActivity(tx, actor, leadId, { type: "LINKED", newValue: user.email, description: "ربط يدوي من الإدارة" });
      await tx.leadConversionMatch.updateMany({ where: { leadId, userId: user.id, status: "OPEN" }, data: { status: "LINKED", resolvedById: actor.userId, resolvedAt: new Date() } });
      await tx.leadConversionMatch.updateMany({ where: { userId: user.id, status: "OPEN" }, data: { status: "DISMISSED", resolvedById: actor.userId, resolvedAt: new Date() } });
      return charge ? convertLinked(tx, leadId, charge) : false;
    });
    return {
      success: true,
      message: converted ? "اترابط الليد واتحسب تحويل — الحساب دافع اشتراك" : "اترابط الليد — هيتحسب تحويل أول ما المتجر يدفع اشتراك",
      leadId,
    };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false, message: "الحساب ده اترابط بليد تاني من شوية" };
    throw error;
  }
}

export async function unlinkLeadFromAccount(actor: LeadActor, leadId: string, reason: string | null): Promise<LeadActionResult> {
  if (actor.kind !== "admin") return { success: false, message: "الليد ده مش متاح لك" };
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, deletedAt: null },
    select: { id: true, customerUserId: true, convertedAt: true, assignedRepId: true, customerUser: { select: { email: true } } },
  });
  if (!lead?.customerUserId) return { success: false, message: "الليد مش مربوط بحساب" };

  // Back to where it was before it converted (from the CONVERTED entry), or the start of the pipeline.
  const lastConversion = lead.convertedAt
    ? await prisma.leadActivity.findFirst({ where: { leadId, type: "CONVERTED" }, orderBy: { createdAt: "desc" }, select: { previousValue: true } })
    : null;
  const back = (lastConversion?.previousValue as Prisma.LeadUpdateInput["status"]) ?? (lead.assignedRepId ? "ASSIGNED" : "NEW");

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: leadId },
      data: {
        customerUserId: null,
        customerStoreId: null,
        linkSource: null,
        linkedAt: null,
        linkedById: null,
        convertedAt: null,
        conversionTxId: null,
        ...(lead.convertedAt ? { status: back, statusChangedAt: new Date() } : {}),
      },
    });
    await logActivity(tx, actor, leadId, { type: "UNLINKED", previousValue: lead.customerUser?.email ?? null, description: reason });
    // So the matcher doesn't link the same pair straight back.
    await tx.leadConversionMatch.upsert({
      where: { leadId_userId: { leadId, userId: lead.customerUserId! } },
      create: { leadId, userId: lead.customerUserId!, matchedBy: "PHONE", reason: "UNLINKED", status: "DISMISSED", resolvedById: actor.userId, resolvedAt: new Date() },
      update: { status: "DISMISSED", resolvedById: actor.userId, resolvedAt: new Date() },
    });
    await refreshDerived(tx, [leadId]);
  });
  return { success: true, message: "اتفك الربط", leadId };
}

export async function resolveConversionMatch(actor: LeadActor, matchId: string, decision: "link" | "dismiss"): Promise<LeadActionResult> {
  if (actor.kind !== "admin") return { success: false, message: "مش مسموح" };
  const match = await prisma.leadConversionMatch.findUnique({ where: { id: matchId }, select: { id: true, leadId: true, userId: true, status: true } });
  if (!match || match.status !== "OPEN") return { success: false, message: "المطابقة دي اتحسمت قبل كده" };
  if (decision === "dismiss") {
    await prisma.leadConversionMatch.update({ where: { id: matchId }, data: { status: "DISMISSED", resolvedById: actor.userId, resolvedAt: new Date() } });
    return { success: true, message: "اتشالت المطابقة" };
  }
  return linkLeadToAccount(actor, match.leadId, match.userId);
}

export const MATCH_REASON_LABELS: Record<string, string> = { ...MATCH_REASONS, UNLINKED: "اتفك الربط يدويًا" };
