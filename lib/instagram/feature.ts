/**
 * Instagram AI orders (DM → suggested order) is paused and shown as "coming soon":
 * the sidebar and integrations page say so, /instagram shows a preview, and the
 * OAuth flow refuses to start. Flip to `true` once the OpenAI key, the
 * "IG Process Jobs" cron and Meta App Review are in place.
 */
export const INSTAGRAM_ORDERS_ENABLED = false;
