export type StoreThemeData = {
  id: string;
  name: string;
  slug: string;
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
    isActive: unknown;
    id: string;
    title: string | null;
    image: string;
  }[];
  products: {
    description: import("react/jsx-runtime").JSX.Element;
    id: string;
    name: string;
    slug: string;
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
