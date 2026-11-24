// Applies pending Prisma migrations before `next build` on Vercel production deploys,
// so a deploy never ships code that reads columns the database doesn't have yet
// (e.g. StoreSettings.storeCurrency → every dashboard page failing with React #441).
//
// Runs only when VERCEL_ENV=production, or when MIGRATE_ON_BUILD=1 is set.
// Preview deploys skip it: an unmerged branch must not change the production schema.
// Uses DIRECT_URL when set (a pooled connection can't hold migrate's advisory lock).
// A failed migration fails the build, keeping the last working deployment live.
import { spawnSync } from "node:child_process";

const enabled = process.env.VERCEL_ENV === "production" || process.env.MIGRATE_ON_BUILD === "1";

if (!enabled) {
  console.log(`[migrate-on-build] skipped (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"})`);
  process.exit(0);
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate-on-build] DATABASE_URL is not set — can't apply migrations.");
  process.exit(1);
}

console.log("[migrate-on-build] applying pending migrations (prisma migrate deploy)…");
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  console.error("[migrate-on-build] prisma migrate deploy failed — stopping the build.");
  process.exit(result.status ?? 1);
}
console.log("[migrate-on-build] database is up to date.");
