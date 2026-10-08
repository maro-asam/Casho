/**
 * The import loop, free of Prisma and of any provider: fetch a page → apply
 * every record → checkpoint. Everything stateful is in `SliceState`, which the
 * engine persists after each page, so a crash or timeout resumes from the last
 * checkpoint. Re-applying a page is safe because the sink is idempotent.
 */
import { logger } from "@/lib/logger";
import { errorLogContext, itemFailureMessage } from "./errors";
import { recordFailure, recordOutcome, emptyEntityProgress } from "./progress";
import type { ImportableEntity, ImportProgress, ImportSink, ImportSource, NormalizedRecord } from "./types";

export type SliceState = {
  kind: "FULL" | "RETRY";
  entities: ImportableEntity[];
  currentEntity: ImportableEntity | null;
  /** FULL: provider pagination cursor. RETRY: id of the last failed-item row handled. */
  cursor: string | null;
  progress: ImportProgress;
};

export type ItemFailure = { entity: ImportableEntity; externalId: string; label: string | null; message: string };
export type ItemRef = { entity: ImportableEntity; externalId: string };

export type RetryBatch = { rowId: string; externalId: string; label: string | null }[];

export type SliceDeps = {
  source: ImportSource;
  sink: ImportSink;
  /** Persists the state + failures; must throw if this worker lost its lock. */
  checkpoint(state: SliceState, failures: ItemFailure[], resolved: ItemRef[]): Promise<void>;
  /** True when the time budget of this run is spent. */
  shouldStop(): boolean;
  /** RETRY jobs: next failed items of the original job after `afterRowId`. */
  nextRetryBatch?(entity: ImportableEntity, afterRowId: string | null): Promise<RetryBatch>;
};

export const RETRY_BATCH_SIZE = 25;

function nextEntity(state: SliceState): ImportableEntity | null {
  return state.entities.find((e) => !state.progress[e]?.done) ?? null;
}

async function applyAll(
  deps: SliceDeps,
  entity: ImportableEntity,
  state: SliceState,
  items: NormalizedRecord[],
  failures: ItemFailure[],
  resolved: ItemRef[],
) {
  const p = (state.progress[entity] ??= emptyEntityProgress());
  for (const item of items) {
    try {
      recordOutcome(p, await deps.sink.apply(item));
      resolved.push({ entity, externalId: item.externalId });
    } catch (err) {
      recordFailure(p);
      failures.push({ entity, externalId: item.externalId, label: item.label, message: itemFailureMessage(err) });
      logger.warn("[Import] Item failed", { entity, externalId: item.externalId, ...errorLogContext(err) });
    }
  }
}

/** Runs pages until everything is imported ("done") or the budget is spent ("more"). */
export async function runSlice(state: SliceState, deps: SliceDeps): Promise<"done" | "more"> {
  await deps.sink.prepare?.();

  for (;;) {
    const entity = state.currentEntity ?? nextEntity(state);
    if (!entity) return "done";
    if (state.currentEntity !== entity) {
      state.currentEntity = entity;
      state.cursor = null;
    }
    const p = (state.progress[entity] ??= emptyEntityProgress());

    const failures: ItemFailure[] = [];
    const resolved: ItemRef[] = [];

    if (state.kind === "FULL") {
      if (p.total === null) {
        p.total = await deps.source.count(entity).catch(() => null);
      }
      const page = await deps.source.fetchPage(entity, state.cursor);
      await applyAll(deps, entity, state, page.items, failures, resolved);
      state.cursor = page.nextCursor;
      if (!page.nextCursor) p.done = true;
      // Successful items of a full run need no "resolve" bookkeeping.
      resolved.length = 0;
    } else {
      if (!deps.nextRetryBatch) throw new Error("RETRY job without nextRetryBatch");
      const batch = await deps.nextRetryBatch(entity, state.cursor);
      if (batch.length === 0) {
        p.done = true;
      } else {
        const fetched = await deps.source.fetchByIds(entity, batch.map((b) => b.externalId));
        const found = new Set(fetched.map((r) => r.externalId));
        await applyAll(deps, entity, state, fetched, failures, resolved);
        for (const missing of batch.filter((b) => !found.has(b.externalId))) {
          recordFailure(p);
          failures.push({ entity, externalId: missing.externalId, label: missing.label, message: "لم يعد موجوداً في المتجر الأصلي" });
        }
        // Every handled original failure moves to this run (resolved there; a
        // repeated failure is recorded again on the retry job).
        resolved.splice(0, resolved.length, ...batch.map((b) => ({ entity, externalId: b.externalId })));
        state.cursor = batch[batch.length - 1].rowId;
        if (batch.length < RETRY_BATCH_SIZE) p.done = true;
      }
    }

    if (p.done) {
      state.currentEntity = nextEntity(state);
      state.cursor = null;
    }

    await deps.checkpoint(state, failures, resolved);

    if (!state.currentEntity) return "done";
    if (deps.shouldStop()) return "more";
  }
}
