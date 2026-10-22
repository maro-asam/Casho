# Import from Shopify

Merchants connect their Shopify store with OAuth and move their catalog, customers and order history into their Kasho store. The import runs in the background, can be resumed, and never creates duplicates when it is run again.

- Page: `/integrations/shopify` (app subdomain). Linked from the sidebar ("القنوات والربط"), the Integrations page and the product import page.
- Who can use it: the store **owner** only (`manage_settings` permission). Managers and staff get an error.

---

## 1. Shopify app setup (one time, done by Kasho)

1. Create an app in the Shopify **Dev Dashboard** (dev.shopify.com → Apps → Create app). This is a non-embedded app: merchants use it from the Kasho dashboard, not from Shopify admin.
2. **App URL**: `https://app.casho.store/integrations/shopify`
3. **Allowed redirection URL** (must match exactly):
   `https://app.casho.store/api/integrations/shopify/oauth/callback`
4. **Access scopes** (read-only; see section 4).
5. **Webhooks** (section 5): the three mandatory privacy topics go in [`shopify-app/shopify.app.toml`](../../shopify-app/shopify.app.toml) (deploy with `npx @shopify/cli@latest app deploy` from that folder). `app/uninstalled` is subscribed per shop from the OAuth callback, because Shopify rejects app-wide subscriptions while `use_legacy_install_flow` is on — and the import needs that flow, since the merchant starts OAuth from the Kasho dashboard.
6. **Protected customer data**: customers and orders contain personal data. In the Partner/Dev Dashboard, request access to protected customer data (name, email, phone and address fields) and explain the purpose: migrating the merchant's own customers and orders into their Kasho store. Without that approval, Shopify rejects the customer and order queries on production stores. Development stores are less restricted. Check Shopify's current rules before launch.
7. **Distribution**: custom distribution only works for one store (or one Plus organization). To serve every Kasho merchant, the app needs public distribution, which goes through Shopify's app review. Check Shopify's current distribution rules before launch.
8. Copy the **Client ID** and **Client secret** into the environment variables below.

> Shopify requires **expiring offline access tokens** for new public apps. Kasho requests them (`expiring=1`) and refreshes them automatically. The refresh token lasts 90 days, so a merchant who leaves an import paused for longer than that has to reconnect. The page shows a reconnect form when that happens.

## 2. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `SHOPIFY_CLIENT_ID` | yes | App Client ID |
| `SHOPIFY_CLIENT_SECRET` | yes | App Client secret. Verifies OAuth callbacks and webhook HMACs and exchanges tokens. |
| `APP_URL` | yes (already used) | Builds the redirect URI: `${APP_URL}/api/integrations/shopify/oauth/callback` |
| `PAYMENT_ENCRYPTION_KEY` | yes (already used) | AES-256-GCM key that encrypts Shopify tokens at rest (`lib/secrets.ts`) |
| `CRON_SECRET` | yes (already used) | Protects `/api/cron/run-imports` |
| `SHOPIFY_API_VERSION` | no | Admin GraphQL version. Default `2026-10`. |
| `SHOPIFY_SCOPES` | no | Comma list. Defaults to the minimum set. Add `read_all_orders` once Shopify approves it. |

If `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET` or `APP_URL` is missing, the page says the integration isn't enabled, and the OAuth routes redirect with `error=not_configured`.

## 3. Background runner (cron)

The import is a DB-backed job (`ImportJob`). Three things move it forward:

1. `after()` immediately after the merchant clicks **Start Import** or **Resume**.
2. The status poll (every 3 s) while the import page is open.
3. **`/api/cron/run-imports`** while nobody has the page open. Add it to cron-job.org next to the existing jobs:
   - URL: `https://casho.store/api/cron/run-imports`
   - Schedule: **every minute**
   - Header: `Authorization: Bearer <CRON_SECRET>`

Each run works for about 25 s, saves a checkpoint after every page and then releases the job. Without the cron, an import only moves forward while the page is open.

## 4. Scopes

| Scope | Why |
|---|---|
| `read_products` | Products, variants, media, collections |
| `read_inventory` | Inventory quantities, tracked flag, unit cost |
| `read_customers` | Customers |
| `read_orders` | Orders and line items (**last 60 days only**) |
| `read_all_orders` *(optional)* | Orders older than 60 days. Shopify must approve it for public apps. Add it to `SHOPIFY_SCOPES` once approved. |

The import never writes to Shopify. When the app has no `read_all_orders`, the preview tells the merchant that only the last 60 days of orders will be imported.

## 5. Webhooks

Endpoint: `POST https://app.casho.store/api/integrations/shopify/webhooks`. Every call is verified with `X-Shopify-Hmac-Sha256`.

| Topic | Handling |
|---|---|
| `app/uninstalled` | Connection → `DISCONNECTED` and its tokens are deleted. A running job pauses and asks the merchant to reconnect. |
| `shop/redact` | Deletes the connection, its job history and every record map for that shop |
| `customers/redact` | Deletes the Shopify↔Kasho link for that customer. The Kasho customer row is the merchant's own record after the migration. |
| `customers/data_request` | Acknowledged. Kasho keeps no Shopify-side copy beyond what the merchant imported into their own store. |

The privacy topics are declared in [`shopify-app/shopify.app.toml`](../../shopify-app/shopify.app.toml). `app/uninstalled` is created per shop with `webhookSubscriptionCreate` right after OAuth (`registerUninstallWebhook` in `lib/integrations/shopify/source.ts`); a failure there is logged and doesn't block the connection.

## 6. Local development

1. Create a Shopify **development store** in the Partner Dashboard and add a few products, customers and orders.
2. Expose your dev server over HTTPS, e.g. `cloudflared tunnel --url http://localhost:3000` or `ngrok http 3000`.
3. Set `APP_URL` to the tunnel URL and add `${APP_URL}/api/integrations/shopify/oauth/callback` to the app's allowed redirection URLs.
4. Set `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET` (use a separate dev app; never commit them).
5. Apply the migration: `npx prisma migrate deploy` (or `npx prisma migrate dev`), then `npx prisma generate`.
6. Open `/dashboard/integrations/shopify`, connect the dev store, preview, start the import.
7. To advance a job without the page open:
   `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/run-imports`

The state cookie is scoped to `.${ROOT_DOMAIN}` in production and to the host on localhost, so start and finish the OAuth flow on the same host.

## 7. Production checklist

- [ ] Run migration `20261006120000_store_imports` (`npx prisma migrate deploy`)
- [ ] Set `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET` in Vercel
- [ ] Redirect URL and webhooks configured in the Shopify app
- [ ] Protected customer data access approved (and `read_all_orders`, if wanted)
- [ ] cron-job.org: `/api/cron/run-imports` every minute with `CRON_SECRET`

## 8. Architecture

```
app/(merchant)/dashboard/integrations/shopify/   UI (state machine: lib/integrations/import/progress.ts)
actions/integrations/shopify-import.actions.ts   server actions: state, preview, start, poll, resume, cancel, retry, disconnect
app/api/integrations/shopify/oauth/initiate      POST: sealed state cookie → redirect to Shopify
app/api/integrations/shopify/oauth/callback      GET: HMAC + state + session checks → encrypted tokens
app/api/integrations/shopify/webhooks            uninstall + privacy webhooks
app/api/cron/run-imports                         background runner

lib/integrations/import/      provider-agnostic engine
  types.ts      Normalized* records, ImportSource / ImportSink contracts
  core.ts       page loop + checkpoints (pure, unit-tested)
  engine.ts     DB job queue: lease, budget, backoff, pause, finish + notification
  sink.ts       Prisma writes into Kasho models + idempotency map
  kasho-fields.ts  pure Normalized → Kasho field conversion
  access.ts     owner-only guard;  views.ts  browser-safe DTOs;  errors.ts  safe messages + redaction
  registry.ts   provider → ImportSource

lib/integrations/shopify/     Shopify provider
  config.ts  oauth.ts  callback.ts  connection.ts (token refresh)  client.ts (GraphQL + rate limits)
  queries.ts  mappers.ts  source.ts (pagination)  webhooks.ts
```

To add WooCommerce or Magento, write `lib/integrations/<provider>/` with an `ImportSource` that returns `Normalized*` records, add an enum value to `ImportProvider`, register it in `registry.ts` and build its connect UI. The engine, sink, progress, history and retry work as they are.

### Import order

Kasho's foreign keys set the order: **Collections → Products (with variants, images, inventory) → Customers → Orders**. A product needs a category; an order item needs a product and optionally links a customer. The merchant can deselect entities.

### Data mapping

| Shopify | Kasho | Notes |
|---|---|---|
| Collection | `Category` | Slug from handle. An existing Kasho category with the same slug is reused. |
| Product | `Product` | title, description (HTML → text), vendor → brand, tags, status ACTIVE → `isActive`, media → `image` + `images`, `createdAt` |
| Product → category | `Product.categoryId` | first imported collection → else a category named after the product type → else "منتجات مستوردة" |
| Options | `sizes` / `colors` / `attributes` | Size/Color options (EN/AR names) feed the storefront pickers; other options go to attributes |
| Variant | `ProductVariant` | name, SKU (cleared if already used in the store), barcode, price, compare-at, unit cost → `costPrice`, options → `attributes`, image |
| Inventory | `Product.stock`, `ProductVariant.stock`, default-branch `BranchInventory`, `StockMovement` | Total across Shopify locations. Untracked variants get **999**. |
| Price | `Product.price` (major units) | Lowest variant price. Compare-at kept only if higher. |
| Customer | `Customer` | Matched by **phone** (`@@unique(storeId, phone)`). E.164 Egyptian numbers → `01…`. An existing Kasho customer with that phone is linked; only its empty fields are filled. Tags → `CustomerTag`. |
| Order | `Order` | `#1001` → `paymentReference`. Totals → piasters. `paymentProvider = "SHOPIFY"`. Original `createdAt`. Linked to the imported customer. |
| Line item | `OrderItem` | Unit price, quantity, discount. Variant title and SKU → `selectedFeatures`. Lines whose product no longer exists point to one inactive "منتج غير متاح" product. |
| Order status | `OrderStatus` | cancelled / refunded / voided → CANCELED · fulfilled → DELIVERED · partially fulfilled → SHIPPED · paid → PAID · else PENDING |

Imported orders **do not** reduce stock and do not send notifications, webhooks or loyalty points.

### Idempotency and duplicate protection

- `ImportRecordMap` has a unique key `(storeId, provider, externalShopId, entityType, externalId)`. Every Kasho row the import creates is mapped **in the same transaction**. A second run finds the map and updates the row (or skips it, for orders).
- If two workers race to create the same record, the second insert into the map violates the constraint, its transaction rolls back (so no orphan product) and it falls back to the update path.
- The partial unique index `ImportJob_one_active_per_store` allows only one QUEUED, RUNNING or PAUSED import per store. A double click, a refresh or a second tab gets "an import is already running".
- Re-import semantics: collections, products (including stock) and customers are refreshed from Shopify. Orders that were already imported are never changed.

### Resumability and failures

- After every page, the job saves `currentEntity` and `cursor` with a lease check (`lockToken`). A crashed or timed-out worker loses its lease after 2 minutes, and the next run continues from the last checkpoint.
- **Item failures** (`ImportItemError`: ids, label and a safe reason, no payload) never stop the import. When it ends with failures, the status is `COMPLETED_WITH_ERRORS`, and **Retry failed items** starts a `RETRY` job that re-fetches only those records by id.
- **Run failures** (network, 5xx, throttling that never clears) back off for 15 s × 2ⁿ, capped at 10 min. After 6 failures in a row the job is `PAUSED` with a reason and a **Resume** button. A 401 or failed token refresh pauses the job straight away and asks the merchant to reconnect.

### Rate limits and large stores

- GraphQL cost-based throttling: after every call the client reads `extensions.cost.throttleStatus` and waits until the bucket can pay for the next query. `THROTTLED` errors and HTTP 429 (`Retry-After`) are waited out, not counted as failures.
- Page sizes keep each query under the 1,000-point cost limit: products 10 (30 variants each), orders 10 (20 line items each), customers and collections 50. Overflowing variants and line items are fetched with follow-up queries.
- Shopify stops cursor pagination at 25,000 objects. Every 20,000 records the cursor restarts with an `id:>lastId` filter, so any store size can be walked. If Shopify ignored that filter, the import fails loudly instead of looping.
- Only one page is held in memory at a time.

### Security

- OAuth: `state` is a 24-byte nonce sealed with AES-256-GCM, together with user, store, shop and expiry, in an httpOnly, SameSite=Lax cookie scoped to the Shopify API path. The callback checks the Shopify HMAC, the state, the shop, that the logged-in user is the one who started the flow, and the user's current permission. The flow starts with a **POST**, so a cross-site page can't trigger it.
- The shop domain must match `^[a-z0-9][a-z0-9-]*\.myshopify\.com$`; tokens are only ever sent to that host.
- Tokens are AES-256-GCM encrypted at rest and decrypted only in `lib/integrations/shopify/connection.ts`. They never reach the browser: DTOs in `views.ts` are built field by field, and a test checks this.
- Logs carry ids, codes and counts only. `redactSecrets()` strips token-shaped strings, and database error messages (which can echo customer values) are never logged or shown.
- Tenant isolation: every action resolves the store from the session and scopes each query by `storeId`. The engine refuses a job whose connection belongs to another store or another shop. The sink only writes with the job's `storeId`.

## 9. Supported vs. not supported

**Imported:** collections, products, variants, product images, inventory quantities, cost prices, tags, size/color options, customers (with phone), customer tags, orders, order line items, order totals, shipping, discounts and coupon code (as text).

**Not imported:** discount codes and automatic discounts, gift cards, pages and blog posts, themes, shipping, tax and payment settings, customer passwords (Shopify doesn't expose them), refund and return details, metafields, per-location inventory (summed into the default branch), product SEO fields, draft orders, abandoned checkouts.

## 10. Known limitations

- **Currency**: amounts are imported as-is. A non-EGP shop gets its numbers without conversion, and the preview warns about it.
- **Images stay on Shopify's CDN** (`cdn.shopify.com`). If the merchant closes their Shopify store for good, those images may stop loading.
- **Customers without a phone number are skipped**: Kasho identifies customers by phone. The count appears in the result.
- Orders older than 60 days need `read_all_orders`.
- Untracked inventory gets a stock of 999.
- Re-importing products overwrites Kasho-side edits to the same fields (Shopify wins), including category and stock.
- The UI wasn't driven end-to-end against a live Shopify store, because that needs app credentials. The logic is covered by unit tests and by an integration test against a real Postgres engine (below).

## 11. Tests

```bash
npx vitest run lib/integrations
```

| Suite | Covers |
|---|---|
| `shopify/oauth.test.ts` | shop validation, authorize URL and scopes, OAuth HMAC, sealed state (tamper, expiry), token exchange and refresh, webhook HMAC |
| `shopify/callback.test.ts` | successful OAuth, invalid/forged/missing state, tampered callback, declined authorization, failed exchange, missing scopes, other user, lost permission |
| `shopify/client.test.ts` | cost throttling, THROTTLED retry, 429 Retry-After, 5xx/network retry and give-up, 401, no token in errors |
| `shopify/source.test.ts` | cursor pagination, nested variant overflow, 25k window restart, id-filter guard, batched `nodes()` |
| `shopify/mappers.test.ts` | product, customer and order mapping, status mapping, phone normalization |
| `import/core.test.ts` | product, customer and order import, pagination, partial failure, duplicate import, interrupted import and resume, time budget, retry of failed items |
| `import/engine.test.ts` | lease, completion and notification, tenant guard, backoff, pause after max attempts, reconnect on 401, lost lease |
| `import/security.test.ts` | owner-only access, cross-store job access, tokens/lease/cursor never in page state, log redaction |
| `import/progress.test.ts` | every UI state (not connected → completed with warnings), progress math |
| `import/sink.integration.test.ts` | real Postgres (PGlite): full import, re-run without duplicates, stock sync via branch, concurrent duplicate create, cross-store isolation, one active job per store, plan limit |

The integration suite is skipped unless the adapter is installed. `@electric-sql/pglite` already comes with Prisma; only the adapter is missing:

```bash
npm i -D pglite-prisma-adapter && npx vitest run lib/integrations/import/sink.integration.test.ts
```

## 12. Future improvements

- Shopify **Bulk Operations** for very large stores (one JSONL export instead of paging).
- Re-host product images to Cloudinary during the import.
- Import discount codes into `Coupon` (needs `read_discounts`).
- Optional ongoing sync (product/inventory webhooks) for merchants running both stores during the transition.
- Per-location inventory → Kasho branches.
- Let the merchant choose how unknown-phone customers are handled.
