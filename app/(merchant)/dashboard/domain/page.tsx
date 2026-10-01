import type { Metadata } from "next";
import { Globe2, Search, ShieldCheck, Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import { EmptyState, PageHeader } from "@/components/saas-page";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { DNS_TARGETS } from "@/lib/custom-domain/dns";
import { FEATURE_KEYS } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { ConnectDomainForm } from "./_components/connect-domain-form";
import { DomainStatus } from "./_components/domain-status";

export const metadata: Metadata = {
  title: "الدومين الخاص",
};

const BENEFITS = [
  { icon: ShieldCheck, title: "ثقة أكتر", body: "mystore.com بيطمّن العميل أكتر من رابط فرعي." },
  { icon: Search, title: "أحسن في جوجل", body: "الدومين بيبقى العنوان الرسمي لمتجرك في نتايج البحث." },
  { icon: Globe2, title: "SSL مجاني", body: "بنجهّز شهادة الأمان (القفل) لوحدنا من غير أي تكلفة." },
];

export default async function DomainRoute() {
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, slug: true, customDomain: true, customDomainStatus: true, customDomainConnectedAt: true },
  });

  if (!store) {
    return (
      <EmptyState
        icon={Store}
        title="لسه معندكش متجر"
        description="أنشئ متجرك الأول وبعدها اربط الدومين بتاعك."
        className="rounded-xl border border-dashed border-border"
      />
    );
  }

  const storeUrl = buildStoreUrl(store.slug);

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="الدومين الخاص" description="خلّي متجرك على اسمك — mystore.com بدل رابط كاشو." />

      <FeatureGate
        storeId={store.id}
        feature={FEATURE_KEYS.CUSTOM_DOMAIN}
        title="الدومين الخاص"
        description="ربط دومين خاص مش متاح في باقتك الحالية."
      >
        {store.customDomain ? (
          <DomainStatus
            key={store.customDomain}
            domain={store.customDomain}
            initialStatus={store.customDomainStatus as "PENDING" | "ACTIVE" | "FAILED"}
            connectedAt={store.customDomainConnectedAt?.toISOString() ?? null}
            storeUrl={storeUrl}
            targets={DNS_TARGETS}
          />
        ) : (
          <div className="space-y-4">
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold">اربط دومينك</h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                متجرك دلوقتي على{" "}
                <span className="font-mono text-foreground" dir="ltr">
                  {storeUrl.replace(/^https?:\/\//, "")}
                </span>
                . اكتب الدومين وهنقولك بالظبط تعمل إيه.
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
              معندكش دومين؟ تقدر تشتري واحد من Namecheap أو GoDaddy أو Hostinger (حوالي ١٠ دولار في السنة)، أو ‎.com.eg من الجهات
              المصرية المعتمدة — وبعدها ارجع هنا.
            </p>
          </div>
        )}
      </FeatureGate>
    </div>
  );
}
