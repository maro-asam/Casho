import "./maximize.css";

import type { StorefrontTheme } from "../types";
import MaxCart from "./cart/MaxCart";
import MaxCheckout from "./cart/MaxCheckout";
import { MaxCategoriesIndex, MaxCategory } from "./categories/MaxCategories";
import MaxFooter from "./footer/MaxFooter";
import MaxHeader from "./header/MaxHeader";
import MaxHome from "./home/MaxHome";
import { MaxAbout, MaxContact, MaxTrack } from "./info/MaxInfo";
import MaxListing from "./listing/MaxListing";
import MaxProduct from "./pdp/MaxProduct";
import { MaxStoreClosed } from "./states";

export const maximizeTheme: StorefrontTheme = {
  rootClassName: "theme-maximize",
  Header: MaxHeader,
  Footer: MaxFooter,
  Home: MaxHome,
  ProductListing: MaxListing,
  CategoriesIndex: MaxCategoriesIndex,
  Category: MaxCategory,
  Product: MaxProduct,
  Cart: MaxCart,
  Checkout: MaxCheckout,
  About: MaxAbout,
  Contact: MaxContact,
  Track: MaxTrack,
  StoreClosed: MaxStoreClosed,
};
