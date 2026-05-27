/**
 * SectionRenderer
 *
 * Renders one of the 9 Sales-Funnel sections by key.
 * Shared across ALL theme Home components so changes propagate everywhere.
 */
import type { SectionKey, SectionContentMap } from "@/types/store-theme.types";
import type { StoreHomeProps, BestSellerProduct, Category } from "../StoreHome";

import OfferStripSection from "./OfferStripSection";
import SocialProofSection from "./SocialProofSection";
import BestSellersSection from "./BestSellersSection";
import WhyChooseUsSection from "./WhyChooseUsSection";
import TestimonialsSection from "./TestimonialsSection";
import AboutBrandSection from "./AboutBrandSection";
import NewsletterSection from "./NewsletterSection";
import UrgencySection from "./UrgencySection";
import CollectionsPreviewSection from "./CollectionsPreviewSection";

type Props = {
  sectionKey: SectionKey;
  store: StoreHomeProps["store"];
  sectionContent: SectionContentMap;
  categories?: Category[];
  bestSellers?: BestSellerProduct[];
};

export default function SectionRenderer({
  sectionKey,
  store,
  sectionContent,
  categories = [],
  bestSellers = [],
}: Props) {
  switch (sectionKey) {
    case "showOfferStrip":
      return <OfferStripSection content={sectionContent.offerStrip} />;

    case "showSocialProof":
      return <SocialProofSection content={sectionContent.socialProof} />;

    case "showBestSellers":
      return (
        <BestSellersSection
          products={bestSellers}
          storeSlug={store.slug}
          content={sectionContent.bestSellers}
        />
      );

    case "showWhyChooseUs":
      return <WhyChooseUsSection content={sectionContent.whyChooseUs} />;

    case "showTestimonials":
      return <TestimonialsSection content={sectionContent.testimonials} />;

    case "showAboutBrand":
      return (
        <AboutBrandSection
          storeName={store.name}
          content={sectionContent.aboutBrand}
        />
      );

    case "showNewsletter":
      return <NewsletterSection content={sectionContent.newsletter} />;

    case "showUrgency":
      return <UrgencySection content={sectionContent.urgency} />;

    case "showCollections":
      return (
        <CollectionsPreviewSection
          storeSlug={store.slug}
          content={sectionContent.collections}
          categories={categories}
        />
      );

    // Core sections are handled by each theme Home directly
    default:
      return null;
  }
}
