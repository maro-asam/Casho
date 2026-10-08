import type { Metadata } from "next";
import { PageHeader, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { GetShopifyImportStateAction } from "@/actions/integrations/shopify-import.actions";
import { ImportHistory } from "./_components/ImportHistory";
import { ShopifyImportClient } from "./_components/ShopifyImportClient";

export const metadata: Metadata = {
  title: "استيراد من Shopify",
};

export default async function ShopifyImportPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const state = await GetShopifyImportStateAction();

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="استيراد من Shopify"
        description="انقل منتجاتك وعملاءك وطلباتك من Shopify لمتجرك على Kasho — من غير تكرار ومن غير ما تقعد جنب الصفحة."
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
