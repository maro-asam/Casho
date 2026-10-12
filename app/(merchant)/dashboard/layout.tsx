import { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import DashboardShell from "../_components/main/DashboardShell";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { GetNotificationsAction } from "@/actions/notifications/notifications.actions";
import { isSubscriptionCurrentlyActive } from "@/lib/subscriptions";
import { renewIfDue } from "@/lib/billing/renewal";

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
  const storeQuery = {
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
  } as const;
  let store = await prisma.store.findFirst(storeQuery);

  // Renew (or move to grace / past due) the moment the merchant shows up, so
  // billing never depends on the cron alone.
  if (store?.subscriptionEndsAt && store.subscriptionEndsAt.getTime() <= Date.now()) {
    const outcome = await renewIfDue(store.id).catch((error) => {
      console.error("[dashboard] renewal", error);
      return "none" as const;
    });
    if (outcome !== "none") store = await prisma.store.findFirst(storeQuery);
  }

  if (!store) {
    // Sales reps have their own workspace.
    const account = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (account?.role === "SALES") redirect("/sales");
    // Team members (cashiers) don't own a store: their workspace is the POS.
    const membership = await prisma.storeMember.findFirst({ where: { userId }, select: { id: true } });
    redirect(membership ? "/pos" : "/");
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
