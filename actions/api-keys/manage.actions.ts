"use server";

import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import type { ApiScope } from "@/lib/api/types";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function generateRawKey(): string {
  return `csk_live_${randomBytes(24).toString("hex")}`;
}

// ─── Create ───────────────────────────────────────────────────────────────

export async function createApiKey(
  storeId: string,
  name: string,
  scopes: ApiScope[] = [],
  ipWhitelist: string[] = [],
): Promise<{ key: string; id: string }> {
  const userId = await requireUserId();

  // Verify the user owns (or is a member of) this store
  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      OR: [
        { userId },
        { members: { some: { userId } } },
      ],
    },
    select: { id: true },
  });

  if (!store) throw new Error("Store not found or access denied");

  const existing = await prisma.apiKey.count({
    where: { storeId, status: "ACTIVE" },
  });
  if (existing >= 10) throw new Error("Maximum of 10 active API keys per store");

  const rawKey = generateRawKey();
  const keyHash = sha256(rawKey);
  const keyHint = rawKey.slice(-8);

  const apiKey = await prisma.apiKey.create({
    data: {
      storeId,
      name,
      keyHash,
      keyHint,
      scopes,
      ipWhitelist,
    },
    select: { id: true },
  });

  // Return the raw key only once — it cannot be retrieved again
  return { key: rawKey, id: apiKey.id };
}

// ─── List ─────────────────────────────────────────────────────────────────

export async function listApiKeys(storeId: string) {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      OR: [
        { userId },
        { members: { some: { userId } } },
      ],
    },
    select: { id: true },
  });

  if (!store) throw new Error("Store not found or access denied");

  return prisma.apiKey.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyHint: true,
      status: true,
      scopes: true,
      ipWhitelist: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
      revokedAt: true,
    },
  });
}

// ─── Revoke ───────────────────────────────────────────────────────────────

export async function revokeApiKey(keyId: string, storeId: string): Promise<void> {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      OR: [
        { userId },
        { members: { some: { userId } } },
      ],
    },
    select: { id: true },
  });

  if (!store) throw new Error("Store not found or access denied");

  const key = await prisma.apiKey.findFirst({
    where: { id: keyId, storeId },
    select: { id: true },
  });

  if (!key) throw new Error("API key not found");

  await prisma.apiKey.update({
    where: { id: keyId },
    data: { status: "REVOKED", revokedAt: new Date() },
  });
}

// ─── Rotate ───────────────────────────────────────────────────────────────

export async function rotateApiKey(
  keyId: string,
  storeId: string,
): Promise<{ key: string; id: string }> {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      OR: [
        { userId },
        { members: { some: { userId } } },
      ],
    },
    select: { id: true },
  });

  if (!store) throw new Error("Store not found or access denied");

  const existing = await prisma.apiKey.findFirst({
    where: { id: keyId, storeId, status: "ACTIVE" },
    select: { id: true, name: true, scopes: true, ipWhitelist: true },
  });

  if (!existing) throw new Error("Active API key not found");

  const newRawKey = generateRawKey();
  const newKeyHash = sha256(newRawKey);
  const newKeyHint = newRawKey.slice(-8);

  // Atomic: revoke old + create new in a transaction
  const [, newKey] = await prisma.$transaction([
    prisma.apiKey.update({
      where: { id: keyId },
      data: { status: "REVOKED", revokedAt: new Date() },
    }),
    prisma.apiKey.create({
      data: {
        storeId,
        name: existing.name,
        keyHash: newKeyHash,
        keyHint: newKeyHint,
        scopes: existing.scopes,
        ipWhitelist: existing.ipWhitelist,
      },
      select: { id: true },
    }),
  ]);

  return { key: newRawKey, id: newKey.id };
}
