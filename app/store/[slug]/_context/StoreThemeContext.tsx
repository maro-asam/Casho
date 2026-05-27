"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  Store Theme Context
//
//  Provides the ResolvedTheme to all CLIENT components inside the store.
//  Server components don't need this — they rely on CSS vars that layout.tsx
//  injects at the root wrapper.
//
//  Usage (client component):
//    const theme   = useStoreTheme();      // full ResolvedTheme
//    const layout  = useThemeLayout();     // ThemeLayout (heroStyle, cardStyle…)
//    const tokens  = useThemeTokens();     // ThemeTokens (colors, radius…)
//    const sections = useThemeSections();  // ThemeSections (showHero…)
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type {
  ResolvedTheme,
  ThemeLayout,
  ThemeTokens,
  ThemeSections,
} from "@/types/store-theme.types";

// ─── Context ─────────────────────────────────────────────────────────────────

const StoreThemeCtx = createContext<ResolvedTheme | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StoreThemeProvider({
  theme,
  children,
}: {
  theme: ResolvedTheme;
  children: ReactNode;
}) {
  return (
    <StoreThemeCtx.Provider value={theme}>
      {children}
    </StoreThemeCtx.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useStoreThemeCtx(): ResolvedTheme {
  const ctx = useContext(StoreThemeCtx);
  if (!ctx) {
    throw new Error(
      "useStoreTheme() must be used inside <StoreThemeProvider>. " +
        "Make sure the store layout wraps the page tree.",
    );
  }
  return ctx;
}

/** Full resolved theme */
export function useStoreTheme(): ResolvedTheme {
  return useStoreThemeCtx();
}

/** Layout / structural config (heroStyle, cardStyle, gridCols…) */
export function useThemeLayout(): ThemeLayout {
  return useStoreThemeCtx().layout;
}

/** Design tokens (colors, radius, shadows…) */
export function useThemeTokens(): ThemeTokens {
  return useStoreThemeCtx().tokens;
}

/** Section visibility toggles */
export function useThemeSections(): ThemeSections {
  return useStoreThemeCtx().sections;
}

/** Which color scheme ("light" | "dark") the active theme uses */
export function useThemeColorScheme(): "light" | "dark" {
  return useStoreThemeCtx().colorScheme;
}
