/**
 * SectionRenderer
 *
 * Renders the merchant-configurable content sections by key.
 * Product sections (featured, latest, best sellers) are rendered by each
 * theme's Home with its own product card.
 */
import type { SectionKey, SectionContentMap } from "@/types/store-theme.types";

import OfferStripSection from "./OfferStripSection";
import SocialProofSection from "./SocialProofSection";
import WhyChooseUsSection from "./WhyChooseUsSection";
import TestimonialsSection from "./TestimonialsSection";
import AboutBrandSection from "./AboutBrandSection";
import NewsletterSection from "./NewsletterSection";
import UrgencySection from "./UrgencySection";
import CollectionsPreviewSection from "./CollectionsPreviewSection";
import HeroBannerSection from "./HeroBannerSection";
import RichTextSection from "./RichTextSection";

type Props = {
  sectionKey: SectionKey;
  store: { name: string; slug: string };
  sectionContent: SectionContentMap;
  categories?: Array<{ name: string; slug: string; image?: string | null }>;
};

export default function SectionRenderer({
  sectionKey,
  store,
  sectionContent,
  categories = [],
}: Props) {
  switch (sectionKey) {
    case "showOfferStrip":
      return <OfferStripSection content={sectionContent.offerStrip} />;

    case "showSocialProof":
      return <SocialProofSection content={sectionContent.socialProof} />;

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

    // ── Visual Builder sections ────────────────────────────────────────────
    case "showHeroBanner":
      return <HeroBannerSection content={sectionContent.heroBanner} />;

    case "showRichText":
      return <RichTextSection content={sectionContent.richText} />;

    // Core sections are handled by each theme Home directly
    default:
      return null;
  }
}
