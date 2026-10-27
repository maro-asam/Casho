import "./cello.css";

import type { StorefrontTheme } from "../types";
import CelloCart from "./cart/CelloCart";
import CelloCheckout from "./cart/CelloCheckout";
import { CelloCategoriesIndex, CelloCategory } from "./categories/CelloCategories";
import CelloFooter from "./footer/CelloFooter";
import CelloHeader from "./header/CelloHeader";
import CelloHome from "./home/CelloHome";
import { CelloAbout, CelloContact, CelloTrack } from "./info/CelloInfo";
import CelloListing from "./listing/CelloListing";
import CelloProduct from "./pdp/CelloProduct";
import { CelloStoreClosed } from "./states";

export const celloTheme: StorefrontTheme = {
  rootClassName: "theme-cello",
  Header: CelloHeader,
  Footer: CelloFooter,
  Home: CelloHome,
  ProductListing: CelloListing,
  CategoriesIndex: CelloCategoriesIndex,
  Category: CelloCategory,
  Product: CelloProduct,
  Cart: CelloCart,
  Checkout: CelloCheckout,
  About: CelloAbout,
  Contact: CelloContact,
  Track: CelloTrack,
  StoreClosed: CelloStoreClosed,
};
