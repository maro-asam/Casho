// ─────────────────────────────────────────────────────────────────────────────
//  Theme → CSS Custom Properties
//
//  Converts a ResolvedTheme into a CSSProperties object that can be spread
//  onto any React element:
//
//    <div style={buildThemeCSSVars(theme)} ...>
//
//  The CSS vars are split into two namespaces:
//    1.  `--store-*`  — store-specific vars consumed by storefront components
//    2.  `--*`        — shadcn/ui design-token overrides (background, foreground…)
//                       so every shadcn component (Button, Card, Input…)
//                       automatically adopts the merchant's theme.
// ─────────────────────────────────────────────────────────────────────────────

import type { CSSProperties } from "react";
import type { ResolvedTheme } from "@/types/store-theme.types";

export function buildThemeCSSVars(
  theme: ResolvedTheme,
  fontFamily?: string,
): CSSProperties {
  const { tokens, colorScheme } = theme;

  return {
    colorScheme: colorScheme as "light" | "dark",

    // ── shadcn/ui design-token overrides ────────────────────────────────
    // These map 1-to-1 onto Tailwind's `hsl(var(--xxx))` vars.
    // We inject raw hex here (not HSL) which is fine since shadcn v2+
    // supports that when you set the base CSS directly on the element.
    "--background": tokens.background,
    "--foreground": tokens.foreground,
    "--card": tokens.card,
    "--card-foreground": tokens.cardForeground,
    "--popover": tokens.surface,
    "--popover-foreground": tokens.surfaceForeground,
    "--primary": tokens.primary,
    "--primary-foreground": tokens.primaryForeground,
    "--secondary": tokens.secondary,
    "--secondary-foreground": tokens.secondaryForeground,
    "--muted": tokens.muted,
    "--muted-foreground": tokens.mutedForeground,
    "--accent": tokens.accent,
    "--accent-foreground": tokens.accentForeground,
    "--border": tokens.border,
    "--input": tokens.border,
    "--ring": tokens.primary,
    "--radius": tokens.radius,

    // ── Store-specific extended vars (--store-*) ─────────────────────────
    // Used by storefront components that need more granularity than shadcn
    // tokens provide.
    "--store-primary": tokens.primary,
    "--store-primary-foreground": tokens.primaryForeground,
    "--store-secondary": tokens.secondary,
    "--store-secondary-foreground": tokens.secondaryForeground,
    "--store-background": tokens.background,
    "--store-foreground": tokens.foreground,
    "--store-surface": tokens.surface,
    "--store-surface-foreground": tokens.surfaceForeground,
    "--store-card": tokens.card,
    "--store-card-foreground": tokens.cardForeground,
    "--store-muted": tokens.muted,
    "--store-muted-foreground": tokens.mutedForeground,
    "--store-border": tokens.border,
    "--store-accent": tokens.accent,
    "--store-accent-foreground": tokens.accentForeground,
    "--store-hero-overlay": tokens.heroOverlay,
    "--store-radius": tokens.radius,
    "--store-shadow-sm": tokens.shadowSm,
    "--store-shadow-md": tokens.shadowMd,
    "--store-shadow-lg": tokens.shadowLg,
    "--store-glow": tokens.glowPrimary,

    // ── Layout tokens → CSS vars ────────────────────────────────────────
    // Consumed by store components so they react to the merchant's layout
    // settings without prop-drilling.

    // Image aspect ratio for product cards
    "--store-img-ratio":
      theme.layout.imageAspectRatio === "portrait" ? "3 / 4"
      : theme.layout.imageAspectRatio === "landscape" ? "4 / 3"
      : "1 / 1",

    // Button border-radius
    "--store-btn-radius":
      theme.layout.buttonStyle === "sharp" ? "0px"
      : theme.layout.buttonStyle === "pill" ? "9999px"
      : "0.5rem",

    // Hover / transition duration
    "--store-motion":
      theme.layout.animations === "none" ? "0ms"
      : theme.layout.animations === "dynamic" ? "500ms"
      : "250ms",

    // Desktop product grid columns (consumed by .store-product-grid in layout)
    "--store-grid-cols": String(theme.layout.desktopGridCols ?? 4),

    // ── Typography ───────────────────────────────────────────────────────
    ...(fontFamily ? { fontFamily } : {}),
  } as CSSProperties;
}

// ─── CSS string builder (for <style> injection — supports dark mode) ────────
//
//  Returns a CSS string that should be injected inside a <style> tag.
//  It defines both `.store-theme-root` (light / base) and
//  `.dark .store-theme-root` (dark override) so that next-themes'
//  `.dark` class toggle automatically switches the store tokens.
//
//  Unlike inline styles, stylesheet rules respect the CSS cascade, meaning
//  `.dark .store-theme-root` correctly overrides `.store-theme-root`.

function tokensToVars(tokens: Partial<import("@/types/store-theme.types").ThemeTokens>): string {
  const map: Record<string, string | undefined> = {
    "--background":            tokens.background,
    "--foreground":            tokens.foreground,
    "--card":                  tokens.card,
    "--card-foreground":       tokens.cardForeground,
    "--popover":               tokens.surface,
    "--popover-foreground":    tokens.surfaceForeground,
    "--primary":               tokens.primary,
    "--primary-foreground":    tokens.primaryForeground,
    "--secondary":             tokens.secondary,
    "--secondary-foreground":  tokens.secondaryForeground,
    "--muted":                 tokens.muted,
    "--muted-foreground":      tokens.mutedForeground,
    "--accent":                tokens.accent,
    "--accent-foreground":     tokens.accentForeground,
    "--border":                tokens.border,
    "--input":                 tokens.border,
    "--ring":                  tokens.primary,
    "--radius":                tokens.radius,
    "--store-primary":               tokens.primary,
    "--store-primary-foreground":    tokens.primaryForeground,
    "--store-secondary":             tokens.secondary,
    "--store-secondary-foreground":  tokens.secondaryForeground,
    "--store-background":            tokens.background,
    "--store-foreground":            tokens.foreground,
    "--store-surface":               tokens.surface,
    "--store-surface-foreground":    tokens.surfaceForeground,
    "--store-card":                  tokens.card,
    "--store-card-foreground":       tokens.cardForeground,
    "--store-muted":                 tokens.muted,
    "--store-muted-foreground":      tokens.mutedForeground,
    "--store-border":                tokens.border,
    "--store-accent":                tokens.accent,
    "--store-accent-foreground":     tokens.accentForeground,
    "--store-hero-overlay":          tokens.heroOverlay,
    "--store-radius":                tokens.radius,
    "--store-shadow-sm":             tokens.shadowSm,
    "--store-shadow-md":             tokens.shadowMd,
    "--store-shadow-lg":             tokens.shadowLg,
    "--store-glow":                  tokens.glowPrimary,
  };

  return Object.entries(map)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
}

export function buildThemeCSSString(
  theme: ResolvedTheme,
  fontFamily?: string,
  darkTokens?: Partial<import("@/types/store-theme.types").ThemeTokens>,
): string {
  const { tokens, colorScheme, layout } = theme;

  const gridColsSm = Math.min(layout.desktopGridCols, 3);
  const gridColsLg = layout.desktopGridCols;

  const btnRadius =
    layout.buttonStyle === "sharp" ? "0px"
    : layout.buttonStyle === "pill" ? "9999px"
    : "0.5rem";

  const motion =
    layout.animations === "none" ? "0ms"
    : layout.animations === "dynamic" ? "500ms"
    : "250ms";

  const imgRatio =
    layout.imageAspectRatio === "portrait" ? "3 / 4"
    : layout.imageAspectRatio === "landscape" ? "4 / 3"
    : "1 / 1";

  const layoutVars = [
    `  --store-img-ratio: ${imgRatio};`,
    `  --store-btn-radius: ${btnRadius};`,
    `  --store-motion: ${motion};`,
    `  --store-grid-cols: ${gridColsLg};`,
    fontFamily ? `  font-family: ${fontFamily};` : "",
  ].filter(Boolean).join("\n");

  const baseVars = tokensToVars(tokens);
  const baseColorScheme = colorScheme === "dark" ? "dark" : "light";

  const darkOverrideVars = darkTokens ? tokensToVars(darkTokens) : "";

  const darkBlock = darkOverrideVars
    ? `.dark .store-theme-root {\n${darkOverrideVars}\n  color-scheme: dark;\n}`
    : "";

  return [
    `.store-theme-root {\n${baseVars}\n${layoutVars}\n  color-scheme: ${baseColorScheme};\n}`,
    darkBlock,
    `@media (min-width: 640px) { .store-product-grid { grid-template-columns: repeat(${gridColsSm}, minmax(0, 1fr)) !important; } }`,
    `@media (min-width: 1024px) { .store-product-grid { grid-template-columns: repeat(${gridColsLg}, minmax(0, 1fr)) !important; } }`,
  ].filter(Boolean).join("\n\n");
}

// ─── Convenience: just the store-specific vars (for inline overrides) ──────

export function buildStoreVarsOnly(
  theme: ResolvedTheme,
): CSSProperties {
  const { tokens } = theme;
  return {
    "--store-primary": tokens.primary,
    "--store-primary-foreground": tokens.primaryForeground,
    "--store-background": tokens.background,
    "--store-foreground": tokens.foreground,
    "--store-card": tokens.card,
    "--store-card-foreground": tokens.cardForeground,
    "--store-muted": tokens.muted,
    "--store-muted-foreground": tokens.mutedForeground,
    "--store-border": tokens.border,
    "--store-radius": tokens.radius,
    "--store-glow": tokens.glowPrimary,
  } as CSSProperties;
}
