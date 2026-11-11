"use client";

import type { ReactNode } from "react";
import { useOptionalStoreTheme } from "../../../_context/StoreThemeContext";
import { pharmacyOn } from "./rx";

/** The Studio's "pharmacy features" switch, read from the store theme. */
export function usePharmacy(): boolean {
  return pharmacyOn(useOptionalStoreTheme()?.layout);
}

/** For server components (they can't read the theme context): renders
 *  `children` in a pharmacy, `otherwise` when the switch is off. */
export function PharmacyOnly({ children, otherwise = null }: { children: ReactNode; otherwise?: ReactNode }) {
  return usePharmacy() ? children : otherwise;
}
