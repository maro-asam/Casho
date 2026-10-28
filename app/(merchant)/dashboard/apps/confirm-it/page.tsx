import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { StatusText } from "@/components/saas-page";
import { getApp } from "@/lib/apps/catalog";
import { confirmItCallbackUrl, getConfirmItApp } from "@/lib/apps/confirm-it";
import { prisma } from "@/lib/prisma";
import { maskSecret } from "@/lib/secrets";
import { AppPageHeader } from "../_components/app-ui";
import ConfirmItClient from "./_components/ConfirmItClient";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
    title: "Confirm It",
    description: tr("تأكيد طلبات الدفع عند الاستلام تلقائياً على واتساب"),
  };
}

export default async function ConfirmItAppPage() {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({ where: { userId }, select: { id: true } });
  if (!store) redirect("/dashboard");

  const app = await getConfirmItApp(store.id);
  const installed = app
    ? {
        isActive: app.row.isActive,
        webhookUrl: app.settings.webhookUrl,
        codOnly: app.settings.codOnly,
        apiKeyHint: app.secrets?.apiKey ? maskSecret(app.secrets.apiKey) : null,
        callbackUrl: app.secrets?.callbackToken ? confirmItCallbackUrl(app.secrets.callbackToken) : null,
        lastSyncAt: app.row.lastSyncAt?.toISOString() ?? null,
        lastError: app.row.lastError,
      }
    : null;

  return (
    <div className="space-y-8" dir={tdir()}>
      <AppPageHeader
        app={getApp("confirm-it")!}
        status={
          installed ? (
            <StatusText tone={installed.isActive ? "success" : "warning"}>
              {installed.isActive ? tr("مثبت وشغال") : tr("مثبت — متوقف")}
            </StatusText>
          ) : (
            <StatusText tone="neutral">{tr("مش متثبت")}</StatusText>
          )
        }
      />
      <ConfirmItClient installed={installed} />
    </div>
  );
}
