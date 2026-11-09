import { lazyIntl } from "@/lib/i18n/dashboard";

// Domain prices are whole multiples of 5 EGP (see ./pricing), so no decimals.
const egp = lazyIntl.number({ style: "currency", currency: "EGP", minimumFractionDigits: 0, maximumFractionDigits: 0 });

/** Piasters → "١٨٥ ج.م.‏" */
export const formatDomainPrice = (piasters: number) => egp.format(piasters / 100);
