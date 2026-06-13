import { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import DashboardShell from "../_components/main/DashboardShell";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { GetNotificationsAction } from "@/actions/notifications/notifications.actions";
import { isSubscriptionCurrentlyActive } from "@/lib/subscriptions";

export const metadata: Metadata = {
  title: {
    default: "كــاشو | لوحة تحكم التاجر",
    template: "كــاشو | %s",
  },
  description:
    "لوحة تحكم التاجر لإدارة الطلبات والمنتجات والتصنيفات وإعدادات المتجر بسهولة.",
  applicationName: "كــاشو",
  keywords: [
    "لوحة تحكم",
    "متجر إلكتروني",
    "إدارة الطلبات",
    "إدارة المنتجات",
    "كــاشو",
    "Dashboard",
    "Ecommerce",
  ],
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      planSelected: true,
      onboardingCompleted: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      gracePeriodEndsAt: true,
      settings: {
        select: {
          themeId: true,
          fontId: true,
          navbarVariant: true,
          primaryColor: true,
          secondaryColor: true,
        },
      },
    },
  });

  if (!store) {
    redirect("/");
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? headersList.get("next-url") ?? "";

  // Onboarding gate — treat planSelected=true (legacy) as equivalent to onboardingCompleted
  const onboardingDone = store.onboardingCompleted || store.planSelected;
  const isOnChangePlan = pathname.includes("/change-plan");
  const isOnOnboarding = pathname.includes("/onboarding");

  if (!onboardingDone && !isOnChangePlan && !isOnOnboarding) {
    redirect("/onboarding");
  }

  // Trial / subscription gate — block dashboard features when demo has expired
  const isSubscribed = isSubscriptionCurrentlyActive({
    subscriptionStatus: store.subscriptionStatus,
    subscriptionEndsAt: store.subscriptionEndsAt,
    gracePeriodEndsAt: store.gracePeriodEndsAt,
  });

  const allowedExpiredPaths = ["/balance", "/change-plan", "/trial-expired"];
  const isOnAllowedExpiredPath = allowedExpiredPaths.some((p) => pathname.includes(p));

  if (!isSubscribed && !isOnAllowedExpiredPath) {
    redirect("/dashboard/trial-expired");
  }

  const { notifications, unreadCount } = await GetNotificationsAction(10);

  return (
    <DashboardShell
      store={store}
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    >
      {children}
    </DashboardShell>
  );
}
