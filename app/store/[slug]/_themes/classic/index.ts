import "./classic.css";

import type { StorefrontTheme } from "../types";
import ClassicCart from "./cart/ClassicCart";
import ClassicCheckout from "./cart/ClassicCheckout";
import { ClassicCategoriesIndex, ClassicCategory } from "./categories/ClassicCategories";
import ClassicFooter from "./footer/ClassicFooter";
import ClassicHeader from "./header/ClassicHeader";
import ClassicHome from "./home/ClassicHome";
import ClassicListing from "./listing/ClassicListing";
import ClassicProduct from "./pdp/ClassicProduct";
import { ClassicAbout, ClassicContact } from "./info/ClassicInfoPages";
import { ClassicStoreClosed } from "./states";

export const classicTheme: StorefrontTheme = {
  rootClassName: "theme-classic",
  Header: ClassicHeader,
  Footer: ClassicFooter,
  Home: ClassicHome,
  ProductListing: ClassicListing,
  CategoriesIndex: ClassicCategoriesIndex,
  Category: ClassicCategory,
  Product: ClassicProduct,
  Cart: ClassicCart,
  Checkout: ClassicCheckout,
  About: ClassicAbout,
  Contact: ClassicContact,
  StoreClosed: ClassicStoreClosed,
};
