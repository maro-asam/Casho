import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/in-app";
import { checkDomainDns, type DnsCheck } from "./dns";
import { addProjectDomain, getProjectDomainStatus, vercelConfigured } from "./vercel";

export type DomainCheckReport = {
  status: "PENDING" | "ACTIVE" | "FAILED";
  dns: DnsCheck;
  /** null when Vercel isn't configured (DNS alone decides). */
  hosting: { onProject: boolean; verified: boolean; configured: boolean | null } | null;
  checkedAt: string;
};

/**
 * Re-checks one store's domain and persists the result:
 * PENDING → ACTIVE once DNS (and Vercel, when configured) are right;
 * ACTIVE → FAILED if it later breaks (the merchant gets notified).
 */
export async function runDomainCheck(store: {
  id: string;
  slug: string;
  customDomain: string;
  customDomainStatus: string;
}): Promise<DomainCheckReport> {
  const domain = store.customDomain;
  const dns = await checkDomainDns(domain);

  let hosting: DomainCheckReport["hosting"] = null;
  if (vercelConfigured) {
    hosting = await getProjectDomainStatus(domain);
    if (!hosting.onProject) {
      await addProjectDomain(domain);
      hosting = await getProjectDomainStatus(domain);
    }
  }

  const live = dns.ok && (!hosting || (hosting.onProject && hosting.verified && hosting.configured !== false));
  const wasActive = store.customDomainStatus === "ACTIVE";
  const status: DomainCheckReport["status"] = live ? "ACTIVE" : wasActive ? "FAILED" : store.customDomainStatus === "FAILED" ? "FAILED" : "PENDING";

  if (status !== store.customDomainStatus) {
    await prisma.store.update({
      where: { id: store.id },
      data: { customDomainStatus: status, ...(status === "ACTIVE" && { customDomainConnectedAt: new Date() }) },
    });
    revalidatePath("/dashboard/domain");
    revalidatePath(`/store/${store.slug}`, "layout");

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

  return { status, dns, hosting, checkedAt: new Date().toISOString() };
}
