# Dune (Casho Dune · كاشو ديون) — design system

Editorial, image-forward storefront modelled on the design language of the
Shopify Impulse "Dune" preset, rebuilt from scratch for Casho (no reference
code, assets or copy). Recognizable from one screenshot: a serif display face,
square photography, pill buttons, hairline rules, a transparent header over a
full-bleed hero, and slow scroll reveals.

## Principles
1. **Images lead.** Square-cornered media on a warm plate; text sits below or over photos, never in cards.
2. **Serif for voice, sans for work.** Markazi Text (Arabic + Latin) for headings, prices, numerals; the merchant's store font for body and UI.
3. **Quiet chrome.** Hairlines (`--dn-line`) instead of boxes; one umber accent for sale/announcement.
4. **Motion is slow and optional.** Reveals are CSS scroll-driven animations, so nothing touches server-rendered markup. Unsupported browsers and reduced-motion users see the static layout.
5. **Arabic-first.** Uppercase and letter-spacing are applied only in LTR (they would break Arabic joins). Drawers and arrows follow the reading direction.
6. **Merchant content only.** No placeholder claims; sections without merchant content render nothing.

## Tokens (preset `dune` in constants/store-themes.ts)
Values measured from the reference preset, then adapted.
| Role | Light | Dark |
|---|---|---|
| canvas (`--background`) | #f7f7f7 | #161513 |
| ink (`--foreground`, buttons `--primary`) | #2a2a28 | #ece9e3 |
| drawer (`--popover`) | #fcfcfc | #1d1c1a |
| plate (`--card`, large media) | #f0eee9 | #22201d |
| tile (`--muted`, footer) | #e5e5e5 | #2a2825 |
| quiet text | #68645d (5.5:1) | #a8a29a (7.2:1) |
| rule (`--border`) | #ccc9c1 | #3a3733 |
| accent (`--accent`, announcement) | #785c43 | #c7b8a1 |
| sale / price | #7d6243 (5.3:1) / #5a4a42 | #c9a67a / #e2d6c6 |
| sand (countdown band) | #c7b8a1 | #3b332a |

`dune.css` aliases them as `--dn-*`. The merchant's primary/secondary overrides flow through as usual.

## Type scale (`dune.css`)
`dn-hero` clamp(2.75–6.75rem)/1.08 · `dn-h1` clamp(2.375–3.75rem) · `dn-h2` clamp(2–3.25rem) ·
`dn-h3` clamp(1.5–2rem) · `dn-h4` 1.375rem · body .9375rem/1.75 · `dn-label` .8125rem (LTR: .6875rem caps, .2em) ·
`dn-price`/`dn-num` serif, tabular. Headings use weight 400.

## Layout
Page width 87.5rem (`dn-wrap`), gutters 17/30/40px, grid gap 17–22px, section rhythm 60/80/100px,
header 60/72/80px. Product grids: 2 → 3 → merchant columns. Featured/new/best-seller sections become a swipe rail on phones.

## Components
- **Header:** announcement bar (rotating messages split by `|` or new lines, with pause and socials) · sticky header. It turns transparent over a home hero via CSS `:has([data-under-header])`, so there is no flash. Mega menu: category columns, quick links, two image promos, hover intent, Esc, focus return. Mobile drawer with serif links and a category accordion. Predictive search drops from the top.
- **Commerce:** product card (hover image crossfade, corner tags, rising quick-view pill and quick add, centered details) · quick-view modal / bottom sheet · buy form (swatches, pill options, wholesale tiers, qty, add / buy now, sticky mobile bar) · slide-out cart drawer.
- **Home sections:** 100vh parallax slideshow (slow settle, staggered copy, progress, pause) · editorial split hero with a shoppable hotspot when there are no banners · collection tiles · promo grid · product spotlight · background image with text · scrolling text · stats · text columns · testimonials · countdown band · rich text · image banner.
- **Pages:** centered page titles or parallax collection headers · filter sidebar / drawer · sort select · active filter chips · promo tile · numbered pagination · PDP gallery with zoom, thumbnails and lightbox · +/− tabs · reviews · related products · recently viewed · cart page · checkout · about · contact.

## Motion
Durations from `--store-motion`. Easing cubic-bezier(.165,.84,.44,1).
- **Scroll-driven (`animation-timeline: view()`):** fade-up (`dn-appear`, stagger via `--d`), image crop reveal (`dn-crop`), card fade (`dn-fade`), parallax (`[data-parallax]`).
- **Transitions:** drawer and modal transitions, button sheen, link underline draw, hero settle, cart-count bump, hotspot ping.
- All disabled under `prefers-reduced-motion`.
- ⚠ A `position: fixed` element must not sit inside an animated `.dn-appear`/`.dn-crop`: the active transform makes that ancestor its containing block.

## Not done / constraints
- No customer accounts, wishlist or newsletter backend in Casho, so none of them appear. The newsletter section reuses the shared component (it simulates a submit).
- Banners carry only image and title, so slide links go to the product listing.
- Hotspots exist only on the no-banner hero, placed on the lead product's own photo. Banners have no product data to pin.
