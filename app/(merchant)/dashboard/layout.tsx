import { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { storePublicUrl } from "@/helpers/BuildStoreURL";
import DashboardShell from "../_components/main/DashboardShell";
import VerifyEmailNotice from "../_components/main/VerifyEmailNotice";
import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { GetNotificationsAction } from "@/actions/notifications/notifications.actions";
import { countNavBadges } from "@/lib/dashboard/nav-badges";
import { isSubscriptionCurrentlyActive } from "@/lib/subscriptions";
import { renewIfDue } from "@/lib/billing/renewal";
import { needsEmailVerification } from "@/lib/auth/email-verification";
import { MEDIA_BUYER_HOME, isMediaBuyer } from "@/lib/admin/panel-roles";
import { tr } from "@/lib/i18n/dashboard";
import DashboardI18nProvider from "@/lib/i18n/dashboard/provider";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";
import { storeFamilyOf } from "@/lib/store-family/rules";
import { loadStoreFamily } from "@/lib/store-family/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
  title: {
    default: tr("كــاشو | لوحة تحكم التاجر"),
    template: tr("كــاشو | %s"),
  },
  description:
    tr("لوحة تحكم التاجر لإدارة الطلبات والمنتجات والتصنيفات وإعدادات المتجر بسهولة."),
  applicationName: tr("كــاشو"),
  keywords: [
    tr("لوحة تحكم"),
    tr("متجر إلكتروني"),
    tr("إدارة الطلبات"),
    tr("إدارة المنتجات"),
    tr("كــاشو"),
    "Dashboard",
    "Ecommerce",
  ],
  robots: {
    index: false,
    follow: false,
  },
};
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await loadDashboardLocale();
  const userId = await requireUserId();
  const account = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true, mustVerifyEmail: true, role: true } });
  if (account && needsEmailVerification(account)) redirect("/verify-email");
  const storeQuery = {
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      customDomain: true,
      customDomainStatus: true,
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
    // Sales reps have their own workspace; media buyers have the Analytics Center.
    if (account?.role === "SALES") redirect("/sales");
    if (account && isMediaBuyer(account.role)) redirect(MEDIA_BUYER_HOME);
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
    // A media buyer who never set up a store came for the Analytics Center, not onboarding.
    if (account && isMediaBuyer(account.role)) redirect(MEDIA_BUYER_HOME);
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

  const familyInbox = storeFamilyOf(account?.email);
  const [{ notifications, unreadCount }, navBadges, storeFamily] = await Promise.all([
    GetNotificationsAction(10),
    countNavBadges(store.id),
    familyInbox ? loadStoreFamily(familyInbox, userId) : null,
  ]);

  return (
    <DashboardI18nProvider locale={locale}>
    <DashboardShell
      store={{ ...store, url: storePublicUrl(store) }}
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
      initialNavBadges={navBadges}
      notice={account && !account.emailVerified ? <VerifyEmailNotice email={account.email} /> : undefined}
      storeFamily={storeFamily}
    >
      {children}
    </DashboardShell>
    </DashboardI18nProvider>
  );
}
