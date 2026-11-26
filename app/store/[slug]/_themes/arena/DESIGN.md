# Casho Arena (كاشو أرينا) — design system

A storefront for game and app top-ups (diamonds, UC, coins, gift cards, subscriptions) that feels like a top-up app: a deep violet night with two soft glows, violet-glass cards with hairline borders, one violet → orchid gradient for the main action, and Baloo Bhaijaan 2 for display type. Modelled on a reference top-up web app the user picked; the order flow is the point: **pick the game → pick the package → type the player ID → confirm**.

## Principles
1. **Dark only, painted from the merchant's colors.** Like Gym, the preset is `colorScheme: "dark"` with no light twin. `arena.css` mixes every surface from `--background`, the violet from `--primary` and the orchid from `--secondary`, so a merchant's two colors repaint the glows, cards, gradient button and prices.
2. **An app, not a website.** A side menu on wide screens (store mark, nav with icon tiles, a help card), a sticky top bar with the page's name and the cart pill, and a tab bar on phones (الرئيسية · الألعاب · طلباتي · السلة).
3. **Games are categories, packages are products.** A category card shows its art, how many packages it has and "يبدأ من" (`CategoryLink.fromPrice`, the cheapest active product). A category with no packages still shows, last, with a "قريبًا" badge.
4. **The game page is the order flow.** `game/PackagePicker.tsx`: 1. package tiles (smallest → largest by price, "الأكثر مبيعًا" on featured ones), 2. the account (player ID + optional name), a note on what comes next, and a sticky bar with the total and "تأكيد الطلب". Confirming adds the package to the cart **with the player ID on the line** (`selectedFeatures.playerId` / `playerName`, see `lib/orders/account-fields.ts`) and opens checkout. The merchant sees "معرّف اللاعب: …" on the order page, the invoice, the new-order email and tracking.
5. **Nothing fake.** The hero chip counts the games that really have packages; badges come from featured / discounts / stock; the hero's small facts are true of every Casho store (details go to the store only, tracking by order number). "Why us" defaults to the real order steps, not claims.

## Signature pieces
- **Hero** (`sections/Hero.tsx`, `sections/BannerSlider.tsx` for designed banners): the gradient card with the dot noise, a chip, a two-line headline (the second line glows — `splitHeadline` splits on a line break or the first comma), a white button and a glass "تابع طلبك". The first banner gives the words and its art fades in at the card's end; without banners the store's name and description fill it.
- **Game cards** (`ui.tsx › GameCard`): icon tile, a blurred glow of the game art in the corner, badge, name, package count, "يبدأ من X", round arrow.
- **Package tiles** (`game/PackagePicker.tsx`): black-glass tiles that light up orchid with a check when chosen.
- **Prices** (`ui.tsx › Price`): the amount in the display face, the currency small (`priceParts` splits the store-currency format).
- **Checkout** (`cart/ArenaCheckout.tsx`): step 3 of the flow around the shared `CheckoutForm`; the summary keeps each line's player ID in view and a wrong line can be removed there.

## Player ID switch
`ThemeLayout.playerId` (Studio → Layout → "خاص بالثيم" → "معرّف اللاعب"), on by default. Off = a store that sells codes or gift cards: the game page drops step 2, the button reads "اطلب الباقة", the card's promise reads "بيوصلك بعد تأكيد الطلب". Read on the client from the store theme context.

## The Studio drives the layout

| Studio setting | Effect |
|---|---|
| Navbar `default` (theme default) / `compact` / `centered` | side menu with labels and a help card / icon rail / no side menu, links in the top bar |
| Hero `split` (default) / `fullscreen` / `compact` / `minimal` | the first banner's words with its art beside them / the banners shown whole in a swipeable slider with dots (for designed banners that carry their own words and logo; the title stays for screen readers) — a taller card when there are none / shorter card / words only, centered, no art |
| Product card `default` / `minimal` / `bold` / `elegant` | glass card / no card / gradient card / centered game cards (`[data-card]` on the store root) |
| Category shape `square` (default) / `circle` / `pill` | icon tiles / round icons / full-width pill rows |
| Buttons `sharp` / `rounded` (default) / `pill` | `--store-btn-radius` × 2 |
| Grid columns, image ratio | `--store-grid-cols` (games, package shelves), `--store-img-ratio` (collection tiles) |
| Density | `[data-density]` → section spacing and gaps |
| Motion `none` / `subtle` (default) / `dynamic` | nothing moves / the reference's rise-in / a slower rise-in |
| Colors, radius, font | tokens; radius scales every corner (`--an-r`, `-md`, `-sm`); the body follows the store font, display type stays Baloo Bhaijaan 2 |
