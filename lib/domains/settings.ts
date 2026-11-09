import { prisma } from "@/lib/prisma";
import type { DomainPricing } from "./pricing";
import { parseRegistrant, type Registrant } from "./registrant";
import { registrarConfigured } from "./registrar";

export type DomainSettingsView = DomainPricing & {
  enabled: boolean;
  registrant: Registrant | null;
};

const DEFAULTS: DomainSettingsView = { enabled: false, usdRate: 5000, markupBps: 2000, registrant: null };

/** Domain sales switch + pricing (singleton row; defaults until an admin saves them). */
export async function getDomainSettings(): Promise<DomainSettingsView> {
  const row = await prisma.domainSettings.findUnique({
    where: { id: "default" },
    select: { enabled: true, usdRate: true, markupBps: true, registrant: true },
  });
  if (!row) return DEFAULTS;
  return { ...row, registrant: parseRegistrant(row.registrant) };
}

/** Merchants can buy only when an admin switched it on, the contact is set and Vercel is configured. */
export function domainSalesOpen(settings: DomainSettingsView) {
  return settings.enabled && Boolean(settings.registrant) && registrarConfigured;
}
