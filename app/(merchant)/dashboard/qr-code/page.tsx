import type { Metadata } from "next";
import { Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { LargeTitle, Unavailable } from "@/components/saas-page";
import { resolveStoreTheme } from "@/constants/store-themes";
import { couponStatusWhere, formatCouponValue } from "@/lib/coupons/coupon-status";
import { prisma } from "@/lib/prisma";
import { storeBaseUrl } from "@/lib/seo/store-seo";
import type { ThemeCustomization } from "@/types/store-theme.types";
import { QrStudio } from "./_components/qr-studio";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export const metadata: Metadata = {
  title: "QR Code",
};

export default async function QrCodeRoute() {
  await loadDashboardLocale();
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      customDomain: true,
      customDomainStatus: true,
      settings: { select: { logo: true, whatsappNumber: true, themeId: true, themeConfig: true, primaryColor: true, secondaryColor: true } },
    },
  });

  if (!store) {
    return (
      <div className="apple-card">
        <Unavailable icon={Store} title={tr("لسه معندكش متجر")} description={tr("أنشئ متجرك الأول وبعدها اعمل QR يوصّل العملاء ليه.")} />
      </div>
    );
  }

  const now = new Date();
  const [products, categories, coupons] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: store.id, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 300,
      select: { slug: true, name: true },
    }),
    prisma.category.findMany({
      where: { storeId: store.id, products: { some: { isActive: true } } },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.coupon.findMany({
      where: { AND: [{ storeId: store.id }, couponStatusWhere("active", now, prisma.coupon.fields.usageLimit)] },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { code: true, type: true, value: true },
    }),
  ]);

  const settings = store.settings;
  const theme = resolveStoreTheme(
    (settings?.themeConfig as ThemeCustomization | null)?.presetId ?? settings?.themeId,
    settings?.themeConfig as ThemeCustomization | null,
    settings?.primaryColor,
    settings?.secondaryColor,
  );

  return (
    <div className="space-y-6" dir={tdir()}>
      <LargeTitle
        title="QR Code"
        subtitle={tr("اطبعه على الكياس والكروت والمنيو — العميل يمسحه ويوصل للمتجر أو منتج أو عرض على طول.")}
      />
      <QrStudio
        storeName={store.name}
        baseUrl={storeBaseUrl(store)}
        logo={settings?.logo ?? null}
        brandColor={theme.tokens.primary}
        whatsapp={settings?.whatsappNumber ?? null}
        products={products}
        categories={categories}
        coupons={coupons.map((c) => ({ code: c.code, label: formatCouponValue(c.type, c.value) }))}
      />
    </div>
  );
}
