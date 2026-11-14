# Import from WooCommerce

Merchants connect their WordPress + WooCommerce site and move their catalog, customers and order history into their Casho store. It runs on the same engine as the [Shopify import](./shopify-import.md): the import runs in the background, can be resumed, and never creates duplicates when it is run again.

- Page: `/integrations/woocommerce` (app subdomain). Linked from the sidebar (Apps), the Integrations page, the Apps catalog and the product import page.
- Who can use it: the store **owner** only (`manage_settings` permission), same as Shopify.

---

## 1. Setup (Casho side)

There is no app to register. WooCommerce has its own key-approval screen (`/wc-auth/v1/authorize`) on every site, and each merchant approves a **read-only** REST key on their own WordPress. Casho only needs:

| Variable | Required | Purpose |
|---|---|---|
| `APP_URL` | yes (already used) | Must be **https://**. WooCommerce refuses a non-SSL callback, so the page says "not enabled" when it isn't https. |
| `PAYMENT_ENCRYPTION_KEY` | yes (already used) | AES-256-GCM key that encrypts the merchant's key pair at rest (`lib/secrets.ts`) |
| `CRON_SECRET` | yes (already used) | Protects `/api/cron/run-imports`, the same runner Shopify uses |

Migration: `20261114120000_woocommerce_import` adds `WOOCOMMERCE` to the `ImportProvider` enum. Nothing else in the schema changes.

## 2. What the merchant needs

- The site on **HTTPS**. WooCommerce only accepts key auth over SSL.
- **Pretty permalinks** (Settings → Permalinks → anything except "Plain"). With plain permalinks the REST API only answers on `?rest_route=`, and WooCommerce's key auth doesn't run there. The connect page detects this and tells the merchant which setting to change.
- A WordPress account that can manage WooCommerce (admin / shop manager) to approve the key.
- The REST API (`/wp-json/`) reachable from the internet. Security plugins, "disable REST API" plugins and Cloudflare bot challenges block it; the connect page and the import report that as "blocked".
- The site must be able to make one outgoing HTTPS request (the key callback). Some hosts or firewalls block outgoing calls. The merchant then lands back on Casho with a clear "the key never reached us" message.

## 3. The connection flow

```
Merchant types "mystore.com"
  → POST /api/integrations/woocommerce/oauth/initiate
      discoverSite(): https only, public host only, GET /wp-json/ → WordPress?
      "wc/v3" in namespaces → WooCommerce active? canonical `home` from the index
  → 303 to {home}/wc-auth/v1/authorize?app_name=Casho&scope=read&user_id=<sealed state>
           &return_url=…/oauth/return&callback_url=…/oauth/callback
Merchant logs into WordPress and clicks Approve
  → WooCommerce POSTs { consumer_key, consumer_secret, key_permissions, user_id } to
    /api/integrations/woocommerce/oauth/callback   (server to server, no browser)
      user_id must open as our sealed, unexpired state → store + user + site
      key pair well-formed, permission read/read_write, user still owner
      → key pair encrypted into ImportConnection.accessTokenEnc, 200
      (any non-200 makes WooCommerce delete the key it just created)
  → WooCommerce redirects the browser to /oauth/return?success=1&user_id=…
      same Casho user as in the state? connection saved for that site just now?
  → /dashboard/integrations/woocommerce?connected=1 → the page loads the preview,
    which is the first real call with the key (a 401 there → "reconnect")
```

Why the state rides in `user_id`: WooCommerce's callback comes from the merchant's server, with no Casho cookies, so it can't be tied to a session. `user_id` is passed through untouched, so it carries the state sealed with AES-256-GCM (`lib/secrets`). It can't be read or forged, it binds the flow to one user, store and site, and it expires after 30 minutes. WooCommerce passes `user_id` through its login redirect without URL-encoding it, so the token is base64url.

Why the callback doesn't call the site back: WordPress is still waiting on our response. On a host with a single PHP worker, a request back to the same site would deadlock until the timeout. The preview checks the key a moment later instead.

Disconnecting deletes the key pair on Casho's side. A read-only key can't delete itself, so the confirmation tells the merchant where to remove it in WooCommerce (Settings → Advanced → REST API, the key named "Casho - API …").

## 4. Outbound request safety (SSRF)

The site URL is typed by a user and fetched from Casho's servers, so every request goes through `safeFetch` (`lib/integrations/woocommerce/site.ts`):

- https only, default port only, no credentials in the URL
- no IP literals, single-label names or internal TLDs (`.local`, `.internal`, `.lan`…)
- every DNS answer must be a public address (private, loopback, link-local, CGNAT, metadata, IPv4-mapped IPv6… are refused)
- redirects are followed by hand and every hop is checked again. Requests that carry the key may only redirect within the same origin.

Known limit: the DNS check runs just before each request, and `fetch` resolves the name again when it connects. A site that switches its DNS between the two (DNS rebinding) isn't covered. Closing that gap needs an undici dispatcher with a checking `connect.lookup`, and `undici` isn't a dependency today. The paths Casho requests are fixed (`/wp-json/…`, GET only), which limits what such a site could reach.

The key travels as `consumer_key` / `consumer_secret` query parameters. That is WooCommerce's documented fallback for hosts that strip the `Authorization` header, so it works on every server. The URL is therefore secret: it is never logged, error messages never contain it, and `redactSecrets` strips `ck_…` / `cs_…` values.

## 5. Reading the store

REST API v3 (`/wp-json/wc/v3`), page numbers ordered by id ascending. The checkpoint is `{ page, perPage }`. Totals come from `X-WP-Total`.

| Entity | Endpoint | Page size | Notes |
|---|---|---|---|
| Categories | `/products/categories` | 100 | The default "Uncategorized" (`uncategorized` slug) is skipped |
| Products | `/products?status=any` | 20 | + `/products/{id}/variations` for variable products, 3 at a time. Grouped products are skipped (their children import on their own). |
| Customers | `/customers` | 100 | Registered customers (role `customer`). Guests only exist on their orders. |
| Orders | `/orders?status=any` | 50 | Line items come with the order |

Also read: `/data/currencies/current` (preview → `ImportConnection.currencyCode`) and `/settings/products/woocommerce_weight_unit` (once per run, falls back to kg).

Client behaviour (`client.ts`): 401, or a 403 with a `woocommerce_rest_*` code → `unauthorized` (the job pauses, the page asks to reconnect). A 403 without one, a Cloudflare challenge (`cf-mitigated`) or an HTML page instead of JSON → `blocked`. 429 honours `Retry-After`. 5xx and network errors retry with backoff. A BOM or PHP notices in front of the JSON are tolerated (`parseWordPressJson`).

A record deleted while the import runs can shift one item back a page. Running the import again picks it up, because imports are idempotent.

## 6. Data mapping

Same sink as Shopify (`lib/integrations/import/sink.ts`), so categories, stock movements, SKU handling, customer matching by phone, placeholder products and order history work the same. WooCommerce specifics (`mappers.ts`):

| WooCommerce | Casho | Notes |
|---|---|---|
| Product category | `Category` | Name HTML-decoded, slug percent-decoded (Arabic slugs). Flat: parents aren't kept. |
| Product | `Product` | name, short + long description (HTML → text), `status = publish` → `isActive`, images (deduped), tags, `brands` (WooCommerce 9.6+) or a "Brand"/"الماركة" attribute → brand, weight → kg |
| Product → category | `Product.categoryId` | first imported category (Uncategorized ignored) → else "منتجات مستوردة" |
| Variation attributes | `sizes` / `colors` / `attributes` | Size/Color (EN/AR names) feed the storefront pickers |
| Other attributes | `Product.attributes` | Visible, non-variation attributes ("Material: Cotton، Linen") as specs |
| Variation | `ProductVariant` | Enabled variations only (status `private` = disabled). SKU, `global_unique_id` → barcode, price, regular price → compare-at when on sale, image |
| Simple product | `Product` (no variants) | price / sale price, SKU, barcode, stock |
| Stock | `stock` | `manage_stock` → quantity (negative → 0). Variation set to "parent" → the parent's quantity. Untracked → **999**, `outofstock` → 0. |
| Cost price | — | WooCommerce core has none |
| Customer | `Customer` | name (account → billing → shipping → username), billing phone (Arabic digits and `+20` normalised), shipping address else billing. Egyptian governorate codes (`EGC`, `EGGZ`…) → Arabic names. |
| Order | `Order` | `#number` → `paymentReference`, totals → piasters, `cod` → `cash_on_delivery`, other gateways keep their title, first coupon, customer note. Taxes and fees are appended to the note (Casho orders have no tax field). |
| Order status | `status` / `paymentStatus` | completed → DELIVERED · processing → PAID if paid, else PENDING (cash on delivery) · pending / on-hold → PENDING · cancelled / refunded / failed → CANCELED · custom "shipped" statuses → SHIPPED. Refunds → REFUNDED / PARTIALLY_REFUNDED. |
| Line item | `OrderItem` | unit price before discount, quantity, line discount, variation attributes from the item meta → `selectedFeatures`. A deleted product points to the inactive "منتج غير متاح" product. |

Not imported (shown on the page): coupons, reviews, pages and posts, theme and plugins, shipping / tax / payment settings, customer passwords, refund details, custom fields and plugin data.

## 7. Local development

1. Run WordPress + WooCommerce somewhere reachable over HTTPS (a staging site, or LocalWP behind a tunnel), with pretty permalinks.
2. Expose Casho over HTTPS (`cloudflared tunnel --url http://localhost:3000`) and set `APP_URL` to the tunnel URL. The WordPress server must be able to reach it.
3. Open `/dashboard/integrations/woocommerce`, enter the site, approve, preview, start.
4. To advance a job without the page open: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/run-imports`

Sites on private addresses (a LAN WordPress, `*.local`) are refused on purpose. See section 4.

## 8. Architecture

```
app/(merchant)/dashboard/integrations/_import/   shared import page (both providers): provider-ui.tsx holds all per-platform copy
app/(merchant)/dashboard/integrations/woocommerce/  page.tsx → <ImportPage provider="WOOCOMMERCE" />
actions/integrations/store-import.actions.ts     server actions for every provider (provider argument validated)
app/api/integrations/woocommerce/oauth/initiate  POST: site discovery → sealed state → redirect to wc-auth
app/api/integrations/woocommerce/oauth/callback  POST (from WordPress): sealed state + key checks → encrypted key pair
app/api/integrations/woocommerce/oauth/return    GET (browser): outcome for the user who started

lib/integrations/woocommerce/
  config.ts    APP_URL must be https
  site.ts      URL normalisation, SSRF guard (safeFetch), WordPress JSON parsing, discovery
  auth.ts      sealed state, approval URL, key pair encryption
  callback.ts  callback + return checks (pure, unit-tested)
  client.ts    REST v3 client: auth, retries, error kinds
  mappers.ts   REST objects → Normalized* (pure)
  source.ts    ImportSource: pagination, variations, preview counts
```

Registered in `lib/integrations/import/registry.ts` (source, preview counts, "configured" check, remote revoke).
