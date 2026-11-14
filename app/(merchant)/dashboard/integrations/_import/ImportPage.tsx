import type { ImportProvider } from "@prisma/client";
import { AlertCircle } from "lucide-react";
import { LargeTitle, Unavailable, readParam, type SearchParamsRecord } from "@/components/saas-page";
import { GetImportPageStateAction } from "@/actions/integrations/store-import.actions";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";
import { ImportClient } from "./ImportClient";
import { ImportHistory } from "./ImportHistory";
import { providerCopy } from "./provider-ui";

/** The whole import page of one source platform (Shopify, WooCommerce…). */
export async function ImportPage({ provider, params }: { provider: ImportProvider; params: SearchParamsRecord | undefined }) {
  const state = await GetImportPageStateAction(provider);
  const copy = providerCopy(provider);

  return (
    <div className="space-y-8" dir={tdir()}>
      <LargeTitle
        eyebrow={<p className="text-[13px] font-semibold text-muted-foreground">{tr("التكاملات")}</p>}
        title={copy.pageTitle}
        subtitle={copy.pageSubtitle}
      />

      {!state.ok ? (
        <div className="apple-card">
          <Unavailable icon={AlertCircle} title={tr("تعذّر تحميل الصفحة")} description={trv(state.error)} />
        </div>
      ) : (
        <ImportClient
          provider={provider}
          configured={state.configured}
          connection={state.connection}
          job={state.job}
          flash={{ connected: readParam(params, "connected") === "1", error: readParam(params, "error") ?? null }}
          history={<ImportHistory provider={provider} history={state.history} />}
        />
      )}
    </div>
  );
}
