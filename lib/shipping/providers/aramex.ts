/**
 * Aramex shipping provider adapter.
 * Docs: https://www.aramex.com/developers/apis
 * Base URL: https://ws.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json
 *
 * NOTE: Aramex uses SOAP/JSON hybrid API. This adapter wraps the JSON endpoints.
 * Credentials required: ClientInfo (UserName, Password, AccountNumber, AccountPin, etc.)
 */

import type {
  ShippingProvider,
  CreateShipmentParams,
  ShipmentResult,
  TrackingResult,
  RateParams,
  RateResult,
  StandardShipmentStatus,
} from "@/lib/shipping/types";

const SHIP_URL = "https://ws.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json";
const TRACK_URL = "https://ws.aramex.net/ShippingAPI.V2/Tracking/Service_1_0.svc/json";

const ARAMEX_STATUS_MAP: Record<string, StandardShipmentStatus> = {
  "PN": "CREATED",
  "PP": "PICKED_UP",
  "IT": "IN_TRANSIT",
  "OD": "OUT_FOR_DELIVERY",
  "DL": "DELIVERED",
  "ND": "FAILED_DELIVERY",
  "RR": "RETURNED",
  "CX": "CANCELED",
};

export interface AramexConfig {
  userName: string;
  password: string;
  accountNumber: string;
  accountPin: string;
  accountEntity: string;
  accountCountryCode: string;
  version: string;
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    const data = (await res.json()) as Record<string, unknown>;
    const hasErrors =
      (data.HasErrors as boolean) ||
      (Array.isArray(data.Notifications) &&
        (data.Notifications as Array<{ Code: string }>).some((n) => n.Code !== "000"));

    if (!res.ok || hasErrors) {
      const msgs = (data.Notifications as Array<{ Message: string }> | undefined)
        ?.map((n) => n.Message)
        .join("; ");
      throw new Error(`Aramex API error: ${msgs ?? "Unknown error"}`);
    }

    return data as T;
  }

  async createShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    const hasCOD = (params.codAmountPiasters ?? 0) > 0;
    const codAmount = hasCOD ? (params.codAmountPiasters! / 100).toFixed(2) : "0.00";

    const body = {
      ClientInfo: this.clientInfo,
      Shipments: [
        {
          Reference1: params.reference ?? params.orderId ?? "",
          Shipper: {
            Reference1: params.reference ?? "",
            AccountNumber: this.config.accountNumber,
            PartyAddress: {
              CountryCode: params.sender?.countryCode ?? "EG",
              City: params.sender?.city ?? "Cairo",
              Line1: params.sender?.street ?? "",
            },
            Contact: {
              PersonName: `${params.sender?.firstName ?? "Store"} ${params.sender?.lastName ?? ""}`.trim(),
              PhoneNumber1: params.sender?.phone ?? "",
            },
          },
          Consignee: {
            Reference1: params.reference ?? "",
            PartyAddress: {
              CountryCode: params.receiver.countryCode ?? "EG",
              City: params.receiver.city,
              Line1: params.receiver.street,
              Line2: [params.receiver.district, params.receiver.buildingNumber]
                .filter(Boolean)
                .join(", "),
            },
            Contact: {
              PersonName: `${params.receiver.firstName} ${params.receiver.lastName ?? ""}`.trim(),
              PhoneNumber1: params.receiver.phone,
            },
          },
          Details: {
            Dimensions: {
              Length: params.parcel.lengthCm ?? 10,
              Width: params.parcel.widthCm ?? 10,
              Height: params.parcel.heightCm ?? 10,
              Unit: "CM",
            },
            ActualWeight: { Value: params.parcel.weightKg, Unit: "KG" },
            ProductType: "PDX",
            PayType: hasCOD ? "C" : "P",
            NumberOfPieces: 1,
            DescriptionOfGoods: params.parcel.description ?? "Goods",
            GoodsOriginCountry: "EG",
            CashOnDeliveryAmount: { CurrencyCode: "EGP", Value: codAmount },
            CollectAmount: { CurrencyCode: "EGP", Value: codAmount },
          },
        },
      ],
      LabelInfo: { ReportID: 9201, ReportType: "URL" },
    };

    const data = await this.post<{
      Shipments: Array<{
        ID: string;
        Reference1: string;
        ShipmentLabel: { LabelURL: string };
      }>;
      ProcessedShipment: {
        ID: string;
        ForeignHAWB: string;
        ShipmentLabel: { LabelURL: string };
      };
    }>(`${SHIP_URL}/CreateShipments`, body);

    const shipment = data.Shipments?.[0] ?? data.ProcessedShipment;

    return {
      providerShipmentId: shipment.ID,
      trackingNumber: shipment.ID,
      courierName: "Aramex",
      labelUrl: shipment.ShipmentLabel?.LabelURL,
      rawResponse: data as unknown as Record<string, unknown>,
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    const body = {
      ClientInfo: this.clientInfo,
      Shipments: [trackingNumber],
    };

    const data = await this.post<{
      TrackingResults: Array<{
        Value: Array<{
          WaybillNumber: string;
          UpdateCode: string;
          UpdateDescription: string;
          UpdateDateTime: string;
          UpdateLocation: string;
        }>;
      }>;
    }>(`${TRACK_URL}/TrackShipments`, body);

    const results = data.TrackingResults?.[0]?.Value ?? [];
    const latest = results[results.length - 1];
    const status = ARAMEX_STATUS_MAP[latest?.UpdateCode ?? ""] ?? "IN_TRANSIT";

    return {
      trackingNumber,
      status,
      courierName: "Aramex",
      events: results.map((r) => ({
        timestamp: new Date(r.UpdateDateTime),
        status: ARAMEX_STATUS_MAP[r.UpdateCode] ?? "IN_TRANSIT",
        description: r.UpdateDescription,
        location: r.UpdateLocation,
      })),
    };
  }

  async cancelShipment(providerShipmentId: string): Promise<void> {
    // Aramex doesn't have a direct cancel API — requires manual cancellation via dashboard
    // or creating a return shipment
    throw new Error(
      `Aramex does not support programmatic cancellation for ${providerShipmentId}. Cancel via the Aramex dashboard.`,
    );
  }

  async calculateRates(params: RateParams): Promise<RateResult[]> {
    const body = {
      ClientInfo: this.clientInfo,
      OriginAddress: {
        CountryCode: "EG",
        City: params.originCity,
      },
      DestinationAddress: {
        CountryCode: "EG",
        City: params.destinationCity,
      },
      ShipmentDetails: {
        ActualWeight: { Value: params.parcel.weightKg, Unit: "KG" },
        ProductType: "PDX",
        NumberOfPieces: 1,
        PayType: (params.codAmountPiasters ?? 0) > 0 ? "C" : "P",
      },
    };

    const data = await this.post<{
      RateCalculatorResponse: {
        TotalAmount: { CurrencyCode: string; Value: string };
        DeliveryDays: number;
      };
    }>(`${SHIP_URL}/CalculateRate`, body);

    const r = data.RateCalculatorResponse;
    return [
      {
        serviceLevel: "Aramex Standard",
        costPiasters: Math.round(parseFloat(r.TotalAmount.Value) * 100),
        estimatedDays: r.DeliveryDays,
        currency: r.TotalAmount.CurrencyCode,
      },
    ];
  }
}
