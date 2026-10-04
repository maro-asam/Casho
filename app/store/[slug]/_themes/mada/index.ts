import "./mada.css";

import type { StorefrontTheme } from "../types";
import MadaCart from "./cart/MadaCart";
import MadaCheckout from "./cart/MadaCheckout";
import { MadaCategoriesIndex, MadaCategory } from "./categories/MadaCategories";
import { madaDisplay } from "./fonts";
import MadaFooter from "./footer/MadaFooter";
import MadaHeader from "./header/MadaHeader";
import MadaHome from "./home/MadaHome";
import { MadaAbout, MadaContact } from "./info/MadaInfo";
import MadaListing from "./listing/MadaListing";
import MadaProduct from "./pdp/MadaProduct";
import { MadaStoreClosed } from "./states";

export const madaTheme: StorefrontTheme = {
  rootClassName: `theme-mada ${madaDisplay.variable}`,
  Header: MadaHeader,
  Footer: MadaFooter,
  Home: MadaHome,
  ProductListing: MadaListing,
  CategoriesIndex: MadaCategoriesIndex,
  Category: MadaCategory,
  Product: MadaProduct,
  Cart: MadaCart,
  Checkout: MadaCheckout,
  About: MadaAbout,
  Contact: MadaContact,
  StoreClosed: MadaStoreClosed,
};
