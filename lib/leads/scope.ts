import type { Prisma } from "@prisma/client";
import type { LeadActor } from "./workflow";

/**
 * The rows an actor may ever touch (pure). Every lead query and mutation
 * starts from this, so another rep's lead id behaves exactly like a missing one.
 */
export function leadScopeFor(actor: LeadActor): Prisma.LeadWhereInput {
  if (actor.kind === "admin") return {};
  return { assignedRepId: actor.salesRepId, archivedAt: null, deletedAt: null };
}
