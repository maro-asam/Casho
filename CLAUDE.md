# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Casho** (`casho.store`) is an Arabic SaaS e-commerce platform where merchants can create online stores. The codebase is a Next.js 16 app with:
- A merchant dashboard at `/dashboard`
- A public storefront served via subdomain routing (`[slug].casho.store`)
- An admin panel at `/admin`
- A marketing/landing page at the root

The UI is Arabic-first (RTL, Cairo font), currency is EGP stored as **piasters** (1 EGP = 100 piasters).

## Commands

```bash
npm run dev        # start dev server
npm run build      # production build
npm run lint       # ESLint
npx prisma generate          # regenerate Prisma client (required after schema changes)
npx prisma migrate dev --name <name>   # create and apply a migration
npx prisma db push           # push schema without migration history (dev only)
npm run db:migrate:deploy    # apply pending migrations (production runs this automatically: `npm run build` on Vercel production calls scripts/migrate-on-build.mjs first)
```

Tests: `npm test` (Vitest, `**/*.test.ts`).

## Architecture

### Routing & Route Groups

```
app/
  layout.tsx              # root layout — RTL, Cairo+Inter fonts, ThemeProvider, Toaster
  (auth)/                 # login, register, forgot/reset-password
  (welcome)/              # marketing landing page
  (merchant)/
    dashboard/            # merchant dashboard (requires auth)
  admin/                  # admin panel
  store/[slug]/           # storefront pages (cart, products, checkout, order, etc.)
  api/                    # API routes (payments/paymob, meta, telegram, export)
```

### Subdomain Routing (middleware.ts)

The middleware rewrites subdomain requests to `/store/[slug]`. `mystore.casho.store` → `/store/mystore`. Locally, `mystore.localhost` also works. Static assets and `/api` are bypassed.

Reserved subdomains: `www`, `app`, `casho`.

### Authentication

Custom session-based auth — no NextAuth. Sessions are stored in the DB (`Session` model). The raw token is stored in an `httpOnly` cookie (`sessionToken`); only the SHA-256 hash is stored in the DB. Key functions in [lib/auth/session.ts](lib/auth/session.ts): `createUserSession`, `getCurrentSession`, `deleteCurrentSession`. Protected routes call `requireUserId()` from [actions/auth/require-user-id.actions.ts](actions/auth/require-user-id.actions.ts).

Email confirmation: email/password signups get `User.mustVerifyEmail` and a 6-digit emailed code; the dashboard, onboarding, builder and POS layouts redirect them to `/verify-email` until it's entered (`requireVerifiedEmail` in [lib/auth/email-verification.ts](lib/auth/email-verification.ts)). Older accounts (`mustVerifyEmail = false`) are never locked — they get a dismissible dashboard notice. Google signups are verified on creation. `/verify-email` is in `AUTH_PATHS` in `proxy.ts` so the app subdomain doesn't rewrite it under `/dashboard`.

### Database (Prisma + PostgreSQL)

Prisma client uses the `@prisma/adapter-pg` driver adapter (not the default connector). The singleton is in [lib/prisma.ts](lib/prisma.ts). Always run `npx prisma generate` after editing `prisma/schema.prisma`.

Key models: `User` → `Store` → `Product`, `Order`, `Category`, `Banner`, `Coupon`. Each store has one `StoreSettings` (theme, SEO, social links) and one `StorePaymentSettings` (manual methods + the merchant's own Paymob keys).

### Server Actions Pattern

All mutations use Next.js Server Actions in [actions/](actions/). They are organized by domain (`auth/`, `store/`, `admin/`, `balance/`, `notifications/`, etc.). Actions call `requireUserId()` or `adminGuard()` at the top for auth.

### Subscription & Balance

Subscriptions are billed from the store's internal balance (not Stripe). Balance is stored in piasters (`Store.balance`). Merchants top up online via Paymob (cards + mobile wallets), or by manual transfer that an admin approves. The subscription logic is in [lib/subscriptions.ts](lib/subscriptions.ts) — statuses are `INACTIVE`, `ACTIVE`, `PAST_DUE`, `CANCELED`. There is no grace period: when a period or the 3-day trial ends and the balance can't cover renewal, the store goes straight to `PAST_DUE` (closed) on the next renewal sweep (`/api/cron/renew-subscriptions`, hourly on cron-job.org). `GRACE_PERIOD` is legacy — only stores from before the change carry it.

### Payment Integration — Paymob

Paymob (Intention API + Unified Checkout) is used twice: Casho's own account (env `PAYMOB_*`) for balance top-ups, and each merchant's own account (`StorePaymentSettings.paymob*`, secrets encrypted) for storefront orders (payment method key `paymob`). Client in [lib/paymob.ts](lib/paymob.ts); callbacks `/api/payments/paymob/topup` and `/api/payments/paymob/order` (POST webhook + GET redirect, both HMAC-SHA512 verified, settled idempotently via [lib/payments/settle.ts](lib/payments/settle.ts)). Amounts are cents = piasters. InstaPay is not a Paymob method — it stays a manual transfer.

Kashier is retired: it can't be chosen or set up any more. Only its callback routes remain so in-flight payments settle.

Manual transfers (wallet, InstaPay, bank, Fawry… — any manual method the merchant gave transfer details for) are paid **before** the order exists: the checkout button opens `ManualPaymentDialog` (amount + where to send it, then "paid from" + a screenshot), and "تأكيد الدفع" places the order with them. The merchant picks which of the two is required (`StorePaymentSettings.requireTransferPayer` / `requireTransferScreenshot`, both on by default, switches under "إثبات التحويل" on `/dashboard/payment-methods`); the other stays in the window as optional. `CreateOrderAction` enforces it (the action is public) and uploads the screenshot server-side to Cloudinary `casho/uploads/payment-proofs` (`lib/cloudinary/server-upload.ts`; the browser shrinks it under the 1 MB action body limit first); they're saved as `Order.paymentPayer` / `Order.paymentProofUrl` and shown on the merchant's order page, the orders list and the new-order email. Rules in [lib/payments/manual-proof.ts](lib/payments/manual-proof.ts). The checkout action answers `{ error }` instead of throwing, so CheckoutForm shows refusals inline.

### Store Themes

Each store can select a theme (`StoreSettings.themeId`, or `themeConfig.presetId`). Presets (tokens, layout, sections) are in [constants/store-themes.ts](constants/store-themes.ts) — `default` (Classic), `riwaq` (Riwaq, editorial paper/ink/arches — see its `DESIGN.md`), `mada` (Mada, modular pine/chartreuse) `dune` (Casho Dune, editorial serif/square media — see its `DESIGN.md`), `maximize` (Maximize, large-catalog electronics layout modelled on the Shopify Maximize preset — see its `DESIGN.md`) `cello` (Cello, navy/yellow electronics layout modelled on the Shopify Cello preset — see its `DESIGN.md`), `medical` (Casho Medical, clinical teal pharmacy theme with prescription/ask-the-pharmacist WhatsApp hand-offs; a Studio switch, `layout.pharmacy`, turns the medical bits off for non-medical stores — see its `DESIGN.md`) `gym` (Casho Gym, black/red supplements and equipment theme that fits any store: neutral copy, and flavors / care note / its own protein-calculator section switch on only from supplement names; every surface mixed from the merchant's colors — see its `DESIGN.md`), `market` (Casho Market, supermarkets and kiosks in Apple's language, orange, light and dark with a shopper toggle, quantity steppers on cards and a phone tab bar — see its `DESIGN.md`) `stage` (Casho Stage, brands and any field in apple.com's store language: light/gray/night bands, two-tone headlines, an Apple-style buy page and its own scroll-pinned `showSpotlight` section, light and dark — see its `DESIGN.md`) and `qirat` (Casho Qirat, jewelers and accessories as a jeweler's vitrine: pearl/champagne/velvet bands, Amiri + Cormorant serif, gold hairlines, pieces on lit plates with a hover glint, metal swatches, a browser wishlist sent over WhatsApp, a ring size guide and its own `showGiftFinder` section, light and dark — see its `DESIGN.md`) and `arena` (Casho Arena, game and app top-ups as a top-up app: dark violet glow, a side menu and a phone tab bar, games = categories with "يبدأ من" (`CategoryLink.fromPrice`), and a game page that is the order flow — pick a package, type the player ID, confirm straight into checkout; a Studio switch, `layout.playerId`, drops the ID for code / gift-card stores — see its `DESIGN.md`). A preset with `adaptive: true` is built for both appearances: the merchant's brand colors apply to light and dark, their surface colors to light only. A preset may define its own `sectionOrder`; a section only some themes offer sets `themes` in the Studio's `SECTION_META`. The store root carries the Studio's card style, density and motion as `data-card` / `data-density` / `data-motion` (and `data-pharmacy="off"` for Medical) for themes that style them globally. Every theme honors every Studio layout control (navbar, hero, card, category shape, buttons via `--store-btn-radius`, image ratio, columns, density, motion); each theme's `DESIGN.md` has a "Studio drives the layout" table, and a preset's own layout values are that theme's native look. `brandAccent` presets (Classic, Riwaq, Maximize, Cello) re-derive `accent` / `accentForeground` from the merchant's primary; the store font is also exposed as `--store-font`; script-driven motion (slideshows, rotating text) checks `motionOff()` from `_themes/shared/motion.ts`.

The storefront UI lives in [app/store/[slug]/_themes/](app/store/[slug]/_themes/): `types.ts` is the theme contract (view-model props per page), `index.ts` is the registry (`getStorefrontTheme(id)`), and each theme is a folder (`classic/`, `riwaq/`) with its own scoped CSS (`.theme-classic`, `.theme-riwaq`). Theme-agnostic helpers (cart events, store paths, social links, price tiers, sort options, filter query builder, cart-count hook, `SubmitButton`) live in `_themes/shared/` — themes import from there, never from each other. `loading.tsx` / `not-found.tsx` render `ThemeState`, which picks the active theme's skeleton from context; a new theme must add its states there. Route files under `app/store/[slug]/` only load data (helpers in `_lib/storefront.ts`) and render `theme.Home`, `theme.ProductListing`, `theme.Product`, `theme.Cart`, etc. Themes never query the DB; they call the existing store actions.

### Player ID on top-ups (`lib/orders/account-fields.ts`)

A top-up's account rides on the cart line's `selectedFeatures` (`playerId`, `playerName`) next to size/color, so the order page, invoice, emails and tracking show "معرّف اللاعب: …" with no extra column (each has a `FEATURE_LABEL(S)` map with those keys). `AddToCartAction` cleans every feature map (`cleanSelectedFeatures`: plain keys, short trimmed values). Arena's `PackagePicker` sends them.

### Store Currency (`StoreSettings.storeCurrency`)

ISO code from `lib/store/currency.ts` (EGP default; SDG, SAR, AED… — set at `/dashboard/settings` → "عملة المتجر"). Display only: product prices stay whole units and shipping/orders hundredths in any currency. The storefront runtime resolves it per request next to the locale (`loadStoreLocale` applies both; `storeCurrency()`, `formatPrice`, `lazyStoreIntl.money()`), and order emails and server pixel events use it. Never hardcode `"EGP"` in storefront code. Paymob charges EGP only, so a non-EGP store can't offer it (`supportsOnlinePayment`: hidden at checkout and refused in `CreateOrderAction`). The merchant dashboard still writes ج.م.

### Storefront Language (`StoreSettings.storeLanguage`)

A store is Arabic or English (picked at onboarding; changed from `/dashboard/settings` → "لغة المتجر" or the Studio's fonts panel — `UpdateStoreLanguageAction`, which also resets the font to the language's default). It drives the storefront's text, direction, digits (`ar-EG` vs `en-US`), the ready-made policy templates (`lib/store-policies/templates.en.ts`) and the customer's order emails; merchant content (product/category names, banners) is shown as typed, and merchant emails stay Arabic. Gettext-style like the dashboard: the Arabic source text is the key — `st("أضف للسلة")`, `st("{0} منتج", n)` — from [lib/i18n/storefront](lib/i18n/storefront/) (shared core in `lib/i18n/catalog.ts`); English lives in `lib/i18n/storefront/en/*.json` (regenerate `index.ts` with `node scripts/i18n/build-en-index.mjs storefront`). English values can pick a word by count: `{0} {0|product|products}`. The store layout and **every storefront page + its `generateMetadata` must `await loadStoreLocale(slug)`** before rendering text (per-request store; the layout also mounts `StorefrontI18nProvider`). Rules: never call `st()` at module level (use getters or `stList`); module-level `Intl` → `lazyStoreIntl`; prices → `formatPrice` from the storefront runtime, not `lib/utils`; a sentence with elements in it → `stRich("عرض {0} من {1} منتج", <b/>, <b/>)`; text from shared libs/server actions (tracking view-model, action messages, payment labels, saved popup/WhatsApp defaults) is translated where the storefront shows it — `st(value)` / `stv(message)` (fully formed runtime strings match `{0}` keys); server-side with no render (emails) → `stIn(locale, …)`. Use logical classes (`ps-`, `start-`, `text-start`) in shared storefront UI. `node scripts/i18n/check-storefront.mjs --missing` reports unwrapped Arabic and keys with no English.

### Custom Domains (connect or buy)

`/domain` (an app in `lib/apps/catalog.ts`): connect a domain bought elsewhere (DNS + `_casho-verify` TXT proof, `lib/custom-domain/`, checked by `/api/cron/verify-domains`) or buy one through Casho. Buying ([lib/domains/](lib/domains/)) uses Vercel's Registrar API on Casho's team: search is unauthenticated, prices are USD → piasters at the admin's rate + markup, rounded up to 5 EGP (`/admin/domains`, `DomainSettings` singleton, off until an admin enables it and fills the registrant contact). The store pays from its balance (`DOMAIN_CHARGE` / `DOMAIN_REFUND` ledger rows — never subscription revenue or commission), the domain registers with Vercel auto-renew **off**, and connects itself (a `DomainRegistration` replaces the TXT proof). Renewal is charged from the balance starting 30 days before expiry by the hourly `renew-subscriptions` cron (`sweepDomainRegistrations`); a failed or unanswered registrar call is refunded only once Vercel confirms it didn't happen. Only 1-year, non-premium names up to $100 are sold; `.eg` can't be bought here.

### Order Tracking (storefront `/track`)

Shoppers track an order without logging in: order number (`#A1B2C3` = last 6 of the id; the dashboard's 8-char prefix and the full id work too) + the phone it was placed with. Emails, the success/order pages and the merchant's WhatsApp chat link to a signed URL (`orderTrackUrl`, HMAC like `whatsapp-confirm`) that opens the order directly. Pure view-model (timeline, shipment, items — never address/phone/merchant notes) in [lib/orders/tracking.ts](lib/orders/tracking.ts); lookups + rate limit in [lib/orders/track-order.ts](lib/orders/track-order.ts) — failed searches are `SecurityLog` rows (`ORDER_TRACK_FAILED`), no extra table. The UI is shared (`_themes/shared/track/OrderTracker`); each theme's `Track` only adds its page chrome and a `TrackSkin`.

### Store Policies (storefront `/policies/[type]`)

Four legal pages per store — `returns`, `shipping`, `privacy`, `terms` — in `StoreSettings.policies` (JSON, per type `{ body?, hidden?, updatedAt? }`). No body = the ready-made Arabic template filled with the store's details (name, contact, digital products, ad pixels), so every store shows them from day one; merchants edit, hide or restore them at `/dashboard/policies` (linked from Settings). Pure logic, the text parser and the templates live in [lib/store-policies/](lib/store-policies/) (DB loaders in `server.ts`). Bodies are plain text: `#` line = heading, `-` line = bullet, blank line = new paragraph. The page UI is shared (`_themes/shared/policies/PolicyDocument`); each theme's `Policy` only adds its page chrome and a `PolicySkin`, and every footer appends `policyFooterLinks(shell)` to its help group. Visible policies are in the store sitemap. `StoreSettings.requireTermsAtCheckout` turns the checkout's "ordering means you agree" line into a required checkbox (re-checked server-side, saved as `Order.termsAcceptedAt`).

### Store Imports (Shopify, WooCommerce)

Merchants migrate from Shopify at `/integrations/shopify` and from WooCommerce at `/integrations/woocommerce`. Provider-agnostic engine in [lib/integrations/import/](lib/integrations/import/) (DB-backed `ImportJob` queue with lease + checkpoints, idempotency via `ImportRecordMap` unique key; `registry.ts` wires each provider). Shopify provider in [lib/integrations/shopify/](lib/integrations/shopify/) (OAuth, GraphQL client with cost-based throttling). WooCommerce provider in [lib/integrations/woocommerce/](lib/integrations/woocommerce/): no app to register — the merchant approves a read-only REST key on their own site (`/wc-auth/v1/authorize`), WooCommerce POSTs it to our callback with a sealed state in `user_id`, and every request to the merchant's site goes through the SSRF-safe `safeFetch` (needs `APP_URL` on https). Both pages share one UI in `app/(merchant)/dashboard/integrations/_import/` (per-platform copy in `provider-ui.tsx`) and one set of server actions ([store-import.actions.ts](actions/integrations/store-import.actions.ts), provider argument validated). Background runs: `after()` on start, the page's status poll, and `/api/cron/run-imports` (CRON_SECRET). Guides: [docs/integrations/shopify-import.md](docs/integrations/shopify-import.md), [docs/integrations/woocommerce-import.md](docs/integrations/woocommerce-import.md).

### Sales Team (referrals & commissions)

Sales reps are `User.role = SALES` + `SalesRep`, created only by admins (`/admin/sales`); reps use `/sales` (guard: `requireSalesRep()` in [lib/sales/guard.ts](lib/sales/guard.ts), scope always from the session). Signup attribution (`SalesAttribution`) comes from a `?ref=` code: the proxy remembers it for 30 days in the `signupRef` cookie (main + app domains, last link wins), and signup shows it or lets the merchant type a code (`lib/sales/ref-cookie.ts`, `readSignupFormReferral`). Reps get a call list (`/sales/calls`, rules in `lib/sales/call-list.ts`) and notifications for signups, commissions, trials ending and stores closing (`lib/sales/notify.ts`: bell + email, swept hourly by the renew-subscriptions cron). Commissions are driven by `SUBSCRIPTION_CHARGE` / `REFUND` ledger rows: every billing path that writes one must call `recordSalesCommissionsForStore(storeId)` afterwards (idempotent; the renew-subscriptions cron also sweeps). Admins can also add a bonus or deduction to a rep (`SalesRepAdjustment`, not tied to a commission — counted in the payable and settled by the next payout) and change a rep's login email. Reps ask to be paid with "طلب سحب الأرباح" (`SalesWithdrawalRequest`, actions in [actions/sales/withdrawal.actions.ts](actions/sales/withdrawal.actions.ts)): it asks for the whole payable to a wallet/bank account they type, one open at a time, and moves no money — the admin still transfers outside Casho and records the payout, which closes the request (or rejects it with a reason). Pure rules in [lib/sales/rules.ts](lib/sales/rules.ts); full policy in [docs/sales/commissions.md](docs/sales/commissions.md).

### Lead Management (prospects before signup)

Super admins (`LEAD_ADMIN_ROLES` in [lib/leads/access.ts](lib/leads/access.ts) — `SUPER_ADMIN` only) manage leads at `/admin/leads` (overview, list with bulk assign/status + CSV/Excel export, Kanban, follow-ups, Import Center, conversion matches); reps work only the leads assigned to them at `/sales/leads` ("ليداتي"). Every query/mutation goes through `leadScopeFor(actor)` ([lib/leads/scope.ts](lib/leads/scope.ts)) — another rep's lead id behaves like a missing one; rules are pure in [lib/leads/workflow.ts](lib/leads/workflow.ts), mutations in [lib/leads/service.ts](lib/leads/service.ts) (transaction + a `LeadActivity` row each). Leads are never hard-deleted (archive / soft delete). A lead **converts only when the merchant's store pays its first subscription** (first `SUBSCRIPTION_CHARGE`): `recordLeadConversionForStore` runs next to `recordSalesCommissionsForStore` in both billing paths and the hourly cron sweeps; only unambiguous matches (one lead, verified email or signup phone) link automatically, the rest wait at `/admin/leads/matches`. Leads never touch `SalesAttribution` or commissions — the referral link stays authoritative. Imports are parsed in the browser and re-validated server-side in chunks, then run in resumable batches under an advisory lock ([lib/leads/import-server.ts](lib/leads/import-server.ts)). Follow-up reminders: hourly cron, once per follow-up via `sendRepNotice`. Full policy: [docs/sales/leads.md](docs/sales/leads.md). `lib/leads/leads.integration.test.ts` runs the real actions on an in-memory PGlite Postgres.

### Casho Sharks (support program)

Selective program for existing merchants: public page `casho.store/sharks` (+ `/sharks/[slug]` stories, teaser on the home page), application at `/dashboard/sharks` (store owners only; `/sharks/apply` redirects there on the app host), admin at `/admin/sharks`. Pure rules in [lib/sharks/workflow.ts](lib/sharks/workflow.ts) (status transitions, publish gates), public reads only through [lib/sharks/public.ts](lib/sharks/public.ts) (published + approved + consented, explicit field list). Tracks are Benefits / Growth only — **Casho Investment is a future pathway with no enum value, toggle, plan type or money path**; keep it that way unless a separately approved implementation is requested. A story publishes only from APPROVED with consent recorded and not revoked; editing an approved story sends it back to review; the video has its own publish switch. Videos are external URLs (YouTube / Vimeo / direct mp4/webm via [lib/sharks/video.ts](lib/sharks/video.ts)). Program switches live in the `SharksProgram` singleton.

### Casho Examples (landing showcase)

"أمثلة كاشو" on the home page (`#showcase`, [Showcase.tsx](app/(welcome)/_components/apple/Showcase.tsx)) shows live stores built on Casho; admins add, edit, hide, reorder and delete them at `/admin/showcase` (`ShowcaseSite` model, actions in [actions/admin/showcase.actions.ts](actions/admin/showcase.actions.ts), every write revalidates `/`). An example is a name, a field (`SHOWCASE_CATEGORIES` in [lib/showcase/catalog.ts](lib/showcase/catalog.ts), ar/en labels), a link and a homepage screenshot (Cloudinary `casho/uploads/showcase`; a tall full-page shot scrolls on hover). It can be tied to a Casho store (paste its slug or link): the card then follows the store's live address and hides itself while the storefront is closed. Public reads only through `getPublishedShowcase()` in [lib/showcase/public.ts](lib/showcase/public.ts) (never throws); the section is hidden when nothing is visible.

### Store Setup Checklist (dashboard overview)

"جهّز متجرك للبيع" on `/dashboard`: **essentials** a store needs before it can take a real order — logo, customer WhatsApp number, real products, removing the onboarding sample catalog (only while it's there — it's live on the storefront), payment, shipping, and a subscription that will actually be paid (a trial counts only when balance + auto-renew cover the first period) — then optional **boosts** (categories, banner, social links, domain, first real order). Rules are pure in [lib/store-setup/checklist.ts](lib/store-setup/checklist.ts) (`hasPaymentSetup` / `hasShippingSetup` are shared with the sales rep's view of a customer's setup; free shipping counts once chosen in onboarding); facts load in `lib/store-setup/server.ts` (sample data excluded via `lib/demo-data/where.ts`). The card ([StarterGuideCard.tsx](app/(merchant)/_components/main/StarterGuideCard.tsx)) does the quick steps in place — logo upload, WhatsApp number (`actions/onboarding/setup-guide.actions.ts`), clearing sample data, copying the store link — and links to the page for the rest. Dismissed per browser (`casho-setup-guide-hidden-v2`); the sample-data banner shows instead once it's hidden.

### Notifications

In-app notifications use polling (every 30s). `createNotification` in [lib/notifications/in-app.ts](lib/notifications/in-app.ts) is safe to call inside any action — it catches errors silently so it never breaks the main flow. Notifications are scoped to `userId` or `storeId`.

Order emails (Brevo SMTP via [lib/mail.ts](lib/mail.ts)) live in [lib/notifications/email/](lib/notifications/email/): the owner gets every new order, and a customer who typed an email at checkout (`Order.email`) gets a confirmation and each status change. The owner also gets store alerts (low/out of stock, at most once a day per product; failed online payments) from [store-alerts.ts](lib/notifications/email/store-alerts.ts). Call the `queue*` functions — they send after the response via `after()` and never throw. Every send goes through `deliver()` ([deliver.ts](lib/notifications/email/deliver.ts)): 3 tries with backoff, then one `EmailLog` row (also used to dedupe alerts). Per-store switches: `StoreSettings.emailNewOrders` / `emailCustomerOrders` / `emailStoreAlerts`.

### Admin Panel

Admin routes are under `app/admin/`. Access is gated by `adminGuard()` in [actions/admin/admin-guard.actions.ts](actions/admin/admin-guard.actions.ts). Admin manages: store listings, topup request approvals, service requests, and support requests.

Media buyers (`User.role = MEDIA_BUYER`, set by a super admin from the user's admin page) get the admin shell with the Analytics Center only: Casho's own traffic (marketing site + merchant dashboard — no storefront scope, store filter, Stores/Settings tabs or storefront funnels), aggregate views and exports, and they may add/delete campaign costs. Rules in [lib/admin/panel-roles.ts](lib/admin/panel-roles.ts). Layouts don't re-render on client navigation, so **every admin page outside `/admin/analytics` starts with `requireAdminPage()`** ([lib/admin/page-guard.ts](lib/admin/page-guard.ts)) and every analytics page reads its filters through `readAnalyticsFilter()` / `analyticsFilterFor()` ([lib/analytics/access.ts](lib/analytics/access.ts)), which pin a media buyer to Casho's traffic; `lib/admin/panel-roles.test.ts` fails a page that skips either.

Permanent delete of a store or account ([lib/admin/deletion.ts](lib/admin/deletion.ts), "danger zone" on the admin store/user pages): an admin can delete only what has no money history (ledger top-ups/charges/refunds, balance, sales commissions, referral rewards). A super admin can **force** past those: the ledger, commissions, domain registrations and referral history are deleted too, a money summary goes to the `STORE_DELETED` / `ACCOUNT_DELETED` security log first, and work the user did in other merchants' stores is handed to that store's owner. Never forceable: deleting yourself, an admin (demote first) or a sales rep (disable instead).

### Environment Variables

Required vars (see [lib/secrets.ts](lib/secrets.ts) and [lib/paymob.ts](lib/paymob.ts)):
- `DATABASE_URL` — PostgreSQL connection string
- `ROOT_DOMAIN` — defaults to `casho.store`
- `APP_URL` — full app URL for callback redirects
- `PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET`, `PAYMOB_INTEGRATION_IDS` (comma-separated card/wallet ids) — Casho's own account for top-ups; online top-ups are hidden until set
- `PAYMENT_ENCRYPTION_KEY` — encrypts merchants' gateway secrets
- `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USER`, `BREVO_SMTP_PASS`, `MAIL_FROM_EMAIL` (+ optional `MAIL_FROM_NAME`, `MAIL_REPLY_TO`) — verification codes, password reset and order emails; order emails are skipped until set. `MAIL_FROM_EMAIL` must be on a domain authenticated in Brevo (`noreply@casho.store`), never free-mail: signup is locked behind the emailed code, so mail in spam stops signups. DNS (Vercel) + Brevo steps in [docs/email/deliverability.md](docs/email/deliverability.md); `npm run check:mail -- <sender> [--send <to>]` checks the records and sends a test.

## Key Conventions

- **Money**: always stored and passed as integer piasters. Convert to display using `formatMoneyFromPiasters()` from [lib/subscriptions.ts](lib/subscriptions.ts).
- **Slugs**: store slugs are globally unique; product slugs are globally unique too (not scoped to store).
- **UI components**: Radix UI primitives + shadcn/ui pattern, located in [components/ui/](components/ui/). Utility: `cn()` from [lib/utils.ts](lib/utils.ts).
- **Validation**: Zod schemas for form inputs, helpers in [lib/zod.ts](lib/zod.ts) and [validations/](validations/).