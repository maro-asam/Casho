/**
 * Custom events from client components:
 *
 *   import { trackEvent } from "@/lib/analytics/track";
 *   trackEvent("pricing_cycle_changed", { cycle: "yearly" });
 *
 * Names are lowercase snake_case; props are up to 12 short strings, numbers
 * or booleans (no personal data — emails and long numbers are masked anyway).
 * A no-op until the visitor's analytics session runs (consent, settings).
 */
export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  const api = (window as Window & { cashoAnalytics?: { track: (n: string, p?: Record<string, unknown>) => void } }).cashoAnalytics;
  api?.track(name, props);
}
