/**
 * Conversation sync logic.
 * Fetches conversations + messages from Meta API and upserts them into the DB.
 */

import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secrets";
import {
  getConversations,
  getConversationMessages,
  MetaApiError,
} from "./client";

/**
 * Sync all conversations for a given InstagramConnection.
 * Fetches up to 3 pages (75 conversations) per run to respect rate limits.
 */
export async function syncConversations(connectionId: string): Promise<{
  synced: number;
  errors: string[];
}> {
  const connection = await prisma.instagramConnection.findUnique({
    where: { id: connectionId },
    select: {
      id: true,
      igUserId: true,
      accessTokenEnc: true,
      storeId: true,
    },
  });

  if (!connection) {
    return { synced: 0, errors: ["Connection not found"] };
  }

  let accessToken: string;
  try {
    accessToken = decryptSecret(connection.accessTokenEnc);
  } catch {
    await prisma.instagramConnection.update({
      where: { id: connectionId },
      data: { status: "ERROR" },
    });
    return { synced: 0, errors: ["Failed to decrypt access token"] };
  }

  let synced = 0;
  const errors: string[] = [];
  let after: string | undefined;
  let page = 0;

  try {
    do {
      page++;
      const response = await getConversations(connection.igUserId, accessToken, after);

      for (const conv of response.data) {
        try {
          await upsertConversation(connection, conv, accessToken);
          synced++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`conv ${conv.id}: ${msg}`);
        }
      }

      after = response.paging?.cursors?.after;
      if (!response.paging?.next) break;
    } while (after && page < 3);

    await prisma.instagramConnection.update({
      where: { id: connectionId },
      data: { lastSyncAt: new Date() },
    });
  } catch (err) {
    if (err instanceof MetaApiError && (err.code === 190 || err.code === 102)) {
      // Token expired
      await prisma.instagramConnection.update({
        where: { id: connectionId },
        data: { status: "EXPIRED" },
      });
      errors.push("Access token expired — merchant must reconnect");
    } else {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return { synced, errors };
}

async function upsertConversation(
  connection: { id: string; igUserId: string; storeId: string },
  conv: { id: string; updated_time: string; message_count: number; participants: { data: Array<{ id: string; username?: string; name?: string }> } },
  accessToken: string,
) {
  // Find the customer (not the merchant) in participants
  const customer = conv.participants.data.find((p) => p.id !== connection.igUserId);

  const conversation = await prisma.instagramConversation.upsert({
    where: { igConversationId: conv.id },
    create: {
      connectionId: connection.id,
      storeId: connection.storeId,
      igConversationId: conv.id,
      customerIgId: customer?.id ?? "unknown",
      customerIgName: customer?.name ?? null,
      customerIgUsername: customer?.username ?? null,
      lastMessageAt: new Date(conv.updated_time),
      messageCount: conv.message_count,
      status: "UNPROCESSED",
    },
    update: {
      lastMessageAt: new Date(conv.updated_time),
      messageCount: conv.message_count,
      customerIgName: customer?.name ?? undefined,
      customerIgUsername: customer?.username ?? undefined,
    },
    select: { id: true, lastMessageAt: true, status: true },
  });

  // Fetch and upsert messages
  await syncMessages(conversation.id, conv.id, connection.igUserId, accessToken);

  // Queue AI job if conversation is unprocessed or has new messages
  const existingJob = await prisma.igProcessingJob.findFirst({
    where: {
      conversationId: conversation.id,
      status: { in: ["QUEUED", "PROCESSING"] },
    },
  });

  if (!existingJob && conversation.status === "UNPROCESSED") {
    await prisma.igProcessingJob.create({
      data: { conversationId: conversation.id },
    });
  }
}

async function syncMessages(
  conversationDbId: string,
  igConversationId: string,
  merchantIgId: string,
  accessToken: string,
) {
  const response = await getConversationMessages(igConversationId, accessToken);

  for (const msg of response.data) {
    const attachment = msg.attachments?.data?.[0];
    const attachmentUrl = attachment?.payload?.url ?? null;
    const messageType = attachment ? attachment.type : "text";

    await prisma.instagramMessage.upsert({
      where: { igMessageId: msg.id },
      create: {
        conversationId: conversationDbId,
        igMessageId: msg.id,
        fromIgId: msg.from.id,
        isFromBusiness: msg.from.id === merchantIgId,
        messageType,
        content: msg.message ?? null,
        attachmentUrl,
        sentAt: new Date(msg.created_time),
      },
      update: {}, // messages are immutable
    });
  }
}

/**
 * Upsert a single message received via webhook.
 * Also ensures the conversation exists and queues an AI job.
 */
export async function upsertWebhookMessage(params: {
  merchantIgId: string;
  customerIgId: string;
  messageId: string;
  text: string | null;
  attachmentUrl: string | null;
  messageType: string;
  timestamp: Date;
}) {
  // Find the connection by merchant IG user ID
  const connection = await prisma.instagramConnection.findFirst({
    where: { igUserId: params.merchantIgId, status: "ACTIVE" },
    select: { id: true, storeId: true, igUserId: true },
  });

  if (!connection) return; // unknown merchant, ignore

  // Build a stable conversation ID: sorted pair of merchant+customer IDs
  // (Meta may not send the conversation ID in webhook payloads)
  const igConversationId = `${params.merchantIgId}_${params.customerIgId}`;

  const conversation = await prisma.instagramConversation.upsert({
    where: { igConversationId },
    create: {
      connectionId: connection.id,
      storeId: connection.storeId,
      igConversationId,
      customerIgId: params.customerIgId,
      lastMessageAt: params.timestamp,
      messageCount: 1,
      status: "UNPROCESSED",
    },
    update: {
      lastMessageAt: params.timestamp,
      messageCount: { increment: 1 },
      // If it was already analyzed and a new message comes in, re-analyze
      status: "UNPROCESSED",
      analysisVersion: { increment: 1 },
    },
    select: { id: true },
  });

  // Upsert the message
  await prisma.instagramMessage.upsert({
    where: { igMessageId: params.messageId },
    create: {
      conversationId: conversation.id,
      igMessageId: params.messageId,
      fromIgId: params.customerIgId,
      isFromBusiness: false,
      messageType: params.messageType,
      content: params.text,
      attachmentUrl: params.attachmentUrl,
      sentAt: params.timestamp,
    },
    update: {},
  });

  // Cancel any existing queued job and create a fresh one (so it picks up the new message)
  await prisma.igProcessingJob.updateMany({
    where: { conversationId: conversation.id, status: "QUEUED" },
    data: { status: "FAILED", errorMessage: "Superseded by new message" },
  });

  await prisma.igProcessingJob.create({
    data: { conversationId: conversation.id },
  });
}
