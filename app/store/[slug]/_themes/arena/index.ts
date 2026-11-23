import "./arena.css";

import type { StorefrontTheme } from "../types";
import ArenaCart from "./cart/ArenaCart";
import ArenaCheckout from "./cart/ArenaCheckout";
import { ArenaCategoriesIndex, ArenaCategory } from "./categories/ArenaCategories";
import { arenaDisplay } from "./fonts";
import ArenaFooter from "./footer/ArenaFooter";
import ArenaHeader from "./header/ArenaHeader";
import ArenaHome from "./home/ArenaHome";
import { ArenaAbout, ArenaContact, ArenaPolicy, ArenaTrack } from "./info/ArenaInfo";
import ArenaListing from "./listing/ArenaListing";
import ArenaProduct from "./pdp/ArenaProduct";
import { ArenaStoreClosed } from "./states";

export const arenaTheme: StorefrontTheme = {
  rootClassName: `theme-arena ${arenaDisplay.variable}`,
  Header: ArenaHeader,
  Footer: ArenaFooter,
  Home: ArenaHome,
  ProductListing: ArenaListing,
  CategoriesIndex: ArenaCategoriesIndex,
  Category: ArenaCategory,
  Product: ArenaProduct,
  Cart: ArenaCart,
  Checkout: ArenaCheckout,
  About: ArenaAbout,
  Contact: ArenaContact,
  Track: ArenaTrack,
  Policy: ArenaPolicy,
  StoreClosed: ArenaStoreClosed,
};
