# Sales team: referrals, commissions, payouts

Admin: `/admin/sales` (admins only). Sales reps: `/sales` (on `app.casho.store/sales`).
Engine and rules: `lib/sales/`. Admin mutations: `actions/admin/sales.actions.ts`.

## Model

| Concept | Where |
|---|---|
| Rep account | `User.role = SALES` + `SalesRep` (status `ACTIVE`/`DISABLED`). Created only by `createSalesRepAction` (always a new account). |
| Referral link | `${APP_URL}/register?ref=<User.referralCode>` (the existing referral code column). |
| Customer | The merchant `User`. Counted once, even with several stores. |
| Attribution | `SalesAttribution` (one per customer, unique). Created in the signup transaction. Admin changes are append-only `SalesAttributionChange` rows. |
| Qualifying payment | A `BalanceTransaction` of type `SUBSCRIPTION_CHARGE`. Subscriptions are paid from the store balance, and the balance is funded only by HMAC-verified Kashier callbacks or admin-approved top-ups. Browser redirects are never trusted. |
| Commission | `SalesCommission`: an immutable snapshot (basis, rate, tier, position, rule id, cohort, eligibility end, payment ref). Unique on `(balanceTransactionId, kind)`. |
| Correction | `SalesCommissionAdjustment` (signed piasters, reason, actor). Refund-credit clawbacks are unique per ledger row. |
| Payout | `SalesPayout`: a transfer that already happened outside Casho, recorded by an admin. |
| Audit | `SalesAuditLog`: every admin action, plus automatic commission and adjustment creation. |

## Rules (approved 2026-10-12)

- **Basis**: the full `SUBSCRIPTION_CHARGE` amount in piasters (EGP only; Casho records no tax or gateway fee).
- **Acquisition** = the customer's first-ever subscription charge. The tier comes from the customer's position = the rep's *currently eligible* count at payment time + 1:
  - 1–10 → 17%
  - 11–20 → 20%
  - 21+ → 22%

  Tiers are marginal, never retroactive.
- **Renewal** = every later subscription charge, including upgrade proration, paid before the customer's `eligibleUntil` → 6%.
- **Eligibility window**: a calendar-month cohort in Africa/Cairo. If the customer was acquired any day in month M, they stay eligible until 00:00 Cairo on the 1st of month M+6 (exclusive). This window drives both the "currently eligible" count and renewal eligibility. It is computed by date queries, so no job has to run on time.
- **Downgrade refund credit** (`REFUND` ledger row) → an adjustment of −(refund × rate of the latest commission at or before it), capped so that commission's net stays ≥ 0.
- **Approval**: commissions are created `APPROVED` (payable). If the rep is disabled at that moment, they are created `ON_HOLD`.
- **Admin actions**:
  - Review: hold, release, reject, reverse. A reason is required, except for release (approve), where it's optional.
  - `PAID` is terminal for status changes. A paid commission is corrected with an adjustment, which is deducted from the next payout.
- **Reassignment**: earned commissions stay with the rep who earned them. A charge goes to the rep who owned the customer *at the time of the charge* (the history is replayed). An attribution an admin creates for a customer who already paid gets no retroactive commissions.
- **Rule changes**: each change appends a new `SalesCommissionRule` version, effective from the moment it's saved. Existing snapshots and customers' `eligibleUntil` never change.
- **Disabled rep**:
  - Their sessions are deleted and `/sales` refuses them on every request.
  - Their link stops attributing new signups.
  - Their history is kept.

## Payment flow and idempotency

1. Billing writes the ledger row (unchanged code paths): `lib/billing/renewal.ts`, `actions/subscription/*`, `actions/admin/admin-store.actions.ts`.
2. After each write, `recordSalesCommissionsForStore(storeId)` replays that customer's ledger:
   - It locks the attribution row (`FOR UPDATE`), and the rep row for an acquisition so tier positions are serialized.
   - It creates any missing rows.
   - It never throws into billing.
3. The `/api/cron/renew-subscriptions` cron also runs `sweepSalesCommissions()` over the last 35 days of ledger activity. This is the safety net for a failed hook.

Duplicate deliveries, retries and concurrent hooks hit the unique keys (P2002) and are ignored.

## Deployment

1. Review `prisma/migrations/20261012120000_sales_commissions/migration.sql`. It is additive only:
   - one new `UserRole` value
   - new tables
   - one seeded rule row
2. Apply it with `npx prisma migrate deploy` (with a DB backup first).
3. No new environment variables. The referral link uses `APP_URL` / `ROOT_DOMAIN`.
4. Keep the external cron calling `/api/cron/renew-subscriptions`. It now also returns `sales: { checked, commissions, adjustments, failed }`.

## Rollback

- **Code**: revert the commit. The billing hooks are one-line calls; without them, billing behaves exactly as before.
- **Data**: the new tables can stay in place, harmlessly.
- **Full DB rollback**: drop the `Sales*` tables and enums. Postgres can't drop an enum value, so first set any `User.role = 'SALES'` rows to `'USER'`, then leave the `SALES` value in `UserRole`.

## Manual verification

1. **Admin**:
   - Go to `/admin/sales` → إضافة مندوب and create a rep.
   - Copy the link.
2. **Signup**:
   - In a private window, open the link and register a merchant.
   - Also try the Google button: the ref survives in the `signupRef` cookie.
   - The customer appears under العملاء as "سجّل ولم يدفع".
3. **Payment**:
   - Approve a top-up for that store (or pay through Kashier test mode), then activate or choose a plan.
   - One acquisition commission appears at 17%, position 1, with the ledger reference.
   - Re-running the cron does not duplicate it.
4. **Renewal**: renew from the admin store page → a 6% renewal commission appears.
5. **Rep**:
   - Log in as the rep → you land on `/sales`.
   - The rep sees only their own customers.
   - Opening `/sales/customers/<another rep's customer id>` returns 404.
6. **Review**:
   - Hold, release, reverse and adjust a commission. Each action is listed under القواعد والسجل.
   - Record a payout: the payable total goes to 0, and the commissions become مدفوعة.
7. **Disable**:
   - Disable the rep → they're logged out and `/sales` refuses them.
   - A new signup through their link is not attributed.
