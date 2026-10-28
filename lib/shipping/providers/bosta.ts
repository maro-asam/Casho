/**
 * Bosta Egypt shipping provider adapter.
 * Docs: https://developer.bosta.co
 * Base URL: https://app.bosta.co/api/v2
 */

import type {
  ShippingProvider,
  CreateShipmentParams,
  ShipmentResult,
  TrackingResult,
  RateParams,
  RateResult,
  StandardShipmentStatus,
  TrackingEvent,
} from "@/lib/shipping/types";

const BASE_URL = "https://app.bosta.co/api/v2";

// Bosta delivery types
const BOSTA_DELIVERY_TYPE = {
  SEND: 10,   // forward delivery
  RETURN: 25, // return to sender
  CASH_COLLECTION: 30,
} as const;

// Map Bosta states → our standard statuses
const BOSTA_STATUS_MAP: Record<string, StandardShipmentStatus> = {
  "CREATED_BY_BUSINESS": "CREATED",
  "PACKAGE_RECEIVED": "PICKED_UP",
  "IN_TRANSIT": "IN_TRANSIT",
  "OUT_FOR_DELIVERY": "OUT_FOR_DELIVERY",
  "DELIVERED": "DELIVERED",
  "WAITING_FOR_BUSINESS_ACTION": "FAILED_DELIVERY",
  "RETURNED_TO_ORIGIN": "RETURNED",
  "CANCELLED": "CANCELED",
  "LOST": "RETURNED",
};

export interface BostaConfig {
  apiKey: string;
  /** Not sent: Bosta picks up from the business's default location in the Bosta account. */
  pickupCity?: string;
}

// Bosta city codes (GET /api/v2/cities), keyed by our governorates' English
// names (constants/egypt-governorates.ts). Codes are stable; names differ in spelling.
const BOSTA_CITY_CODES: Record<string, string> = {
  cairo: "EG-01",
  alexandria: "EG-02",
  "north coast": "EG-03",
  beheira: "EG-04",
  dakahlia: "EG-05",
  qalyubia: "EG-06",
  gharbia: "EG-07",
  "kafr el sheikh": "EG-08",
  monufia: "EG-09",
  sharqia: "EG-10",
  ismailia: "EG-11",
  suez: "EG-12",
  "port said": "EG-13",
  damietta: "EG-14",
  fayoum: "EG-15",
  "beni suef": "EG-16",
  asyut: "EG-17",
  sohag: "EG-18",
  minya: "EG-19",
  qena: "EG-20",
  aswan: "EG-21",
  luxor: "EG-22",
  "red sea": "EG-23",
  "new valley": "EG-24",
  giza: "EG-25",
  "south sinai": "EG-26",
  "north sinai": "EG-27",
  matrouh: "EG-28",
};

/** Bosta's city code for a governorate's English name (or an "EG-xx" code passed through). */
export function bostaCityCode(city: string): string | null {
  const key = city.trim().toLowerCase();
  if (/^eg-\d{2}$/.test(key)) return key.toUpperCase();
  return BOSTA_CITY_CODES[key] ?? null;
}

export class BostaProvider implements ShippingProvider {
  readonly name = "bosta";

  constructor(private config: BostaConfig) {}

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: this.config.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });

    const data = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
      throw new Error(
        `Bosta API error ${res.status}: ${(data.message as string) ?? "Unknown error"}`,
      );
    }

    return data as T;
  }

  async createShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    const hasCOD = (params.codAmountPiasters ?? 0) > 0;
    const city = bostaCityCode(params.receiver.city);
    if (!city) throw new Error(`المحافظة "${params.receiver.city}" مش موجودة في قايمة مدن بوسطة`);

    // dropOffAddress is where the parcel goes (the customer); the receiver block
    // is only the contact. City is a Bosta code ("EG-12"), not a name or object.
    const payload = {
      type: BOSTA_DELIVERY_TYPE.SEND,
      specs: {
        weight: params.parcel.weightKg,
        packageDetails: {
          itemsCount: 1,
          description: params.parcel.description ?? "Parcel",
        },
      },
      dropOffAddress: {
        city,
        firstLine: params.receiver.street,
        ...(params.receiver.district && { district: params.receiver.district }),
        ...(params.receiver.buildingNumber && { buildingNumber: params.receiver.buildingNumber }),
        ...(params.receiver.floor && { floor: params.receiver.floor }),
        ...(params.receiver.apartment && { apartment: params.receiver.apartment }),
      },
      receiver: {
        firstName: params.receiver.firstName,
        lastName: params.receiver.lastName || params.receiver.firstName,
        phone: params.receiver.phone,
      },
      ...(params.notes && { notes: params.notes }),
      ...(hasCOD && { cod: params.codAmountPiasters! / 100 }),
      ...(params.reference && { businessReference: params.reference }),
    };

    const data = await this.request<{
      _id: string;
      trackingNumber: string;
      courier?: { name: string };
      cod?: { amount: number };
      promisedDate?: string;
    }>("POST", "/deliveries", payload);

    return {
      providerShipmentId: data._id,
      trackingNumber: data.trackingNumber,
      courierName: "Bosta",
      estimatedDelivery: data.promisedDate ? new Date(data.promisedDate) : undefined,
      rawResponse: data as unknown as Record<string, unknown>,
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    const data = await this.request<{
      trackingNumber: string;
      currentStatus: { state: string; timestamp: string; description?: string };
      nextWorkingDay?: string;
      transitions?: Array<{
        state: string;
        timestamp: string;
        description?: string;
        hub?: { name: string };
      }>;
    }>("GET", `/deliveries/${trackingNumber}/tracking`);

    const currentState = data.currentStatus?.state ?? "CREATED_BY_BUSINESS";
    const status = BOSTA_STATUS_MAP[currentState] ?? "IN_TRANSIT";

    const events: TrackingEvent[] = (data.transitions ?? []).map((t) => ({
      timestamp: new Date(t.timestamp),
      status: BOSTA_STATUS_MAP[t.state] ?? "IN_TRANSIT",
      description: t.description ?? t.state,
      location: t.hub?.name,
    }));

    return {
      trackingNumber: data.trackingNumber,
      status,
      courierName: "Bosta",
      estimatedDelivery: data.nextWorkingDay ? new Date(data.nextWorkingDay) : undefined,
      events,
    };
  }

  async cancelShipment(providerShipmentId: string): Promise<void> {
    await this.request("PUT", `/deliveries/${providerShipmentId}/terminate`, {
      reason: "Cancelled by merchant",
    });
  }

  async calculateRates(params: RateParams): Promise<RateResult[]> {
    // Bosta doesn't expose a public rates endpoint; return standard Egypt rates
    const hasCOD = (params.codAmountPiasters ?? 0) > 0;
    const basePiasters = 4500; // 45 EGP base
    const codFee = hasCOD ? 300 : 0; // 3 EGP COD fee

    return [
      {
        serviceLevel: "Standard",
        costPiasters: basePiasters + codFee,
        estimatedDays: 2,
        currency: "EGP",
      },
      {
        serviceLevel: "Express",
        costPiasters: basePiasters + codFee + 2000,
        estimatedDays: 1,
        currency: "EGP",
      },
    ];
  }
}
