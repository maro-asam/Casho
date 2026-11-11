# Casho landing — design notes

The marketing page at `/` (app/(welcome)/page.tsx). Apple-style: full-bleed
sections alternating light / dark, one idea per section. Tokens and glass
recipes live in `apple.css` (scoped under `.al`); the hero has its own
`hero-grow.css`.

## Tokens

| Token | Light | Dark |
|---|---|---|
| `--al-bg` | `#ffffff` | `#000000` |
| `--al-text` | `#1d1d1f` | `#f5f5f7` |
| `--al-muted` | `#6e6e73` | `#a1a1a6` |
| `--al-tint` (brand) | `#1447e6` | `#3366ff` |
| `--al-new` (badge accent) | `#b64400` | `#ff9f45` |

One accent: the brand blue. Headline emphasis uses `.al-gradient-text`
(deep navy → brand → light brand, never purple). Ink (`--al-text`) is the
second "colour" wherever the shop / till appears; blue is online.

## Type

Cairo (Arabic + Latin), weights 400 / 600 / 700. `globals.css` forces
`font-light` on `*`; inside `.al` weights inherit again. Never letter-space
Arabic — tracking rules are `[dir="ltr"]` only. Numbers are Latin digits with
`tabular-nums`.

## Motion

Entrances are CSS (they run before hydration): headline lines only translate
(they are the LCP), everything else fades up. Easing
`cubic-bezier(0.16, 1, 0.3, 1)`, no bounce. Loops run only on screen and in a
visible tab; `prefers-reduced-motion` gets the finished state.

## Hero — "ابدأ صغير. كبّر بسرعة. كله على كاشو."

`HeroGrow.tsx` + `GrowthBoard.tsx` + `growth-board-data.ts`.

- The headline sits on the start side. On `lg+` the whole hero behind it is a
  dot-matrix board (canvas); below `lg` the board stacks under the text.
- Lit dots are orders: one dot under the CTA ("ابدأ من هنا"), compounding
  toward the far side into today's column. Blue = online, ink = the shop,
  stacked in the same columns (one business, one place). Unlit dots run to the
  screen edges and fade toward the headline.
- Flags mark what the store added while growing (online payments, the shop,
  shipping, a domain, a second branch). They are placed at runtime around the
  headline's actual text lines and each other; one that doesn't fit is
  dropped (lower `priority` first). Today's card always wins.
- Live: after the build, an order drops into today's column every 2.6 s and
  today's numbers tick. Hover / tap a column for its month and numbers.
- The story is deterministic (seeded) — change it in `growth-board-data.ts`
  (milestones, `SHOP_OPENS`, `GROWTH`, seasonal bumps); covered by
  `growth-board-data.test.ts`.

## What didn't work before (don't repeat)

Split hero with a product-UI mockup and floating glass cards; glossy CG
(prism, liquid drops); cute literal objects (receipt printer); a thin line
drawing with lots of white ("تقليدي / فاضي").

_Last updated: 2026-11-12 — growth board hero._
