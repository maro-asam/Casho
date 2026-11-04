import "./qirat.css";

import type { StorefrontTheme } from "../types";
import QiratCart from "./cart/QiratCart";
import QiratCheckout from "./cart/QiratCheckout";
import { QiratCategoriesIndex, QiratCategory } from "./categories/QiratCategories";
import { qiratArabic, qiratLatin } from "./fonts";
import QiratFooter from "./footer/QiratFooter";
import QiratHeader from "./header/QiratHeader";
import QiratHome from "./home/QiratHome";
import { QiratAbout, QiratContact, QiratTrack } from "./info/QiratInfo";
import QiratListing from "./listing/QiratListing";
import QiratProduct from "./pdp/QiratProduct";
import { QiratStoreClosed } from "./states";

export const qiratTheme: StorefrontTheme = {
  rootClassName: `theme-qirat ${qiratArabic.variable} ${qiratLatin.variable}`,
  Header: QiratHeader,
  Footer: QiratFooter,
  Home: QiratHome,
  ProductListing: QiratListing,
  CategoriesIndex: QiratCategoriesIndex,
  Category: QiratCategory,
  Product: QiratProduct,
  Cart: QiratCart,
  Checkout: QiratCheckout,
  About: QiratAbout,
  Contact: QiratContact,
  Track: QiratTrack,
  StoreClosed: QiratStoreClosed,
};
