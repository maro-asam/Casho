/**
 * Background import runner (DB-backed queue, same model as the Instagram jobs).
 *
 * A run = claim the job's lease → import pages for a time budget → checkpoint
 * after every page → release. Runs are triggered by:
 *   - `after()` right after the merchant starts/resumes an import,
 *   - the status poll of an open import page (keeps it moving instantly),
 *   - the cron endpoint /api/cron/run-imports (keeps it moving with the page closed).
 *
 * Safety:
 *   - lease (lockToken + lockedUntil) → one worker per job; a crashed worker's
 *     lease expires and the next run resumes from the last checkpoint.
 *   - every checkpoint is conditional on the lockToken → a worker that lost its
 *     lease can't overwrite newer progress.
 *   - the job row carries storeId; the sink only writes to that store, and the
 *     connection must belong to the same store.
 */
import crypto from "crypto";
import type { ImportJob, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications/in-app";
import { runSlice, RETRY_BATCH_SIZE, type ItemFailure, type ItemRef, type SliceState } from "./core";
import { SourceApiError, errorLogContext, jobFailureMessage } from "./errors";
import { parseProgress, totalFailed } from "./progress";
import { createImportSource } from "./registry";
import { createPrismaSink } from "./sink";
import { orderEntities, PROVIDER_LABELS, type ImportableEntity } from "./types";

const LOCK_MS = 2 * 60 * 1000;
export const DEFAULT_BUDGET_MS = 25_000;
/** Consecutive failed runs before the job pauses and waits for the merchant. */
export const MAX_ATTEMPTS = 6;

class LeaseLostError extends Error {}

export type RunResult = "done" | "more" | "busy" | "paused" | "retrying";

export function retryDelayMs(attempts: number) {
  return Math.min(10 * 60 * 1000, 15_000 * 2 ** Math.max(0, attempts - 1));
}

async function claim(jobId: string, lockToken: string) {
  const now = new Date();
  const claimed = await prisma.importJob.updateMany({
    where: {
      id: jobId,
      status: { in: ["QUEUED", "RUNNING"] },
      nextRunAt: { lte: now },
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
    },
    data: { status: "RUNNING", lockToken, lockedUntil: new Date(now.getTime() + LOCK_MS) },
  });
  return claimed.count === 1;
}

function stateOf(job: ImportJob): SliceState {
  return {
    kind: job.kind,
    entities: orderEntities(job.entities),
    currentEntity: (job.currentEntity as ImportableEntity | null) ?? null,
    cursor: job.cursor,
    progress: parseProgress(job.progress),
  };
}

async function checkpoint(job: ImportJob, lockToken: string, state: SliceState, failures: ItemFailure[], resolved: ItemRef[]) {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const updated = await tx.importJob.updateMany({
      where: { id: job.id, lockToken },
      data: {
        currentEntity: state.currentEntity,
        cursor: state.cursor,
        progress: state.progress as Prisma.InputJsonValue,
        lockedUntil: new Date(now.getTime() + LOCK_MS),
        attempts: 0,
        lastError: null,
      },
    });
    if (updated.count !== 1) throw new LeaseLostError();

    for (const f of failures) {
      await tx.importItemError.upsert({
        where: { jobId_entityType_externalId: { jobId: job.id, entityType: f.entity, externalId: f.externalId } },
        create: { jobId: job.id, storeId: job.storeId, entityType: f.entity, externalId: f.externalId, label: f.label?.slice(0, 200), message: f.message },
        update: { message: f.message, attempts: { increment: 1 }, resolvedAt: null },
      });
    }

    // A retry run takes ownership of the original failures it handled: they are
    // resolved there, and any that failed again are recorded on the retry job.
    if (job.kind === "RETRY" && job.retryOfJobId) {
      const byEntity = new Map<ImportableEntity, string[]>();
      for (const r of resolved) byEntity.set(r.entity, [...(byEntity.get(r.entity) ?? []), r.externalId]);
      for (const [entityType, externalIds] of byEntity) {
        await tx.importItemError.updateMany({
          where: { jobId: job.retryOfJobId, storeId: job.storeId, entityType, externalId: { in: externalIds } },
          data: { resolvedAt: now },
        });
      }
    }
  });
}

async function finish(job: ImportJob, lockToken: string, state: SliceState) {
  const failed = totalFailed(state.progress);
  const status = failed > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED";
  const updated = await prisma.importJob.updateMany({
    where: { id: job.id, lockToken },
    data: {
      status,
      completedAt: new Date(),
      currentEntity: null,
      cursor: null,
      lockToken: null,
      lockedUntil: null,
      progress: state.progress as Prisma.InputJsonValue,
    },
  });
  if (updated.count !== 1) return;

  const label = PROVIDER_LABELS[job.provider];
  await createNotification({
    storeId: job.storeId,
    type: "SYSTEM",
    title: failed > 0 ? `اكتمل الاستيراد من ${label} مع بعض المشاكل` : `اكتمل الاستيراد من ${label} ✅`,
    message: failed > 0 ? `${failed} عنصر لم يتم استيراده — راجع التفاصيل وأعد المحاولة` : "كل البيانات المختارة اتنقلت لمتجرك",
    href: "/integrations/shopify",
  });
  logger.info("[Import] Job finished", { jobId: job.id, storeId: job.storeId, status, failed });
}

async function release(jobId: string, lockToken: string, data: Prisma.ImportJobUpdateManyMutationInput) {
  await prisma.importJob.updateMany({
    where: { id: jobId, lockToken },
    data: { ...data, lockToken: null, lockedUntil: null },
  });
}

/** Runs one time-boxed slice of a job. Safe to call concurrently — extra callers get "busy". */
export async function runImportJob(jobId: string, { budgetMs = DEFAULT_BUDGET_MS } = {}): Promise<RunResult> {
  const lockToken = crypto.randomUUID();
  if (!(await claim(jobId, lockToken))) return "busy";

  const job = await prisma.importJob.findUnique({ where: { id: jobId }, include: { connection: true } });
  if (!job) return "busy";

  // Tenant guard: a job may only ever read through its own store's connection.
  if (job.connection.storeId !== job.storeId || job.connection.externalShopId !== job.externalShopId) {
    logger.error("[Import] Connection/store mismatch — pausing job", { jobId, storeId: job.storeId });
    await release(jobId, lockToken, { status: "PAUSED", lastError: "المتجر المربوط اتغير — ابدأ استيراد جديد" });
    return "paused";
  }
  if (job.connection.status !== "ACTIVE") {
    await release(jobId, lockToken, { status: "PAUSED", lastError: jobFailureMessage(new SourceApiError("unauthorized", "inactive")) });
    return "paused";
  }
  if (!job.startedAt) await prisma.importJob.update({ where: { id: jobId }, data: { startedAt: new Date() } });

  const state = stateOf(job);
  const startedAt = Date.now();

  try {
    const result = await runSlice(state, {
      source: createImportSource(job.connection),
      sink: createPrismaSink({ storeId: job.storeId, provider: job.provider, externalShopId: job.externalShopId }),
      shouldStop: () => Date.now() - startedAt > budgetMs,
      checkpoint: (s, failures, resolved) => checkpoint(job, lockToken, s, failures, resolved),
      nextRetryBatch: async (entity, afterRowId) =>
        job.retryOfJobId
          ? (
              await prisma.importItemError.findMany({
                where: {
                  jobId: job.retryOfJobId,
                  storeId: job.storeId,
                  entityType: entity,
                  resolvedAt: null,
                  ...(afterRowId ? { id: { gt: afterRowId } } : {}),
                },
                orderBy: { id: "asc" },
                take: RETRY_BATCH_SIZE,
                select: { id: true, externalId: true, label: true },
              })
            ).map((row) => ({ rowId: row.id, externalId: row.externalId, label: row.label }))
          : [],
    });

    if (result === "done") {
      await finish(job, lockToken, state);
      return "done";
    }
    await release(jobId, lockToken, { status: "RUNNING", nextRunAt: new Date() });
    return "more";
  } catch (err) {
    if (err instanceof LeaseLostError) return "busy";

    const attempts = job.attempts + 1;
    const unauthorized = err instanceof SourceApiError && err.kind === "unauthorized";
    const pause = unauthorized || attempts >= MAX_ATTEMPTS;
    logger.error("[Import] Run failed", { jobId, storeId: job.storeId, attempts, pause, ...errorLogContext(err) });

    if (unauthorized) {
      await prisma.importConnection.update({ where: { id: job.connectionId }, data: { status: "NEEDS_RECONNECT" } });
    }
    await release(jobId, lockToken, {
      status: pause ? "PAUSED" : "RUNNING",
      attempts,
      lastError: jobFailureMessage(err),
      nextRunAt: new Date(Date.now() + (pause ? 0 : retryDelayMs(attempts))),
    });
    return pause ? "paused" : "retrying";
  }
}

/** Cron entry point: advances every due job, oldest first, within a total budget. */
export async function runDueImportJobs({ totalBudgetMs = 50_000, maxJobs = 5 } = {}) {
  const deadline = Date.now() + totalBudgetMs;
  const now = new Date();
  const jobs = await prisma.importJob.findMany({
    where: {
      status: { in: ["QUEUED", "RUNNING"] },
      nextRunAt: { lte: now },
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
    },
    orderBy: { nextRunAt: "asc" },
    take: maxJobs,
    select: { id: true },
  });

  const results: Record<string, RunResult> = {};
  for (const { id } of jobs) {
    const remaining = deadline - Date.now();
    if (remaining < 5_000) break;
    results[id] = await runImportJob(id, { budgetMs: Math.min(DEFAULT_BUDGET_MS, remaining - 5_000) });
  }
  return { count: Object.keys(results).length, results };
}

/** True when a run could make progress right now (used by the status poll). */
export function isRunnable(job: Pick<ImportJob, "status" | "nextRunAt" | "lockedUntil">, now = new Date()) {
  return (
    (job.status === "QUEUED" || job.status === "RUNNING") &&
    job.nextRunAt <= now &&
    (!job.lockedUntil || job.lockedUntil < now)
  );
}
