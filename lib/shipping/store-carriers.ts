// Server-only helpers for a store's connected carriers. Kept out of "use server"
// files on purpose: they take a storeId, so they must never be callable from the client.

import { prisma } from "@/lib/prisma";
import { decryptSecret, maskSecret } from "@/lib/secrets";
import { getCarrier, readCarrierSettings, type Carrier, type CarrierKey, type CarrierSettings } from "./carriers";
import { getShippingProvider } from "./factory";
import { governorateNameEn } from "@/constants/egypt-governorates";
import type { ShippingProvider } from "./types";

export type ConnectedCarrier = {
  provider: CarrierKey;
  isActive: boolean;
  /** Masked credential hint for API carriers ("••••a1b2"). */
  hint: string;
  settings: CarrierSettings;
  /** Credential keys already stored — the form may leave them blank to keep them. */
  storedFields: string[];
  updatedAt: Date;
};

export async function getStoreCarriers(storeId: string): Promise<ConnectedCarrier[]> {
  const integrations = await prisma.shippingIntegration.findMany({
    where: { storeId },
    select: { provider: true, isActive: true, credentials: true, settings: true, updatedAt: true },
    orderBy: { createdAt: "asc" },
  });

  return integrations.flatMap((i) => {
    const carrier = getCarrier(i.provider);
    if (!carrier) return [];
    let hint = "";
    let storedFields: string[] = [];
    if (i.credentials) {
      try {
        const creds = JSON.parse(decryptSecret(i.credentials)) as Record<string, string>;
        storedFields = Object.keys(creds).filter((k) => creds[k]);
        const hintField = carrier.credentialFields?.find((f) => f.hint);
        hint = hintField ? maskSecret(creds[hintField.key] ?? "") : "";
      } catch {
        hint = "••••";
      }
    }
    return [
      {
        provider: carrier.key,
        isActive: i.isActive,
        hint,
        settings: readCarrierSettings(i.settings),
        storedFields,
        updatedAt: i.updatedAt,
      },
    ];
  });
}

export type LoadedCarrier = {
  carrier: Carrier;
  settings: CarrierSettings;
  isActive: boolean;
  /** API adapter — null for manual carriers. */
  provider: ShippingProvider | null;
};

/** A store's connection to one carrier, with its API adapter when it has one. */
export async function loadStoreCarrier(storeId: string, carrierKey: string): Promise<LoadedCarrier | null> {
  const carrier = getCarrier(carrierKey);
  if (!carrier) return null;

  const integration = await prisma.shippingIntegration.findUnique({
    where: { storeId_provider: { storeId, provider: carrier.key } },
    select: { isActive: true, credentials: true, settings: true },
  });
  if (!integration) return null;

  const settings = readCarrierSettings(integration.settings);
  let provider: ShippingProvider | null = null;
  if (carrier.integration === "api") {
    if (!integration.credentials) throw new Error(`بيانات ربط ${carrier.nameAr} ناقصة — ادخلها تاني`);
    let credentials: Record<string, string>;
    try {
      credentials = JSON.parse(decryptSecret(integration.credentials));
    } catch {
      throw new Error(`بيانات ربط ${carrier.nameAr} المحفوظة مش صالحة — ادخلها تاني`);
    }
    provider = getShippingProvider(carrier.key, credentials, {
      pickupCity: governorateNameEn(settings.pickupGovernorate) ?? undefined,
    });
  }

  return { carrier, settings, isActive: integration.isActive, provider };
}
