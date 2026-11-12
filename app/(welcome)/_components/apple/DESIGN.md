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

## One system for every section

Every section below the hero uses the same parts — don't give a section its
own header, card or spacing style.

- **Header**: `SectionHead.tsx` — eyebrow, a two-tone headline (the claim in
  ink, the second beat in gray via `accent`), one subhead (max 600px). The blue
  gradient (`emphasis="gradient"`) is only for brand moments: the hero's last
  line, the Sharks teaser and the final CTA.
- **Rhythm**: sections alternate white (`.al-section`) and gray
  (`.al-section-surface`), black (`.al-dark`) for brand moments. Current order:
  hero (white) → sync (gray) → features (white) → themes (gray) → examples
  (white) → Sharks (black) → pricing (gray) → FAQ (white) → CTA (black).
- **Tiles**: `.al-tile` is always the other tone of its section (gray on
  white, white on gray), so it needs no border or shadow. `.al-well` is a tray
  inside a tile. Only depicted screens (theme previews, example browser frames)
  get a hairline / soft shadow.
- **Radii**: `--al-r-lg` 28 (tiles, panels), `--al-r-md` 18 (framed screens),
  `--al-r-sm` 12 (wells).
- **Spacing**: `.al-section` padding everywhere; `.al-body` is the one gap
  between a header and its content.
- **Captions under a picture**: `.al-item-title` / `.al-item-note`.
- **Controls**: `.al-btn-filled` (one per view), `.al-btn-gray`, `.al-link`,
  `.al-icon-btn`, `.al-chip`.
- **Promo colour**: `--al-new` (orange) for "most popular", "save x%" — no green.

## Section 2 — "one number across two worlds" (SyncSection.tsx)

A panel split into the shop (dark) and the online store (light) — side by
side, stacked on phones — with one stock number on the seam. The number is
drawn twice (`.ss-layer`) and each copy is clipped to its half, so it reads
white on the shop and ink on the store. The panel pins (`.ss-pin`) while the
visitor scrolls 240svh; four sales land at `THRESHOLDS` and the number counts
48 → 44. Phones keep only the latest sale per side (the caption shares the
online half). Reduced motion: not pinned, final state.

## Pricing (ApplePricing.tsx) — Apple One cards

Plans are **Starter / Growth / Scale** (English in both languages; the DB keys
stay SILVER / GOLD / PLATINUM — internal, wired into the trial, sales
commissions and checkout) plus **Enterprise (soon)**, which has no DB row.

- The plans as separate, roomy tiles (`.plans` / `.plan`): one column (max
  560px) below 1080px, side by side from 1080px (3 plans ≈ 370px each — 4 in
  a row was too narrow). Each: a centred head (the plan's tier icon from
  `components/plans/tier-glyph.tsx` — the same icon as the dashboard — name,
  tagline, price, one full-width button) over a list of app-icon feature rows
  (`feature-icons.tsx`, keyed by feature key, display only).
- The most popular plan (`HIGHLIGHTED_PLAN`, Growth) is the brand-blue tile:
  white text, white tier icon, white button with blue label, feature icons as
  white glass (the colourful icons clash on blue).
- Rows: the limits that differ between plans first ("لحد 3", "غير محدود"),
  then only what's new against the previous plan ("كل اللي في Starter، وكمان"),
  falling back to the full list if a plan doesn't include everything before it.
  All from the DB; BOOLEAN features never show a limit.
- Enterprise: a wide frosted-glass card under the plans (`.plan-soon`, stacked
  on phones; `.plan-frost`: blurred brand-light blobs under a white glass
  layer) with sharp text — name, "قريبًا", one sentence, "سعر خاص", one button
  to /contact-us. No promised features.
- "قارن الباقات بالتفصيل" opens Apple's compare table (real plans only).
- Taglines (`pricing.taglines` by plan key) must stay claim-free.
- Rejected (2026-11-12, "سئ جدا ومش احترافي"): one board with plan columns and
  no cards, a dot band across the top, Enterprise with blurred text.

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

_Last updated: 2026-11-12 — Apple One pricing cards (Starter / Growth / Scale + Enterprise soon)._
