import DefaultHome from "./themes/DefaultHome";
import BoldHome from "./themes/BoldHome";
import ElegantHome from "./themes/ElegantHome";
import ModernHome from "./themes/ModernHome";
import MinimalHome from "./themes/MinimalHome";
import DarkHome from "./themes/DarkHome";
import type { HomePageSections, SectionContentMap } from "@/types/store-theme.types";

export type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  isFeatured: boolean;
  isActive?: boolean;
  category: { name: string; slug: string; image: string | null } | null;
};

export type BestSellerProduct = Product & { salesCount: number };

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string | null | undefined;
};

export type Banner = {
  id: string;
  title: string;
  image: string;
  isActive: boolean;
};

export type StoreHomeProps = {
  store: {
    id: string;
    name: string;
    slug: string;
    settings: {
      themeId?: string | null;
      description?: string | null;
      coverImage?: string | null;
      logo?: string | null;
      primaryColor?: string | null;
    } | null;
    categories: Category[];
    banners: Banner[];
    products: Product[];
    bestSellers?: BestSellerProduct[];
  };
  sections: HomePageSections;
  sectionContent?: SectionContentMap;
};

const DEFAULT_SECTIONS: HomePageSections = {
  showHero: true,
  showCategories: true,
  showFeaturedProducts: true,
  showLatestProducts: true,
  showOfferStrip: false,
  showSocialProof: false,
  showBestSellers: false,
  showWhyChooseUs: false,
  showTestimonials: false,
  showAboutBrand: false,
  showNewsletter: false,
  showUrgency: false,
  showCollections: false,
  showHeroBanner: false,
  showRichText: false,
};

export default function StoreHome({
  store,
  sections = DEFAULT_SECTIONS,
  sectionContent = {},
}: StoreHomeProps) {
  const themeId = store.settings?.themeId;

  switch (themeId) {
    case "bold":
      return <BoldHome store={store} sections={sections} sectionContent={sectionContent} />;
    case "elegant":
      return <ElegantHome store={store} sections={sections} sectionContent={sectionContent} />;
    case "modern":
      return <ModernHome store={store} sections={sections} sectionContent={sectionContent} />;
    case "minimal":
      return <MinimalHome store={store} sections={sections} sectionContent={sectionContent} />;
    case "dark":
      return <DarkHome store={store} sections={sections} sectionContent={sectionContent} />;
    default:
      return <DefaultHome store={store} sections={sections} sectionContent={sectionContent} />;
  }
}
