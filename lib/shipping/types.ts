// ─── Unified address model ─────────────────────────────────────────────────

export interface ShippingAddress {
  firstName: string;
  lastName?: string;
  phone: string;
  city: string;
  district?: string;
  street: string;
  buildingNumber?: string;
  floor?: string;
  apartment?: string;
  postalCode?: string;
  countryCode?: string; // ISO 3166-1 alpha-2, defaults to "EG"
}

// ─── Unified parcel / dimensions ──────────────────────────────────────────

export interface Parcel {
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  description?: string;
}

// ─── Create shipment ──────────────────────────────────────────────────────

export interface CreateShipmentParams {
  orderId?: string;
  reference?: string;
  sender?: ShippingAddress;          // optional — defaults to store address
  receiver: ShippingAddress;
  parcel: Parcel;
  codAmountPiasters?: number;        // cash-on-delivery amount in piasters (0 = prepaid)
  notes?: string;
}

export interface ShipmentResult {
  providerShipmentId: string;
  trackingNumber: string;
  courierName: string;
  costPiasters?: number;
  estimatedDelivery?: Date;
  labelUrl?: string;
  rawResponse: Record<string, unknown>;
}

// ─── Track shipment ───────────────────────────────────────────────────────

export type StandardShipmentStatus =
  | "CREATED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED_DELIVERY"
  | "RETURNED"
  | "CANCELED";

export interface TrackingEvent {
  timestamp: Date;
  status: StandardShipmentStatus;
  description: string;
  location?: string;
}

export interface TrackingResult {
  trackingNumber: string;
  status: StandardShipmentStatus;
  courierName: string;
  estimatedDelivery?: Date;
  events: TrackingEvent[];
}

// ─── Rate calculation ─────────────────────────────────────────────────────

export interface RateParams {
  originCity: string;
  destinationCity: string;
  parcel: Parcel;
  codAmountPiasters?: number;
}

export interface RateResult {
  serviceLevel: string;
  costPiasters: number;
  estimatedDays: number;
  currency: string;
}

// ─── Provider interface ───────────────────────────────────────────────────

export interface ShippingProvider {
  readonly name: string;
  createShipment(params: CreateShipmentParams): Promise<ShipmentResult>;
  trackShipment(trackingNumber: string): Promise<TrackingResult>;
  cancelShipment(providerShipmentId: string): Promise<void>;
  calculateRates(params: RateParams): Promise<RateResult[]>;
}
