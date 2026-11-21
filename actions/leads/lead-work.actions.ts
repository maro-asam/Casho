"use server";

/**
 * Working a lead — used by a super admin on any lead and by a rep on the
 * leads assigned to them. Scope and rules are enforced in lib/leads/service.ts
 * (rows are loaded through the actor's scope, so another rep's id fails like a
 * missing one).
 */
import { requireLeadActor } from "@/lib/leads/access";
import {
  cancelFollowUp,
  changeLeadStatus,
  completeFollowUp,
  logLeadInteraction,
  rescheduleFollowUp,
  scheduleFollowUp,
  type LeadActionResult,
} from "@/lib/leads/service";
import {
  cancelFollowUpSchema,
  changeStatusSchema,
  completeFollowUpSchema,
  logInteractionSchema,
  rescheduleFollowUpSchema,
  scheduleFollowUpSchema,
} from "@/validations/leads.schema";
import { guarded, invalid } from "./shared";

export async function changeLeadStatusAction(input: unknown): Promise<LeadActionResult> {
  return guarded(async () => {
    const actor = await requireLeadActor();
    const parsed = changeStatusSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    return changeLeadStatus(actor, parsed.data.leadId, parsed.data.status, parsed.data);
  });
}

export async function logLeadInteractionAction(input: unknown): Promise<LeadActionResult> {
  return guarded(async () => {
    const actor = await requireLeadActor();
    const parsed = logInteractionSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    return logLeadInteraction(actor, parsed.data);
  });
}

export async function scheduleLeadFollowUpAction(input: unknown): Promise<LeadActionResult> {
  return guarded(async () => {
    const actor = await requireLeadActor();
    const parsed = scheduleFollowUpSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    return scheduleFollowUp(actor, parsed.data.leadId, parsed.data.dueAt, parsed.data.note);
  });
}

export async function completeLeadFollowUpAction(input: unknown): Promise<LeadActionResult> {
  return guarded(async () => {
    const actor = await requireLeadActor();
    const parsed = completeFollowUpSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    return completeFollowUp(actor, parsed.data);
  });
}

export async function rescheduleLeadFollowUpAction(input: unknown): Promise<LeadActionResult> {
  return guarded(async () => {
    const actor = await requireLeadActor();
    const parsed = rescheduleFollowUpSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    return rescheduleFollowUp(actor, parsed.data.followUpId, parsed.data.dueAt, parsed.data.reason);
  });
}

export async function cancelLeadFollowUpAction(input: unknown): Promise<LeadActionResult> {
  return guarded(async () => {
    const actor = await requireLeadActor();
    const parsed = cancelFollowUpSchema.safeParse(input);
    if (!parsed.success) return invalid(parsed.error);
    return cancelFollowUp(actor, parsed.data.followUpId, parsed.data.reason);
  });
}
