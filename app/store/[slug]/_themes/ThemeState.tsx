"use client";

// Loading / not-found boundaries are server files that don't know the store,
// but they render inside the store layout, so the active theme is in context.
// This picks the matching theme's state screen. Only state components are
// imported here, so other themes' pages never reach the client bundle.

import { isThemePresetId, type ThemePresetId } from "@/types/store-theme.types";
import { useOptionalStoreTheme } from "../_context/StoreThemeContext";
import {
  CategoriesSkeleton,
  ClassicNotFound,
  HomeSkeleton,
  ListingSkeleton,
  PageSkeleton,
  ProductGridPageSkeleton,
  ProductSkeleton,
} from "./classic/states";
import {
  RiwaqCategoriesSkeleton,
  RiwaqGridPageSkeleton,
  RiwaqHomeSkeleton,
  RiwaqListingSkeleton,
  RiwaqNotFound,
  RiwaqPageSkeleton,
  RiwaqProductSkeleton,
} from "./riwaq/states";
import {
  MadaCategoriesSkeleton,
  MadaGridPageSkeleton,
  MadaHomeSkeleton,
  MadaListingSkeleton,
  MadaNotFound,
  MadaPageSkeleton,
  MadaProductSkeleton,
} from "./mada/states";
import {
  DuneCategoriesSkeleton,
  DuneGridPageSkeleton,
  DuneHomeSkeleton,
  DuneListingSkeleton,
  DuneNotFound,
  DunePageSkeleton,
  DuneProductSkeleton,
} from "./dune/states";
import {
  MaxCategoriesSkeleton,
  MaxGridPageSkeleton,
  MaxHomeSkeleton,
  MaxListingSkeleton,
  MaxNotFound,
  MaxPageSkeleton,
  MaxProductSkeleton,
} from "./maximize/states";
import {
  CelloCategoriesSkeleton,
  CelloGridPageSkeleton,
  CelloHomeSkeleton,
  CelloListingSkeleton,
  CelloNotFound,
  CelloPageSkeleton,
  CelloProductSkeleton,
} from "./cello/states";

type StateKind = "home" | "listing" | "product" | "page" | "categories" | "grid" | "not-found";

const STATES: Record<ThemePresetId, Record<StateKind, React.ComponentType>> = {
  default: {
    home: HomeSkeleton,
    listing: ListingSkeleton,
    product: ProductSkeleton,
    page: PageSkeleton,
    categories: CategoriesSkeleton,
    grid: ProductGridPageSkeleton,
    "not-found": ClassicNotFound,
  },
  riwaq: {
    home: RiwaqHomeSkeleton,
    listing: RiwaqListingSkeleton,
    product: RiwaqProductSkeleton,
    page: RiwaqPageSkeleton,
    categories: RiwaqCategoriesSkeleton,
    grid: RiwaqGridPageSkeleton,
    "not-found": RiwaqNotFound,
  },
  mada: {
    home: MadaHomeSkeleton,
    listing: MadaListingSkeleton,
    product: MadaProductSkeleton,
    page: MadaPageSkeleton,
    categories: MadaCategoriesSkeleton,
    grid: MadaGridPageSkeleton,
    "not-found": MadaNotFound,
  },
  dune: {
    home: DuneHomeSkeleton,
    listing: DuneListingSkeleton,
    product: DuneProductSkeleton,
    page: DunePageSkeleton,
    categories: DuneCategoriesSkeleton,
    grid: DuneGridPageSkeleton,
    "not-found": DuneNotFound,
  },
  maximize: {
    home: MaxHomeSkeleton,
    listing: MaxListingSkeleton,
    product: MaxProductSkeleton,
    page: MaxPageSkeleton,
    categories: MaxCategoriesSkeleton,
    grid: MaxGridPageSkeleton,
    "not-found": MaxNotFound,
  },
  cello: {
    home: CelloHomeSkeleton,
    listing: CelloListingSkeleton,
    product: CelloProductSkeleton,
    page: CelloPageSkeleton,
    categories: CelloCategoriesSkeleton,
    grid: CelloGridPageSkeleton,
    "not-found": CelloNotFound,
  },
};

export default function ThemeState({ kind }: { kind: StateKind }) {
  const id = useOptionalStoreTheme()?.id;
  const Comp = STATES[isThemePresetId(id) ? id : "default"][kind];
  return <Comp />;
}
