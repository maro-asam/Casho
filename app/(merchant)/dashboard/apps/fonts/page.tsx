import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Languages } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { appleButton } from "@/components/saas-page";
import { getApp } from "@/lib/apps/catalog";
import { APPEARANCE_SELECT, liveAppearance } from "@/lib/studio/appearance";
import { prisma } from "@/lib/prisma";
import { AppPageHeader } from "../_components/app-ui";
import FontsAppClient from "./_components/FontsAppClient";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: tr("الخطوط") };
}

export default async function FontsAppPage() {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, settings: { select: APPEARANCE_SELECT } },
  });
  if (!store) redirect("/dashboard");

  const appearance = liveAppearance(store.settings);

  return (
    <div className="space-y-8" dir={tdir()}>
      <AppPageHeader
        app={getApp("fonts")!}
        actions={
          <Link href="/builder?panel=fonts" className={appleButton.gray}>
            <Languages className="size-4" />
            {tr("لغة المتجر")}
          </Link>
        }
      />
      <FontsAppClient storeId={store.id} activeId={appearance.fontId} language={appearance.storeLanguage} />
    </div>
  );
}
