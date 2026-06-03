export type StoreFrontHeaderProps = {
  storeName: string;
  storeSlug: string;
  logo?: string | null;
  logoRadius?: number | null;
  logoSize?: number | null;
  cartCount?: number;
  announcementText?: string | null;
  showStoreName?: boolean;
};
