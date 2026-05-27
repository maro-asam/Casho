/**
 * Instagram long-lived token refresh.
 *
 * Meta long-lived tokens expire after ~60 days. They can be refreshed
 * any time while still valid (at least 1 day remaining).
 *
 * Strategy:
 *   - Run weekly via cron
 *   - Refresh tokens expiring within REFRESH_THRESHOLD_DAYS (14 days)
 *   - On success: update tokenExpiresAt + reset status to ACTIVE
 *   - On failure: mark connection EXPIRED, send IG_CONNECTION_EXPIRED notification
 */

import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret } from "@/lib/secrets";
import { createNotification } from "@/lib/notifications/in-app";
import { logger } from "@/lib/logger";

const REFRESH_THRESHOLD_DAYS = 14;
const META_API_BASE = "https://graph.facebook.com/v21.0";

export type TokenRefreshResult = {
  refreshed: number;
  expired: number;
  errors: string[];
};

export async function refreshExpiringTokens(): Promise<TokenRefreshResult> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + REFRESH_THRESHOLD_DAYS);

  // Find active connections with tokens expiring soon
  const connections = await prisma.instagramConnection.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { tokenExpiresAt: { lte: cutoff } },
        { tokenExpiresAt: null }, // Unknown expiry — refresh to be safe
      ],
    },
    select: {
      id: true,
      storeId: true,
      accessTokenEnc: true,
      tokenExpiresAt: true,
      igUsername: true,
    },
  });

  logger.info("[TokenRefresh] Starting refresh run", {
    connectionCount: connections.length,
    thresholdDays: REFRESH_THRESHOLD_DAYS,
  });

  const result: TokenRefreshResult = { refreshed: 0, expired: 0, errors: [] };

  for (const conn of connections) {
    try {
      const currentToken = decryptSecret(conn.accessTokenEnc);
      const refreshed = await refreshLongLivedToken(currentToken);

      if (!refreshed) {
        // Token is invalid — can't refresh
        await markExpired(conn.id, conn.storeId);
        result.expired++;
        continue;
      }

      const newTokenEnc = encryptSecret(refreshed.accessToken);
      const expiresAt   = new Date(Date.now() + refreshed.expiresInSeconds * 1000);

      await prisma.instagramConnection.update({
        where: { id: conn.id },
        data: {
          accessTokenEnc: newTokenEnc,
          tokenExpiresAt: expiresAt,
          status:         "ACTIVE",
        },
      });

      logger.info("[TokenRefresh] Token refreshed", {
        connectionId: conn.id,
        igUsername:   conn.igUsername,
        newExpiresAt: expiresAt.toISOString(),
      });

      result.refreshed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`${conn.id}: ${message}`);

      logger.error("[TokenRefresh] Failed to refresh token", {
        connectionId: conn.id,
        igUsername:   conn.igUsername,
        err:          message,
      });

      // Mark as expired if the error indicates an invalid token
      if (isTokenInvalidError(err)) {
        await markExpired(conn.id, conn.storeId);
        result.expired++;
      }
    }
  }

  logger.info("[TokenRefresh] Run complete", result);
  return result;
}

// ─── Meta API call ─────────────────────────────────────────────────────────────

async function refreshLongLivedToken(
  accessToken: string,
): Promise<{ accessToken: string; expiresInSeconds: number } | null> {
  const params = new URLSearchParams({
    grant_type:        "fb_exchange_token",
    client_id:         process.env.META_APP_ID ?? "",
    client_secret:     process.env.META_APP_SECRET ?? "",
    fb_exchange_token: accessToken,
  });

  const res = await fetch(`${META_API_BASE}/oauth/access_token?${params.toString()}`);
  const json = await res.json() as Record<string, unknown>;

  if (!res.ok || json.error) {
    const error = json.error as { code?: number; message?: string } | undefined;
    logger.warn("[TokenRefresh] Meta API error", { error });

    // Code 190 = invalid token
    if (error?.code === 190) return null;

    throw new Error(error?.message ?? `Meta API error ${res.status}`);
  }

  return {
    accessToken:      json.access_token as string,
    expiresInSeconds: Number(json.expires_in ?? 5183944), // ~60 days default
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function markExpired(connectionId: string, storeId: string) {
  await prisma.instagramConnection.update({
    where: { id: connectionId },
    data: { status: "EXPIRED" },
  });

  await createNotification({
    storeId,
    type:    "IG_CONNECTION_EXPIRED",
    title:   "انتهت صلاحية ربط انستجرام ⚠️",
    message: "يجب إعادة ربط حساب انستجرام لاستمرار اكتشاف الطلبات تلقائياً",
    href:    "/dashboard/integrations/instagram",
  });

  logger.warn("[TokenRefresh] Connection marked EXPIRED", { connectionId, storeId });
}

function isTokenInvalidError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.message.includes("190") ||
    err.message.toLowerCase().includes("invalid") ||
    err.message.toLowerCase().includes("expired")
  );
}
