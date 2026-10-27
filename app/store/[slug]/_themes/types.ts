// ─────────────────────────────────────────────────────────────────────────────
//  Storefront theme contract
//
//  Route files under app/store/[slug] load data and pass these plain
//  view-models to the active theme (see ./index.ts). A theme owns every pixel
//  of the storefront but never queries the database or mutates data itself —
//  it calls the existing store actions for that.
// ─────────────────────────────────────────────────────────────────────────────

import type { ComponentType } from "react";
import type { BannerLink } from "@/lib/banners/banner-link";
import type { TrackedOrder } from "@/lib/orders/tracking";
import type { ProductsQuery } from "@/lib/products-query";
import type { StoreNavbarVariant } from "@/constants/store-navbar";
import type {
  HomePageSections,
  SectionContentMap,
  ThemeLayout,
} from "@/types/store-theme.types";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  isFeatured: boolean;
  stock: number;
  /** Has sizes/colors — must be chosen on the product page before adding. */
  hasOptions: boolean;
  categoryName: string | null;
  rating: { average: number; count: number } | null;
  /** Second gallery image (for hover swaps), if the product has one. */
  hoverImage: string | null;
  sizes: string[];
  colors: string[];
  brand: string | null;
  /** Added in the last 30 days. */
  isNew: boolean;
};

export type CategoryLink = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  productCount: number;
};

export type StoreContact = {
  email: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
};

/** Store chrome shared by the header and footer. */
export type StoreShell = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  logoRadius: number;
  logoSize: number;
  showStoreName: boolean;
  announcementText: string | null;
  description: string | null;
  contact: StoreContact;
  categories: CategoryLink[];
  navbarVariant: StoreNavbarVariant;
  showPoweredByCasho: boolean;
  dir: "rtl" | "ltr";
  /** Newest active banner — for promo slots in menus. */
  banner: BannerData | null;
};

export type BannerData = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  /** Phone art; themes render it via `BannerImage`. */
  mobileImage: string | null;
  /** Button text — the merchant's own or the default "تسوق الآن". */
  cta: string;
  /** Where a click goes; null → image only. Render with `BannerLink`. */
  link: BannerLink | null;
};

export type HomeViewProps = {
  store: { id: string; name: string; slug: string; description: string | null };
  dir: "rtl" | "ltr";
  banners: BannerData[];
  categories: CategoryLink[];
  featured: ProductCardData[];
  latest: ProductCardData[];
  bestSellers: ProductCardData[];
  sections: HomePageSections;
  sectionContent: SectionContentMap;
  layout: ThemeLayout;
};

export type ListingViewProps = {
  store: { name: string; slug: string };
  products: ProductCardData[];
  categories: CategoryLink[];
  query: ProductsQuery;
  total: number;
  totalPages: number;
  pageSize: number;
  dir: "rtl" | "ltr";
  /** Cheapest / most expensive active product — hints for the price filter. */
  priceBounds: { min: number; max: number } | null;
  /** Values that exist across the store's active products (for filters). */
  facets: { brands: string[]; sizes: string[]; colors: string[] };
};

export type CategoriesIndexViewProps = {
  store: { name: string; slug: string };
  categories: CategoryLink[];
};

export type CategoryViewProps = {
  store: { name: string; slug: string };
  category: CategoryLink;
  products: ProductCardData[];
  otherCategories: CategoryLink[];
};

export type WholesaleTier = { minQty: number; maxQty?: number; price: number };

export type BundleItem = {
  productId: string;
  productName: string;
  quantity: number;
  image: string;
};

export type ReviewData = {
  id: string;
  customerName: string;
  customerAvatar: string | null;
  rating: number;
  title: string | null;
  content: string;
  verifiedPurchase: boolean;
  reviewDate: Date;
};

export type ProductDetailData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  gallery: string[];
  description: string | null;
  brand: string | null;
  sku: string | null;
  weight: number | null;
  stock: number;
  isFeatured: boolean;
  sizes: string[];
  colors: string[];
  wholesaleOptions: WholesaleTier[] | null;
  type: string;
  bundleItems: BundleItem[] | null;
  category: { id: string; name: string; slug: string };
};

export type ShippingOption = {
  id: string;
  name: string;
  /** Piasters */
  price: number;
  estimatedDays: number | null;
};

export type ProductViewProps = {
  store: { id: string; name: string; slug: string };
  product: ProductDetailData;
  reviews: ReviewData[];
  related: ProductCardData[];
  shipping: ShippingOption[];
};

export type CartViewProps = {
  storeSlug: string;
  cart: Awaited<ReturnType<typeof import("@/actions/store/cart.actions").GetCartItemsAction>>;
  notice: {
    couponStatus?: string;
    couponMessage?: string;
    stockChanged: boolean;
  };
};

export type CheckoutViewProps = {
  storeSlug: string;
  cart: CartViewProps["cart"];
  paymentMethods: { key: string; label: string }[];
  /** Server action that validates the form and places the order. */
  createOrder: (formData: FormData) => Promise<void>;
};

export type AboutViewProps = {
  store: { name: string; slug: string };
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  contact: StoreContact;
  productCount: number;
  categoryCount: number;
};

export type ContactViewProps = {
  store: { name: string; slug: string };
  contact: StoreContact;
};

export type TrackViewProps = {
  store: { name: string; slug: string };
  /** Store WhatsApp — for "ask about this order". */
  whatsapp: string | null;
  /** Pre-filled order number (`/track?order=A1B2C3`). */
  initialCode: string;
  /** Opened from a signed link (emails, WhatsApp) — shown without a search. */
  order: TrackedOrder | null;
};

export type StorefrontTheme = {
  Header: ComponentType<{ shell: StoreShell }>;
  Footer: ComponentType<{ shell: StoreShell }>;
  Home: ComponentType<HomeViewProps>;
  ProductListing: ComponentType<ListingViewProps>;
  CategoriesIndex: ComponentType<CategoriesIndexViewProps>;
  Category: ComponentType<CategoryViewProps>;
  Product: ComponentType<ProductViewProps>;
  Cart: ComponentType<CartViewProps>;
  Checkout: ComponentType<CheckoutViewProps>;
  About: ComponentType<AboutViewProps>;
  Contact: ComponentType<ContactViewProps>;
  /** Order tracking — page chrome around the shared `OrderTracker` (shared/track). */
  Track: ComponentType<TrackViewProps>;
  StoreClosed: ComponentType<{ storeSlug?: string }>;
  /** className applied to the storefront root (scopes the theme's CSS). */
  rootClassName: string;
};
