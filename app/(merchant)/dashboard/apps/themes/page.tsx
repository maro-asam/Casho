import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wand2 } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { appleButton } from "@/components/saas-page";
import { getApp } from "@/lib/apps/catalog";
import { APPEARANCE_SELECT, liveAppearance } from "@/lib/studio/appearance";
import { prisma } from "@/lib/prisma";
import { AppPageHeader } from "../_components/app-ui";
import ThemesAppClient from "./_components/ThemesAppClient";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: tr("الثيمات") };
}

export default async function ThemesAppPage() {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, settings: { select: APPEARANCE_SELECT } },
  });
  if (!store) redirect("/dashboard");

  const appearance = liveAppearance(store.settings);
  const app = getApp("themes")!;

  return (
    <div className="space-y-8" dir={tdir()}>
      <AppPageHeader
        app={app}
        actions={
          <Link href="/builder?panel=theme" className={appleButton.gray}>
            <Wand2 className="size-4" />
            {tr("خصّص في الاستوديو")}
          </Link>
        }
      />
      <ThemesAppClient storeId={store.id} activeId={appearance.themeConfig.presetId ?? "default"} />
    </div>
  );
}
