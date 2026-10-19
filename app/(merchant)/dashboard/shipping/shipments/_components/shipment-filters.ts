import type { Prisma, ShipmentStatus } from "@prisma/client";
import { readParam, type SearchParamsRecord } from "@/components/saas-page";
import { isCarrierKey, type CarrierKey } from "@/lib/shipping/carriers";
import { tr } from "@/lib/i18n/dashboard";

/** Tabs group the carrier lifecycle into what the merchant acts on. */
export const SHIPMENT_TABS = [
  { value: "ready", get label() { return tr("مستنية الاستلام"); }, statuses: ["CREATED"] },
  { value: "transit", get label() { return tr("في الطريق"); }, statuses: ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] },
  { value: "failed", get label() { return tr("محاولة فاشلة"); }, statuses: ["FAILED_DELIVERY"] },
  { value: "delivered", get label() { return tr("اتسلّمت"); }, statuses: ["DELIVERED"] },
  { value: "returned", get label() { return tr("مرتجعة"); }, statuses: ["RETURNED"] },
  { value: "canceled", get label() { return tr("ملغية"); }, statuses: ["CANCELED"] },
] as const satisfies readonly { value: string; label: string; statuses: readonly ShipmentStatus[] }[];

export type ShipmentTab = (typeof SHIPMENT_TABS)[number]["value"];
export type CodFilter = "due" | "collected";

export type ShipmentFilters = { q?: string; tab?: ShipmentTab; carrier?: CarrierKey; cod?: CodFilter };

export function parseShipmentFilters(params: SearchParamsRecord | undefined): ShipmentFilters {
  const tab = readParam(params, "status");
  const carrier = readParam(params, "carrier");
  const cod = readParam(params, "cod");
  return {
    q: readParam(params, "q")?.trim() || undefined,
    tab: SHIPMENT_TABS.some((t) => t.value === tab) ? (tab as ShipmentTab) : undefined,
    carrier: isCarrierKey(carrier) ? carrier : undefined,
    cod: cod === "due" || cod === "collected" ? cod : undefined,
  };
}

export function buildShipmentWhere(
  storeId: string,
  f: ShipmentFilters,
  { withTab = true }: { withTab?: boolean } = {},
): Prisma.ShipmentWhereInput {
  const and: Prisma.ShipmentWhereInput[] = [{ storeId }];
  if (f.carrier) and.push({ provider: { in: [f.carrier, f.carrier.toLowerCase()] } });
  if (f.cod === "due") and.push({ status: "DELIVERED", codAmount: { gt: 0 }, codCollectedAt: null });
  if (f.cod === "collected") and.push({ codCollectedAt: { not: null } });
  if (f.q) {
    and.push({
      OR: [
        { trackingNumber: { contains: f.q, mode: "insensitive" } },
        { order: { fullName: { contains: f.q, mode: "insensitive" } } },
        { order: { phone: { contains: f.q } } },
      ],
    });
  }
  if (withTab && f.tab) {
    const statuses = SHIPMENT_TABS.find((t) => t.value === f.tab)!.statuses;
    and.push({ status: { in: [...statuses] } });
  }
  return { AND: and };
}
