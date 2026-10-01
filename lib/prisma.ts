import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const isProd = process.env.NODE_ENV === "production";

// Queries that exceed this threshold are logged as warnings
const SLOW_QUERY_THRESHOLD_MS = Number(process.env.SLOW_QUERY_THRESHOLD_MS ?? 500);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const pool = new Pool({
    connectionString,
    // max: tune via env var; min stays at 0 so connections are created on-demand
    // (eager min>0 connections can cause the pool to enter a failed state if the
    // database is briefly unavailable during module init / hot-reload in dev)
    max: Number(process.env.DB_POOL_MAX ?? (isProd ? 10 : 5)),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  // This catches connection-level failures (dropped connections, pool exhaustion)
  // which are separate from query-level errors handled by .catch() in callers
  pool.on("error", (err) => {
    console.error("[DB Pool] Idle client error:", err.message);
  });

  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: [
      // Only intercept query events so we can detect slow queries.
      // warn/error use "stdout" (Prisma's default) so we never intercept
      // errors that callers already handle with .catch(() => {}).
      { emit: "event", level: "query" },
      { emit: "stdout", level: "warn" },
      { emit: "stdout", level: "error" },
    ],
  });

  client.$on("query", (e) => {
    if (e.duration >= SLOW_QUERY_THRESHOLD_MS) {
      console.warn(`[DB SLOW QUERY] ${e.duration}ms | ${e.query.slice(0, 300)}`);
    }
  });

  return client;
}

/**
 * Dev keeps the client on globalThis across hot reloads. After `prisma generate`
 * that cached instance is from the old schema and is missing new models — so
 * throw it away when any current model has no delegate on it.
 */
function isStale(client: PrismaClient) {
  return Object.values(Prisma.ModelName).some(
    (model) => !(model.charAt(0).toLowerCase() + model.slice(1) in client),
  );
}

const cached = globalForPrisma.prisma;
if (cached && isStale(cached)) void cached.$disconnect().catch(() => {});

export const prisma = cached && !isStale(cached) ? cached : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
