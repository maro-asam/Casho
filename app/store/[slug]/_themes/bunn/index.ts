import "./bunn.css";

import type { StorefrontTheme } from "../types";
import BunnCart from "./cart/BunnCart";
import BunnCheckout from "./cart/BunnCheckout";
import { BunnCategoriesIndex, BunnCategory } from "./categories/BunnCategories";
import { bunnArabic, bunnLatin } from "./fonts";
import BunnFooter from "./footer/BunnFooter";
import BunnHeader from "./header/BunnHeader";
import BunnHome from "./home/BunnHome";
import { BunnAbout, BunnContact, BunnPolicy, BunnTrack } from "./info/BunnInfo";
import BunnListing from "./listing/BunnListing";
import BunnProduct from "./pdp/BunnProduct";
import { BunnStoreClosed } from "./states";

export const bunnTheme: StorefrontTheme = {
  rootClassName: `theme-bunn ${bunnArabic.variable} ${bunnLatin.variable}`,
  Header: BunnHeader,
  Footer: BunnFooter,
  Home: BunnHome,
  ProductListing: BunnListing,
  CategoriesIndex: BunnCategoriesIndex,
  Category: BunnCategory,
  Product: BunnProduct,
  Cart: BunnCart,
  Checkout: BunnCheckout,
  About: BunnAbout,
  Contact: BunnContact,
  Track: BunnTrack,
  Policy: BunnPolicy,
  StoreClosed: BunnStoreClosed,
};
