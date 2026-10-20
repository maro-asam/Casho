import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import { LargeTitle, Unavailable, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { GetShopifyImportStateAction } from "@/actions/integrations/shopify-import.actions";
import { ImportHistory } from "./_components/ImportHistory";
import { ShopifyImportClient } from "./_components/ShopifyImportClient";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
    title: tr("استيراد من Shopify"),
  };
}

export default async function ShopifyImportPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  await loadDashboardLocale();
  const params = await searchParams;
  const state = await GetShopifyImportStateAction();

  return (
    <div className="space-y-8" dir={tdir()}>
      <LargeTitle
        eyebrow={<p className="text-[13px] font-semibold text-muted-foreground">{tr("التكاملات")}</p>}
        title={tr("استيراد من Shopify")}
        subtitle={tr("انقل منتجاتك وعملاءك وطلباتك من Shopify لمتجرك على Kasho — من غير تكرار ومن غير ما تقعد جنب الصفحة.")}
      />

      {!state.ok ? (
        <div className="apple-card">
          <Unavailable icon={AlertCircle} title={tr("تعذّر تحميل الصفحة")} description={trv(state.error)} />
        </div>
      ) : (
        <ShopifyImportClient
          configured={state.configured}
          connection={state.connection}
          job={state.job}
          flash={{ connected: readParam(params, "connected") === "1", error: readParam(params, "error") ?? null }}
          history={<ImportHistory history={state.history} />}
        />
      )}
    </div>
  );
}
