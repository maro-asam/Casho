// DEV ONLY — creates a 7-day dashboard session for an existing user so the
// i18n crawler can sign in. Optionally sets the user's dashboard locale.
//   node scripts/i18n/dev-session.mjs <email> [ar|en]   → prints the cookie token
import "dotenv/config";
import pg from "pg";
import crypto from "node:crypto";

if (process.env.NODE_ENV === "production") throw new Error("dev only");
const [email, locale] = process.argv.slice(2);
if (!email) throw new Error("usage: dev-session.mjs <email> [ar|en]");
const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
const user = (await c.query(`select id from "User" where email = $1`, [email])).rows[0];
if (!user) throw new Error("no such user");
const token = crypto.randomBytes(32).toString("hex");
const hash = crypto.createHash("sha256").update(token).digest("hex");
await c.query(`insert into "Session" (id, "tokenHash", "userId", "expiresAt") values ($1, $2, $3, now() + interval '7 days')`, [crypto.randomUUID(), hash, user.id]);
if (locale) await c.query(`update "User" set locale = $1 where id = $2`, [locale, user.id]);
console.log(token);
await c.end();
