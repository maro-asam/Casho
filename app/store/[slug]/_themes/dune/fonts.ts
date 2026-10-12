import { Markazi_Text } from "next/font/google";

/** Dune's display face — an editorial Arabic/Latin serif (Markazi Text) for
 *  headlines, prices and numerals, standing in for the serif display of the
 *  reference design. Body text keeps the merchant's chosen store font. */
export const duneDisplay = Markazi_Text({
  subsets: ["arabic", "latin"],
  weight: "variable",
  variable: "--font-dune-display",
  display: "swap",
});
