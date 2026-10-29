import "./medical.css";

import type { StorefrontTheme } from "../types";
import MedicalCart from "./cart/MedicalCart";
import MedicalCheckout from "./cart/MedicalCheckout";
import { MedicalCategoriesIndex, MedicalCategory } from "./categories/MedicalCategories";
import MedicalFooter from "./footer/MedicalFooter";
import MedicalHeader from "./header/MedicalHeader";
import MedicalHome from "./home/MedicalHome";
import { MedicalAbout, MedicalContact, MedicalTrack } from "./info/MedicalInfo";
import MedicalListing from "./listing/MedicalListing";
import MedicalProduct from "./pdp/MedicalProduct";
import { MedicalStoreClosed } from "./states";

export const medicalTheme: StorefrontTheme = {
  rootClassName: "theme-medical",
  Header: MedicalHeader,
  Footer: MedicalFooter,
  Home: MedicalHome,
  ProductListing: MedicalListing,
  CategoriesIndex: MedicalCategoriesIndex,
  Category: MedicalCategory,
  Product: MedicalProduct,
  Cart: MedicalCart,
  Checkout: MedicalCheckout,
  About: MedicalAbout,
  Contact: MedicalContact,
  Track: MedicalTrack,
  StoreClosed: MedicalStoreClosed,
};
