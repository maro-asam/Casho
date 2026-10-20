import type { Metadata } from "next";
import { Lock, Search, ShieldCheck, Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import { LargeTitle, Unavailable } from "@/components/saas-page";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { DNS_TARGETS } from "@/lib/custom-domain/dns";
import { domainVerificationToken } from "@/lib/custom-domain/ownership";
import { FEATURE_KEYS } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { IconTile } from "../settings/_components/settings-ui";
import { ConnectDomainForm } from "./_components/connect-domain-form";
import { DomainStatus } from "./_components/domain-status";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
    title: tr("الدومين الخاص"),
  };
}

function benefits() {
  return [
    { icon: ShieldCheck, tint: "bg-primary", title: tr("ثقة أكتر"), body: tr("mystore.com بيطمّن العميل أكتر من رابط فرعي.") },
    { icon: Search, tint: "bg-(--sys-orange)", title: tr("أحسن في جوجل"), body: tr("الدومين بيبقى العنوان الرسمي لمتجرك في نتايج البحث.") },
    { icon: Lock, tint: "bg-(--sys-green)", title: tr("SSL مجاني"), body: tr("بنجهّز شهادة الأمان (القفل) لوحدنا من غير أي تكلفة.") },
  ];
}

export default async function DomainRoute() {
  await loadDashboardLocale();
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true, customDomain: true, customDomainStatus: true, customDomainConnectedAt: true },
  });

  if (!store) {
    return (
      <div className="apple-card">
        <Unavailable icon={Store} title={tr("لسه معندكش متجر")} description={tr("أنشئ متجرك الأول وبعدها اربط الدومين بتاعك.")} />
      </div>
    );
  }

  const storeUrl = buildStoreUrl(store.slug);

  return (
    <div className="space-y-8" dir={tdir()}>
      <LargeTitle
        eyebrow={<p className="text-[13px] font-semibold text-muted-foreground">{tr("المتجر")}</p>}
        title={tr("الدومين الخاص")}
        subtitle={tr("خلّي متجرك على اسمك — mystore.com بدل رابط كاشو.")}
      />

      <FeatureGate
        storeId={store.id}
        feature={FEATURE_KEYS.CUSTOM_DOMAIN}
        title={tr("الدومين الخاص")}
        description={tr("ربط دومين خاص مش متاح في باقتك الحالية.")}
      >
        {store.customDomain ? (
          <DomainStatus
            key={store.customDomain}
            domain={store.customDomain}
            initialStatus={store.customDomainStatus as "PENDING" | "ACTIVE" | "FAILED"}
            connectedAt={store.customDomainConnectedAt?.toISOString() ?? null}
            storeUrl={storeUrl}
            targets={DNS_TARGETS}
            verifyToken={domainVerificationToken(store.id)}
          />
        ) : (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <ConnectDomainForm currentHost={storeUrl.replace(/^https?:\/\//, "")} />
            <aside className="space-y-2">
              <h2 className="px-4 text-[13px] font-semibold text-muted-foreground">{tr("ليه دومين خاص؟")}</h2>
              <ul className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:58px]">
                {benefits().map((b) => (
                  <li key={b.title} className="flex items-start gap-3.5 px-4 py-3">
                    <IconTile icon={b.icon} tint={b.tint} />
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium">{b.title}</p>
                      <p className="mt-0.5 text-[13px] leading-[18px] text-muted-foreground">{b.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="px-4 pt-1 text-[13px] leading-[18px] text-muted-foreground">
                {tr("معندكش دومين؟ تقدر تشتري واحد من Namecheap أو GoDaddy أو Hostinger (حوالي ١٠ دولار في السنة)، أو ‎.com.eg من الجهات المصرية المعتمدة — وبعدها ارجع هنا.")}
              </p>
            </aside>
          </div>
        )}
      </FeatureGate>
    </div>
  );
}
