export const WEBHOOK_EVENTS = [
  "order.created",
  "order.updated",
  "order.paid",
  "shipment.created",
  "shipment.updated",
  "shipment.delivered",
  "customer.created",
  // Accounting events — also dispatched as webhooks for integrations
  "invoice.created",
  "payment.received",
  "refund.issued",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface WebhookPayload {
  id: string;         // delivery UUID
  event: WebhookEvent;
  timestamp: string;  // ISO 8601
  store_id: string;
  api_version: string;
  data: Record<string, unknown>;
}

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Dispatch a webhook event to all active endpoints subscribed to that event.
 * Creates WebhookDelivery records for async processing.
 * Call this from server actions or API handlers — it never throws.
 */
export async function dispatchWebhookEvent(
  storeId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        storeId,
        status: "ACTIVE",
        events: { has: event },
      },
      select: { id: true },
    });

    if (endpoints.length === 0) return;

    const payload: WebhookPayload = {
      id: randomUUID(),
      event,
      timestamp: new Date().toISOString(),
      store_id: storeId,
      api_version: "2024-01",
      data,
    };

    await prisma.webhookDelivery.createMany({
      data: endpoints.map((ep) => ({
        endpointId: ep.id,
        storeId,
        event,
        payload: payload as object,
        nextRetryAt: new Date(),
      })),
    });
  } catch (error) {
    // Never propagate — webhooks must not break the main flow
    console.error("[webhook] dispatch failed:", error);
  }
}
