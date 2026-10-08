/**
 * Server-only token handling for Shopify connections. Decrypted tokens live only
 * in memory for the duration of a request and are never returned to callers
 * outside lib/integrations/shopify.
 */
import type { ImportConnection } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/secrets";
import { logger } from "@/lib/logger";
import { SourceApiError, errorLogContext } from "@/lib/integrations/import/errors";
import { refreshAccessToken, type ShopifyTokenSet } from "./oauth";

/** Refresh this long before expiry so a token never dies mid-page. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export function encryptedTokenFields(tokens: ShopifyTokenSet) {
  return {
    accessTokenEnc: encryptSecret(tokens.accessToken),
    accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    refreshTokenEnc: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : null,
    refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
  };
}

export async function markNeedsReconnect(connectionId: string) {
  await prisma.importConnection.update({
    where: { id: connectionId },
    data: { status: "NEEDS_RECONNECT" },
  });
}

type TokenFields = Pick<
  ImportConnection,
  "id" | "shopDomain" | "status" | "accessTokenEnc" | "accessTokenExpiresAt" | "refreshTokenEnc" | "refreshTokenExpiresAt"
>;

/** Returns a usable access token, refreshing (and persisting) it when close to expiry. */
export async function getShopifyAccessToken(connectionId: string): Promise<string> {
  const connection: TokenFields | null = await prisma.importConnection.findUnique({
    where: { id: connectionId },
    select: {
      id: true,
      shopDomain: true,
      status: true,
      accessTokenEnc: true,
      accessTokenExpiresAt: true,
      refreshTokenEnc: true,
      refreshTokenExpiresAt: true,
    },
  });
  if (!connection || connection.status !== "ACTIVE" || !connection.accessTokenEnc) {
    throw new SourceApiError("unauthorized", "Shopify connection is not active");
  }

  const expiresAt = connection.accessTokenExpiresAt?.getTime();
  if (!expiresAt || expiresAt - Date.now() > REFRESH_MARGIN_MS) {
    return decryptSecret(connection.accessTokenEnc);
  }

  const refreshUsable =
    connection.refreshTokenEnc &&
    (!connection.refreshTokenExpiresAt || connection.refreshTokenExpiresAt.getTime() > Date.now());
  if (!refreshUsable) {
    await markNeedsReconnect(connection.id);
    throw new SourceApiError("unauthorized", "Shopify refresh token expired");
  }

  try {
    const tokens = await refreshAccessToken(connection.shopDomain, decryptSecret(connection.refreshTokenEnc!));
    await prisma.importConnection.update({
      where: { id: connection.id },
      data: {
        ...encryptedTokenFields(tokens),
        // Keep the old refresh token if Shopify didn't rotate it.
        ...(tokens.refreshToken ? {} : { refreshTokenEnc: connection.refreshTokenEnc, refreshTokenExpiresAt: connection.refreshTokenExpiresAt }),
      },
    });
    logger.info("[Shopify] Access token refreshed", { connectionId: connection.id });
    return tokens.accessToken;
  } catch (err) {
    // Another worker may have refreshed (and rotated) the token meanwhile.
    const latest = await prisma.importConnection.findUnique({
      where: { id: connection.id },
      select: { accessTokenEnc: true, accessTokenExpiresAt: true },
    });
    if (latest?.accessTokenEnc && latest.accessTokenExpiresAt && latest.accessTokenExpiresAt.getTime() - Date.now() > REFRESH_MARGIN_MS) {
      return decryptSecret(latest.accessTokenEnc);
    }
    logger.warn("[Shopify] Token refresh failed", { connectionId: connection.id, ...errorLogContext(err) });
    if (err instanceof SourceApiError && err.kind === "unauthorized") await markNeedsReconnect(connection.id);
    throw err;
  }
}
