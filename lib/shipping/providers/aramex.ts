/**
 * Aramex shipping provider adapter (Shipping Services API v2, JSON flavour of the
 * WCF service). Field names and codes follow the Aramex API manual as used by the
 * open-source SDKs: ProductGroup DOM/EXP, PaymentType P/C/3, Services "CODS".
 *
 * Gotchas this adapter handles:
 *  - Dates are WCF JSON dates — the string must arrive as `"\/Date(ms)\/"`, which
 *    JSON.stringify can't produce, so the body is patched after serialising.
 *  - Errors come per shipment (`Shipments[i].HasErrors` + `Notifications`), not
 *    only at the top level, and with HTTP 200.
 *  - Cash on delivery is the CODS *service* on a prepaid shipment. PaymentType "C"
 *    means the receiver pays the shipping fee, which is something else.
 */

import type {
  CreateShipmentParams,
  RateParams,
  RateResult,
  ShipmentResult,
  ShippingAddress,
  ShippingProvider,
  StandardShipmentStatus,
  TrackingResult,
} from "@/lib/shipping/types";

const BASE = "https://ws.aramex.net/ShippingAPI.V2";
const SHIP_URL = `${BASE}/Shipping/Service_1_0.svc/json`;
const TRACK_URL = `${BASE}/Tracking/Service_1_0.svc/json`;
const RATE_URL = `${BASE}/RateCalculator/Service_1_0.svc/json`;

/** Domestic parcels; international shipments use the express group. */
const DOMESTIC = { ProductGroup: "DOM", ProductType: "ONP" } as const;
const INTERNATIONAL = { ProductGroup: "EXP", ProductType: "PPX" } as const;

export interface AramexConfig {
  userName: string;
  password: string;
  accountNumber: string;
  accountPin: string;
  accountEntity: string;
  accountCountryCode: string;
  version: string;
}

type Notification = { Code?: string; Message?: string };

/** WCF JSON date placeholder; turned into `\/Date(ms)\/` when the body is serialised. */
const wcfDate = (d: Date) => `/Date(${d.getTime()})/`;

export function serializeAramexBody(body: unknown) {
  return JSON.stringify(body).replace(/"\/Date\((\d+)\)\/"/g, '"\\/Date($1)\\/"');
}

/** `/Date(1700000000000+0200)/` → Date (null when it isn't one). */
export function parseAramexDate(value: string | undefined | null): Date | null {
  const match = value?.match(/\/Date\((-?\d+)(?:[+-]\d{4})?\)\//);
  return match ? new Date(Number(match[1])) : null;
}

/**
 * Aramex update codes are account/region specific, so the description decides
 * the status; the few codes that are stable everywhere back it up.
 */
export function aramexStatus(code: string | undefined, description: string | undefined): StandardShipmentStatus {
  const d = (description ?? "").toLowerCase();
  if (code === "SH005" || code === "SH006" || code === "SH007" || /\bdelivered\b|collected by consignee/.test(d)) return "DELIVERED";
  if (/return(ed)? to shipper|returned|return to origin/.test(d)) return "RETURNED";
  if (/cancel/.test(d)) return "CANCELED";
  if (code === "SH003" || /out for delivery|with delivery courier/.test(d)) return "OUT_FOR_DELIVERY";
  if (/attempt|not delivered|refused|unable to deliver|consignee not available|address/.test(d)) return "FAILED_DELIVERY";
  if (code === "SH014" || /record created|shipment created|data received/.test(d)) return "CREATED";
  if (/picked up|collected from shipper|received at origin/.test(d)) return "PICKED_UP";
  return "IN_TRANSIT";
}

function partyContact(p: ShippingAddress, fallbackCompany: string) {
  const name = `${p.firstName} ${p.lastName ?? ""}`.trim();
  return {
    PersonName: name,
    CompanyName: p.company || name || fallbackCompany,
    PhoneNumber1: p.phone,
    CellPhone: p.phone,
    EmailAddress: p.email ?? "",
  };
}

function partyAddress(p: ShippingAddress) {
  return {
    Line1: p.street,
    Line2: [p.district, p.buildingNumber && `Building ${p.buildingNumber}`].filter(Boolean).join(", "),
    Line3: [p.floor && `Floor ${p.floor}`, p.apartment && `Apt ${p.apartment}`].filter(Boolean).join(", "),
    City: p.city,
    PostCode: p.postalCode ?? "",
    CountryCode: p.countryCode ?? "EG",
  };
}

export class AramexProvider implements ShippingProvider {
  readonly name = "aramex";

  constructor(private config: AramexConfig) {}

  private get clientInfo() {
    return {
      UserName: this.config.userName,
      Password: this.config.password,
      AccountNumber: this.config.accountNumber,
      AccountPin: this.config.accountPin,
      AccountEntity: this.config.accountEntity,
      AccountCountryCode: this.config.accountCountryCode,
      Version: this.config.version,
      Source: 24,
    };
  }

  private async post<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: serializeAramexBody(body),
      signal: AbortSignal.timeout(20_000),
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const notes: Notification[] = [
      ...((data.Notifications as Notification[] | undefined) ?? []),
      ...(((data.Shipments as { Notifications?: Notification[] }[] | undefined) ?? []).flatMap((s) => s.Notifications ?? [])),
    ];
    const shipmentFailed = ((data.Shipments as { HasErrors?: boolean }[] | undefined) ?? []).some((s) => s.HasErrors);

    if (!res.ok || data.HasErrors === true || shipmentFailed) {
      const msgs = notes.map((n) => [n.Code, n.Message].filter(Boolean).join(": ")).filter(Boolean);
      if (res.status === 401 || msgs.some((m) => /invalid (user ?name|password|account)|authentication/i.test(m))) {
        throw new Error("بيانات حساب أرامكس غلط (اسم المستخدم أو الباسورد أو رقم الحساب أو الـ PIN). راجعها من صفحة شركات الشحن.");
      }
      if (res.status >= 500 && msgs.length === 0) throw new Error("أرامكس فيها مشكلة من عندها دلوقتي. جرّب تاني بعد شوية.");
      throw new Error(`Aramex API error: ${msgs.join("; ") || `HTTP ${res.status}`}`);
    }

    return data as T;
  }

  async createShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    const sender = params.sender;
    if (!sender?.street) throw new Error("أرامكس محتاجة عنوان الاستلام بتاعك. اكتبه في إعدادات أرامكس من صفحة شركات الشحن.");
    if (!sender.phone) throw new Error("أرامكس محتاجة رقم موبايل للمتجر. ضيفه في إعدادات المتجر.");

    const cod = (params.codAmountPiasters ?? 0) / 100;
    const domestic = (params.receiver.countryCode ?? "EG") === (sender.countryCode ?? "EG");
    const now = new Date();

    const body = {
      ClientInfo: this.clientInfo,
      LabelInfo: { ReportID: 9201, ReportType: "URL" },
      Shipments: [
        {
          Reference1: params.reference ?? params.orderId ?? "",
          Shipper: {
            Reference1: params.reference ?? "",
            AccountNumber: this.config.accountNumber,
            PartyAddress: partyAddress(sender),
            Contact: partyContact(sender, "Store"),
          },
          Consignee: {
            Reference1: params.reference ?? "",
            PartyAddress: partyAddress(params.receiver),
            Contact: partyContact(params.receiver, "Customer"),
          },
          ShippingDateTime: wcfDate(now),
          DueDate: wcfDate(new Date(now.getTime() + 2 * 86_400_000)),
          Comments: params.notes ?? "",
          PickupLocation: "Reception",
          TransportType: 0,
          Details: {
            Dimensions: {
              Length: params.parcel.lengthCm ?? 10,
              Width: params.parcel.widthCm ?? 10,
              Height: params.parcel.heightCm ?? 10,
              Unit: "CM",
            },
            ActualWeight: { Value: params.parcel.weightKg, Unit: "KG" },
            ...(domestic ? DOMESTIC : INTERNATIONAL),
            PaymentType: "P",
            PaymentOptions: "",
            Services: cod > 0 ? "CODS" : "",
            NumberOfPieces: 1,
            DescriptionOfGoods: (params.parcel.description ?? "Goods").slice(0, 100),
            GoodsOriginCountry: "EG",
            ...(cod > 0 && { CashOnDeliveryAmount: { CurrencyCode: "EGP", Value: cod } }),
          },
        },
      ],
    };

    const data = await this.post<{
      Shipments?: Array<{ ID: string; ShipmentLabel?: { LabelURL?: string } }>;
    }>(`${SHIP_URL}/CreateShipments`, body);

    const shipment = data.Shipments?.[0];
    if (!shipment?.ID) throw new Error("Aramex API error: no waybill number in the response");

    return {
      providerShipmentId: shipment.ID,
      trackingNumber: shipment.ID,
      courierName: "Aramex",
      labelUrl: shipment.ShipmentLabel?.LabelURL,
      rawResponse: data as unknown as Record<string, unknown>,
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    const data = await this.post<{
      TrackingResults?: Array<{
        Key?: string;
        Value?: Array<{ UpdateCode?: string; UpdateDescription?: string; UpdateDateTime?: string; UpdateLocation?: string }>;
      }>;
    }>(`${TRACK_URL}/TrackShipments`, {
      ClientInfo: this.clientInfo,
      Shipments: [trackingNumber],
      GetLastTrackingUpdateOnly: false,
    });

    const updates = (data.TrackingResults?.find((r) => r.Key === trackingNumber) ?? data.TrackingResults?.[0])?.Value ?? [];
    // Order isn't guaranteed — sort oldest → newest by the update time.
    const events = updates
      .map((u) => ({
        timestamp: parseAramexDate(u.UpdateDateTime) ?? new Date(0),
        status: aramexStatus(u.UpdateCode, u.UpdateDescription),
        description: u.UpdateDescription ?? u.UpdateCode ?? "",
        location: u.UpdateLocation || undefined,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      trackingNumber,
      status: events.at(-1)?.status ?? "CREATED",
      courierName: "Aramex",
      events,
    };
  }

  async cancelShipment(providerShipmentId: string): Promise<void> {
    // The Shipping API has no cancel call; Aramex cancels from their portal.
    throw new Error(`أرامكس مش بتسمح بإلغاء البوليصة ${providerShipmentId} من الـ API. الغيها من بوابة أرامكس.`);
  }

  async calculateRates(params: RateParams): Promise<RateResult[]> {
    const cod = (params.codAmountPiasters ?? 0) > 0;
    const data = await this.post<{
      TotalAmount?: { CurrencyCode: string; Value: number };
    }>(`${RATE_URL}/CalculateRate`, {
      ClientInfo: this.clientInfo,
      OriginAddress: { CountryCode: "EG", City: params.originCity },
      DestinationAddress: { CountryCode: "EG", City: params.destinationCity },
      ShipmentDetails: {
        ActualWeight: { Value: params.parcel.weightKg, Unit: "KG" },
        ChargeableWeight: { Value: params.parcel.weightKg, Unit: "KG" },
        ...DOMESTIC,
        PaymentType: "P",
        Services: cod ? "CODS" : "",
        NumberOfPieces: 1,
      },
    });

    if (!data.TotalAmount) return [];
    return [
      {
        serviceLevel: "Aramex Domestic",
        costPiasters: Math.round(Number(data.TotalAmount.Value) * 100),
        estimatedDays: 2,
        currency: data.TotalAmount.CurrencyCode,
      },
    ];
  }
}
