# Casho Bunn (كاشو بُن) — design system

A storefront for coffee roasters, cafés and brewing-gear shops, built as the roastery: a kraft page with a faint paper grain, oat and espresso bands, a sturdy Kufi voice, crema only in kickers, rules and seals — and every coffee laid out like a specialty bag's label. "Bunn" (بُن) is the Arabic word for coffee beans.

## Principles
1. **Coffee reads like a label.** Bunn reads the merchant's own product details (product form → «خصائص مخصصة») — المنشأ، المنطقة، المعالجة، الارتفاع، السلالة، الحصاد، التحميص، النكهات، التحضير، الوزن الصافي — and "key: value" lines in the description (Arabic or English keys, any spelling; `lib/coffee.ts → fieldOf`). Cards show origin · process, the tasting notes and a five-bean roast meter; the product page adds the crop label ("بطاقة المحصول"). A field the merchant didn't give is never shown or guessed.
2. **Nothing fake.** Notes take their flavor-family color from the words themselves; roast levels from the merchant's words or a 1–5 scale; the price per 100 g only from a stated net weight (never the shipping weight); brew suggestions for a roast are labelled "مقترح". Tags come from real discounts, `isNew` and stock; the timer is the merchant's own. Casho has no inbox, so "join" and "help me choose" go to WhatsApp.
3. **Kufi for voice, store font for work.** Noto Kufi Arabic (Arabic) and Fraunces (Latin, English stores) carry headings, names and prices through one stack (`--bn-display`); Fraunces' metric fallback is off on purpose (`fonts.ts`) so Arabic never falls to a local Times face. Body and UI keep the merchant's store font.
4. **Three tones.** `Band tone="page" | "alt" | "espresso"`. Oat mixes the accent into the page; espresso is the merchant's primary pulled down to a roast, with cream ink and lifted crema. Espresso scopes re-run the same derived tokens, so anything inside reads right.
5. **Light and dark are one design.** The preset is `adaptive`: brand colors apply to both appearances, surface colors to light only. Shoppers pick Automatic / Light / Dark (header on desktop, menu and footer everywhere).
6. **Arabic never runs round a circle.** Browsers drop Arabic letter joins on an SVG text path, so the seal sets its words straight inside a ring of beans. SVG text on the map is anchored left-to-right (`direction: ltr`) so anchors stay geometric in RTL stores.

## Signature pieces
- **The cup** (`sections/Hero.tsx → Cup`, hero `split`, theme default): the main banner seen from above inside a cup on its saucer, steam rising, the roastery seal on the rim, the next banner as a small cup beside it, and "من محاصيل" chips of the countries the store's coffees come from.
- **The seal** (`sections/Stamp.tsx`): store name (and a section or origin) in a ring of fourteen beans that turns slowly with motion on.
- **Bag-label card** (`product/ProductCard.tsx`): photo on a warm plate, then origin · process, the name, notes as colored dots, price with the bag's weight, the roast meter. Gear and cups get the same label without the coffee lines. Quick add opens the quick view for beans (grind) or products with options.
- **Grind** (`product/BuyForm.tsx`, Studio switch `layout.grind`): whole-bean coffee asks for a grind — whole bean, espresso, Turkish, filter / V60, French press, moka — as six tiles with the brew method's glyph (`icons.tsx`) and the grind's coarseness; the grind for the coffee's first brew method is marked "مقترح". It rides on the cart line as `selectedFeatures.grind` ("الطحنة: إسبريسو") through the cart, order page, invoice, emails and tracking. Gear, capsules, instant and anything already ground (تركي، محوّج، مطحون…) never ask; nor does a product whose own options are grinds.
- **Coffee options** (`lib/coffee.ts → optionKind`): sizes / colors that are roasts read "التحميص" with bean-colored chips, weights "الوزن", plain / spiced "النوع", grinds "الطحنة".
- **Roaster's pick** (`sections/ProductSections.tsx → RoasterPick`): the lead featured coffee large with its label beside it (notes, region, process, altitude, variety, roast, bag weight), the next four as cards.
- **The coffee belt** (`sections/Origins.tsx`, section `showOrigins`, offered only with this theme): the belt between the tropics as a dot map (`lib/coffee.ts → landDots`, coarse land outlines, latitude drawn 1.5× taller), a pin on every country the store's coffees come from (blends on each of their countries), labels placed so they don't collide, and that origin's coffees beside it.
- **Brew guide** (`sections/BrewGuide.tsx`, section `showBrewGuide`, offered only with this theme): six methods; pick one and the number of cups and it works out coffee and water (espresso: dose and drink weight), temperature, grind, time and ratio, with the steps — and up to three of the store's coffees that suit it (named in their details first, then by roast), plus "اسألنا على واتساب".
- **Crop label** (`pdp/Passport.tsx`): the origin set big beside the seal, the farm facts in a ruled grid, the roast on a five-step scale, notes as chips, and the brew methods it suits with a short recipe each.
- **Café menu** (hero `compact`, category shape `pill`): names with dotted leaders and their real starting price (`CategoryLink.fromPrice`).
- **Order tickets** (testimonials): customer words on perforated café tickets.

## The Studio drives the layout

| Studio setting | Effect |
|---|---|
| Navbar `default` (theme default) / `centered` / `compact` | the mark on the start, links beside it, the cart as a pill / the mark in the middle, links on a dashed row under it / the mark, a wide search field and the icons, every link in the menu |
| Hero `split` (default) / `fullscreen` / `compact` / `minimal` | the cup / the board: banners fill the screen one after another / the menu board: the store's name, the banner and the sections as menu lines / the shelf: three bags on a shelf (also used without banners) |
| Product card `default` / `elegant` / `minimal` / `bold` | the bag label / centered with an arched photo / bare, no notes or kicker / an espresso card (`[data-card]` on the store root) |
| Category shape `circle` (default) / `square` / `pill` | cups seen from above on saucers / photo tiles with a dashed kraft label / the café menu |
| Buttons `pill` (default) / `rounded` / `sharp` | `--store-btn-radius` |
| Image ratio (default square), grid columns | `--store-img-ratio`, `--store-grid-cols` |
| Density | `[data-density]` → section rhythm and gaps |
| Motion `none` / `subtle` (default) / `dynamic` | still / fades as things scroll in, steam, the seal turns, the ticker drifts, the active map pin pulses / adds travel and the board's slow settle |
| Theme switch «اختيار الطحنة» | `layout.grind` — off for stores that sell coffee already ground |
| Colors, radius, font | primary → buttons and espresso bands, accent → crema, surfaces → light mode; radius scales every corner (`--bn-r`); the store font sets body text |

## Demo
`scripts/qahwa-demo/` (catalog + seed, `--remove`) creates «قهوة» (qahwa.casho.store), a specialty roastery with 32 products (single origins with full details, blends, Turkish coffee with roast options, gear, mugs) on real Unsplash photos.
