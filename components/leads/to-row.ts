import type { LeadRow } from "@/lib/leads/queries";
import { repLabel } from "@/lib/leads/queries";
import type { LeadTableRow } from "./leads-table";

/** Server list row → the table's serializable row. */
export const toTableRow = (r: LeadRow): LeadTableRow => ({
  id: r.id,
  businessName: r.businessName,
  ownerName: r.ownerName,
  phone: r.phone,
  whatsapp: r.whatsapp,
  category: r.category,
  city: r.city,
  source: r.source,
  status: r.status,
  priority: r.priority,
  score: r.score,
  repName: repLabel(r.assignedRep),
  repActive: r.assignedRep?.status !== "DISABLED",
  lastContactedAt: r.lastContactedAt,
  nextFollowUpAt: r.nextFollowUpAt,
  createdAt: r.createdAt,
  archived: !!r.archivedAt,
});
