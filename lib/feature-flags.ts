/**
 * Runtime feature flags — controlled via environment variables.
 * Set the env var to "false" to disable a feature without redeploying.
 *
 * Example .env:
 *   INSTAGRAM_AI_ORDERS_ENABLED=false   # disables all IG AI processing globally
 */

function envBool(key: string, defaultValue = true): boolean {
  const val = process.env[key];
  if (val === undefined) return defaultValue;
  return val.toLowerCase() !== "false" && val !== "0";
}

export const featureFlags = {
  /** Master switch: Instagram AI Orders. Disabling stops job processing and webhook handling. */
  instagramAiOrders: () => envBool("INSTAGRAM_AI_ORDERS_ENABLED", true),

  /**
   * AI Marketing Assistant — shows a "Boost Sales with AI" modal after product creation.
   * Generates viral hooks, captions, hashtags, content ideas, and ad angles.
   * Disable with: AI_MARKETING_ASSISTANT_ENABLED=false
   */
  aiMarketingAssistant: () => envBool("AI_MARKETING_ASSISTANT_ENABLED", true),
};
