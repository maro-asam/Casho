import "./riwaq.css";

import type { StorefrontTheme } from "../types";
import RiwaqCart from "./cart/RiwaqCart";
import RiwaqCheckout from "./cart/RiwaqCheckout";
import { RiwaqCategoriesIndex, RiwaqCategory } from "./categories/RiwaqCategories";
import { riwaqDisplay } from "./fonts";
import RiwaqFooter from "./footer/RiwaqFooter";
import RiwaqHeader from "./header/RiwaqHeader";
import RiwaqHome from "./home/RiwaqHome";
import { RiwaqAbout, RiwaqContact } from "./info/RiwaqInfo";
import RiwaqListing from "./listing/RiwaqListing";
import RiwaqProduct from "./pdp/RiwaqProduct";
import { RiwaqStoreClosed } from "./states";

export const riwaqTheme: StorefrontTheme = {
  rootClassName: `theme-riwaq ${riwaqDisplay.variable}`,
  Header: RiwaqHeader,
  Footer: RiwaqFooter,
  Home: RiwaqHome,
  ProductListing: RiwaqListing,
  CategoriesIndex: RiwaqCategoriesIndex,
  Category: RiwaqCategory,
  Product: RiwaqProduct,
  Cart: RiwaqCart,
  Checkout: RiwaqCheckout,
  About: RiwaqAbout,
  Contact: RiwaqContact,
  StoreClosed: RiwaqStoreClosed,
};
