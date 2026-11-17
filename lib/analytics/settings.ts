/**
 * Analytics settings (singleton row) with a short in-process cache: the
 * collector reads them on every batch and must not hit the database for it.
 */
import type { AnalyticsConsentMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CONSENT_COUNTRIES, type ScopeCode } from "./constants";

export type AnalyticsSettingsValue = {
  enabled: boolean;
  trackMarketing: boolean;
  trackApp: boolean;
  trackStorefronts: boolean;
  consentMode: AnalyticsConsentMode;
  respectDnt: boolean;
  sessionTimeoutMin: number;
  realtimeWindowMin: number;
  rawRetentionDays: number;
  sessionRetentionDays: number;
  excludedPaths: string[];
  excludedQueryParams: string[];
  internalIps: string[];
  excludeTeam: boolean;
  heatmapsEnabled: boolean;
  heatmapSampleRate: number;
  heatmapPrivatePages: boolean;
  trackClicks: boolean;
  trackScroll: boolean;
  trackForms: boolean;
  trackErrors: boolean;
  trackVitals: boolean;
  trackCustomEvents: boolean;
  updatedAt: Date | null;
  updatedById: string | null;
};

export const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettingsValue = {
  enabled: true,
  trackMarketing: true,
  trackApp: true,
  trackStorefronts: true,
  consentMode: "REGION",
  respectDnt: true,
  sessionTimeoutMin: 30,
  realtimeWindowMin: 5,
  rawRetentionDays: 90,
  sessionRetentionDays: 395,
  excludedPaths: [],
  excludedQueryParams: [],
  internalIps: [],
  excludeTeam: true,
  heatmapsEnabled: true,
  heatmapSampleRate: 100,
  heatmapPrivatePages: false,
  trackClicks: true,
  trackScroll: true,
  trackForms: true,
  trackErrors: true,
  trackVitals: true,
  trackCustomEvents: true,
  updatedAt: null,
  updatedById: null,
};

const TTL_MS = 30_000;
let cache: { value: AnalyticsSettingsValue; expires: number } | null = null;

/** Never throws: a database hiccup falls back to the last known (or default) settings. */
export async function getAnalyticsSettings(): Promise<AnalyticsSettingsValue> {
  if (cache && cache.expires > Date.now()) return cache.value;
  try {
    const row = await prisma.analyticsSettings.findUnique({ where: { id: "default" } });
    const value: AnalyticsSettingsValue = row ? { ...DEFAULT_ANALYTICS_SETTINGS, ...row } : DEFAULT_ANALYTICS_SETTINGS;
    cache = { value, expires: Date.now() + TTL_MS };
    return value;
  } catch (error) {
    console.error("[analytics] settings", error);
    return cache?.value ?? DEFAULT_ANALYTICS_SETTINGS;
  }
}

/** After a save, so this instance picks the change up at once (others within 30 s). */
export function clearAnalyticsSettingsCache() {
  cache = null;
}

export function scopeEnabled(settings: AnalyticsSettingsValue, scope: ScopeCode) {
  if (!settings.enabled) return false;
  if (scope === "m") return settings.trackMarketing;
  if (scope === "a") return settings.trackApp;
  return settings.trackStorefronts;
}

/** What the browser SDK needs — no secrets, no internal lists (excluded IPs stay server-side). */
export type PublicAnalyticsConfig = {
  /** Collect for this scope. */
  on: boolean;
  /** Ask for consent first. */
  ask: boolean;
  /** Stop when the browser sends Do Not Track / Global Privacy Control. */
  dnt: boolean;
  /** Session timeout, minutes. */
  to: number;
  /** Excluded path prefixes. */
  ex: string[];
  /** Send click events on this scope (the dashboard only when private-page heatmaps are on). */
  ck: boolean;
  /** % of sessions whose click positions are collected (0 = heatmaps off for this scope). */
  hm: number;
  /** Feature switches: clicks, scroll, forms, errors, vitals, custom events. */
  f: { c: boolean; s: boolean; fo: boolean; er: boolean; vi: boolean; cu: boolean };
  /** Skip Casho staff (the SDK checks the team cookie). */
  tm: boolean;
};

export function publicConfig(settings: AnalyticsSettingsValue, scope: ScopeCode, country: string | null): PublicAnalyticsConfig {
  const on = scopeEnabled(settings, scope);
  const ask =
    settings.consentMode === "BANNER" ||
    (settings.consentMode === "REGION" && !!country && CONSENT_COUNTRIES.has(country.toUpperCase()));
  const heatmapAllowed = settings.heatmapsEnabled && settings.trackClicks && (scope !== "a" || settings.heatmapPrivatePages);
  return {
    on,
    ask,
    dnt: settings.respectDnt,
    to: settings.sessionTimeoutMin,
    ex: settings.excludedPaths,
    ck: settings.trackClicks && (scope !== "a" || settings.heatmapPrivatePages),
    hm: heatmapAllowed ? Math.max(0, Math.min(100, settings.heatmapSampleRate)) : 0,
    f: {
      c: settings.trackClicks,
      s: settings.trackScroll,
      fo: settings.trackForms,
      er: settings.trackErrors,
      vi: settings.trackVitals,
      cu: settings.trackCustomEvents,
    },
    tm: settings.excludeTeam,
  };
}
