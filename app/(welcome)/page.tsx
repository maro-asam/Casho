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
import { isDirectPlanCheckoutEnabled } from "@/lib/payments/plan-checkout";
import { getPublishedShowcase } from "@/lib/showcase/public";
import type { WelcomePlan } from "./_components/Pricing";
import HeroClaim from "./_components/apple/HeroClaim";
import SyncSection from "./_components/apple/SyncSection";
import Bento from "./_components/apple/Bento";
import ThemesRail from "./_components/apple/ThemesRail";
import Showcase from "./_components/apple/Showcase";
import ApplePricing from "./_components/apple/ApplePricing";
import AppleFAQ from "./_components/apple/AppleFAQ";
import FinalCTA from "./_components/apple/FinalCTA";
import SharksTeaser from "./_components/sharks/SharksTeaser";

// Cached (ISR): plan and example edits revalidate "/" right away
// (actions/admin/admin-plans.actions.ts, actions/admin/showcase.actions.ts),
// this window is only the safety net.
export const revalidate = 300;

export default async function Page() {
  const [allPlans, showcase] = await Promise.all([getAllActivePlans(), getPublishedShowcase()]);
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
        type: pf.feature.type,
        sortOrder: pf.feature.sortOrder,
      })),
  }));

  // Apple-style landing: full-bleed sections alternating light / dark,
  // one idea per section. Tokens + glass recipes in _components/apple/apple.css.
  return (
    <div className="al">
      <LandingPageTracker />
      <HeroClaim />
      <SyncSection />
      <Bento />
      <ThemesRail />
      {showcase.length > 0 && <Showcase sites={showcase} />}
      <SharksTeaser />
      <ApplePricing plans={plans} checkoutEnabled={isDirectPlanCheckoutEnabled()} />
      <AppleFAQ />
      <FinalCTA />
    </div>
  );
}
