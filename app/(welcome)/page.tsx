import { LandingPageTracker } from "@/components/meta/meta-pixel";
import { ComingSoon } from "./_components/ComingSoon";

// TEMP: "Coming soon" until launch (20 Oct 2026).
// To restore the landing page: delete this component and uncomment the original page below.
// export default function Page() {
//   return (
//     <>
//       <LandingPageTracker />
//       <ComingSoon />
//     </>
//   );
// }

/* ------------------------------------------------------------------ */
/* Original landing page — commented out while "coming soon" is live.  */
/* ------------------------------------------------------------------ */

import { getAllActivePlans } from "@/lib/entitlements";
import type { WelcomePlan } from "./_components/Pricing";
import AppleHero from "./_components/apple/AppleHero";
import SyncSection from "./_components/apple/SyncSection";
import Bento from "./_components/apple/Bento";
import ThemesRail from "./_components/apple/ThemesRail";
import ApplePricing from "./_components/apple/ApplePricing";
import AppleFAQ from "./_components/apple/AppleFAQ";
import FinalCTA from "./_components/apple/FinalCTA";

export default async function Page() {
  const allPlans = await getAllActivePlans();
  const plans: WelcomePlan[] = allPlans.map((plan) => ({
    id: plan.id,
    key: plan.key,
    name: plan.name,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    originalMonthlyPrice: plan.originalMonthlyPrice,
    discountPercent: plan.discountPercent,
    sortOrder: plan.sortOrder,
    features: plan.planFeatures
      .filter((pf) => pf.enabled && pf.feature.isActive)
      .sort((a, b) => a.feature.sortOrder - b.feature.sortOrder)
      .map((pf) => ({
        key: pf.feature.key,
        name: pf.feature.name,
        unit: pf.feature.unit,
        isUnlimited: pf.isUnlimited,
        limitValue: pf.limitValue,
      })),
  }));

  // Apple-style landing: full-bleed sections alternating light / dark,
  // one idea per section. Tokens + glass recipes in _components/apple/apple.css.
  return (
    <div className="al">
      <LandingPageTracker />
      <AppleHero />
      <SyncSection />
      <Bento />
      <ThemesRail />
      <ApplePricing plans={plans} />
      <AppleFAQ />
      <FinalCTA />
    </div>
  );
}
