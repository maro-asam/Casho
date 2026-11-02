# Casho Market (كاشو ماركت) — design system

Storefront for supermarkets, groceries and kiosks. Built from scratch for Casho, in Apple's language (HIG + Liquid Glass): content on a plain page, gray tiles, chrome floating on glass, one tint for what you can tap. Shoppers fill a basket from the shelf without opening a page.

## Principles
1. **Light and dark are one design.** `market.css` mixes every surface from `--background` / `--foreground`; the preset's `darkTokens` only swap those two plus the tints. The preset is `adaptive`: shoppers switch appearance, so the merchant's primary, secondary and accent apply to both, their surface colors stay in light mode, and text on the tint is recomputed for each (`resolveStoreTheme`).
2. **Appearance follows the device until the shopper chooses** (`lib/appearance.ts`): a one-tap toggle in the bar, Automatic / Light / Dark in the footer. An inline script stops a white flash on a dark device's first visit. Inside the Studio canvas the choice stays in the frame, so previewing dark never flips the merchant's dashboard.
3. **Glass is chrome, never content.** Only the bar, tab bar and menus use `.mk-glass`. Content scrolls beneath them with a fading scroll edge instead of a hairline.
4. **One tint.** The merchant's primary marks what's interactive: the stepper, the cart, the main button. Nothing static is tinted. Aisle icons are the exception, like home-screen icons they carry their own system colors.
5. **Nothing fake.** Charts come from real sales, badges from real discounts, `isNew` and stock; the timer is the merchant's own; the Join section and the shopping list hand off to WhatsApp because Casho has no inbox for them.

## Signature pieces
- **Stepper** (`product/Stepper.tsx`, `lib/cart-lines.ts`): a round + grows into − qty + in place. Taps update one shared picture of the cart at once and queue on the server in order; a failure undoes the tap and shows a toast. Products with options open their sheet instead.
- **Aisles as app icons** (`sections/CategoryShelf.tsx`, `lib/category-icon.tsx`): the icon and color come from the aisle's name, kiosk shelves included (cigarettes, recharge cards, newspapers); a photo fills the icon.
- **Tab bar + basket** (`header/TabBar.tsx`): a floating glass tab bar on phones that shrinks while scrolling down, with the basket total riding above it like a mini player. Screens with their own bottom action hide it.
- **Spotlight search** (`header/SearchSheet.tsx`): every search button opens one surface, ⌘K on desktop, a full sheet on phones.
- **Shopping list** (`sections/ShoppingList.tsx`, section `showShoppingList`, only offered with this theme): written like a note, kept in the browser and sent to the store's WhatsApp. Made for shops whose shelves aren't all online.
- **Top charts** for best sellers, **message bubbles** for testimonials, **grouped lists** for promises and delivery facts.

## The Studio drives the layout

| Studio setting | Effect |
|---|---|
| Navbar `default` (theme default) / `centered` / `compact` | logo, links, search pill, cart / logo centered with links on a second row / wide search field (also on phones) |
| Hero `fullscreen` (default) / `split` / `compact` / `minimal` | one big rounded tile at a time / copy on a tile beside the photo / short swipeable cards / greeting and search. Without banners: the greeting beside real products |
| Product card `default` / `bold` / `minimal` / `elegant` | tile with the stepper on its corner / big full-width add button and larger price / no tile / centered copy (`[data-card]` on the store root) |
| Category shape `square` (default) / `circle` / `pill` | app icons / circles / chips |
| Buttons `sharp` / `rounded` / `pill` (default) | `--store-btn-radius` on every button and the stepper |
| Image ratio, grid columns | `--store-img-ratio`, `--store-grid-cols` (grids, rails, listing; minus one column beside the filter panel) |
| Density | `[data-density]` → section spacing and gaps |
| Motion `subtle` (default) / `dynamic` / `none` | `[data-motion]`: fades in; dynamic adds travel; none stops everything including the hero's auto-advance |
| Colors, fonts, logo, announcement | store tokens, the store font and `StoreShell`. Secondary is the wash behind deals and offer chips |
| Section order, switches, content | `renderSections`; the preset has its own `sectionOrder` |

## Tokens (preset `market` in constants/store-themes.ts)

| Role | Light | Dark | Alias |
|---|---|---|---|
| page (`--background`) | #ffffff | #000000 | `--mk-bg` |
| label (`--foreground`) | #1d1d1f | #f5f5f7 | `--mk-ink`; `--mk-label-2/3`, `--mk-cell`, `--mk-fill`, `--mk-sep` are mixes of it |
| tint (`--primary`) | #f26a00 | #ff9230 | `--mk-btn`; `--mk-tint` is the version that reads as text |
| wash (`--secondary`) | #fff1e4 | #3a2410 | `--mk-wash` |
| plate | #f6f6f7 | #e7e7ea | `--mk-plate`, fixed: pack shots with white backgrounds multiply onto it |

The tint is darker than Apple's system orange because white text on `#ff8d28` fails contrast; dark mode uses the system orange with dark text. Fonts: the store's, weights 400–700. Arabic is never letter-spaced, so type carries hierarchy through size and weight only.

## Not done / constraints
- While the Studio canvas is switched to dark, a live background or text color edit shows on top of the dark surfaces until it's saved; the live store keeps those colors to light mode.
- Sizes are options on one price, so they don't change it (wholesale tiers do).
- No delivery slots or minimum order: neither exists in Casho.
