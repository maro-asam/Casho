# Riwaq (رواق) — design system

Editorial storefront inspired by the arcades (أروقة) of old Cairo souqs:
warm paper, ink, one terracotta accent, hairline rules instead of cards, and
the **arch** as the signature frame. Recognizable from one screenshot: Kufi
display type, ruled catalogue grid, arched images, numbered sections.

## Principles
1. **Rules, not cards.** Structure comes from 1px hairlines. No shadows, no radius (except arches).
2. **One accent.** Terracotta (`--primary`, merchant-overridable) marks state: active, sale, index numbers.
3. **Type carries the brand.** Reem Kufi for display/prices/numerals; the merchant's store font for body.
4. **Numbered like a catalogue.** Sections (٠١، ٠٢…), products, menu items, search results.
5. **Arabic-first.** No letter-spacing or uppercase on Arabic; arrows/origins follow reading direction.

## Tokens (preset `riwaq` in constants/store-themes.ts)
| Role | Light | Dark |
|---|---|---|
| paper (`--background`) | #f2ece1 | #15120f |
| ink (`--foreground`) | #1d1a16 | #eee6d7 |
| sheet (`--popover`) | #f8f4ec | #1c1814 |
| plate (`--card`, image backdrop) | #eae3d6 | #221d18 |
| quiet text | #6a6157 (5.2:1) | #a99d8c (7:1) |
| rule (`--border`) | #d6ccbb | #3a3229 |
| accent (`--primary`) | #a8432a (5.6:1 w/ paper text) | #d9673f |
| sale / success / warn | #b0261c / #3f6212 / #8a4b00 | #f07a6a / #9bc26a / #e2a54a |

Riwaq aliases them as `--rq-*` in `riwaq.css`.

## Type scale (`riwaq.css`)
`rq-display` clamp(2.6–7rem)/1.08 · `rq-h1` clamp(2–4rem) · `rq-h2` clamp(1.6–2.6rem) ·
`rq-h3` clamp(1.19–1.5rem) · `rq-h4` 1.06rem · body 1rem/1.85 · `rq-small` .875 ·
`rq-caption`/`rq-label` .8125 · `rq-price`/`rq-num` display face, tabular · `rq-sup` superscript counts.

## Layout
Container 90rem (`rq-wrap`), gutters 16/24/40px, section rhythm 4/5/7rem, bar 56/64px.
Desktop pages use a 12-col grid (7/5 splits). Every responsive grid starts at `grid-cols-1`
(minmax(0,1fr)) so long text can't widen the page.

## Components
`btn()` ink / accent / line / text with a colour sweep from the reading start · underlined
`rq-field` inputs · `rq-opt` square option chips (`aria-checked/pressed/current` = ink fill) ·
`rq-badge` · `rq-arch` (+`--line` inner hairline) · `rq-ruled` catalogue grid ·
`rq-receipt` scalloped slip + `rq-leader` dotted rows · `SectionHead`, `PageTitle`, `Crumbs`
(slash), `Price`, `Stars`, `Empty` (outlined arch), `PlateImage` (star fallback), `StarMark`.

## Images
Product plates honour `--store-img-ratio` (preset: portrait 3/4); PDP 4/5; categories arch 3/4;
banners 4:3 → 16:7 → 16:6 "plates" with captions. Missing images show the star motif.

## Motion
Durations from `--store-motion`; easing cubic-bezier(.16,1,.3,1). Button sweep, underline draw,
arrow nudge, hero arch wipe, slow-turning stamp, category ticker, scroll-driven section reveal
(`animation-timeline: view()`, static fallback), staggered menu/search lists, cart-count bump.
All disabled under `prefers-reduced-motion`.

## Not done / constraints
- Merchant funnel sections (`_components/sections/*`) are shared with Classic and keep their own look (they inherit Riwaq tokens).
- No wishlist (no data model). No newsletter backend.
- Merchant layout options honoured: grid columns, image ratio, motion. Card/hero/category style options are Riwaq-defined.

Last updated: 2026-10-04 — initial theme.
