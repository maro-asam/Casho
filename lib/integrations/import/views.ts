/**
 * The only shapes of import data that reach the browser. Built field-by-field
 * (never by spreading a DB row) so encrypted tokens, lock tokens and cursors
 * can't leak by accident when the schema grows.
 */
import type { ImportConnection, ImportItemError, ImportJob } from "@prisma/client";
import { ALL_ORDERS_SCOPE } from "@/lib/integrations/shopify/config";
import { parseProgress } from "./progress";
import { orderEntities, type ImportableEntity, type ImportProgress } from "./types";

export type ConnectionView = {
  provider: ImportConnection["provider"];
  shopName: string;
  shopDomain: string;
  currencyCode: string | null;
  status: ImportConnection["status"];
  /** Orders older than 60 days are readable (read_all_orders granted). */
  hasAllOrders: boolean;
  connectedAt: string;
};

export type FailureView = {
  entityType: ImportItemError["entityType"];
  externalId: string;
  label: string | null;
  message: string;
};

export type JobView = {
  id: string;
  kind: ImportJob["kind"];
  status: ImportJob["status"];
  entities: ImportableEntity[];
  currentEntity: ImportableEntity | null;
  progress: ImportProgress;
  lastError: string | null;
  attempts: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  failures: FailureView[];
  unresolvedFailures: number;
};

export function toConnectionView(c: ImportConnection): ConnectionView {
  return {
    provider: c.provider,
    shopName: c.shopName,
    shopDomain: c.shopDomain,
    currencyCode: c.currencyCode,
    status: c.status,
    hasAllOrders: c.scopes.includes(ALL_ORDERS_SCOPE),
    connectedAt: c.updatedAt.toISOString(),
  };
}

export function toFailureView(e: Pick<ImportItemError, "entityType" | "externalId" | "label" | "message">): FailureView {
  return { entityType: e.entityType, externalId: e.externalId, label: e.label, message: e.message };
}

export function toJobView(job: ImportJob, failures: FailureView[] = [], unresolvedFailures = 0): JobView {
  return {
    id: job.id,
    kind: job.kind,
    status: job.status,
    entities: orderEntities(job.entities),
    currentEntity: (job.currentEntity as ImportableEntity | null) ?? null,
    progress: parseProgress(job.progress),
    lastError: job.lastError,
    attempts: job.attempts,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    failures,
    unresolvedFailures,
  };
}
