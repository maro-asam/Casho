import type { Metadata } from "next";
import type { SearchParamsRecord } from "@/components/saas-page";
import { tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";
import { ImportPage } from "../_import/ImportPage";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
    title: tr("استيراد من Shopify"),
  };
}

export default async function ShopifyImportPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  await loadDashboardLocale();
  return <ImportPage provider="SHOPIFY" params={await searchParams} />;
}
