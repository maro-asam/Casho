import Header from "@/components/shared/header";
import HeroSection from "@/components/hero";
import LogosTicker from "@/components/LogosTicker";
import HowItWorks from "@/components/HowItWorks";
import CTA from "@/components/CTA";
import Pricing from "@/components/Pricing";
import Features from "@/components/Features";
import FAQ from "@/components/FAQ";
import Footer from "@/components/shared/footer";

const HomeRoute = () => {
  return (
    <>
      <Header />
      <div>
        <HeroSection />
        <LogosTicker />
        <Features />
        <HowItWorks />
        <Pricing />
        <CTA />
        <FAQ />
        <Footer />
      </div>
    </>
  );
};

export default HomeRoute;
