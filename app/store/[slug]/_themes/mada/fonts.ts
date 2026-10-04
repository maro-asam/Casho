import { Alexandria } from "next/font/google";

/** Mada's display face — a geometric Arabic/Latin sans for headlines, prices
 *  and navigation. Body text keeps the merchant's chosen store font. */
export const madaDisplay = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-mada-display",
  display: "swap",
});
