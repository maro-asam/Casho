import { Reem_Kufi } from "next/font/google";

/** Riwaq's display face — a geometric Kufi for headlines, prices and numerals.
 *  Body text keeps the merchant's chosen store font. */
export const riwaqDisplay = Reem_Kufi({
  subsets: ["arabic", "latin"],
  variable: "--font-riwaq-display",
  display: "swap",
});
