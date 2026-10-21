import Link from "next/link";
import type { Metadata } from "next";
import { ChevronDown, KeyRound, Plus, Store } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { Card, LargeTitle, Row, Rows, Unavailable, appleButton } from "@/components/saas-page";
import { prisma } from "@/lib/prisma";
import { ApiKeysList } from "./_components/api-keys-list";
import { CopyButton } from "./_components/key-reveal";
import { MAX_ACTIVE_KEYS, apiBaseUrl } from "./_lib/api-base";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
    title: tr("مفاتيح API"),
  };
}

const nf = lazyIntl.number();

export default async function ApiKeysPage() {
  await loadDashboardLocale();
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) {
    return (
      <div className="apple-card">
        <Unavailable icon={Store} title={tr("لسه معندكش متجر")} description={tr("أنشئ متجرك الأول وبعدها اعمل مفاتيح API.")} />
      </div>
    );
  }

  const keys = await prisma.apiKey.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, keyHint: true, status: true, scopes: true, ipWhitelist: true, lastUsedAt: true, createdAt: true, revokedAt: true },
  });
  const active = keys.filter((k) => k.status === "ACTIVE");
  const revoked = keys.filter((k) => k.status !== "ACTIVE");
  const atLimit = active.length >= MAX_ACTIVE_KEYS;
  const baseUrl = apiBaseUrl();

  const newButton = atLimit ? (
    <span aria-disabled className={`${appleButton.filled} pointer-events-none opacity-50`}>
      <Plus className="size-4" />
      {tr("مفتاح جديد")}
    </span>
  ) : (
    <Link href="/api-keys/new" className={appleButton.filled}>
      <Plus className="size-4" />
      {tr("مفتاح جديد")}
    </Link>
  );

  return (
    <div className="space-y-6" dir={tdir()}>
      <LargeTitle
        title={tr("مفاتيح API")}
        subtitle={tr("وصّل متجرك بأنظمتك — ERP، محاسبة، شحن — من خلال API العام لكاشو.")}
        actions={keys.length > 0 && newButton}
      />

      {keys.length === 0 ? (
        <div className="apple-card">
          <Unavailable
            icon={KeyRound}
            title={tr("لسه معملتش مفاتيح")}
            description={tr("المفتاح بيخلّي نظام تاني يقرأ طلباتك ومنتجاتك أو يعمل طلبات وشحنات — بالصلاحيات اللي انت تحددها بس.")}
            action={
              <Link href="/api-keys/new" className={appleButton.filled}>
                <Plus className="size-4" />
                {tr("اعمل أول مفتاح")}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card
              title={tr("المفاتيح الشغّالة")}
              subtitle={tr("{0} من {1} مفاتيح", nf.format(active.length), nf.format(MAX_ACTIVE_KEYS))}
            >
              {active.length > 0 ? (
                <div className="border-t-[0.5px] border-border">
                  <ApiKeysList keys={active} storeId={store.id} baseUrl={baseUrl} />
                </div>
              ) : (
                <p className="border-t-[0.5px] border-border px-5 py-8 text-center text-[15px] text-muted-foreground">
                  {tr("مفيش مفاتيح شغّالة دلوقتي.")}
                </p>
              )}
            </Card>

            {revoked.length > 0 && (
              <details className="group apple-card overflow-hidden">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-[15px] [&::-webkit-details-marker]:hidden">
                  <span>{tr("المفاتيح الملغاة")}</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground tabular-nums">
                    {nf.format(revoked.length)}
                    <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
                  </span>
                </summary>
                <div className="border-t-[0.5px] border-border">
                  <ApiKeysList keys={revoked} revoked storeId={store.id} baseUrl={baseUrl} />
                </div>
              </details>
            )}
          </div>

          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <Card title={tr("الاتصال")} subtitle={tr("كل طلب لازم يبعت المفتاح في الهيدر.")}>
              <Rows>
                <Row label={tr("الرابط")}>
                  <span className="flex items-center justify-end gap-2">
                    <code dir="ltr" className="truncate font-mono text-[13px]">
                      {baseUrl.replace(/^https?:\/\//, "")}
                    </code>
                    <CopyButton value={baseUrl} label={tr("نسخ الرابط")} className="size-7" />
                  </span>
                </Row>
                <Row label={tr("الهيدر")}>
                  <code dir="ltr" className="font-mono text-[13px]">
                    Bearer csk_live_…
                  </code>
                </Row>
              </Rows>
            </Card>
            <p className="px-5 text-[13px] leading-[18px] text-muted-foreground">
              {tr("عامل المفتاح زي الباسورد: متحطوش في كود الموقع أو التطبيق، وادي كل نظام مفتاح لوحده بأقل صلاحيات يحتاجها.")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
