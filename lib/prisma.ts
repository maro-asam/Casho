import "dotenv/config";
import net from "node:net";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Neon's host resolves to IPv4 and IPv6 addresses. Node tries each for only
// 250ms before moving on, so one slow IPv4 handshake sent connections to
// IPv6 — which some networks can't reach — and they died with ETIMEDOUT
// (~40% of connects on such a network). 2s per address fixed it (15/15).
net.setDefaultAutoSelectFamilyAttemptTimeout(Number(process.env.DB_FAMILY_ATTEMPT_TIMEOUT_MS ?? 2_000));

// Queries that exceed this threshold are logged as warnings
const SLOW_QUERY_THRESHOLD_MS = Number(process.env.SLOW_QUERY_THRESHOLD_MS ?? 500);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  /** SCHEMA_SIGNATURE of the cached client (dev hot reloads). */
  prismaSignature?: string;
};

function createPrismaClient(): PrismaClient {
  const pool = new Pool({
    connectionString,
    // max: tune via env var; min stays at 0 so connections are created on-demand
    // (eager min>0 connections can cause the pool to enter a failed state if the
    // database is briefly unavailable during module init / hot-reload in dev)
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    // Covers both opening a connection and waiting for a free one in the pool.
    // A remote/serverless DB (Neon) can take several seconds to wake up, and a
    // page plus its layout fire many parallel queries — 5s failed in practice.
    connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 20_000),
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
 * Fingerprint of the generated schema: every model's scalar fields. Changes on
 * `prisma generate` whenever a model or a field is added/removed.
 */
const SCHEMA_SIGNATURE = JSON.stringify(
  Object.entries(Prisma)
    .filter(([key]) => key.endsWith("ScalarFieldEnum"))
    .map(([key, fields]) => [key, Object.keys(fields as object)])
    .sort(([a], [b]) => String(a).localeCompare(String(b))),
);

/**
 * Dev keeps the client on globalThis across hot reloads. After `prisma generate`
 * that cached instance is from the old schema — missing new models *and* new
 * fields (it rejects them as unknown) — so throw it away when the schema moved.
 */
function isStale(client: PrismaClient) {
  if (globalForPrisma.prismaSignature !== SCHEMA_SIGNATURE) return true;
  return Object.values(Prisma.ModelName).some(
    (model) => !(model.charAt(0).toLowerCase() + model.slice(1) in client),
  );
}

const cached = globalForPrisma.prisma;
const stale = cached ? isStale(cached) : false;
if (cached && stale) void cached.$disconnect().catch(() => {});

export const prisma = cached && !stale ? cached : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSignature = SCHEMA_SIGNATURE;
}
