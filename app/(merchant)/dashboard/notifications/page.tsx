import type { Metadata } from "next";
import { GetNotificationsAction } from "@/actions/notifications/notifications.actions";
import NotificationsPageClient from "./NotificationsPageClient";
import { tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: tr("الإشعارات"),
  robots: {
    index: false,
    follow: false,
  },
};
}

export default async function NotificationsPage() {
  await loadDashboardLocale();
  const { notifications } = await GetNotificationsAction(50);

  return <NotificationsPageClient initialNotifications={notifications} />;
}
