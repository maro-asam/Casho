import { beforeEach, describe, expect, it, vi } from "vitest";

type Job = {
  id: string;
  conversationId: string;
  status: "QUEUED" | "PROCESSING" | "DONE" | "FAILED";
  attempts: number;
  maxAttempts: number;
  lastAttemptAt: Date | null;
  nextRetryAt: Date | null;
  createdAt: Date;
};

const jobs: Job[] = [];

type Claimable = {
  OR: ({ status: { in: string[] } } | { status: string; lastAttemptAt: { lt: Date } })[];
};

function matchesClaimable(job: Job, where: Claimable) {
  return where.OR.some((c) =>
    typeof c.status === "object"
      ? c.status.in.includes(job.status)
      : job.status === c.status && job.lastAttemptAt !== null && job.lastAttemptAt < (c as { lastAttemptAt: { lt: Date } }).lastAttemptAt.lt,
  );
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    igProcessingJob: {
      findMany: vi.fn(async ({ where }: { where: { AND: [Claimable, unknown]; attempts: { lt: number } } }) =>
        jobs
          .filter((j) => matchesClaimable(j, where.AND[0]) && j.attempts < where.attempts.lt)
          .filter((j) => j.nextRetryAt === null || j.nextRetryAt <= new Date())
          .map(({ id, conversationId, attempts, maxAttempts }) => ({ id, conversationId, attempts, maxAttempts })),
      ),
      updateMany: vi.fn(async ({ where, data }: { where: { id: string } & Claimable; data: { status: Job["status"]; lastAttemptAt: Date } }) => {
        const job = jobs.find((j) => j.id === where.id && matchesClaimable(j, where));
        if (job) Object.assign(job, { status: data.status, lastAttemptAt: data.lastAttemptAt, attempts: job.attempts + 1 });
        return { count: job ? 1 : 0 };
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<Job> }) => {
        const job = jobs.find((j) => j.id === where.id)!;
        Object.assign(job, data);
        return job;
      }),
    },
    // The conversation is gone, so a claimed job finishes right away as "skipped".
    instagramConversation: { findUnique: vi.fn(async () => null) },
  },
}));
vi.mock("@/lib/ai/order-extractor", () => ({ extractOrderFromConversation: vi.fn(), CONFIDENCE_THRESHOLD: 0.7 }));
vi.mock("@/lib/notifications/in-app", () => ({ createNotification: vi.fn() }));
vi.mock("@/lib/rate-limit/ig-rate-limit", () => ({ checkRateLimit: vi.fn(), incrementUsage: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } }));
vi.mock("@/lib/feature-flags", () => ({ featureFlags: { instagramAiOrders: () => true } }));

const { runPendingJobs, STALE_PROCESSING_MS } = await import("./ig-job-runner");

function job(id: string, overrides: Partial<Job> = {}): Job {
  return {
    id,
    conversationId: `c-${id}`,
    status: "QUEUED",
    attempts: 0,
    maxAttempts: 3,
    lastAttemptAt: null,
    nextRetryAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  jobs.length = 0;
});

describe("runPendingJobs", () => {
  it("processes each job once when two runs overlap", async () => {
    jobs.push(job("j1"), job("j2"));
    const [a, b] = await Promise.all([runPendingJobs(), runPendingJobs()]);
    expect(a.processed + b.processed).toBe(2);
    expect(jobs.map((j) => j.attempts)).toEqual([1, 1]);
    expect(jobs.every((j) => j.status === "DONE")).toBe(true);
  });

  it("leaves a job another run is working on alone", async () => {
    jobs.push(job("busy", { status: "PROCESSING", attempts: 1, lastAttemptAt: new Date() }));
    const result = await runPendingJobs();
    expect(result.processed).toBe(0);
    expect(jobs[0]).toMatchObject({ status: "PROCESSING", attempts: 1 });
  });

  it("takes back a job a crashed run left in PROCESSING", async () => {
    jobs.push(job("stuck", { status: "PROCESSING", attempts: 1, lastAttemptAt: new Date(Date.now() - STALE_PROCESSING_MS - 1_000) }));
    const result = await runPendingJobs();
    expect(result.processed).toBe(1);
    expect(jobs[0]).toMatchObject({ status: "DONE", attempts: 2 });
  });

  it("stops retrying a stuck job once it has used its attempts", async () => {
    jobs.push(job("spent", { status: "PROCESSING", attempts: 3, lastAttemptAt: new Date(Date.now() - STALE_PROCESSING_MS - 1_000) }));
    const result = await runPendingJobs();
    expect(result.processed).toBe(0);
  });
});
