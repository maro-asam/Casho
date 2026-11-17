/**
 * Pure calculations behind the Analytics Center — rates, period deltas,
 * funnels and journey paths. No database here, so every definition the
 * dashboard shows is unit-tested (metrics.test.ts).
 */

/** a ÷ b, or null when b is 0 (shown as "—", never as 0 %). */
export function ratio(a: number, b: number): number | null {
  return b > 0 ? a / b : null;
}

/** Change vs the previous period as a fraction (0.25 = +25 %); null when there is nothing to compare with. */
export function pctChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / Math.abs(previous);
}

export type SessionTotals = {
  sessions: number;
  /** Distinct visitors in the range. */
  visitors: number;
  /** Σ distinct visitors per day (a visitor on two days counts twice). */
  visitorDays: number;
  newVisitors: number;
  pageviews: number;
  engagedSessions: number;
  convertedSessions: number;
  engagedMs: number;
  durationMs: number;
};

export const EMPTY_TOTALS: SessionTotals = {
  sessions: 0,
  visitors: 0,
  visitorDays: 0,
  newVisitors: 0,
  pageviews: 0,
  engagedSessions: 0,
  convertedSessions: 0,
  engagedMs: 0,
  durationMs: 0,
};

/** Every derived overview figure, from one row of totals. */
export function deriveRates(t: SessionTotals) {
  return {
    returningVisitors: Math.max(0, t.visitors - t.newVisitors),
    pagesPerSession: ratio(t.pageviews, t.sessions),
    avgSessionMs: ratio(t.durationMs, t.sessions),
    avgEngagementMs: ratio(t.engagedMs, t.sessions),
    engagementRate: ratio(t.engagedSessions, t.sessions),
    bounceRate: t.sessions > 0 ? 1 - t.engagedSessions / t.sessions : null,
    conversionRate: ratio(t.convertedSessions, t.sessions),
  };
}

// ─── Funnels ───────────────────────────────────────────────────────────────

/** One visitor reaching one step at one time (ms). Step 0 occurrences must already lie in the date range. */
export type StepOccurrence = { visitorId: string; step: number; at: number };

export type FunnelStepResult = {
  /** Visitors who reached this step (in order, within the window). */
  entered: number;
  /** Share of step 1's visitors. */
  fromStart: number | null;
  /** Share of the previous step's visitors. */
  fromPrevious: number | null;
  /** Visitors lost between the previous step and this one. */
  dropped: number;
  dropRate: number | null;
  /** Median time from the previous step, ms. */
  medianMsFromPrevious: number | null;
};

export type FunnelResult = { steps: FunnelStepResult[]; biggestDropStep: number | null };

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Ordered funnel: a visitor counts for step k only after reaching steps
 * 0…k-1 in that order, at or after the previous step's time, and within
 * `windowMs` of entering step 0 (their earliest step-0 time).
 */
export function computeFunnel(stepCount: number, occurrences: StepOccurrence[], windowMs: number): FunnelResult {
  const byVisitor = new Map<string, number[][]>();
  for (const o of occurrences) {
    if (o.step < 0 || o.step >= stepCount || !Number.isFinite(o.at)) continue;
    let steps = byVisitor.get(o.visitorId);
    if (!steps) {
      steps = Array.from({ length: stepCount }, () => []);
      byVisitor.set(o.visitorId, steps);
    }
    steps[o.step].push(o.at);
  }

  const entered = new Array<number>(stepCount).fill(0);
  const gaps: number[][] = Array.from({ length: stepCount }, () => []);

  for (const steps of byVisitor.values()) {
    if (!steps[0].length) continue;
    const start = Math.min(...steps[0]);
    const deadline = start + windowMs;
    let prev = start;
    entered[0] += 1;
    for (let k = 1; k < stepCount; k++) {
      let next = Infinity;
      for (const at of steps[k]) if (at >= prev && at <= deadline && at < next) next = at;
      if (next === Infinity) break;
      entered[k] += 1;
      gaps[k].push(next - prev);
      prev = next;
    }
  }

  let biggestDropStep: number | null = null;
  let biggest = 0;
  const results = entered.map((count, k): FunnelStepResult => {
    const previous = k === 0 ? count : entered[k - 1];
    const dropped = k === 0 ? 0 : previous - count;
    if (k > 0 && dropped > biggest) {
      biggest = dropped;
      biggestDropStep = k;
    }
    return {
      entered: count,
      fromStart: ratio(count, entered[0]),
      fromPrevious: k === 0 ? null : ratio(count, previous),
      dropped,
      dropRate: k === 0 ? null : ratio(dropped, previous),
      medianMsFromPrevious: k === 0 ? null : median(gaps[k]),
    };
  });
  return { steps: results, biggestDropStep };
}

// ─── Journeys ──────────────────────────────────────────────────────────────

/** A session as an ordered list of steps (page paths and key actions). */
export type JourneySteps = string[];

/** Consecutive repeats collapse ("/ → / → /pricing" = "/ → /pricing"); capped at `depth`; "(exit)" closes short journeys. */
export function journeyKey(steps: JourneySteps, depth: number): string[] {
  const out: string[] = [];
  for (const step of steps) {
    if (out[out.length - 1] === step) continue;
    out.push(step);
    if (out.length >= depth) return out;
  }
  out.push("(exit)");
  return out;
}

/** Most common journeys (first `depth` steps). */
export function topJourneys(sessions: JourneySteps[], depth: number, limit: number) {
  const counts = new Map<string, { steps: string[]; sessions: number }>();
  for (const steps of sessions) {
    if (!steps.length) continue;
    const key = journeyKey(steps, depth);
    const id = key.join("\u0000");
    const hit = counts.get(id);
    if (hit) hit.sessions += 1;
    else counts.set(id, { steps: key, sessions: 1 });
  }
  return [...counts.values()].sort((a, b) => b.sessions - a.sessions || a.steps.length - b.steps.length).slice(0, limit);
}

/** Page → next page counts (including "(exit)"), for "where do people go from here". */
export function transitions(sessions: JourneySteps[]) {
  const counts = new Map<string, Map<string, number>>();
  for (const steps of sessions) {
    const collapsed = journeyKey(steps, Number.POSITIVE_INFINITY);
    for (let i = 0; i < collapsed.length - 1; i++) {
      const from = collapsed[i];
      const to = collapsed[i + 1];
      let row = counts.get(from);
      if (!row) counts.set(from, (row = new Map()));
      row.set(to, (row.get(to) ?? 0) + 1);
    }
  }
  return counts;
}

// ─── Scroll ────────────────────────────────────────────────────────────────

/**
 * Share of page views that reached each depth band (0, 5, …, 100 %), from the
 * deepest point each view reached. reach[0] = 1 when there is any data.
 */
export function scrollReach(depths: number[], step = 5): { depth: number; reached: number }[] {
  const total = depths.length;
  const bands: { depth: number; reached: number }[] = [];
  for (let d = 0; d <= 100; d += step) {
    const count = total ? depths.filter((v) => v >= d).length : 0;
    bands.push({ depth: d, reached: total ? count / total : 0 });
  }
  return bands;
}

/** Depth (%) at which a given share of views has dropped off — e.g. the 50 % point. */
export function depthReachedBy(depths: number[], share: number): number | null {
  if (!depths.length) return null;
  const sorted = [...depths].sort((a, b) => b - a);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * share) - 1));
  return sorted[index];
}

// ─── Web vitals ────────────────────────────────────────────────────────────

/** Google's thresholds: [good ≤, poor >]. CLS is unitless, the rest ms. */
export const VITAL_THRESHOLDS: Record<string, [number, number]> = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

export function vitalRating(metric: string, value: number): "good" | "needs-improvement" | "poor" | null {
  const t = VITAL_THRESHOLDS[metric];
  if (!t) return null;
  if (value <= t[0]) return "good";
  if (value <= t[1]) return "needs-improvement";
  return "poor";
}

/** The pth percentile (0–1), nearest-rank — Google reports vitals at p75. */
export function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[rank];
}
