import "./market.css";

import type { StorefrontTheme } from "../types";
import MarketCart from "./cart/MarketCart";
import MarketCheckout from "./cart/MarketCheckout";
import { MarketCategoriesIndex, MarketCategory } from "./categories/MarketCategories";
import MarketFooter from "./footer/MarketFooter";
import MarketHeader from "./header/MarketHeader";
import MarketHome from "./home/MarketHome";
import { MarketAbout, MarketContact, MarketTrack } from "./info/MarketInfo";
import MarketListing from "./listing/MarketListing";
import MarketProduct from "./pdp/MarketProduct";
import { MarketStoreClosed } from "./states";

export const marketTheme: StorefrontTheme = {
  rootClassName: "theme-market",
  Header: MarketHeader,
  Footer: MarketFooter,
  Home: MarketHome,
  ProductListing: MarketListing,
  CategoriesIndex: MarketCategoriesIndex,
  Category: MarketCategory,
  Product: MarketProduct,
  Cart: MarketCart,
  Checkout: MarketCheckout,
  About: MarketAbout,
  Contact: MarketContact,
  Track: MarketTrack,
  StoreClosed: MarketStoreClosed,
};
