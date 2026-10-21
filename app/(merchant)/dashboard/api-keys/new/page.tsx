import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { prisma } from "@/lib/prisma";
import { CreateKeyForm } from "../_components/create-key-form";
import { apiBaseUrl } from "../_lib/api-base";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: tr("مفتاح API جديد") };
}

export default async function NewApiKeyPage() {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) redirect("/api-keys");

  return (
    <div dir={tdir()}>
      <CreateKeyForm storeId={store.id} baseUrl={apiBaseUrl()} />
    </div>
  );
}
