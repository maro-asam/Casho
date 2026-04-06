"use client";


import HeroSection from "./_components/Hero";
import PaymentMethodsSection from "./_components/PaymentMethodsSection";
import FeaturesSection from "./_components/Features";
import StatsSection from "./_components/Stats";
import BeforeAfterSection from "./_components/BeforeAfter";
import PricingSection from "./_components/Pricing";
import FAQSection from "./_components/FAQ";
import CTASection from "./_components/CTA";

import { ReactLenis } from "lenis/react";
import type { LenisRef } from "lenis/react";
import { useEffect, useRef } from "react";

const Page = () => {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    let rafId: number;

    const update = (time: number) => {
      lenisRef.current?.lenis?.raf(time);
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <>
      <ReactLenis
        root
        ref={lenisRef}
        options={{
          autoRaf: false,
          smoothWheel: true,
          lerp: 0.08,
        }}
      />

      <div className="mt-10 flex flex-col gap-20">
        <HeroSection />
        <PaymentMethodsSection />
        <StatsSection />
        <BeforeAfterSection />
        <FeaturesSection />
        <PricingSection />
        <CTASection />
        <FAQSection />
      </div>
    </>
  );
};

export default Page;
