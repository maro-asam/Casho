import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { isOfferType } from "@/lib/offers/offer-pricing";
import { OfferForm } from "../_components/offer-form";
import { loadOfferStore } from "../_lib/offer-form-data";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: tr("عرض جديد") };
}

export default async function NewOfferPage({ searchParams }: { searchParams?: Promise<{ type?: string }> }) {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const store = await loadOfferStore(userId);
  if (!store) redirect("/offers");

  const type = (await searchParams)?.type;

  return (
    <div dir={tdir()}>
      <OfferForm key={type ?? "new"} offer={null} initialType={isOfferType(type) ? type : "CROSS_SELL"} storefrontUrl={buildStoreUrl(store.slug)} />
    </div>
  );
}
