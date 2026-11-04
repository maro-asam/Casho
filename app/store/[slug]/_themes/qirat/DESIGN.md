# Casho Qirat (كاشو قيراط) — design system

A storefront for jewelers and accessories, built as the jeweler's vitrine: a pearl page, champagne bands and velvet display cases, a serif voice, gold only in hairlines and diamonds, and every piece on a softly lit plate with a glint that passes over it. "Qirat" is the Arabic word the carat comes from.

## Principles
1. **Pieces sit on plates.** Every product photo stands on `--qr-plate-paint` (a radial light on a warm plate), so cut-outs and lifestyle shots look at home together.
2. **Serif for voice, sans for work.** Amiri (Arabic) and Cormorant Garamond (Latin) carry headings, names, prices and numbers through one stack (`--qr-serif`); the merchant's store font stays for body and UI. Cormorant's metric fallback is off on purpose (`fonts.ts`): it would hand Arabic to a local Times face instead of Amiri.
3. **Gold is detail, never fill.** `--accent` paints hairlines, the diamond ornament, kickers and small marks. The one gold button is "send my wishlist". Buttons fill with the merchant's primary and get a passing glint on hover.
4. **Three tones.** `Band tone="page" | "alt" | "velvet"`. Champagne mixes the accent into the page; velvet is the merchant's primary steeped in black, with ivory ink and lifted gold. Velvet scopes re-run the same derived tokens, so anything placed inside reads right.
5. **Light and dark are one design.** The preset is `adaptive`: brand colors apply to both appearances, surface colors to light only. Shoppers pick Automatic / Light / Dark (header toggle on desktop, menu and footer everywhere).
6. **Nothing fake.** Tags come from real discounts, `isNew` and stock; budgets from real prices; the timer is the merchant's own. Casho has no accounts or inbox, so the wishlist lives in the browser and hand-offs go to WhatsApp.

## Signature pieces
- **The vitrine** (`sections/HeroSlides.tsx`): banners fill the screen one at a time with a slow crossfade (and a settle on "حيوية"), thin gold lines count and fill with time, autoplay stops on hover, focus, pause or reduced motion. When it's the first section the header turns clear over it (CSS `:has`, no flash) with a soft top shade.
- **Jewel-box card** (`product/ProductCard.tsx`): the second photo crossfades in, a glint crosses, tags on the start, a heart on the end, and quick add rises as a bar (a round + on touch).
- **The edit** (`sections/ProductSections.tsx` → `FeaturedEdit`): the lead featured piece large with its story, the next four in a 2×2 beside it.
- **Cameos** (`sections/Cameos.tsx`): collections as gold-ringed medallions.
- **Gift finder** (`sections/GiftFinder.tsx`, section `showGiftFinder`, offered only with this theme): budgets that split the store's real prices into thirds × real collections, matching pieces at once, the full listing with the same filters, and a WhatsApp "help me choose".
- **Wishlist** (`cart/WishlistDrawer.tsx`): hearts on cards and the product page; the drawer sends the list (with links) over WhatsApp — to the shopper, or to someone who might gift it. The product page also has "لمّح لحد يهاديك" for a single piece.
- **Size guide** (`pdp/SizeGuide.tsx`): a ring sizer (circumference → ISO / US / diameter, and the nearest size the piece comes in when the store's scale is clear), how to measure for bracelets, and the usual necklace lengths. Pure math in `lib/qirat.ts`, tested.
- **Metals** (`lib/qirat.ts`): gold, rose gold, silver/white gold/platinum/steel and copper/bronze labels get polished swatches and the option reads "المعدن" when every value is a metal. Weights under a kilo show in grams.

## The Studio drives the layout

| Studio setting | Effect |
|---|---|
| Navbar `centered` (theme default) / `default` / `compact` | the maison bar: mark in the middle, links on a row under it / mark on the start with the links beside it / mark, a wide search field and the icons, every link in the menu |
| Hero `fullscreen` (default) / `split` / `compact` / `minimal` | the vitrine / the atelier: copy beside a framed banner with a second one laid over its corner / the gazette: the store's name as a masthead over framed banners / the tray: three pieces on lit plates (also used without banners) |
| Product card `elegant` (default) / `default` / `minimal` / `bold` | centered on a plate / a framed box with a gold inner frame on hover / bare / velvet (`[data-card]` on the store root) |
| Category shape `circle` (default) / `square` / `pill` | cameos / framed portrait plates with counts / one line of names divided by diamonds |
| Buttons `sharp` (default) / `rounded` / `pill` | `--store-btn-radius` |
| Image ratio (default portrait), grid columns | `--store-img-ratio`, `--store-grid-cols` |
| Density | `[data-density]` → section rhythm and gaps |
| Motion `none` / `subtle` (default) / `dynamic` | still / fades as things scroll in, hover glints, the ribbon drifts / adds travel and the vitrine's slow settle |
| Colors, radius, font | primary → buttons and velvet, accent → the gold, surfaces → light mode; radius scales every corner (`--qr-r`); the store font sets body text |
