/**
 * Mylerz (Egypt) shipping provider adapter.
 * Endpoints and field names follow Mylerz's official WooCommerce plugin (v5):
 *   POST /token (password grant) → bearer token
 *   POST /api/orders/addorders           [package…] → Value.Packages[].BarCode
 *   POST /api/packages/GetPackageListStatus [barcode…] → Value[].Status
 *   POST /api/packages/CancelPackage     [{ Barcode }]
 *   GET  /api/orders/GetWarehouses       → Value[].Name
 *   GET  /api/packages/GetCityZoneList   (public) → Value[].{Code, EnName, Zones[].Code}
 * Every response is `{ IsErrorState, ErrorDescription, Value }` (or `{ Message }` when auth fails).
 */

import type {
  CreateShipmentParams,
  RateResult,
  ShipmentResult,
  ShippingProvider,
  StandardShipmentStatus,
  TrackingResult,
} from "@/lib/shipping/types";

const BASE_URL = "https://integration.mylerz.net";

export interface MylerzConfig {
  username: string;
  password: string;
  /** Warehouse name on the Mylerz account; the first one when empty. */
  warehouse?: string;
}

export type MylerzZone = { code: string; name: string; nameAr: string };
export type MylerzCity = { code: string; name: string; nameAr: string; zones: MylerzZone[] };

// Mylerz city codes, keyed by our governorates' English names (constants/egypt-governorates.ts).
const MYLERZ_CITY_CODES: Record<string, string> = {
  cairo: "CA",
  giza: "Giza",
  alexandria: "ALX",
  qalyubia: "QLYB",
  sharqia: "SHRK",
  dakahlia: "DAKH",
  gharbia: "GHRB",
  monufia: "MONF",
  beheira: "BEHR",
  "kafr el sheikh": "SHKH",
  damietta: "DAMT",
  "port said": "PORS",
  ismailia: "ISML",
  suez: "SUEZ",
  fayoum: "FAYM",
  "beni suef": "BENS",
  minya: "MNYA",
  asyut: "ASYT",
  sohag: "SOHG",
  qena: "QENA",
  luxor: "LUXR",
  aswan: "ASWN",
  "red sea": "REDS",
  "new valley": "WADI",
  matrouh: "MTRH",
  "north sinai": "NSNA",
  "south sinai": "SSINA",
};

export function mylerzCityCode(governorateEn: string): string | null {
  return MYLERZ_CITY_CODES[governorateEn.trim().toLowerCase()] ?? null;
}

type Envelope<T> = { IsErrorState?: boolean; ErrorDescription?: unknown; Message?: string; Value?: T };

function envelopeError(data: Envelope<unknown>, status: number): string | null {
  if (data.Message && /authorization/i.test(data.Message)) {
    return "بيانات حساب مايلرز اتلغت أو اتغيرت. ادخلها تاني من صفحة شركات الشحن.";
  }
  if (data.IsErrorState === true || data.Message) {
    const detail = typeof data.ErrorDescription === "string" ? data.ErrorDescription : data.Message ?? JSON.stringify(data.ErrorDescription ?? data.Value ?? "");
    return `Mylerz API error: ${detail || `HTTP ${status}`}`;
  }
  if (status >= 500) return "مايلرز فيها مشكلة من عندها دلوقتي. جرّب تاني بعد شوية.";
  if (status >= 400) return `Mylerz API error: HTTP ${status}`;
  return null;
}

/** Mylerz's public city → zone list (cached for a day by Next's fetch cache). */
export async function getMylerzCities(): Promise<MylerzCity[]> {
  const res = await fetch(`${BASE_URL}/api/packages/GetCityZoneList`, {
    next: { revalidate: 86_400 },
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as Envelope<
    { Code: string; EnName: string; ArName: string; Zones?: { Code: string; EnName: string; ArName: string }[] }[]
  >;
  const error = envelopeError(data, res.status);
  if (error) throw new Error(error);
  return (data.Value ?? []).map((c) => ({
    code: c.Code,
    name: c.EnName,
    nameAr: c.ArName,
    zones: (c.Zones ?? []).map((z) => ({ code: z.Code, name: z.EnName, nameAr: z.ArName })),
  }));
}

/** The zones a customer in this governorate can be in (one for most governorates; many for Cairo/Giza). */
export async function getMylerzZones(governorateEn: string): Promise<MylerzZone[]> {
  const code = mylerzCityCode(governorateEn);
  if (!code) return [];
  const city = (await getMylerzCities()).find((c) => c.code === code);
  return city?.zones ?? [];
}

/** Status text → our status. Mylerz doesn't publish a fixed list, so match on the words. */
export function mylerzStatus(status: string | undefined): StandardShipmentStatus {
  const s = (status ?? "").toLowerCase();
  if (/return/.test(s)) return "RETURNED";
  if (/cancel/.test(s)) return "CANCELED";
  if (/out for delivery|out_for_delivery|with courier/.test(s)) return "OUT_FOR_DELIVERY";
  if (/\bdelivered\b/.test(s)) return "DELIVERED";
  if (/fail|reject|refus|postpone|not delivered|unreachable/.test(s)) return "FAILED_DELIVERY";
  if (/picked|received|collected/.test(s)) return "PICKED_UP";
  if (/created|new|pending|confirmed|ready/.test(s) || s === "") return "CREATED";
  return "IN_TRANSIT";
}

export class MylerzProvider implements ShippingProvider {
  readonly name = "mylerz";
  private token: string | null = null;

  constructor(private config: MylerzConfig) {}

  private async accessToken(): Promise<string> {
    if (this.token) return this.token;
    const res = await fetch(`${BASE_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({ username: this.config.username, password: this.config.password, grant_type: "password" }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string };
    if (!data.access_token) {
      if (res.status === 400 || data.error === "invalid_grant") {
        throw new Error("اسم المستخدم أو الباسورد بتوع مايلرز غلط. راجعهم من صفحة شركات الشحن.");
      }
      throw new Error(`Mylerz API error: ${data.error_description ?? data.error ?? `HTTP ${res.status}`}`);
    }
    return (this.token = data.access_token);
  }

  private async call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `bearer ${await this.accessToken()}` },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await res.json().catch(() => ({}))) as Envelope<T>;
    const error = envelopeError(data, res.status);
    if (error) throw new Error(error);
    return data.Value as T;
  }

  private async warehouseName(): Promise<string> {
    if (this.config.warehouse?.trim()) return this.config.warehouse.trim();
    const warehouses = await this.call<{ Name: string }[]>("GET", "/api/orders/GetWarehouses");
    const first = warehouses?.[0]?.Name;
    if (!first) throw new Error("حساب مايلرز مفيهوش مخزن (Warehouse). ضيف واحد من لوحة مايلرز.");
    return first;
  }

  async createShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    const cityCode = mylerzCityCode(params.receiver.city);
    if (!cityCode) throw new Error(`المحافظة "${params.receiver.city}" مش موجودة عند مايلرز`);

    let zone = params.receiver.zone;
    if (!zone) {
      const zones = await getMylerzZones(params.receiver.city);
      if (zones.length !== 1) throw new Error("اختار المنطقة اللي العميل فيها عشان مايلرز تقدر تحسب الشحنة.");
      zone = zones[0].code;
    }

    const cod = Math.round(params.codAmountPiasters ?? 0) / 100;
    const r = params.receiver;
    const pkg = {
      WarehouseName: await this.warehouseName(),
      PickupDueDate: new Date().toISOString().slice(0, 19).replace("T", " "),
      Package_Serial: 1,
      Reference: `#${params.reference ?? params.orderId ?? ""}`,
      Description: params.parcel.description ?? "Goods",
      Service_Type: "DTD",
      Service: "ND",
      Service_Category: "DELIVERY",
      Payment_Type: cod > 0 ? "COD" : "PP",
      COD_Value: cod,
      Pieces: [{ PieceNo: 1, Weight: params.parcel.weightKg, Special_Notes: params.notes ?? "" }],
      Customer_Name: `${r.firstName} ${r.lastName ?? ""}`.trim(),
      Mobile_No: r.phone,
      Street: [r.street, r.district, r.buildingNumber, r.floor && `Floor ${r.floor}`, r.apartment && `Apt ${r.apartment}`].filter(Boolean).join(", "),
      Country: "Egypt",
      Neighborhood: zone,
      Address_Category: "H",
      Currency: "EGP",
    };

    const value = await this.call<{ Packages?: { BarCode?: string; Reference?: string }[] }>("POST", "/api/orders/addorders", [pkg]);
    const barcode = value?.Packages?.[0]?.BarCode;
    if (!barcode) throw new Error("Mylerz API error: no barcode in the response");

    return {
      providerShipmentId: barcode,
      trackingNumber: barcode,
      courierName: "Mylerz",
      rawResponse: value as unknown as Record<string, unknown>,
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    const rows = await this.call<{ BarCode?: string; Status?: string }[]>("POST", "/api/packages/GetPackageListStatus", [trackingNumber]);
    const row = rows?.find((p) => p.BarCode === trackingNumber) ?? rows?.[0];
    const status = mylerzStatus(row?.Status);
    return {
      trackingNumber,
      status,
      courierName: "Mylerz",
      // Mylerz returns only the current state with no time, so there's no history to show.
      events: [],
    };
  }

  async cancelShipment(providerShipmentId: string): Promise<void> {
    await this.call("POST", "/api/packages/CancelPackage", [{ Barcode: providerShipmentId }]);
  }

  async calculateRates(): Promise<RateResult[]> {
    // No public rates endpoint; prices are on the merchant's Mylerz contract.
    return [];
  }
}
