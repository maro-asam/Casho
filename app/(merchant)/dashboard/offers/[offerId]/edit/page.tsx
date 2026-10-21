import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { OfferForm } from "../../_components/offer-form";
import { loadEditableOffer, loadOfferStore } from "../../_lib/offer-form-data";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: tr("تعديل العرض") };
}

export default async function EditOfferPage({ params }: { params: Promise<{ offerId: string }> }) {
  await loadDashboardLocale();
  const { offerId } = await params;
  const userId = await requireUserId();

  const store = await loadOfferStore(userId);
  if (!store) redirect("/offers");
  const offer = await loadEditableOffer(store.id, offerId);
  if (!offer) redirect("/offers");

  return (
    <div dir={tdir()}>
      <OfferForm key={offer.id} offer={offer} initialType={offer.type} storefrontUrl={buildStoreUrl(store.slug)} />
    </div>
  );
}
