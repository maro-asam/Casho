# Casho Medical (كاشو ميديكال) — design system

Pharmacy storefront: medicines, vitamins, personal care and medical supplies.
Built from scratch for Casho (no reference theme) around how people shop a
pharmacy: search first, browse by department, ask before buying.

## Principles
1. **Clinical and calm.** Cool off-white canvas, white cards, the store's teal for actions, a light mint tint (`--secondary`) for panels and badges, a deep teal (primary mixed toward near-black) for the utility bar, prescription band and footer. A quiet "plus" pattern (`.rx-pluses`) marks clinical panels.
2. **Search and departments first.** A large pill search with predictive results sits in the header (and in the text-only hero); departments show as icons — a category without a photo gets an icon picked from its name (`lib/category-icon.tsx`: vitamins, baby, skin, hair, dental, eyes, devices, first aid…).
3. **Ask before you buy — over WhatsApp.** Casho has no prescription upload, so "send a prescription" and "ask the pharmacist" open the store's WhatsApp with a pre-written message (`lib/rx.ts`). They only appear when the store has a WhatsApp number. Home/Product view-models carry `whatsapp` for this.
4. **Real data only.** Badges come from real discounts, `isNew`, `isFeatured` and stock; delivery facts from real shipping methods; the countdown from the merchant's own date. Sections without merchant content render nothing; no newsletter (no backend). The product page carries one general care note (information is not a substitute for a doctor/pharmacist; read the leaflet).
5. **The Studio drives the layout.** Every Layout-panel setting changes the theme:

| Studio setting | Effect |
|---|---|
| Navbar `compact` (default) / `centered` / `default` | big search in the header + departments row / logo centered + departments row / inline links + search button |
| Hero `split` (default) / `fullscreen` / `compact` / `minimal` | slideshow + prescription/track/banner column / full-width slideshow / short contained slideshow / text + big search |
| Product card `default` / `minimal` / `bold` / `elegant` | framed card with add button / plate only with round add button / lifted card on mint plate / centered quiet copy (`[data-card]` on the store root) |
| Category shape `circle` (default) / `square` / `pill` | round icons in a swipe row / tiles / chips |
| Image ratio, grid columns | `--store-img-ratio`, `--store-grid-cols` (grids, rails, listing; minus one column beside the filter panel) |
| Buttons | `--store-btn-radius` on every `.rx-btn` |
| Density | `[data-density]` → section spacing and gaps |
| Motion | `--store-motion` durations; `[data-motion="none"]` stops reveals and the marquee |

Colors, background, text and accent from the Colors panel and the store font from the Fonts panel flow through the store tokens (headings use the store font too). Home sections follow the merchant's order and switches.

## Tokens (preset `medical` in constants/store-themes.ts)
| Role | Light | Dark |
|---|---|---|
| canvas (`--background`) | #f4f8f8 | #0a1617 |
| cards (`--card`) | #ffffff | #112324 |
| ink (`--foreground`) | #0f2a2e | #e5f1f0 |
| actions (`--primary`) | #0a6c74 | #2ab3aa |
| tint (`--secondary`) | #e3f3f1 | #12302f |
| links (`--accent-foreground`) | #07595f | #7fd8cf |
| sale | #d42a4a | #ff6b81 |
| in stock / low | #0d8a5c / #b45309 | #4fd39a / #f5a65b |

`medical.css` aliases them as `--rx-*`. Radii follow `--radius` (14px): cards 14, small 8, panels 20.

## Components
- **Header:** deep utility bar (merchant announcement rotating one message at a time; desktop: track order, WhatsApp number) · main row per navbar setting · "send prescription" button · cart pill with count · departments row with icons and a mega menu (all departments + newest banner or prescription card) · phone drawer menu · sticky on scroll-up · back-to-top.
- **Home:** hero → departments → best sellers rail → deals panel (real discounts + countdown) → promo tiles → store picks rail → media banner → new arrivals grid → stats band → testimonials → about → rich text → promises → prescription band (when WhatsApp exists and the hero isn't `split`, which already shows it).
- **Product card:** pale plate with contained pack shot, discount/new/pick badges, quick look on hover, brand line, two-line name, price (red when discounted) + struck compare-at, full-width add button. Card adds show a toast with "view cart" instead of opening the drawer (shoppers add several items in a row); product-page adds open the cart drawer.
- **Listing:** clinical page head · department pills · filter panel (department, availability, price, color, size → "الحجم", brand → "الشركة المصنعة") / phone drawer · toolbar (filters, grid/list, sort, count) · active chips · pagination.
- **Product page:** sticky gallery (zoom, lightbox) · buy panel (stock with count, price + discount chip, pack size/color pills, wholesale tiers, qty, add + buy now) · ask-the-pharmacist WhatsApp · delivery facts · care note · tabs (description / details / delivery) · reviews · alternatives rail · recently viewed.
- **Cart / checkout / about / contact / track:** shared actions and forms in the theme's panels.

## Not done / constraints
- No prescription upload, consultation booking, insurance or "requires prescription" flag exist in Casho, so the theme hands those to WhatsApp and never marks products as Rx-only.
- Sizes are options on one price, so pack sizes don't change the price; wholesale tiers do.
