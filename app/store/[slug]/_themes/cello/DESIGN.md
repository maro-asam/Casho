# Cello (تشيلو) — design system

Electronics storefront modelled on the Shopify **Cello** theme by Webibazaar
(preset "Cello", demo `cello-melody-theme.myshopify.com`), rebuilt for Casho.
No reference code, assets or copy were reused; layout, proportions and tokens
were taken from the live demo (desktop 1440px, mobile 390px) and adapted to
RTL and to Casho's brand blue.

## Principles
1. **Navy chrome, blue actions, yellow search.** Promo bar, countdown boxes, carousel arrows and footer are a deep navy mixed from the store's primary; buttons use the primary itself (Casho blue `#1447e6` by default); the search button and "Buy now" use the secondary (Cello yellow `#fdc500`).
2. **White cards on a light grey canvas.** Products, categories and panels are white 8px cards on `#f8f8f8`; product shots are contained, never cropped.
3. **Real data only.** "Save X" badges come from real compare-at prices, "New" from `isNew`, stock counts from real stock, delivery facts from real shipping methods, the countdown from the merchant's own end date. Sections without merchant content render nothing; there is no newsletter (no backend), brand-logo strip or blog (no data).
4. **Arabic-first.** Cairo for display and body; Latin falls back to Inter. Drawers, arrows, sliders and underlines follow the reading direction. Arabic is never italicised, tracked or uppercased.

## Tokens (preset `cello` in constants/store-themes.ts)
| Role | Light | Dark | Reference |
|---|---|---|---|
| canvas (`--background`) | #f8f8f8 | #0f1420 | 248 248 248 |
| cards (`--card`) | #ffffff | #161c2b | white cards |
| ink (`--foreground`) | #202020 | #f2f4f8 | 32 32 32 |
| buttons (`--primary`) | #1447e6 (Casho blue) | #4d7bff | 0 41 107 |
| search / buy now (`--secondary`) | #fdc500 | #fdc500 | 253 197 0 |
| navy chrome (`--ce-navy`) | primary 40% + #000a24 | #0b1222 | 0 41 107 |
| sale / save badge | #e02424 | #d63131 | red badge |
| new badge | #1a6fe6 | #2f7cf0 | 21 110 228 |
| in stock | #108017 | #5ccf69 | progress green |

`cello.css` aliases them as `--ce-*`. Merchant primary/secondary overrides flow through as usual.

## Shape, type and layout
Radii 8 / 10 / 4px (cards / banners / buttons-inputs-badges). Page width 1600px, gutters 16/24/40px, grid gap 16px.
Headings medium-weight (600); subtitles in body color under each title. Header row 68px desktop.
Product grids: 2 → 3 (3 with the filter sidebar, 4 on very wide screens; 4–5 without it). Rails show 2 / 3 / 4 / 5 cards.

## Components
- **Header:** navy scrolling promo bar (merchant announcement split by `|` or new lines, pausable) · white main row: logo, grey search field + yellow "Search" button with predictive panel (recent searches, store picks, categories, products, ↑/↓ + Enter), WhatsApp, bag with yellow count + "Cart / N items" · nav row: "All categories" multi-column mega menu, top categories, new arrivals, all products; end side ⚡ store picks | about | contact · sticky on scroll-up · back-to-top.
- **Home (reference order):** full-width hero slideshow (prev / dots / next / pause, swipe, autoplay off under reduced motion) → category grid two rows high with header arrows → blue headline band (offer strip) → best-seller rail → deals panel (grey panel, navy countdown boxes, horizontal mini cards) → promo banners → featured-product spotlight (gallery + full buy box) → store-picks rail led by a banner tile → full-width media banner → "new arrivals" mini-card grid → testimonials carousel → navy service strip (why choose us) above the footer.
- **Product card:** white card; badge (save / new / pick / sold out) and underlined "Quick look" above the image; square navy cart button on the image corner (opens the quick view when options are needed); category, two-line title, price with red struck compare-at, "Color: …" with square swatches.
- **Collection:** rounded photo/navy banner with breadcrumbs, title and count · category chips · "Filter:" sidebar (accordions) / mobile drawer · toolbar (filter toggle, grid/list, sort, count) · active chips + clear all · numbered pagination with progress.
- **Product page:** breadcrumbs · white panel: bordered main image (hover zoom, lightbox) over bordered thumbnails; title, price + compare-at + "Sale %" badge, stock with real count, options (square swatches, small option buttons), quantity, blue add-to-cart + yellow buy-now, wholesale tiers, delivery facts · tabs (description / specifications / shipping) · reviews · related rail · recently viewed.
- **Cart:** slide-out drawer · cart page · checkout (shared form).

## Motion
Durations from `--store-motion`; easing cubic-bezier(.22,.61,.36,1). Slides cross-fade 700ms with a slow zoom, drawers 420ms, popups 300ms, card hover lift 300ms, sections fade up as they enter (scroll-driven CSS). All disabled under `prefers-reduced-motion`.

## Not done / constraints
- No customer accounts, wishlist, compare, language/currency switchers, blog, brand logos or newsletter backend in Casho, so none appear.
- Categories are flat, so the mega menu lists categories (with photos and counts) instead of nested link columns.
- Variant-specific prices/images don't exist (sizes/colors are options on one price), so choosing a color doesn't swap the image or price; wholesale tiers do change the unit price.
- The Cello demo's stock progress bar has no real scale in Casho, so only the real unit count is shown.
