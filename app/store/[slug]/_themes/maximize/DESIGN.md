# Maximize (ماكسيمايز) — design system

Large-catalog, conversion-first storefront modelled on the Shopify **Maximize**
theme by Omni Themes (preset "Maximize", demo `maximize-evolutions.myshopify.com`),
rebuilt from scratch for Casho. No reference code, assets or copy were reused;
layout, proportions and tokens were measured from the live demo (desktop 1440px,
mobile 390px) and adapted to RTL.

## Principles
1. **Find it fast.** Wide search with a category scope sits in the header; a tabbed "all categories" mega menu, a category strip and dense grids follow.
2. **Products on plates.** Product shots are contained on a soft grey plate (10px radius) and multiplied into it, so cut-outs read like the reference and photos stay whole.
3. **Deals in red, actions in emerald.** Sale prices, "−%" chips and promo seals use red; buttons and links use the merchant's primary (emerald by default).
4. **Real data only.** Badges come from real discounts, `isNew`, `isFeatured` and stock. Promo seals appear only on products with an actual discount. Sections without merchant content render nothing.
5. **Arabic-first.** Cairo for Arabic display and Inter for Latin (both loaded by the root layout); body uses the merchant's store font. Drawers, chevrons, rails and underlines follow the reading direction. Arabic is never tracked or uppercased.

## Tokens (preset `maximize` in constants/store-themes.ts)
| Role | Light | Dark | Reference |
|---|---|---|---|
| canvas (`--background`) | #ffffff | #171a22 | #ffffff / #171a22 |
| ink (`--foreground`) | #100f0f | #ffffff | heading 16 15 15 |
| buttons (`--primary`) | #0b7f6f (emerald) | #2bbfa8 | 45 72 149 |
| links (`--accent-foreground`) | #075e52 | #7fdcc9 | 15 57 139 |
| brand tint (`--accent`) | #e3f4f1 | #12332f | collection banner |
| plate (`--card`) | #f4f4f5 | #232834 | product card bg |
| rule (`--border`) | #e7e7ea | #2c313d | 241 241 241 |
| sale / seal | #d0202e / #b3232c | #ff6b72 / #c4313a | red seal, price |

`maximize.css` aliases them as `--mx-*`. Merchant primary/secondary overrides flow through as usual.

## Shape, type and layout
Radii 10 / 12 / 6px (cards / banners / buttons-inputs). Page width full screen (100%), gutters 16/24/32px, grid gap 12px.
Headings bold (700) display face; body 14px/1.6. Header row 84px desktop, 60px phones.
Product grids: 2 → 3 → 4 (5–6 when the sidebar is hidden on wide screens). Rails show 2.2 / 3.3 / 5 / 6 cards.

## Components
- **Header:** scrolling promo bar (merchant announcement split by `|` or new lines, pausable) · main row: blue "Menu" drawer button, logo, search bar with category scope and predictive panel (recent searches, store picks, matching categories/products, ↑/↓ + Enter), WhatsApp, cart badge · nav row: "Shop by category" tabbed mega menu, top categories, new arrivals (with a "new" tag), store picks, all products · utility bar with store pages and contact · sticky on scroll-up · back-to-top.
- **Home (reference order):** category strip → promotion grid (bento: lead banner/deal, tall tile with real "save %" seal, category tiles) → trust row (merchant's "why choose us") → featured collection rails (eyebrow, title, countdown from the merchant's end date, "View all »") → wide media banner → tabbed collection (category tabs with photos) → promo tiles (2 wide + 3) → "Exclusive in …" story with category grid → testimonials cards → category circles → stats → rich text.
- **Product card:** plate, stacked labels (store pick / price drop / new / sold out), hover quick view (side) + add-to-cart bar (bottom), brand, one-line title, rating, price + compare-at + "−%" chip, swatches, stock line. List view lays it out horizontally.
- **Collection:** tinted collection banner (category photo when present) · breadcrumbs · category pills · bordered toolbar (filter toggle, count, sort, list/grid) · collapsible filter sidebar / mobile drawer · active chips + clear all · numbered pagination with progress.
- **Product page:** vertical thumbnails + main image with hover zoom and lightbox (swipe strip with dots on phones) · sticky buy box (title, rating, price, saving, stock, options, quantity, add / buy now, quantity-pricing cards, delivery facts from real shipping methods) · description / specification table / shipping accordions · reviews · related rail · recently viewed.
- **Cart:** slide-out drawer (quantities, remove, recommendations, subtotal, cart/checkout) · cart page (shipping methods, coupon, loyalty, totals, mobile sticky total) · checkout (shared form, order summary).

## Motion
Durations from `--store-motion`; easing cubic-bezier(.22,.61,.36,1). Drawers 420ms, popups 300ms, menu 300ms, image hover zoom 500ms, card hover 300–400ms, section fade-up as they enter (scroll-driven CSS, no JS). All disabled under `prefers-reduced-motion`.

## Not done / constraints
- No customer accounts, wishlist, product comparison, store locator, B2B login or newsletter backend in Casho, so none of them appear. The shared newsletter section only simulates a submit, so Maximize renders nothing for it.
- Categories are flat (no sub-collections), so the mega menu is "tabbed" by category instead of multi-level columns.
- Banners carry only an image and a title, so banner links go to the product listing.
- Variant-specific prices/images don't exist in the data model (sizes/colors are options on one price), so choosing an option doesn't change the price; wholesale tiers do.
