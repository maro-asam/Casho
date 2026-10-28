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

### Store Themes

Each store can select a theme (`StoreSettings.themeId`, or `themeConfig.presetId`). Presets (tokens, layout, sections) are in [constants/store-themes.ts](constants/store-themes.ts) — `default` (Classic), `riwaq` (Riwaq, editorial paper/ink/arches — see its `DESIGN.md`), `mada` (Mada, modular pine/chartreuse) `dune` (Casho Dune, editorial serif/square media — see its `DESIGN.md`), `maximize` (Maximize, large-catalog electronics layout modelled on the Shopify Maximize preset — see its `DESIGN.md`) and `cello` (Cello, navy/yellow electronics layout modelled on the Shopify Cello preset — see its `DESIGN.md`).

The storefront UI lives in [app/store/[slug]/_themes/](app/store/[slug]/_themes/): `types.ts` is the theme contract (view-model props per page), `index.ts` is the registry (`getStorefrontTheme(id)`), and each theme is a folder (`classic/`, `riwaq/`) with its own scoped CSS (`.theme-classic`, `.theme-riwaq`). Theme-agnostic helpers (cart events, store paths, social links, price tiers, sort options, filter query builder, cart-count hook, `SubmitButton`) live in `_themes/shared/` — themes import from there, never from each other. `loading.tsx` / `not-found.tsx` render `ThemeState`, which picks the active theme's skeleton from context; a new theme must add its states there. Route files under `app/store/[slug]/` only load data (helpers in `_lib/storefront.ts`) and render `theme.Home`, `theme.ProductListing`, `theme.Product`, `theme.Cart`, etc. Themes never query the DB; they call the existing store actions.

### Order Tracking (storefront `/track`)

Shoppers track an order without logging in: order number (`#A1B2C3` = last 6 of the id; the dashboard's 8-char prefix and the full id work too) + the phone it was placed with. Emails, the success/order pages and the merchant's WhatsApp chat link to a signed URL (`orderTrackUrl`, HMAC like `whatsapp-confirm`) that opens the order directly. Pure view-model (timeline, shipment, items — never address/phone/merchant notes) in [lib/orders/tracking.ts](lib/orders/tracking.ts); lookups + rate limit in [lib/orders/track-order.ts](lib/orders/track-order.ts) — failed searches are `SecurityLog` rows (`ORDER_TRACK_FAILED`), no extra table. The UI is shared (`_themes/shared/track/OrderTracker`); each theme's `Track` only adds its page chrome and a `TrackSkin`.

### Store Imports (Shopify)

Merchants migrate from Shopify at `/integrations/shopify`. Provider-agnostic engine in [lib/integrations/import/](lib/integrations/import/) (DB-backed `ImportJob` queue with lease + checkpoints, idempotency via `ImportRecordMap` unique key), Shopify provider in [lib/integrations/shopify/](lib/integrations/shopify/) (OAuth, GraphQL client with cost-based throttling). Background runs: `after()` on start, the page's status poll, and `/api/cron/run-imports` (CRON_SECRET). Full guide: [docs/integrations/shopify-import.md](docs/integrations/shopify-import.md).

### Sales Team (referrals & commissions)

Sales reps are `User.role = SALES` + `SalesRep`, created only by admins (`/admin/sales`); reps use `/sales` (guard: `requireSalesRep()` in [lib/sales/guard.ts](lib/sales/guard.ts), scope always from the session). Signup attribution (`SalesAttribution`) comes from `?ref=` on `/register` (Google OAuth carries it in the `signupRef` cookie). Commissions are driven by `SUBSCRIPTION_CHARGE` / `REFUND` ledger rows: every billing path that writes one must call `recordSalesCommissionsForStore(storeId)` afterwards (idempotent; the renew-subscriptions cron also sweeps). Pure rules in [lib/sales/rules.ts](lib/sales/rules.ts); full policy in [docs/sales/commissions.md](docs/sales/commissions.md).

### Casho Sharks (support program)

Selective program for existing merchants: public page `casho.store/sharks` (+ `/sharks/[slug]` stories, teaser on the home page), application at `/dashboard/sharks` (store owners only; `/sharks/apply` redirects there on the app host), admin at `/admin/sharks`. Pure rules in [lib/sharks/workflow.ts](lib/sharks/workflow.ts) (status transitions, publish gates), public reads only through [lib/sharks/public.ts](lib/sharks/public.ts) (published + approved + consented, explicit field list). Tracks are Benefits / Growth only — **Casho Investment is a future pathway with no enum value, toggle, plan type or money path**; keep it that way unless a separately approved implementation is requested. A story publishes only from APPROVED with consent recorded and not revoked; editing an approved story sends it back to review; the video has its own publish switch. Videos are external URLs (YouTube / Vimeo / direct mp4/webm via [lib/sharks/video.ts](lib/sharks/video.ts)). Program switches live in the `SharksProgram` singleton.

### Notifications

In-app notifications use polling (every 30s). `createNotification` in [lib/notifications/in-app.ts](lib/notifications/in-app.ts) is safe to call inside any action — it catches errors silently so it never breaks the main flow. Notifications are scoped to `userId` or `storeId`.

Order emails (Brevo SMTP via [lib/mail.ts](lib/mail.ts)) live in [lib/notifications/email/](lib/notifications/email/): the owner gets every new order, and a customer who typed an email at checkout (`Order.email`) gets a confirmation and each status change. The owner also gets store alerts (low/out of stock, at most once a day per product; failed online payments) from [store-alerts.ts](lib/notifications/email/store-alerts.ts). Call the `queue*` functions — they send after the response via `after()` and never throw. Every send goes through `deliver()` ([deliver.ts](lib/notifications/email/deliver.ts)): 3 tries with backoff, then one `EmailLog` row (also used to dedupe alerts). Per-store switches: `StoreSettings.emailNewOrders` / `emailCustomerOrders` / `emailStoreAlerts`.

### Admin Panel

Admin routes are under `app/admin/`. Access is gated by `adminGuard()` in [actions/admin/admin-guard.actions.ts](actions/admin/admin-guard.actions.ts). Admin manages: store listings, topup request approvals, service requests, and support requests.

### Environment Variables

Required vars (see [lib/secrets.ts](lib/secrets.ts) and [lib/paymob.ts](lib/paymob.ts)):
- `DATABASE_URL` — PostgreSQL connection string
- `ROOT_DOMAIN` — defaults to `casho.store`
- `APP_URL` — full app URL for callback redirects
- `PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET`, `PAYMOB_INTEGRATION_IDS` (comma-separated card/wallet ids) — Casho's own account for top-ups; online top-ups are hidden until set
- `PAYMENT_ENCRYPTION_KEY` — encrypts merchants' gateway secrets
- `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USER`, `BREVO_SMTP_PASS`, `MAIL_FROM_EMAIL` (+ optional `MAIL_FROM_NAME`) — password reset and order emails; order emails are skipped until set

## Key Conventions

- **Money**: always stored and passed as integer piasters. Convert to display using `formatMoneyFromPiasters()` from [lib/subscriptions.ts](lib/subscriptions.ts).
- **Slugs**: store slugs are globally unique; product slugs are globally unique too (not scoped to store).
- **UI components**: Radix UI primitives + shadcn/ui pattern, located in [components/ui/](components/ui/). Utility: `cn()` from [lib/utils.ts](lib/utils.ts).
- **Validation**: Zod schemas for form inputs, helpers in [lib/zod.ts](lib/zod.ts) and [validations/](validations/).