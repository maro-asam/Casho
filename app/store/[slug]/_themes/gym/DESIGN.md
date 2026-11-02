# Casho Gym (كاشو جيم) — design system

Storefront for gym supplements and equipment. Built from scratch for Casho (no
reference theme). Iron, chalk and one hot color: a black gym floor, the store's
red, light chalk plates under the product shots, knurled steel texture and a
forward slant on everything that moves.

## Principles
1. **Every color is the merchant's.** `gym.css` never fixes a surface: cards, lines, drawers and quiet text are mixed from `--background` / `--foreground`, the red and its text version from `--primary`, chalk from `--secondary`. Change the background to white in the Studio and the whole theme turns light and holds; pick any palette and everything follows, live. Only the product plate (`--gy-plate`) is fixed: it stays light so pack shots with white backgrounds multiply into it. The preset's `card` / `muted` / `border` tokens are overridden from those mixes, so shared components (checkout, popups, tracker) follow too.
2. **Heavy and slanted.** Display type is the store's own font at 900 (`constants/arabic-fonts.ts` loads 800/900 where the family has them). The lean (`--gy-slant`, 12° forward in the reading direction) appears on badges, tags, eyebrow marks and, when buttons are "sharp", on the buttons. Arabic text itself is never skewed.
3. **Signature objects, real data.** The bumper plate (`sections/WeightPlate.tsx`) is drawn in code from the store colors with the store's name cast into it; it opens even an empty new store. Everything claimed comes from real data: rankings from real sales order, badges from real discounts, `isNew`, `isFeatured` and stock, poster numbers from real product counts, delivery from real shipping methods, the countdown from the merchant's own date.
4. **Every section the merchant adds shows up.** All 16 section keys render in the theme's language. A section with nothing to show yet renders nothing for shoppers but a dashed marker in the Studio canvas (`sections/StudioEmpty.tsx`, only when framed), so it can be clicked and filled. Collections fall back to the store's top categories (the Studio has no editor for it), About to the store description.
5. **Nothing fake.** The newsletter section has no backend anywhere in Casho, so `JoinBand` hands off to WhatsApp (or the contact page) with the merchant's copy instead of pretending to subscribe.

## The Studio drives the layout

| Studio setting | Effect |
|---|---|
| Navbar `default` (theme default) / `centered` / `compact` | inline links + search button / logo centered + shelves row / big search + shelves row |
| Hero `fullscreen` (default) / `split` / `compact` / `minimal` | full-bleed slideshow / copy on the page, photo behind a slanted edge / short contained slideshow / text + big search. Without banners: the poster (name huge, real numbers, plate + up to three products); `compact` gets a shorter one |
| Product card `default` / `bold` / `minimal` / `elegant` | steel card / the whole card is a chalk plate with a red price tag / bare plate with an add button on the image / centered quiet copy (`[data-card]` on the store root) |
| Category shape `square` (default) / `circle` / `pill` | a wall with no holes, red floods a tile on hover / bumper plates that turn on hover / chips |
| Buttons `sharp` (default) / `rounded` / `pill` | `--store-btn-slant` leans sharp buttons; the shape lives on `.gy-btn::before`, so the label stays upright and portals follow |
| Image ratio, grid columns | `--store-img-ratio`, `--store-grid-cols` (grids, rails, listing; minus one column beside the filter panel; a row with ≤ 3 products gives the spare columns to a title panel) |
| Density | `[data-density]` → section spacing and gaps |
| Motion `dynamic` (default) / `subtle` / `none` | `[data-motion]`: reveals everywhere; dynamic adds the plate turning with the page, drifting ghost words and harder reveals; none stops everything, including the marquees and the slide wipe |
| Colors, fonts, logo (size, corners, show name), announcement | store tokens, the store font and `StoreShell`, as above |
| Section order, switches, content | `renderSections`; the preset has its own `sectionOrder` (the Studio's actions start from it) |
| Best sellers: headline, max products | leaderboard: #1 slab, #2–5 list, the rest keep counting in a row underneath |
| Urgency: headline, timer, label, stock badge | deals poster; `showStockBadge` adds the real units left on nearly-gone items. `showViewersBadge` is ignored (it would be invented) |
| Custom banner: image, copy, align, overlay, link · Rich text: width, align, background | honored as set; rich text picks a readable color on any background |

## Gym-specific
- **Protein calculator** (`showCalculator`, a section only this theme offers: `themes` in the Studio's `SECTION_META`): weight + goal → daily protein range, creatine, water, ending on the store's protein shelf (`lib/coach.ts`). General ranges with a visible note that it isn't medical advice.
- **Flavors.** Supplements sell flavors through the "color" option. `isFlavor` relabels it "النكهة" and shows pills instead of swatches (product page, filters, cart rows).
- **Category icons** come from the name (`lib/category-icon.tsx`: protein, creatine, pre-workout, burners, gloves, shakers…).
- **Supplement care note** on product pages of consumables only (`isSupplement`). "محتار؟" hand-offs go to the store's WhatsApp and only appear when it has one.

## Tokens (preset `gym` in constants/store-themes.ts)
Dark by default (`colorScheme: "dark"`, no `darkTokens`).

| Role | Value | Alias |
|---|---|---|
| floor (`--background`) | #0b0b0d | `--gy-bg` |
| ink (`--foreground`) | #f5f3ef | `--gy-ink`; text/quiet/lines/cards are mixes of it |
| hot color (`--primary`) | #e10600 | `--gy-btn`; `--gy-link` is the version that reads as text on any floor |
| chalk (`--secondary`) | #efece6 | `--gy-chalk`, the "buy now" button and pick badges |
| plate | #eeece8 (fixed) | `--gy-plate` |

Radii follow `--radius` (4px). Fonts: the store's, weight 900 for display.

## Components
- **Header:** red utility bar (rotating announcement; desktop: track order, WhatsApp) · main row per navbar setting · slanted cart · mega menu (shelves + newest banner or ask-us card) · phone drawer · sticky on scroll-up · back-to-top.
- **Home (default order):** hero + shelf tape → custom banner → offer tape → category wall → leaderboard → deals poster → store picks → collections → calculator → new arrivals → scoreboard → spec plates → quotes → about → text → join band.
- **Listing / categories / about / contact / track / cart / checkout:** shared actions and forms in the theme's panels; page heads are knurled steel with a slanted window.
- **Product page:** sticky gallery on the chalk plate (zoom, lightbox) · brand, heavy title, stock, price · flavor/size pills, wholesale tiers, qty, add + buy now · stack contents for bundles · delivery facts · ask on WhatsApp · care note · tabs · reviews · "كمّل عدّتك" rail · recently viewed.
- **Footer:** steel, contact and link columns (accordions on phones), payment logos, the store's name as one huge outlined line.

## Not done / constraints
- No nutrition facts, servings or goal fields exist on products, so the theme doesn't show them; sizes are options on one price, so they don't change it (wholesale tiers do).
- Copy is Arabic like the other themes; `dir="ltr"` stores mirror correctly.
