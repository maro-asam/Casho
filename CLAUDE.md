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

There are no tests in this project.

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
  api/                    # API routes (payments/kashier, meta, telegram, export)
```

### Subdomain Routing (middleware.ts)

The middleware rewrites subdomain requests to `/store/[slug]`. `mystore.casho.store` → `/store/mystore`. Locally, `mystore.localhost` also works. Static assets and `/api` are bypassed.

Reserved subdomains: `www`, `app`, `casho`.

### Authentication

Custom session-based auth — no NextAuth. Sessions are stored in the DB (`Session` model). The raw token is stored in an `httpOnly` cookie (`sessionToken`); only the SHA-256 hash is stored in the DB. Key functions in [lib/auth/session.ts](lib/auth/session.ts): `createUserSession`, `getCurrentSession`, `deleteCurrentSession`. Protected routes call `requireUserId()` from [actions/auth/require-user-id.actions.ts](actions/auth/require-user-id.actions.ts).

### Database (Prisma + PostgreSQL)

Prisma client uses the `@prisma/adapter-pg` driver adapter (not the default connector). The singleton is in [lib/prisma.ts](lib/prisma.ts). Always run `npx prisma generate` after editing `prisma/schema.prisma`.

Key models: `User` → `Store` → `Product`, `Order`, `Category`, `Banner`, `Coupon`. Each store has one `StoreSettings` (theme, SEO, social links) and one `StorePaymentSettings` (Kashier credentials).

### Server Actions Pattern

All mutations use Next.js Server Actions in [actions/](actions/). They are organized by domain (`auth/`, `store/`, `admin/`, `balance/`, `notifications/`, etc.). Actions call `requireUserId()` or `adminGuard()` at the top for auth.

### Subscription & Balance

Subscriptions are billed from the store's internal balance (not Stripe). Balance is stored in piasters (`Store.balance`). Merchants top up via Kashier payment; admin approves topup requests. The subscription logic is in [lib/subscriptions.ts](lib/subscriptions.ts) — statuses are `INACTIVE`, `ACTIVE`, `GRACE_PERIOD`, `CANCELED`. Grace period = 3 days after expiry.

### Payment Integration — Kashier

Kashier is the Egyptian payment gateway used for balance topups. Integration in [lib/kashier.ts](lib/kashier.ts). The callback endpoint is `/api/payments/kashier/callback`. Hash verification uses HMAC-SHA256. Amounts pass through the helpers `piastersToKashierAmount` / `kashierAmountToPiasters`.

### Store Themes

Each store can select a theme (`StoreSettings.themeId`). Themes live in [app/store/[slug]/_themes/](app/store/[slug]/_themes/) — currently `classic`, `bold`, `boutique`, `magazine`. The `StoreThemeRenderer` picks the right theme component based on the setting.

### Notifications

In-app notifications use polling (every 30s). `createNotification` in [lib/notifications/in-app.ts](lib/notifications/in-app.ts) is safe to call inside any action — it catches errors silently so it never breaks the main flow. Notifications are scoped to `userId` or `storeId`.

### Admin Panel

Admin routes are under `app/admin/`. Access is gated by `adminGuard()` in [actions/admin/admin-guard.actions.ts](actions/admin/admin-guard.actions.ts). Admin manages: store listings, topup request approvals, service requests, and support requests.

### Environment Variables

Required vars (see [lib/secrets.ts](lib/secrets.ts) and [lib/kashier.ts](lib/kashier.ts)):
- `DATABASE_URL` — PostgreSQL connection string
- `ROOT_DOMAIN` — defaults to `casho.store`
- `APP_URL` — full app URL for callback redirects
- `KASHIER_MERCHANT_ID`, `KASHIER_PAYMENT_API_KEY`, `KASHIER_MODE` (`test`|`live`)

## Key Conventions

- **Money**: always stored and passed as integer piasters. Convert to display using `formatMoneyFromPiasters()` from [lib/subscriptions.ts](lib/subscriptions.ts).
- **Slugs**: store slugs are globally unique; product slugs are globally unique too (not scoped to store).
- **UI components**: Radix UI primitives + shadcn/ui pattern, located in [components/ui/](components/ui/). Utility: `cn()` from [lib/utils.ts](lib/utils.ts).
- **Validation**: Zod schemas for form inputs, helpers in [lib/zod.ts](lib/zod.ts) and [validations/](validations/).