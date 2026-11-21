/**
 * Lead list filters: read from the URL (anything unknown is dropped) and
 * turned into a Prisma `where`. The actor's scope is ANDed in last and can't
 * be widened by any filter — a rep passing `rep=<someone else>` still only
 * gets their own leads. Pure (unit-tested).
 */
import type { LeadPriority, LeadSource, LeadStatus, Prisma } from "@prisma/client";
import { LEAD_SOURCES, LEAD_STATUSES, PRIORITIES } from "./constants";
import { cairoDayBounds } from "./follow-ups";
import { leadScopeFor } from "./scope";
import type { LeadActor } from "./workflow";
import { normalizePhone, toLatinDigits } from "./normalize";

export const LEAD_SORTS = ["createdAt", "businessName", "status", "priority", "score", "lastContactedAt", "nextFollowUpAt"] as const;
export type LeadSort = (typeof LEAD_SORTS)[number];

export const LEAD_VIEWS = ["active", "archived", "deleted"] as const;
export type LeadView = (typeof LEAD_VIEWS)[number];

export const FOLLOW_UP_FILTERS = ["overdue", "today", "week", "none"] as const;
export type FollowUpFilter = (typeof FOLLOW_UP_FILTERS)[number];

export type LeadFilters = {
  q?: string;
  status?: LeadStatus;
  /** A rep id, "none" (unassigned) or "inactive" (rep disabled — waiting for reassignment). Admin only. */
  rep?: string;
  category?: string;
  city?: string;
  source?: LeadSource;
  priority?: LeadPriority;
  /** YYYY-MM-DD, Cairo days, inclusive. */
  from?: string;
  to?: string;
  followUp?: FollowUpFilter;
  view: LeadView;
  sort: LeadSort;
  dir: "asc" | "desc";
  page: number;
};

type Params = Record<string, string | string[] | undefined> | undefined;

const one = (p: Params, key: string) => {
  const v = p?.[key];
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  return s ? s.slice(0, 120) : undefined;
};
const pick = <T extends string>(values: readonly T[], raw: string | undefined) => (raw && (values as readonly string[]).includes(raw) ? (raw as T) : undefined);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function readLeadFilters(p: Params): LeadFilters {
  const page = Number(one(p, "page"));
  return {
    q: one(p, "q"),
    status: pick(LEAD_STATUSES, one(p, "status")),
    rep: one(p, "rep"),
    category: one(p, "category"),
    city: one(p, "city"),
    source: pick(LEAD_SOURCES, one(p, "source")),
    priority: pick(PRIORITIES, one(p, "priority")),
    from: DAY.test(one(p, "from") ?? "") ? one(p, "from") : undefined,
    to: DAY.test(one(p, "to") ?? "") ? one(p, "to") : undefined,
    followUp: pick(FOLLOW_UP_FILTERS, one(p, "followUp")),
    view: pick(LEAD_VIEWS, one(p, "view")) ?? "active",
    sort: pick(LEAD_SORTS, one(p, "sort")) ?? "createdAt",
    dir: one(p, "dir") === "asc" ? "asc" : "desc",
    page: Number.isInteger(page) && page > 1 ? Math.min(page, 10_000) : 1,
  };
}

/** Filters that narrow the list (for "clear filters" and empty states). */
export const hasNarrowingFilters = (f: LeadFilters) =>
  !!(f.q || f.status || f.rep || f.category || f.city || f.source || f.priority || f.from || f.to || f.followUp);

function cairoDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return cairoDayBounds(new Date(Date.UTC(y, m - 1, d, 10))).start;
}

export function buildLeadWhere(actor: LeadActor, f: LeadFilters, now = new Date()): Prisma.LeadWhereInput {
  const and: Prisma.LeadWhereInput[] = [];

  // Archive / trash views exist for the admin only; a rep is always on live leads (the scope enforces it too).
  const view = actor.kind === "admin" ? f.view : "active";
  if (view === "deleted") and.push({ deletedAt: { not: null } });
  else and.push({ deletedAt: null, archivedAt: view === "archived" ? { not: null } : null });

  if (f.q) {
    const q = f.q;
    const phone = normalizePhone(q);
    const digits = toLatinDigits(q).replace(/\D/g, "");
    const or: Prisma.LeadWhereInput[] = [
      { businessName: { contains: q, mode: "insensitive" } },
      { ownerName: { contains: q, mode: "insensitive" } },
      { email: { contains: q.toLowerCase() } },
    ];
    if (phone) or.push({ normalizedPhone: phone }, { normalizedWhatsapp: phone });
    if (digits.length >= 4) or.push({ normalizedPhone: { contains: digits } }, { phone: { contains: digits } });
    and.push({ OR: or });
  }
  if (f.status) and.push({ status: f.status });
  if (f.category) and.push({ category: f.category });
  if (f.city) and.push({ city: f.city });
  if (f.source) and.push({ source: f.source });
  if (f.priority) and.push({ priority: f.priority });
  if (f.from) and.push({ createdAt: { gte: cairoDay(f.from) } });
  if (f.to) and.push({ createdAt: { lt: cairoDayBounds(cairoDay(f.to)).end } });

  if (f.followUp) {
    const { end } = cairoDayBounds(now);
    if (f.followUp === "overdue") and.push({ nextFollowUpAt: { lt: now } });
    else if (f.followUp === "today") and.push({ nextFollowUpAt: { gte: now, lt: end } });
    else if (f.followUp === "week") and.push({ nextFollowUpAt: { gte: now, lt: new Date(end.getTime() + 6 * 86_400_000) } });
    else and.push({ nextFollowUpAt: null });
  }

  if (actor.kind === "admin" && f.rep) {
    if (f.rep === "none") and.push({ assignedRepId: null });
    else if (f.rep === "inactive") and.push({ assignedRep: { status: "DISABLED" } });
    else and.push({ assignedRepId: f.rep });
  }

  // Last, and never optional: the actor's own scope.
  and.push(leadScopeFor(actor));
  return { AND: and };
}

const PRIORITY_RANK_SORT: Record<"asc" | "desc", Prisma.SortOrder> = { asc: "asc", desc: "desc" };

export function leadOrderBy(f: Pick<LeadFilters, "sort" | "dir">): Prisma.LeadOrderByWithRelationInput[] {
  const dir = PRIORITY_RANK_SORT[f.dir];
  switch (f.sort) {
    case "lastContactedAt":
    case "nextFollowUpAt":
      return [{ [f.sort]: { sort: dir, nulls: "last" } }, { createdAt: "desc" }];
    case "priority":
      // Enum order is LOW → HOT, so "desc" puts HOT first.
      return [{ priority: dir }, { score: dir }, { createdAt: "desc" }];
    case "createdAt":
      return [{ createdAt: dir }];
    default:
      return [{ [f.sort]: dir }, { createdAt: "desc" }];
  }
}
