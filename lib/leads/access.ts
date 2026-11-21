/**
 * Who is acting on leads, resolved from the session on every request — never
 * from anything the browser sends. Lead management is for super admins; a
 * rep reaches only the leads assigned to them (lib/leads/workflow.ts).
 *
 * Widen LEAD_ADMIN_ROLES to let ADMIN accounts manage leads too.
 */
import { notFound } from "next/navigation";
import { SalesRepStatus, UserRole } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { PanelUser } from "@/lib/admin/page-guard";
import type { LeadActor } from "./workflow";

export const LEAD_ADMIN_ROLES: readonly UserRole[] = [UserRole.SUPER_ADMIN];
export const isLeadAdminRole = (role: UserRole | string) => (LEAD_ADMIN_ROLES as readonly string[]).includes(role);

export type AdminLeadActor = Extract<LeadActor, { kind: "admin" }>;
export type RepLeadActor = Extract<LeadActor, { kind: "rep" }> & { name: string | null; email: string };

export class LeadAccessError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

async function sessionUser() {
  const session = await getCurrentSession();
  if (!session?.user) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, salesRep: { select: { id: true, status: true } } },
  });
}

/** The signed-in super admin or active rep, or null for anyone else (signed out included). */
export async function getLeadActor(): Promise<AdminLeadActor | RepLeadActor | null> {
  const user = await sessionUser();
  if (!user) return null;
  if (isLeadAdminRole(user.role)) return { kind: "admin", userId: user.id };
  if (user.role === UserRole.SALES && user.salesRep?.status === SalesRepStatus.ACTIVE) {
    return { kind: "rep", userId: user.id, salesRepId: user.salesRep.id, name: user.name, email: user.email };
  }
  return null;
}

/** Server actions / routes for super admins. */
export async function requireLeadAdmin(): Promise<AdminLeadActor> {
  const actor = await getLeadActor();
  if (actor?.kind !== "admin") throw new LeadAccessError();
  return actor;
}

/** Server actions for reps (a super admin is refused here — they use the admin actions). */
export async function requireLeadRep(): Promise<RepLeadActor> {
  const actor = await getLeadActor();
  if (actor?.kind !== "rep") throw new LeadAccessError();
  return actor;
}

/** Either side — for actions both use (notes, follow-ups, status). */
export async function requireLeadActor(): Promise<AdminLeadActor | RepLeadActor> {
  const actor = await getLeadActor();
  if (!actor) throw new LeadAccessError();
  return actor;
}

/**
 * Admin pages: `assertLeadAdmin(await requireAdminPage())`. An admin without
 * lead access gets a 404, like anyone outside the panel.
 */
export function assertLeadAdmin(user: PanelUser): AdminLeadActor {
  if (!isLeadAdminRole(user.role)) notFound();
  return { kind: "admin", userId: user.id };
}

export { leadScopeFor } from "./scope";
