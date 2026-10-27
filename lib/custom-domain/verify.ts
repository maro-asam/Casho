import { revalidatePath } from "next/cache";
import { revalidateStorefront } from "@/lib/store/storefront-cache";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/in-app";
import { checkDomainDns, type DnsCheck } from "./dns";
import { checkDomainOwnership } from "./ownership";
import { addProjectDomain, getProjectDomainStatus, vercelConfigured } from "./vercel";

export type DomainCheckReport = {
  status: "PENDING" | "ACTIVE" | "FAILED";
  dns: DnsCheck;
  /** The store's TXT ownership record is published (see ./ownership). */
  ownership: boolean;
  /** null when Vercel isn't configured (DNS alone decides). */
  hosting: { onProject: boolean; verified: boolean; configured: boolean | null } | null;
  checkedAt: string;
};

/**
 * Re-checks one store's domain and persists the result:
 * PENDING → ACTIVE once DNS (and Vercel, when configured) are right AND the
 * store proved ownership with its TXT record; ACTIVE → FAILED if it later
 * breaks (the merchant gets notified). A domain this store already activated
 * once (customDomainConnectedAt) keeps working without the TXT record, so
 * domains connected before ownership checks existed don't break.
 */
export async function runDomainCheck(store: {
  id: string;
  slug: string;
  customDomain: string;
  customDomainStatus: string;
  customDomainConnectedAt?: Date | null;
}): Promise<DomainCheckReport> {
  const domain = store.customDomain;
  const [dns, ownership] = await Promise.all([checkDomainDns(domain), checkDomainOwnership(domain, store.id)]);
  const provenBefore = Boolean(store.customDomainConnectedAt);

  let hosting: DomainCheckReport["hosting"] = null;
  if (vercelConfigured) {
    hosting = await getProjectDomainStatus(domain);
    if (!hosting.onProject) {
      await addProjectDomain(domain);
      hosting = await getProjectDomainStatus(domain);
    }
  }

  const live =
    dns.ok &&
    (ownership || provenBefore) &&
    (!hosting || (hosting.onProject && hosting.verified && hosting.configured !== false));
  const wasActive = store.customDomainStatus === "ACTIVE";
  const status: DomainCheckReport["status"] = live ? "ACTIVE" : wasActive ? "FAILED" : store.customDomainStatus === "FAILED" ? "FAILED" : "PENDING";

  if (status !== store.customDomainStatus) {
    await prisma.store.update({
      where: { id: store.id },
      data: { customDomainStatus: status, ...(status === "ACTIVE" && { customDomainConnectedAt: new Date() }) },
    });
    revalidatePath("/dashboard/domain");
    revalidateStorefront(store.slug);

    if (status === "ACTIVE") {
      await createNotification({
        storeId: store.id,
        type: "SYSTEM",
        title: "دومينك شغّال 🎉",
        message: `متجرك بقى متاح على ${domain}`,
        href: "/domain",
      });
    } else if (wasActive) {
      await createNotification({
        storeId: store.id,
        type: "SYSTEM",
        title: "في مشكلة في الدومين",
        message: `${domain} مبقاش بيشاور على متجرك. راجع إعدادات الـ DNS.`,
        href: "/domain",
      });
    }
  }

  return { status, dns, ownership, hosting, checkedAt: new Date().toISOString() };
}
