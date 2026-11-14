# Casho vs Shopify — `/compare/shopify`

A page that names a competitor. It persuades by being right, so the rules
below matter more than the layout.

## Rules for every claim

- **Shopify facts come from Shopify's own pages** and are dated in
  `copy.ts → sources` (pricing, Shopify Payments countries, manual payments,
  billing currency). Re-read the page before changing a Shopify number, then
  update the date. Fee rates live in `fees.ts` (basis points, tested).
- **Casho facts must be shipped code, on every plan.** Don't list a feature
  that is plan-gated (POS is — `FEATURE_KEYS.POS`), off until an admin turns
  it on (domain buying), or needs an env that may be missing (checkout OTP
  needs Twilio Verify — left off for that reason).
- **Only real differences go in the table.** Things Shopify also has were left
  out on purpose: POS (POS Lite is free there), abandoned-checkout emails,
  shipping zones per governorate, tracking numbers for any carrier, Arabic
  admin and RTL storefronts (Shopify improved Arabic RTL in Oct 2026).
- **Words in every cell, never bare ✓ / ✗**, so each cell says exactly what
  is true ("تطبيق خارجي", not "لأ").
- Keep the honest section ("ساعات شوبيفاي بيكون الاختيار الأصح"), the
  sources footnote and the trademark line. No Shopify logo or styling.

## Facts used (checked 2026-11-14)

| Claim | Where it comes from |
|---|---|
| Shopify Payments isn't available in Egypt | Shopify's supported-countries page (only the UAE in the region) |
| Shopify's fee on third-party gateways: 2% / 1% / 0.6% (Basic / Grow / Advanced) | shopify.com/pricing |
| No such fee on manual payments (COD) | Shopify help: manual payments |
| Shopify bills Egypt in USD | Shopify help: local-currency billing (EGP not listed) |
| Casho takes 0% of orders; online orders settle on the merchant's own Paymob | `StorePaymentSettings.paymob*`, no transaction fee anywhere in billing |
| Balance top-up in EGP: Vodafone Cash, InstaPay, transfer, card | `constants/topup.ts`, Paymob top-ups |
| Phone history across all Casho stores, blocklist, auto-refuse high risk | `lib/fraud/reputation.ts`, `BlockedPhone`, `StoreSettings.blockHighRiskOrders` |
| Bosta / Aramex / Mylerz waybills + tracking sync | `lib/shipping/carriers.ts` (`integration: "api"`) |
| Instagram DM → AI-suggested order, merchant approves | `lib/ai/order-extractor.ts`, `ApproveSuggestedOrderAction` |
| Shopify import: read-only, preview first, background, no duplicates, theme not moved | `docs/integrations/shopify-import.md` |

## Layout

Same system as the home page (`../apple/DESIGN.md`): hero (white) → fee
calculator (gray) → table (white) → moving from Shopify (gray) → honest take
(white) → `FinalCTA` (black). `SectionHead` for every header; tiles are the
other tone of their section.

- **Hero**: headline only, Shopify line in ink, Casho line in the brand
  gradient. Smaller than the home hero (`clamp(44px, 6.2vw, 88px)`) so each
  Arabic line stays on one line from 768px up; English wraps with
  text-balance.
- **Fee calculator**: one slider over fixed stops (10k → 1M EGP a month),
  plan chips, Shopify's monthly fee vs Casho's 0 (brand blue). The footnote
  says the fee applies to online payments only.
- **Table**: a real `<table>`; the column header sticks under the floating
  nav (the rule is an inset shadow, since collapsed borders don't stick). Phones
  keep two columns and lift the feature name above them.

`compare.css` holds only what `apple.css` lacks. `apple.css` is unlayered, so
it beats Tailwind utilities; overrides here use `.al …` selectors.
