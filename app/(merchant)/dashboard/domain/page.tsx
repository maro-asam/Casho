import type { Metadata } from "next";
import { Globe2, Search, ShieldCheck, Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import { EmptyState, PageHeader } from "@/components/saas-page";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { DNS_TARGETS } from "@/lib/custom-domain/dns";
import { domainVerificationToken } from "@/lib/custom-domain/ownership";
import { FEATURE_KEYS } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
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

const BENEFITS = [
  { icon: ShieldCheck, get title() { return tr("ثقة أكتر"); }, get body() { return tr("mystore.com بيطمّن العميل أكتر من رابط فرعي."); } },
  { icon: Search, get title() { return tr("أحسن في جوجل"); }, get body() { return tr("الدومين بيبقى العنوان الرسمي لمتجرك في نتايج البحث."); } },
  { icon: Globe2, get title() { return tr("SSL مجاني"); }, get body() { return tr("بنجهّز شهادة الأمان (القفل) لوحدنا من غير أي تكلفة."); } },
];

export default async function DomainRoute() {
  await loadDashboardLocale();
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true, customDomain: true, customDomainStatus: true, customDomainConnectedAt: true },
  });

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title={tr("لسه معندكش متجر")}
        description={tr("أنشئ متجرك الأول وبعدها اربط الدومين بتاعك.")}
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  const storeUrl = buildStoreUrl(store.slug);

  return (
    <div className="space-y-6" dir={tdir()}>
      <PageHeader title={tr("الدومين الخاص")} description={tr("خلّي متجرك على اسمك — mystore.com بدل رابط كاشو.")} />

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
          <div className="space-y-4">
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold">{tr("اربط دومينك")}</h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                {tr("متجرك دلوقتي على")}{" "}
                <span className="font-mono text-foreground" dir="ltr">
                  {storeUrl.replace(/^https?:\/\//, "")}
                </span>
                {tr(". اكتب الدومين وهنقولك بالظبط تعمل إيه.")}
              </p>
              <ConnectDomainForm />
            </section>

            <div className="grid gap-3 sm:grid-cols-3">
              {BENEFITS.map((b) => (
                <div key={b.title} className="rounded-xl border border-border bg-card p-4">
                  <b.icon className="size-5 text-primary" />
                  <p className="mt-2 text-sm font-semibold">{b.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{b.body}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              {tr("معندكش دومين؟ تقدر تشتري واحد من Namecheap أو GoDaddy أو Hostinger (حوالي ١٠ دولار في السنة)، أو ‎.com.eg من الجهات المصرية المعتمدة — وبعدها ارجع هنا.")}
            </p>
          </div>
        )}
      </FeatureGate>
    </div>
  );
}
