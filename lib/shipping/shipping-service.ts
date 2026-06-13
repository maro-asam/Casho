import { prisma } from "@/lib/prisma";
import { dispatchWebhookEvent } from "@/lib/webhooks/events";
import { BostaProvider, type BostaConfig } from "./providers/bosta";
import { AramexProvider, type AramexConfig } from "./providers/aramex";
import type {
  ShippingProvider,
  CreateShipmentParams,
  TrackingResult,
} from "./types";

export type ProviderName = "bosta" | "aramex";

/**
 * Store-level shipping provider credentials.
 * In production these come from a StoreShippingSettings model (or stored encrypted in DB).
 * For now, fall back to env vars prefixed by BOSTA_ / ARAMEX_.
 */
function buildProvider(name: ProviderName): ShippingProvider {
  switch (name) {
    case "bosta": {
      const config: BostaConfig = {
        apiKey: process.env.BOSTA_API_KEY ?? "",
        pickupCity: process.env.BOSTA_PICKUP_CITY ?? "Cairo",
      };
      return new BostaProvider(config);
    }

    case "aramex": {
      const config: AramexConfig = {
        userName: process.env.ARAMEX_USERNAME ?? "",
        password: process.env.ARAMEX_PASSWORD ?? "",
        accountNumber: process.env.ARAMEX_ACCOUNT_NUMBER ?? "",
        accountPin: process.env.ARAMEX_ACCOUNT_PIN ?? "",
        accountEntity: process.env.ARAMEX_ACCOUNT_ENTITY ?? "CAI",
        accountCountryCode: process.env.ARAMEX_COUNTRY_CODE ?? "EG",
        version: "v1.0",
      };
      return new AramexProvider(config);
    }

    default:
      throw new Error(`Unknown shipping provider: ${name}`);
  }
}

export class ShippingService {
  /**
   * Create a shipment with the given provider, persist to DB, and emit webhook.
   */
  static async createShipment(
    storeId: string,
    providerName: ProviderName,
    params: CreateShipmentParams,
  ) {
    const provider = buildProvider(providerName);
    const result = await provider.createShipment(params);

    const shipment = await prisma.shipment.create({
      data: {
        storeId,
        orderId: params.orderId,
        provider: providerName,
        providerShipmentId: result.providerShipmentId,
        trackingNumber: result.trackingNumber,
        status: "CREATED",
        courierName: result.courierName,
        cost: result.costPiasters,
        estimatedDelivery: result.estimatedDelivery,
        providerPayload: result.rawResponse as object,
      },
    });

    await dispatchWebhookEvent(storeId, "shipment.created", {
      shipment_id: shipment.id,
      provider: providerName,
      tracking_number: result.trackingNumber,
      order_id: params.orderId,
      status: "CREATED",
    });

    return shipment;
  }

  /**
   * Fetch live tracking from the provider and sync status to DB.
   */
  static async trackShipment(shipmentId: string): Promise<TrackingResult> {
    const shipment = await prisma.shipment.findUniqueOrThrow({
      where: { id: shipmentId },
    });

    const provider = buildProvider(shipment.provider as ProviderName);
    const tracking = await provider.trackShipment(
      shipment.trackingNumber ?? shipment.providerShipmentId ?? shipmentId,
    );

    const previousStatus = shipment.status;

    await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: tracking.status,
        estimatedDelivery: tracking.estimatedDelivery,
        deliveredAt: tracking.status === "DELIVERED" ? new Date() : undefined,
      },
    });

    if (tracking.status !== previousStatus) {
      const event =
        tracking.status === "DELIVERED" ? "shipment.delivered" : "shipment.updated";

      await dispatchWebhookEvent(shipment.storeId, event, {
        shipment_id: shipmentId,
        tracking_number: shipment.trackingNumber,
        order_id: shipment.orderId,
        status: tracking.status,
        previous_status: previousStatus,
      });
    }

    return tracking;
  }

  /**
   * Cancel a shipment via the provider and mark as CANCELED in DB.
   */
  static async cancelShipment(shipmentId: string): Promise<void> {
    const shipment = await prisma.shipment.findUniqueOrThrow({
      where: { id: shipmentId },
    });

    const provider = buildProvider(shipment.provider as ProviderName);
    await provider.cancelShipment(
      shipment.providerShipmentId ?? shipmentId,
    );

    await prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: "CANCELED", canceledAt: new Date() },
    });

    await dispatchWebhookEvent(shipment.storeId, "shipment.updated", {
      shipment_id: shipmentId,
      tracking_number: shipment.trackingNumber,
      order_id: shipment.orderId,
      status: "CANCELED",
    });
  }

  /**
   * Calculate shipping rates without creating a shipment.
   */
  static async calculateRates(
    providerName: ProviderName,
    params: Parameters<ShippingProvider["calculateRates"]>[0],
  ) {
    const provider = buildProvider(providerName);
    return provider.calculateRates(params);
  }
}
