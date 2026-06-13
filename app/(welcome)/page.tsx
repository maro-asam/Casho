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

export default function Page() {
  return (
    <>
      <LandingPageTracker />

      <div className="mt-10 flex flex-col gap-12 md:gap-20">
        <HeroSection />
        <PaymentMethodsSection />
        <StatsSection />
        <BeforeAfterSection />
        <FeaturesSection />
        <PricingSection />
        <BlogSection />
        <CTASection />
        <FAQSection />
      </div>
    </>
  );
}
