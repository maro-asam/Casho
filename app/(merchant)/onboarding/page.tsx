import { Metadata } from "next";
import { requireAuth } from "@/actions/auth/require.actions";
import { prisma } from "@/lib/prisma";
import OnboardingWizard from "./_components/OnboardingWizard";
import { tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";
import { DEMO_CUSTOMERS, demoKitFor } from "@/lib/demo-data/kits";
import { isThemePresetId, type ThemePresetId } from "@/constants/store-themes";
import { DEMO_ORDER_COUNT } from "@/lib/demo-data/seed";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
    title: tr("إعداد المتجر | كاشو"),
    robots: { index: false, follow: false },
  };
}

/** Theme that suits each sample kit — the one we preselect and mark "مقترح". */
const SUGGESTED_THEME: Record<string, ThemePresetId> = {
  fashion: "dune",
  accessories: "dune",
  electronics: "maximize",
  cars: "cello",
  food: "mada",
  beauty: "riwaq",
  home: "riwaq",
  books: "riwaq",
  sports: "cello",
  kids: "default",
  digital: "default",
};

function daysUntil(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}

export default async function OnboardingPage() {
  await loadDashboardLocale();
  const user = await requireAuth();

  const store = await prisma.store.findFirst({
    where: { userId: user.id },
    select: {
      name: true,
      slug: true,
      trialEndDate: true,
      user: { select: { name: true, businessType: true, phone_number: true } },
      settings: { select: { logo: true, whatsappNumber: true, storeLanguage: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const businessType = store?.user.businessType ?? "";
  const kit = demoKitFor(businessType);
  const suggested = SUGGESTED_THEME[kit.id] ?? "default";
  const trialDaysLeft = store?.trialEndDate ? daysUntil(store.trialEndDate) : null;

  return (
    <OnboardingWizard
      storeName={store?.name ?? ""}
      slug={store?.slug ?? ""}
      ownerName={store?.user.name?.trim().split(/\s+/)[0] ?? ""}
      businessType={businessType}
      initialLogo={store?.settings?.logo ?? null}
      initialWhatsapp={store?.settings?.whatsappNumber ?? store?.user.phone_number ?? ""}
      initialLanguage={store?.settings?.storeLanguage === "en" ? "en" : "ar"}
      suggestedTheme={isThemePresetId(suggested) ? suggested : "default"}
      trialDaysLeft={trialDaysLeft}
      demo={{
        products: kit.products.length,
        orders: DEMO_ORDER_COUNT,
        customers: DEMO_CUSTOMERS.length,
        preview: kit.products.slice(0, 4).map((p) => ({ name: p.name, image: p.image, price: p.price })),
      }}
    />
  );
}
