import type { Metadata } from "next";
import { PageHeader, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { GetShopifyImportStateAction } from "@/actions/integrations/shopify-import.actions";
import { ImportHistory } from "./_components/ImportHistory";
import { ShopifyImportClient } from "./_components/ShopifyImportClient";
import { tdir, tr } from "@/lib/i18n/dashboard";
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
    <div className="space-y-6" dir={tdir()}>
      <PageHeader
        title={tr("استيراد من Shopify")}
        description={tr("انقل منتجاتك وعملاءك وطلباتك من Shopify لمتجرك على Kasho — من غير تكرار ومن غير ما تقعد جنب الصفحة.")}
      />

      {!state.ok ? (
        <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">{state.error}</p>
      ) : (
        <>
          <ShopifyImportClient
            configured={state.configured}
            connection={state.connection}
            job={state.job}
            flash={{ connected: readParam(params, "connected") === "1", error: readParam(params, "error") ?? null }}
          />
          <ImportHistory history={state.history} />
        </>
      )}
    </div>
  );
}
