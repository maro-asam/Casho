export type StoreThemeData = {
  id: string;
  name: string;
  slug: string;
  subscriptionStatus: import("@prisma/client").SubscriptionStatus;

  settings: {
    themeId?: string | null;
    description?: string | null;
    coverImage?: string | null;
    logo?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  } | null;

  categories: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
  }[];

  banners: {
    id: string;
    title: string | null;
    image: string;
    isActive: boolean;
  }[];

  products: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    compareAtPrice: number | null;
    image: string | null;
    isFeatured: boolean;
    isActive: boolean;
    category: {
      name: string;
      slug: string;
      image: string | null;
    } | null;
  }[];
};

export type StoreThemeProps = {
  store: StoreThemeData;
};