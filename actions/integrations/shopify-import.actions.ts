"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma, type ImportEntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { decryptSecret } from "@/lib/secrets";
import { ImportAccessError, requireImportAccess } from "@/lib/integrations/import/access";
import { isRunnable, runImportJob } from "@/lib/integrations/import/engine";
import { errorLogContext, isUniqueViolation, jobFailureMessage, SourceApiError } from "@/lib/integrations/import/errors";
import { initialProgress } from "@/lib/integrations/import/progress";
import { isImportableEntity, orderEntities, type ImportableEntity } from "@/lib/integrations/import/types";
import { toConnectionView, toFailureView, toJobView, type ConnectionView, type JobView } from "@/lib/integrations/import/views";
import { isShopifyConfigured } from "@/lib/integrations/shopify/config";
import { fetchPreviewCounts, type ShopifyPreviewCounts } from "@/lib/integrations/shopify/source";

const PROVIDER = "SHOPIFY" as const;
const PAGE_PATH = "/dashboard/integrations/shopify";
const FAILURES_SHOWN = 50;
const HISTORY_SIZE = 10;

type Fail = { ok: false; error: string };

async function guard(): Promise<{ storeId: string; userId: string } | Fail> {
  try {
    const ctx = await requireImportAccess();
    return { storeId: ctx.storeId, userId: ctx.userId };
  } catch (err) {
    if (err instanceof ImportAccessError) return { ok: false, error: err.message };
    throw err;
  }
}

/** Every job lookup is scoped by the caller's store — ids from the client are never trusted alone. */
async function findStoreJob(storeId: string, jobId: string) {
  return prisma.importJob.findFirst({ where: { id: jobId, storeId } });
}

async function jobView(storeId: string, jobId: string): Promise<JobView | null> {
  const job = await findStoreJob(storeId, jobId);
  if (!job) return null;
  const [failures, unresolved] = await Promise.all([
    prisma.importItemError.findMany({
      where: { jobId: job.id, storeId, resolvedAt: null },
      orderBy: { createdAt: "asc" },
      take: FAILURES_SHOWN,
      select: { entityType: true, externalId: true, label: true, message: true },
    }),
    prisma.importItemError.count({ where: { jobId: job.id, storeId, resolvedAt: null } }),
  ]);
  return toJobView(job, failures.map(toFailureView), unresolved);
}

function kick(jobId: string) {
  after(async () => {
    try {
      await runImportJob(jobId);
    } catch (err) {
      logger.error("[Import] Background run crashed", { jobId, ...errorLogContext(err) });
    }
  });
}

/** The "one unfinished import per store" index rejected a second job. */
const isActiveJobConflict = isUniqueViolation;

// ─── Page state ──────────────────────────────────────────────────────────────

export type ShopifyImportPageState =
  | Fail
  | {
      ok: true;
      configured: boolean;
      connection: ConnectionView | null;
      job: JobView | null;
      history: JobView[];
    };

export async function GetShopifyImportStateAction(): Promise<ShopifyImportPageState> {
  const access = await guard();
  if ("ok" in access) return access;

  const [connection, jobs] = await Promise.all([
    prisma.importConnection.findUnique({ where: { storeId_provider: { storeId: access.storeId, provider: PROVIDER } } }),
    prisma.importJob.findMany({
      where: { storeId: access.storeId, provider: PROVIDER },
      orderBy: { createdAt: "desc" },
      take: HISTORY_SIZE,
    }),
  ]);

  const latest = jobs[0] ? await jobView(access.storeId, jobs[0].id) : null;
  if (jobs[0] && isRunnable(jobs[0])) kick(jobs[0].id);

  return {
    ok: true,
    configured: isShopifyConfigured(),
    connection: connection && connection.status !== "DISCONNECTED" ? toConnectionView(connection) : null,
    job: latest,
    history: jobs.map((j) => toJobView(j)),
  };
}

// ─── Preview ─────────────────────────────────────────────────────────────────

export type PreviewResult = Fail | { ok: true; counts: ShopifyPreviewCounts; connection: ConnectionView };

export async function LoadShopifyPreviewAction(): Promise<PreviewResult> {
  const access = await guard();
  if ("ok" in access) return access;

  const connection = await prisma.importConnection.findUnique({
    where: { storeId_provider: { storeId: access.storeId, provider: PROVIDER } },
  });
  if (!connection || connection.status !== "ACTIVE") return { ok: false, error: "اربط متجر Shopify الأول" };

  try {
    const counts = await fetchPreviewCounts(connection);
    return { ok: true, counts, connection: toConnectionView(connection) };
  } catch (err) {
    logger.warn("[Shopify] Preview failed", { storeId: access.storeId, ...errorLogContext(err) });
    if (err instanceof SourceApiError && err.kind === "unauthorized") revalidatePath(PAGE_PATH);
    return { ok: false, error: jobFailureMessage(err) };
  }
}

// ─── Start / resume / cancel / retry ─────────────────────────────────────────

export type JobResult = Fail | { ok: true; job: JobView };

export async function StartShopifyImportAction(selected: string[]): Promise<JobResult> {
  const access = await guard();
  if ("ok" in access) return access;

  const entities = orderEntities(selected.filter(isImportableEntity));
  if (entities.length === 0) return { ok: false, error: "اختار نوع بيانات واحد على الأقل" };

  const connection = await prisma.importConnection.findUnique({
    where: { storeId_provider: { storeId: access.storeId, provider: PROVIDER } },
  });
  if (!connection || connection.status !== "ACTIVE") return { ok: false, error: "اربط متجر Shopify الأول" };

  // Totals make the progress bars meaningful from the first second; the engine
  // counts lazily if Shopify can't answer now.
  let totals: Partial<Record<ImportableEntity, number | null>> = {};
  try {
    const c = await fetchPreviewCounts(connection);
    totals = { COLLECTION: c.collections, PRODUCT: c.products, CUSTOMER: c.customers, ORDER: c.orders };
  } catch (err) {
    if (err instanceof SourceApiError && err.kind === "unauthorized") return { ok: false, error: jobFailureMessage(err) };
  }

  try {
    const job = await prisma.importJob.create({
      data: {
        storeId: access.storeId,
        connectionId: connection.id,
        provider: PROVIDER,
        externalShopId: connection.externalShopId,
        entities,
        progress: initialProgress(entities, totals) as Prisma.InputJsonValue,
        startedByUserId: access.userId,
      },
    });
    logger.info("[Import] Job created", { jobId: job.id, storeId: access.storeId, entities });
    kick(job.id);
    revalidatePath(PAGE_PATH);
    return { ok: true, job: toJobView(job) };
  } catch (err) {
    if (isActiveJobConflict(err)) return { ok: false, error: "فيه استيراد شغال بالفعل — تابعه من نفس الصفحة" };
    throw err;
  }
}

/** Polled by the import page; also nudges the job forward while the page is open. */
export async function GetImportJobStatusAction(jobId: string): Promise<JobResult> {
  const access = await guard();
  if ("ok" in access) return access;

  const job = await findStoreJob(access.storeId, jobId);
  if (!job) return { ok: false, error: "الاستيراد غير موجود" };
  if (isRunnable(job)) kick(job.id);

  const view = await jobView(access.storeId, job.id);
  return view ? { ok: true, job: view } : { ok: false, error: "الاستيراد غير موجود" };
}

export async function ResumeImportJobAction(jobId: string): Promise<JobResult> {
  const access = await guard();
  if ("ok" in access) return access;

  const job = await findStoreJob(access.storeId, jobId);
  if (!job || job.status !== "PAUSED") return { ok: false, error: "الاستيراد ده مش متوقف" };

  const connection = await prisma.importConnection.findUnique({ where: { id: job.connectionId }, select: { status: true, storeId: true } });
  if (!connection || connection.storeId !== access.storeId || connection.status !== "ACTIVE") {
    return { ok: false, error: "أعد ربط متجر Shopify الأول ثم استكمل" };
  }

  await prisma.importJob.updateMany({
    where: { id: job.id, storeId: access.storeId, status: "PAUSED" },
    data: { status: "QUEUED", attempts: 0, lastError: null, nextRunAt: new Date(), lockToken: null, lockedUntil: null },
  });
  kick(job.id);
  const view = await jobView(access.storeId, job.id);
  return view ? { ok: true, job: view } : { ok: false, error: "الاستيراد غير موجود" };
}

export async function CancelImportJobAction(jobId: string): Promise<JobResult> {
  const access = await guard();
  if ("ok" in access) return access;

  const updated = await prisma.importJob.updateMany({
    where: { id: jobId, storeId: access.storeId, status: { in: ["QUEUED", "RUNNING", "PAUSED"] } },
    data: { status: "CANCELED", completedAt: new Date(), lockToken: null, lockedUntil: null },
  });
  if (updated.count === 0) return { ok: false, error: "الاستيراد ده خلص بالفعل" };

  revalidatePath(PAGE_PATH);
  const view = await jobView(access.storeId, jobId);
  return view ? { ok: true, job: view } : { ok: false, error: "الاستيراد غير موجود" };
}

export async function RetryFailedItemsAction(jobId: string): Promise<JobResult> {
  const access = await guard();
  if ("ok" in access) return access;

  const source = await findStoreJob(access.storeId, jobId);
  if (!source || !["COMPLETED_WITH_ERRORS", "CANCELED", "COMPLETED"].includes(source.status)) {
    return { ok: false, error: "مينفعش إعادة المحاولة دلوقتي" };
  }

  const connection = await prisma.importConnection.findUnique({ where: { id: source.connectionId } });
  if (!connection || connection.storeId !== access.storeId || connection.status !== "ACTIVE") {
    return { ok: false, error: "أعد ربط متجر Shopify الأول" };
  }
  if (connection.externalShopId !== source.externalShopId) {
    return { ok: false, error: "المتجر المربوط حالياً مختلف عن متجر الاستيراد ده" };
  }

  const grouped = await prisma.importItemError.groupBy({
    by: ["entityType"],
    where: { jobId: source.id, storeId: access.storeId, resolvedAt: null },
    _count: { _all: true },
  });
  const totals: Partial<Record<ImportableEntity, number>> = {};
  for (const g of grouped) if (isImportableEntity(g.entityType)) totals[g.entityType] = g._count._all;
  const entities = orderEntities(Object.keys(totals));
  if (entities.length === 0) return { ok: false, error: "مفيش عناصر فاشلة" };

  try {
    const job = await prisma.importJob.create({
      data: {
        storeId: access.storeId,
        connectionId: connection.id,
        provider: PROVIDER,
        externalShopId: source.externalShopId,
        kind: "RETRY",
        retryOfJobId: source.id,
        entities: entities as ImportEntityType[],
        progress: initialProgress(entities, totals) as Prisma.InputJsonValue,
        startedByUserId: access.userId,
      },
    });
    kick(job.id);
    revalidatePath(PAGE_PATH);
    return { ok: true, job: toJobView(job) };
  } catch (err) {
    if (isActiveJobConflict(err)) return { ok: false, error: "فيه استيراد شغال بالفعل" };
    throw err;
  }
}

// ─── Disconnect ──────────────────────────────────────────────────────────────

export async function DisconnectShopifyAction(): Promise<{ ok: true } | Fail> {
  const access = await guard();
  if ("ok" in access) return access;

  const connection = await prisma.importConnection.findUnique({
    where: { storeId_provider: { storeId: access.storeId, provider: PROVIDER } },
  });
  if (!connection) return { ok: false, error: "مفيش متجر Shopify مربوط" };

  // Best effort: uninstall the app from the merchant's Shopify store too.
  if (connection.accessTokenEnc && isShopifyConfigured()) {
    try {
      await fetch(`https://${connection.shopDomain}/admin/api_permissions/current.json`, {
        method: "DELETE",
        headers: { "X-Shopify-Access-Token": decryptSecret(connection.accessTokenEnc) },
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err) {
      logger.warn("[Shopify] Revoke on disconnect failed", { storeId: access.storeId, ...errorLogContext(err) });
    }
  }

  await prisma.$transaction([
    prisma.importJob.updateMany({
      where: { storeId: access.storeId, connectionId: connection.id, status: { in: ["QUEUED", "RUNNING", "PAUSED"] } },
      data: { status: "CANCELED", completedAt: new Date(), lockToken: null, lockedUntil: null },
    }),
    prisma.importConnection.update({
      where: { id: connection.id },
      data: {
        status: "DISCONNECTED",
        accessTokenEnc: null,
        refreshTokenEnc: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
      },
    }),
  ]);

  revalidatePath(PAGE_PATH);
  return { ok: true };
}
