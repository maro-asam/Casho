// Shipment lifecycle: labels, timeline events, and how a shipment's status
// moves its order. Pure — shared by dashboard, storefront and actions.

import type { OrderStatus, ShipmentStatus } from "@prisma/client";

export type ShipmentTone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";

export const SHIPMENT_STATUS_META: Record<ShipmentStatus, { label: string; customerLabel: string; tone: ShipmentTone }> = {
  CREATED: { label: "مستنية الاستلام", customerLabel: "طلبك اتجهّز وهيتسلّم لشركة الشحن", tone: "neutral" },
  PICKED_UP: { label: "اتسلّمت للشركة", customerLabel: "طلبك مع شركة الشحن", tone: "info" },
  IN_TRANSIT: { label: "في الطريق", customerLabel: "طلبك في الطريق", tone: "info" },
  OUT_FOR_DELIVERY: { label: "خرجت للتوصيل", customerLabel: "المندوب في الطريق ليك النهارده", tone: "accent" },
  DELIVERED: { label: "اتسلّمت", customerLabel: "طلبك اتسلّم", tone: "success" },
  FAILED_DELIVERY: { label: "محاولة فاشلة", customerLabel: "المندوب ماقدرش يوصلك — هيحاول تاني", tone: "warning" },
  RETURNED: { label: "مرتجعة", customerLabel: "الشحنة رجعت للمتجر", tone: "danger" },
  CANCELED: { label: "ملغية", customerLabel: "الشحنة اتلغت", tone: "neutral" },
};

/** Forward path shown as the progress track. */
export const SHIPMENT_TRACK: ShipmentStatus[] = ["CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];

export const ACTIVE_SHIPMENT_STATUSES: ShipmentStatus[] = [
  "CREATED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "FAILED_DELIVERY",
];

export function isClosedShipment(status: ShipmentStatus) {
  return status === "DELIVERED" || status === "RETURNED" || status === "CANCELED";
}

// ─── Timeline ────────────────────────────────────────────────────────────────

export type ShipmentEvent = {
  /** ISO timestamp */
  at: string;
  status: ShipmentStatus;
  note?: string;
  location?: string;
  /** "merchant" for manual updates, "carrier" for API sync. */
  source: "merchant" | "carrier" | "system";
};

export function readShipmentEvents(value: unknown): ShipmentEvent[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (e): e is ShipmentEvent =>
      !!e && typeof e === "object" && typeof (e as ShipmentEvent).at === "string" && typeof (e as ShipmentEvent).status === "string",
  );
}

/** Carrier sync replaces carrier events but keeps the merchant's own notes. */
export function mergeCarrierEvents(existing: ShipmentEvent[], carrier: ShipmentEvent[]): ShipmentEvent[] {
  const kept = existing.filter((e) => e.source !== "carrier");
  return [...kept, ...carrier].sort((a, b) => a.at.localeCompare(b.at));
}

// ─── Order sync ──────────────────────────────────────────────────────────────

/**
 * The order status a shipment status implies, or null to leave the order alone.
 * A returned shipment cancels the order as a refused delivery (`returned`).
 */
export function orderStatusForShipment(
  status: ShipmentStatus,
): { status: OrderStatus; returned?: boolean } | null {
  switch (status) {
    case "CREATED":
    case "PICKED_UP":
    case "IN_TRANSIT":
    case "OUT_FOR_DELIVERY":
      return { status: "SHIPPED" };
    case "DELIVERED":
      return { status: "DELIVERED" };
    case "RETURNED":
      return { status: "CANCELED", returned: true };
    default:
      return null;
  }
}

/** Cash a carrier has collected but not yet handed to the merchant. */
export function isCodOutstanding(s: { status: ShipmentStatus; codAmount: number | null; codCollectedAt: Date | null }) {
  return s.status === "DELIVERED" && (s.codAmount ?? 0) > 0 && !s.codCollectedAt;
}
