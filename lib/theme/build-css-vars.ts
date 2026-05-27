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
