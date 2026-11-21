"use server";

/**
 * Super-admin lead actions. The actor always comes from the session
 * (requireLeadAdmin); ids from the browser only ever narrow what it touches.
 */
import { requireLeadAdmin } from "@/lib/leads/access";
import { auditLeads } from "@/lib/leads/audit";
import {
  existingAccountsFor,
  findMerchantAccounts,
  linkLeadToAccount,
  resolveConversionMatch,
  unlinkLeadFromAccount,
  type AccountHit,
} from "@/lib/leads/conversion";
import { normalizePhone } from "@/lib/leads/normalize";
import {
  archiveLead,
  assignLeads,
  bulkChangeLeadStatus,
  changeLeadPriority,
  createLead,
  deleteLead,
  updateLead,
  type LeadActionResult,
} from "@/lib/leads/service";
import {
  assignLeadsSchema,
  bulkStatusSchema,
  changePrioritySchema,
  createLeadSchema,
  findAccountSchema,
  leadReasonSchema,
  linkCustomerSchema,
  resolveMatchSchema,
  updateLeadSchema,
} from "@/validations/leads.schema";
import { guarded, invalid } from "./shared";

export async function createLeadAction(input: unknown): Promise<LeadActionResult> {
  return guarded(async () => {
    const admin = await requireLeadAdmin();
    const parsed = createLeadSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const result = await createLead(admin, parsed.data);
    if (!result.success) return result;
    // Not a block — just tell the admin this business may already be on Casho.
    const accounts = await existingAccountsFor({ normalizedPhone: normalizePhone(parsed.data.phone)!, email: parsed.data.email });
    if (accounts.length) {
      const store = accounts[0].stores[0];
      return { ...result, message: `اتضاف الليد — بس الرقم أو الإيميل ده بتاع حساب كاشو موجود${store ? ` (${store.name})` : ""}. تقدر تربطه من صفحة الليد.` };
    }
    return result;
  });
}

export async function updateLeadAction(input: unknown): Promise<LeadActionResult> {
  return guarded(async () => {
    const admin = await requireLeadAdmin();
    const parsed = updateLeadSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const { leadId, ...fields } = parsed.data;
    return updateLead(admin, leadId, fields);
  });
}

export async function assignLeadsAction(input: unknown): Promise<LeadActionResult> {
  return guarded(async () => {
    const admin = await requireLeadAdmin();
    const parsed = assignLeadsSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const result = await assignLeads(admin, parsed.data.leadIds, parsed.data.salesRepId, parsed.data.reason);
    if (result.success && parsed.data.leadIds.length > 1) {
      await auditLeads(admin.userId, "LEADS_BULK_ASSIGNED", { count: result.changed ?? 0, salesRepId: parsed.data.salesRepId });
    }
    return result;
  });
}

export async function bulkLeadStatusAction(input: unknown): Promise<LeadActionResult> {
  return guarded(async () => {
    const admin = await requireLeadAdmin();
    const parsed = bulkStatusSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const result = await bulkChangeLeadStatus(admin, parsed.data.leadIds, parsed.data.status, parsed.data);
    if (result.success) await auditLeads(admin.userId, "LEADS_BULK_STATUS", { count: result.changed ?? 0, status: parsed.data.status });
    return result;
  });
}

export async function changeLeadPriorityAction(input: unknown): Promise<LeadActionResult> {
  return guarded(async () => {
    const admin = await requireLeadAdmin();
    const parsed = changePrioritySchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    return changeLeadPriority(admin, parsed.data.leadId, parsed.data.priority);
  });
}

function reasonAction(run: typeof archiveLead, restore: boolean) {
  return async (input: unknown) =>
    guarded(async () => {
      const admin = await requireLeadAdmin();
      const parsed = leadReasonSchema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      return run(admin, parsed.data.leadId, parsed.data.reason, restore);
    });
}

export async function archiveLeadAction(input: unknown) {
  return reasonAction(archiveLead, false)(input);
}
export async function restoreLeadAction(input: unknown) {
  return reasonAction(archiveLead, true)(input);
}
export async function deleteLeadAction(input: unknown) {
  const result = await reasonAction(deleteLead, false)(input);
  if (result.success && result.leadId) {
    const admin = await requireLeadAdmin();
    await auditLeads(admin.userId, "LEAD_DELETED", { leadId: result.leadId });
  }
  return result;
}
export async function undeleteLeadAction(input: unknown) {
  return reasonAction(deleteLead, true)(input);
}

export async function linkLeadAccountAction(input: unknown): Promise<LeadActionResult> {
  return guarded(async () => {
    const admin = await requireLeadAdmin();
    const parsed = linkCustomerSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    const result = await linkLeadToAccount(admin, parsed.data.leadId, parsed.data.userId);
    if (result.success) await auditLeads(admin.userId, "LEAD_LINKED", { leadId: parsed.data.leadId, userId: parsed.data.userId });
    return result;
  });
}

export async function unlinkLeadAccountAction(input: unknown): Promise<LeadActionResult> {
  return guarded(async () => {
    const admin = await requireLeadAdmin();
    const parsed = leadReasonSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    return unlinkLeadFromAccount(admin, parsed.data.leadId, parsed.data.reason);
  });
}

export async function resolveLeadMatchAction(input: unknown): Promise<LeadActionResult> {
  return guarded(async () => {
    const admin = await requireLeadAdmin();
    const parsed = resolveMatchSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    return resolveConversionMatch(admin, parsed.data.matchId, parsed.data.decision);
  });
}

/** The link dialog's search. */
export async function findLeadAccountsAction(input: unknown): Promise<{ success: boolean; message: string; accounts: AccountHit[] }> {
  try {
    await requireLeadAdmin();
    const parsed = findAccountSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "اكتب كلمة البحث", accounts: [] };
    const accounts = await findMerchantAccounts(parsed.data.query);
    return { success: true, message: accounts.length ? "" : "مفيش حسابات تجار بالبحث ده", accounts };
  } catch {
    return { success: false, message: "مش مسموح لك تعمل ده", accounts: [] };
  }
}
