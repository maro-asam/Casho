import PaymentMethodsSection from "./_components/PaymentMethodsSection";
import FeaturesSection from "./_components/Features";
import StatsSection from "./_components/Stats";
import BeforeAfterSection from "./_components/BeforeAfter";
import PricingSection from "./_components/Pricing";
import FAQSection from "./_components/FAQ";
import CTASection from "./_components/CTA";
import BlogSection from "./_components/BlogSection";
import { LandingPageTracker } from "@/components/meta/meta-pixel";
import { HeroSection } from "./_components/Hero";
import { getAllActivePlans } from "@/lib/entitlements";
import type { WelcomePlan } from "./_components/Pricing";

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

  return (
    <>
      <LandingPageTracker />

      <div className="mt-10 flex flex-col gap-12 md:gap-20">
        <HeroSection />
        <PaymentMethodsSection />
        <StatsSection />
        <BeforeAfterSection />
        {/* <FeaturesSection /> */}
        <PricingSection plans={plans} />
        <BlogSection />
        <CTASection />
        <FAQSection />
      </div>
    </>
  );
}
