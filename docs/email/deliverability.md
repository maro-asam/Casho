# Email deliverability (Brevo + casho.store)

Every email/password signup is locked at `/verify-email` until the user types the 6-digit code we email them. If that email lands in spam or never arrives, signups stop. So the sender must pass SPF/DKIM/DMARC checks.

**Target:** send everything as `noreply@casho.store`, with `casho.store` authenticated in Brevo.

**Before (Nov 15, 2026):** the sender was `cashostore0@gmail.com`, and `casho.store` had no SPF, DKIM, DMARC or MX records. Brevo can't sign mail for gmail.com, so every email failed DMARC (gmail.com is `p=none; sp=quarantine`), and Gmail and other providers sent it to spam.

## How it passes

Brevo sends with its own Return-Path domain, so SPF is checked against Brevo, never against us. DMARC passes because of **DKIM**: Brevo signs as `d=casho.store` using the key behind the `brevo1/brevo2._domainkey` CNAMEs. That's why DKIM and DMARC are required and SPF is only advised.

## DNS records

DNS for `casho.store` is on **Vercel** (`ns1/ns2.vercel-dns.com`): Vercel → Domains → `casho.store` → DNS Records. In Vercel's *Name* field, leave out `.casho.store` and leave it empty for the root.

| Type | Name (in Vercel) | Value | Where it comes from |
|---|---|---|---|
| TXT | *(empty)* | `brevo-code:…` | Brevo's domain screen (unique to our account) |
| CNAME | `brevo1._domainkey` | `b1.….dkim.brevo.com` | Brevo's domain screen |
| CNAME | `brevo2._domainkey` | `b2.….dkim.brevo.com` | Brevo's domain screen |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` | Brevo shows the same value |
| TXT | *(empty)* | `v=spf1 include:spf.brevo.com ~all` | Optional, advised |

A domain can have only **one** SPF record. If we add another mail service later (for example Google Workspace), merge it into this one: `v=spf1 include:spf.brevo.com include:_spf.google.com ~all`.

## Setup, in this order

Don't switch `MAIL_FROM_EMAIL` until step 5 is done. Until the domain is authenticated, Brevo refuses or flags mail from `noreply@casho.store`, and then no verification codes would go out at all.

1. **Brevo:** Settings → *Senders, Domains & Dedicated IPs* → *Domains* → *Add a domain* → `casho.store` → authenticate it yourself (manual DNS). Copy the records it shows.
2. **Vercel DNS:** add the records from the table above.
3. **Check:** run `npm run check:mail -- noreply@casho.store` until there are no ✗ lines. Records usually go live within minutes.
4. **Brevo:** on the domain, press *Authenticate this email domain*. It should show **Authenticated**.
5. **Brevo:** *Senders* → *Add a sender* → name `Casho`, email `noreply@casho.store`. The domain is authenticated, so Brevo shouldn't need an emailed code (the address has no inbox, so a code couldn't arrive anyway).
6. **Test send:** run `npm run check:mail -- noreply@casho.store --send you@gmail.com`. In Gmail, open ⋮ → *Show original*. **SPF, DKIM and DMARC must all say PASS**, and DKIM must be `casho.store`.
7. **Switch:** on the Vercel project, set `MAIL_FROM_EMAIL=noreply@casho.store` (Production + Preview), then redeploy. Change your local `.env` too.
8. **Confirm:** register a test account. The code should arrive in the inbox, and Brevo → Transactional → Logs should show it as *Delivered*.

**Rollback:** set `MAIL_FROM_EMAIL` back and redeploy. You can leave the DNS records in place; they do no harm.

## Later

- **Tighten DMARC:** after 2–4 weeks of clean reports (Brevo → domain → DMARC), change `p=none` to `p=quarantine`. That also stops others from spoofing `casho.store`. Don't move to `p=reject` while any other service sends mail as casho.store without DKIM.
- **Reply-To:** `MAIL_REPLY_TO` is optional. Mail without one has nowhere for replies to go, because `noreply@casho.store` has no MX. Don't point it at a Gmail address: a free-mail Reply-To on a casho.store From is a spam-filter signal (`FREEMAIL_FORGED_REPLYTO`). Set it once a real inbox like `support@casho.store` exists. Order emails already set their own Reply-To (the store's email).

## In the code

- [lib/mail.ts](../../lib/mail.ts): the one SMTP sender. The address is always `MAIL_FROM_EMAIL`, and the display name varies (`كاشو`, the store's name…). It logs a warning once when that address is free-mail.
- [lib/mail-auth.ts](../../lib/mail-auth.ts): the pure DNS rules used by the check script (tested in `mail-auth.test.ts`).
- [scripts/check-mail.mjs](../../scripts/check-mail.mjs): the DNS check plus the optional test send. It queries 1.1.1.1 / 8.8.8.8 directly, so it isn't fooled by a local cache.
