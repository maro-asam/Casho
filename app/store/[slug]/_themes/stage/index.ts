import "./stage.css";

import type { StorefrontTheme } from "../types";
import StageCart from "./cart/StageCart";
import StageCheckout from "./cart/StageCheckout";
import { StageCategoriesIndex, StageCategory } from "./categories/StageCategories";
import StageFooter from "./footer/StageFooter";
import StageHeader from "./header/StageHeader";
import StageHome from "./home/StageHome";
import { StageAbout, StageContact, StageTrack } from "./info/StageInfo";
import StageListing from "./listing/StageListing";
import StageProduct from "./pdp/StageProduct";
import { StageStoreClosed } from "./states";

export const stageTheme: StorefrontTheme = {
  rootClassName: "theme-stage",
  Header: StageHeader,
  Footer: StageFooter,
  Home: StageHome,
  ProductListing: StageListing,
  CategoriesIndex: StageCategoriesIndex,
  Category: StageCategory,
  Product: StageProduct,
  Cart: StageCart,
  Checkout: StageCheckout,
  About: StageAbout,
  Contact: StageContact,
  Track: StageTrack,
  StoreClosed: StageStoreClosed,
};
