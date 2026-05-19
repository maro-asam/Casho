import type { Metadata } from "next";
import { GetNotificationsAction } from "@/actions/notifications/notifications.actions";
import NotificationsPageClient from "./NotificationsPageClient";

export const metadata: Metadata = {
  title: "الإشعارات",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NotificationsPage() {
  const { notifications, unreadCount } = await GetNotificationsAction(50);

  return (
    <NotificationsPageClient
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    />
  );
}
