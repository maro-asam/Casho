import "./gym.css";

import type { StorefrontTheme } from "../types";
import GymCart from "./cart/GymCart";
import GymCheckout from "./cart/GymCheckout";
import { GymCategoriesIndex, GymCategory } from "./categories/GymCategories";
import GymFooter from "./footer/GymFooter";
import GymHeader from "./header/GymHeader";
import GymHome from "./home/GymHome";
import { GymAbout, GymContact, GymTrack, GymPolicy } from "./info/GymInfo";
import GymListing from "./listing/GymListing";
import GymProduct from "./pdp/GymProduct";
import { GymStoreClosed } from "./states";

export const gymTheme: StorefrontTheme = {
  rootClassName: "theme-gym",
  Header: GymHeader,
  Footer: GymFooter,
  Home: GymHome,
  ProductListing: GymListing,
  CategoriesIndex: GymCategoriesIndex,
  Category: GymCategory,
  Product: GymProduct,
  Cart: GymCart,
  Checkout: GymCheckout,
  About: GymAbout,
  Contact: GymContact,
  Track: GymTrack,
  Policy: GymPolicy,
  StoreClosed: GymStoreClosed,
};
