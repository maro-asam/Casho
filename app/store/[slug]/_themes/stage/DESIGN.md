# Casho Stage (كاشو ستيدج) — design system

A storefront for brands and any kind of shop, built in the language of apple.com's store: a plain page and its light gray, night tiles for the moments that matter, huge two-tone headlines, capsule buttons, glass only on the chrome. Nothing in it is specific to one field, so fashion, electronics, beauty, home or gifts all look at home.

## Principles
1. **Light and dark are one design.** `stage.css` mixes every surface from `--background` / `--foreground`; the preset is `adaptive`, so the merchant's brand colors apply to both appearances and their surface colors to light only. Appearance follows the device until the shopper picks Automatic / Light / Dark (footer, phone menu); `lib/appearance.ts` blocks the white flash on a dark device's first visit.
2. **Three tones, one set of tokens.** `Band tone="page" | "alt" | "night"`. Night scopes swap the color pair and re-declare the derived tokens, so a night tile reads the same in both modes (a step up from black in dark mode). Cards float white on the gray band and gray on the page.
3. **Typography carries the hierarchy.** Section heads are apple.com's two-tone sentence ("مختاراتنا. اللي بننصحك بيه."): the claim in ink, the rest in gray. No boxes or borders to separate sections; the bands do it.
4. **One tint.** The merchant's primary fills the main capsule and colors links; everything static stays neutral. The orange "جديد" eyebrow is decoration and doesn't use the tint. The gradient (tint turning through two hues, `--sg-g1..3`) is for a few words and big numbers only.
5. **Glass is chrome.** The global nav, the local nav, the phone purchase bar and toasts. Content never uses it.
6. **Nothing fake.** Eyebrows come from real discounts, `isNew` and stock; charts from real sales; the timer is the merchant's own; the Join band hands off to WhatsApp because Casho has no inbox for it.

## Signature pieces
- **Global nav** (`header/StageHeader.tsx`): a thin frosted bar with the shelves in the middle; "تسوّق" opens a flyout with every shelf in big type while the page blurs behind; on phones a full-screen menu drops its links in one after another.
- **Search** (`header/SearchSheet.tsx`): drops over the bar like apple.com's, big field, quick links, store picks; ⌘K anywhere.
- **Hero tiles** (`sections/Hero.tsx`): the first banner fills the screen, the rest follow as apple.com's two-up tiles.
- **Shelves** (`product/Rail.tsx`): start at the content column and run off the screen's end, with round paddles under them. The featured shelf uses tall "The latest" cards (`BigShelf`).
- **Spotlight** (`sections/Spotlight.tsx`, section `showSpotlight`, offered only with this theme): one product on night. With motion on "حيوية" it pins while you scroll: the name steps back, the product grows to fill the stage, then the price and buy arrive (CSS scroll-driven, still layout elsewhere).
- **Buy page** (`pdp/StageProduct.tsx`, `product/BuyForm.tsx`): apple.com's steps ("اللون. اختار لونك المفضّل.") over round swatches and large boxes, a gray bag box with the total, delivery facts from real shipping methods, a local nav that keeps "اشترِ" in reach on wide screens and a floating glass bar on phones.
- **Bag** (`cart/StageCart.tsx`): "إجمالي حقيبتك ٢٬٣٠٠ ج.م." as the headline, airy rows, the summary on the end.

## The Studio drives the layout

| Studio setting | Effect |
|---|---|
| Navbar `default` (theme default) / `centered` / `compact` | apple.com's full-width bar / the same bar as a floating glass capsule / mark, search and bag with every link in the menu |
| Hero `fullscreen` (default) / `split` / `compact` / `minimal` | full-screen banner + tiles / copy beside a rounded photo / the store's name huge with banners on a shelf / the name in the gradient with products on a podium (also used when there are no banners) |
| Product card `default` / `minimal` / `bold` / `elegant` | store card (gray on the page, white on the gray) / no card / night card / centered (`[data-card]` on the store root) |
| Category shape `square` (default) / `circle` / `pill` | chapter nav tiles / circles / capsules |
| Buttons `sharp` / `rounded` / `pill` (default) | `--store-btn-radius` |
| Image ratio, grid columns | `--store-img-ratio`, `--store-grid-cols` (one less beside the filter panel) |
| Density | `[data-density]` → band spacing and gaps |
| Motion `none` / `subtle` / `dynamic` (default) | nothing moves / fades as things scroll in / travel, the hero settling and the pinned spotlight |
| Colors, radius, font | tokens; radius scales every corner (`--sg-r`, `-sm`, `-xl`) |
