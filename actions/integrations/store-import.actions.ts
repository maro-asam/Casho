"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma, type ImportEntityType, type ImportProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { ImportAccessError, requireImportAccess } from "@/lib/integrations/import/access";
import { isRunnable, runImportJob } from "@/lib/integrations/import/engine";
import { errorLogContext, isUniqueViolation, jobFailureMessage, SourceApiError } from "@/lib/integrations/import/errors";
import { initialProgress } from "@/lib/integrations/import/progress";
import { fetchPreviewCounts, isProviderConfigured, revokeRemoteAccess } from "@/lib/integrations/import/registry";
import {
  isImportableEntity,
  isImportProvider,
  orderEntities,
  PROVIDER_LABELS,
  PROVIDER_PAGE_PATHS,
  type ImportableEntity,
  type PreviewCounts,
} from "@/lib/integrations/import/types";
import { toConnectionView, toFailureView, toJobView, type ConnectionView, type JobView } from "@/lib/integrations/import/views";

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

/** The provider comes from the client — only known values pass. */
function providerOf(value: unknown): ImportProvider | null {
  return isImportProvider(value) ? value : null;
}

const pagePath = (provider: ImportProvider) => `/dashboard${PROVIDER_PAGE_PATHS[provider]}`;

function connectFirst(provider: ImportProvider) {
  return provider === "SHOPIFY" ? "اربط متجر Shopify الأول" : `اربط موقعك على ${PROVIDER_LABELS[provider]} الأول`;
}

function reconnectFirst(provider: ImportProvider) {
  return provider === "SHOPIFY" ? "أعد ربط متجر Shopify الأول ثم استكمل" : `أعد ربط موقعك على ${PROVIDER_LABELS[provider]} الأول ثم استكمل`;
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

/** The "one unfinished import per store and provider" index rejected a second job. */
const isActiveJobConflict = isUniqueViolation;

function findConnection(storeId: string, provider: ImportProvider) {
  return prisma.importConnection.findUnique({ where: { storeId_provider: { storeId, provider } } });
}

// ─── Page state ──────────────────────────────────────────────────────────────

export type ImportPageState =
  | Fail
  | {
      ok: true;
      configured: boolean;
      connection: ConnectionView | null;
      job: JobView | null;
      history: JobView[];
    };

export async function GetImportPageStateAction(providerInput: ImportProvider): Promise<ImportPageState> {
  const provider = providerOf(providerInput);
  if (!provider) return { ok: false, error: "مصدر استيراد غير معروف" };
  const access = await guard();
  if ("ok" in access) return access;

  const [connection, jobs] = await Promise.all([
    findConnection(access.storeId, provider),
    prisma.importJob.findMany({
      where: { storeId: access.storeId, provider },
      orderBy: { createdAt: "desc" },
      take: HISTORY_SIZE,
    }),
  ]);

  const latest = jobs[0] ? await jobView(access.storeId, jobs[0].id) : null;
  if (jobs[0] && isRunnable(jobs[0])) kick(jobs[0].id);

  return {
    ok: true,
    configured: isProviderConfigured(provider),
    connection: connection && connection.status !== "DISCONNECTED" ? toConnectionView(connection) : null,
    job: latest,
    history: jobs.map((j) => toJobView(j)),
  };
}

// ─── Preview ─────────────────────────────────────────────────────────────────

export type PreviewResult = Fail | { ok: true; counts: PreviewCounts; connection: ConnectionView };

export async function LoadImportPreviewAction(providerInput: ImportProvider): Promise<PreviewResult> {
  const provider = providerOf(providerInput);
  if (!provider) return { ok: false, error: "مصدر استيراد غير معروف" };
  const access = await guard();
  if ("ok" in access) return access;

  let connection = await findConnection(access.storeId, provider);
  if (!connection || connection.status !== "ACTIVE") return { ok: false, error: connectFirst(provider) };

  try {
    const counts = await fetchPreviewCounts(connection);
    if (counts.currencyCode && counts.currencyCode !== connection.currencyCode) {
      connection = await prisma.importConnection.update({ where: { id: connection.id }, data: { currencyCode: counts.currencyCode } });
    }
    return { ok: true, counts, connection: toConnectionView(connection) };
  } catch (err) {
    logger.warn("[Import] Preview failed", { provider, storeId: access.storeId, ...errorLogContext(err) });
    if (err instanceof SourceApiError && err.kind === "unauthorized") {
      await prisma.importConnection.update({ where: { id: connection.id }, data: { status: "NEEDS_RECONNECT" } });
      revalidatePath(pagePath(provider));
    }
    return { ok: false, error: jobFailureMessage(err, provider) };
  }
}

// ─── Start / resume / cancel / retry ─────────────────────────────────────────

export type JobResult = Fail | { ok: true; job: JobView };

export async function StartImportAction(providerInput: ImportProvider, selected: string[]): Promise<JobResult> {
  const provider = providerOf(providerInput);
  if (!provider) return { ok: false, error: "مصدر استيراد غير معروف" };
  const access = await guard();
  if ("ok" in access) return access;

  const entities = orderEntities((Array.isArray(selected) ? selected : []).filter(isImportableEntity));
  if (entities.length === 0) return { ok: false, error: "اختار نوع بيانات واحد على الأقل" };

  const connection = await findConnection(access.storeId, provider);
  if (!connection || connection.status !== "ACTIVE") return { ok: false, error: connectFirst(provider) };

  // Totals make the progress bars meaningful from the first second; the engine
  // counts lazily if the source can't answer now.
  let totals: Partial<Record<ImportableEntity, number | null>> = {};
  try {
    const c = await fetchPreviewCounts(connection);
    totals = { COLLECTION: c.collections, PRODUCT: c.products, CUSTOMER: c.customers, ORDER: c.orders };
  } catch (err) {
    if (err instanceof SourceApiError && err.kind === "unauthorized") return { ok: false, error: jobFailureMessage(err, provider) };
  }

  try {
    const job = await prisma.importJob.create({
      data: {
        storeId: access.storeId,
        connectionId: connection.id,
        provider,
        externalShopId: connection.externalShopId,
        entities,
        progress: initialProgress(entities, totals) as Prisma.InputJsonValue,
        startedByUserId: access.userId,
      },
    });
    logger.info("[Import] Job created", { jobId: job.id, provider, storeId: access.storeId, entities });
    kick(job.id);
    revalidatePath(pagePath(provider));
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
    return { ok: false, error: reconnectFirst(job.provider) };
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

  const view = await jobView(access.storeId, jobId);
  if (view) {
    const job = await findStoreJob(access.storeId, jobId);
    if (job) revalidatePath(pagePath(job.provider));
  }
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
    return { ok: false, error: source.provider === "SHOPIFY" ? "أعد ربط متجر Shopify الأول" : `أعد ربط موقعك على ${PROVIDER_LABELS[source.provider]} الأول` };
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
        provider: source.provider,
        externalShopId: source.externalShopId,
        kind: "RETRY",
        retryOfJobId: source.id,
        entities: entities as ImportEntityType[],
        progress: initialProgress(entities, totals) as Prisma.InputJsonValue,
        startedByUserId: access.userId,
      },
    });
    kick(job.id);
    revalidatePath(pagePath(source.provider));
    return { ok: true, job: toJobView(job) };
  } catch (err) {
    if (isActiveJobConflict(err)) return { ok: false, error: "فيه استيراد شغال بالفعل" };
    throw err;
  }
}

// ─── Disconnect ──────────────────────────────────────────────────────────────

export async function DisconnectImportAction(providerInput: ImportProvider): Promise<{ ok: true } | Fail> {
  const provider = providerOf(providerInput);
  if (!provider) return { ok: false, error: "مصدر استيراد غير معروف" };
  const access = await guard();
  if ("ok" in access) return access;

  const connection = await findConnection(access.storeId, provider);
  if (!connection) return { ok: false, error: provider === "SHOPIFY" ? "مفيش متجر Shopify مربوط" : `مفيش موقع ${PROVIDER_LABELS[provider]} مربوط` };

  await revokeRemoteAccess(connection);

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

  revalidatePath(pagePath(provider));
  return { ok: true };
}
