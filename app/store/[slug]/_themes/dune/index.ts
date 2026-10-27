import "./dune.css";

import type { StorefrontTheme } from "../types";
import DuneCart from "./cart/DuneCart";
import DuneCheckout from "./cart/DuneCheckout";
import { DuneCategoriesIndex, DuneCategory } from "./categories/DuneCategories";
import { duneDisplay } from "./fonts";
import DuneFooter from "./footer/DuneFooter";
import DuneHeader from "./header/DuneHeader";
import DuneHome from "./home/DuneHome";
import { DuneAbout, DuneContact, DuneTrack } from "./info/DuneInfo";
import DuneListing from "./listing/DuneListing";
import DuneProduct from "./pdp/DuneProduct";
import { DuneStoreClosed } from "./states";

export const duneTheme: StorefrontTheme = {
  rootClassName: `theme-dune ${duneDisplay.variable}`,
  Header: DuneHeader,
  Footer: DuneFooter,
  Home: DuneHome,
  ProductListing: DuneListing,
  CategoriesIndex: DuneCategoriesIndex,
  Category: DuneCategory,
  Product: DuneProduct,
  Cart: DuneCart,
  Checkout: DuneCheckout,
  About: DuneAbout,
  Contact: DuneContact,
  Track: DuneTrack,
  StoreClosed: DuneStoreClosed,
};
