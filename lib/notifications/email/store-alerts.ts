// Stock alerts to the store owner. A product that keeps selling below its
// threshold would otherwise email on every sale, so each product gets at most
// one "low" and one "out of stock" email a day (EmailLog dedupes).

import { isMailConfigured } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { storeBaseUrl } from "@/lib/seo/store-seo";
import { dashboardUrl, deliver, inBackground, sentWithin } from "./deliver";
import { infoRows, renderEmail, type EmailBrand } from "./layout";

export type LowStockItem = { id: string; name: string; stock: number; branchName?: string | null };

const nf = new Intl.NumberFormat("ar-EG");

export function buildLowStockEmail(brand: EmailBrand, item: LowStockItem, productUrl: string) {
  const out = item.stock <= 0;
  const where = item.branchName ? ` في فرع ${item.branchName}` : "";
  const heading = out ? `"${item.name}" خلص` : `"${item.name}" قرب يخلص`;
  const intro = out
    ? `المنتج خلص من المخزون${where}، وبقى يظهر للعملاء "نفد المخزون". زوّد الكمية علشان ترجع تبيعه.`
    : `فاضل منه ${nf.format(item.stock)} ${item.stock === 1 ? "قطعة" : "قطع"} بس${where}. زوّد المخزون قبل ما يخلص.`;

  const html = renderEmail({
    brand: { ...brand, url: productUrl },
    preheader: intro,
    heading,
    intro,
    body: infoRows([
      { label: "المنتج", value: item.name },
      { label: "المتبقي", value: nf.format(Math.max(item.stock, 0)) },
      { label: "الفرع", value: item.branchName },
    ]),
    cta: { label: "عدّل المخزون", href: productUrl },
    footer: "بيوصلك تنبيه واحد بالكتير لكل منتج في اليوم. تقدر تقفل تنبيهات المتجر من إعدادات المتجر ← إيميلات الطلبات.",
  });
  const text = `${heading}\n${intro}\n${productUrl}`;
  return { subject: out ? `${item.name} خلص من المخزون` : `${item.name} قرب يخلص — فاضل ${nf.format(item.stock)}`, html, text };
}

/** Called after a sale (online or POS) leaves products at or under their threshold. */
export function queueLowStockEmails(storeId: string, items: LowStockItem[]) {
  if (items.length === 0) return;
  inBackground(async () => {
    if (!isMailConfigured()) return;
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        name: true,
        slug: true,
        customDomain: true,
        customDomainStatus: true,
        user: { select: { email: true } },
        settings: { select: { logo: true, primaryColor: true, emailStoreAlerts: true } },
      },
    });
    if (!store || store.settings?.emailStoreAlerts === false) return;

    const brand: EmailBrand = {
      name: store.name,
      logo: store.settings?.logo ?? null,
      accent: store.settings?.primaryColor ?? null,
      url: storeBaseUrl(store),
    };

    for (const item of items) {
      const kind = item.stock <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK";
      if (await sentWithin(kind, item.id, 24)) continue;
      const productUrl = dashboardUrl(`/products/${item.id}/edit`);
      await deliver({ ...buildLowStockEmail(brand, item, productUrl), to: store.user.email }, { kind, storeId, refId: item.id });
    }
  });
}
