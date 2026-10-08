/**
 * Pure progress math + the UI state machine of the import page.
 * No I/O here — shared by the engine, the server actions and the client UI.
 */
import type { ApplyOutcome, EntityProgress, ImportableEntity, ImportProgress } from "./types";
import { IMPORTABLE_ENTITIES } from "./types";

export function emptyEntityProgress(total: number | null = null): EntityProgress {
  return {
    total,
    processed: 0,
    imported: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    failed: 0,
    skipReasons: {},
    done: false,
  };
}

export function initialProgress(
  entities: readonly ImportableEntity[],
  totals: Partial<Record<ImportableEntity, number | null>> = {},
): ImportProgress {
  const progress: ImportProgress = {};
  for (const entity of entities) progress[entity] = emptyEntityProgress(totals[entity] ?? null);
  return progress;
}

/** Reads the JSON column defensively (old/partial rows never crash the page). */
export function parseProgress(value: unknown): ImportProgress {
  const progress: ImportProgress = {};
  if (!value || typeof value !== "object") return progress;
  for (const entity of IMPORTABLE_ENTITIES) {
    const raw = (value as Record<string, unknown>)[entity];
    if (raw && typeof raw === "object") progress[entity] = { ...emptyEntityProgress(), ...(raw as Partial<EntityProgress>) };
  }
  return progress;
}

export function recordOutcome(p: EntityProgress, outcome: ApplyOutcome) {
  p.processed++;
  switch (outcome.result) {
    case "imported":
      p.imported++;
      break;
    case "updated":
      p.updated++;
      break;
    case "unchanged":
      p.unchanged++;
      break;
    case "skipped":
      p.skipped++;
      p.skipReasons[outcome.reason] = (p.skipReasons[outcome.reason] ?? 0) + 1;
      break;
  }
}

export function recordFailure(p: EntityProgress) {
  p.processed++;
  p.failed++;
}

/** 0–100 for one entity. Unknown totals count as 0 until done. */
export function entityPercent(p: EntityProgress): number {
  if (p.done) return 100;
  if (!p.total) return 0;
  return Math.min(99, Math.floor((p.processed / p.total) * 100));
}

/** Weighted by record count, so 5,000 orders weigh more than 20 collections. */
export function overallPercent(progress: ImportProgress): number {
  const entries = Object.values(progress);
  if (entries.length === 0) return 0;
  if (entries.every((p) => p.done)) return 100;
  let total = 0;
  let processed = 0;
  for (const p of entries) {
    const t = Math.max(p.total ?? 0, p.done ? p.processed : 0, 1);
    total += t;
    processed += p.done ? t : Math.min(p.processed, t);
  }
  return Math.min(99, Math.floor((processed / total) * 100));
}

export function totalFailed(progress: ImportProgress) {
  return Object.values(progress).reduce((sum, p) => sum + p.failed, 0);
}

export function totalRemaining(progress: ImportProgress) {
  return Object.values(progress).reduce(
    (sum, p) => sum + (p.done ? 0 : Math.max(0, (p.total ?? 0) - p.processed)),
    0,
  );
}

// ─── Page state machine ──────────────────────────────────────────────────────

export type ImportViewState =
  | "not_connected"
  | "connecting"
  | "needs_reconnect"
  | "connected"
  | "loading_preview"
  | "preview_ready"
  | "importing"
  | "paused"
  | "completed"
  | "completed_with_warnings";

export type ViewInput = {
  connectionStatus: "ACTIVE" | "NEEDS_RECONNECT" | "DISCONNECTED" | null;
  /** The newest job of the store (any status). */
  job: { status: string } | null;
  preview: "idle" | "loading" | "ready" | "error";
  connecting?: boolean;
  /** The merchant dismissed the last result to start a new import. */
  resultDismissed?: boolean;
};

export function deriveViewState(input: ViewInput): ImportViewState {
  if (input.connecting) return "connecting";

  const status = input.job?.status;
  // A running/paused job is shown even if the connection broke meanwhile.
  if (status === "QUEUED" || status === "RUNNING") return "importing";
  if (status === "PAUSED") return "paused";

  if (!input.connectionStatus || input.connectionStatus === "DISCONNECTED") return "not_connected";
  if (input.connectionStatus === "NEEDS_RECONNECT") return "needs_reconnect";

  if (input.preview === "loading") return "loading_preview";
  if (input.preview === "ready") return "preview_ready";

  if (!input.resultDismissed) {
    if (status === "COMPLETED") return "completed";
    if (status === "COMPLETED_WITH_ERRORS") return "completed_with_warnings";
  }
  return "connected";
}
