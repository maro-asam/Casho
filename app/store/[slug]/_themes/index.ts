// ─────────────────────────────────────────────────────────────────────────────
//  Storefront theme registry
//  Maps a theme preset id to the components that render the storefront.
//  To add a theme: build it under ./<name>/ implementing StorefrontTheme,
//  add its id to THEME_PRESET_IDS and register it here.
// ─────────────────────────────────────────────────────────────────────────────

import { isThemePresetId, type ThemePresetId } from "@/types/store-theme.types";
import { classicTheme } from "./classic";
import { duneTheme } from "./dune";
import { madaTheme } from "./mada";
import { maximizeTheme } from "./maximize";
import { celloTheme } from "./cello";
import { riwaqTheme } from "./riwaq";
import type { StorefrontTheme } from "./types";

const THEMES: Record<ThemePresetId, StorefrontTheme> = {
  default: classicTheme,
  riwaq: riwaqTheme,
  mada: madaTheme,
  dune: duneTheme,
  maximize: maximizeTheme,
  cello: celloTheme,
};

export function getStorefrontTheme(themeId?: string | null): StorefrontTheme {
  return THEMES[isThemePresetId(themeId) ? themeId : "default"];
}

export type { StorefrontTheme } from "./types";
