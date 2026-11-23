import { Baloo_Bhaijaan_2 } from "next/font/google";

/** Arena's display face: Baloo Bhaijaan 2, a round heavy Arabic + Latin
 *  display type that reads like a game's UI. Headings, prices, the store name
 *  and tab labels use it; body text keeps the merchant's chosen store font. */
export const arenaDisplay = Baloo_Bhaijaan_2({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-arena-display",
  display: "swap",
});
