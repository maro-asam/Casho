# Lead Management

Prospects before they sign up: who they are, who's calling them, where they are in the pipeline, and whether they became a paying Casho merchant. Code in `lib/leads/`, admin UI at `/admin/leads`, rep UI at `/sales/leads`.

## Who can do what

| | Super admin (`SUPER_ADMIN`) | Sales rep (active `SALES`) |
|---|---|---|
| See leads | all (incl. archive / deleted) | only leads assigned to them, not archived/deleted |
| Create, import, edit identity/contact data | ✓ | — |
| Assign / reassign / unassign | ✓ | — |
| Status | any except CONVERTED | their leads: CONTACTED → NEGOTIATION, LOST |
| Log calls / WhatsApp / email / meetings / demos / notes | ✓ | their leads |
| Follow-ups (schedule, complete, reschedule, cancel) | ✓ | their leads |
| Archive / delete (soft) / restore | ✓ | — |
| Link a lead to a Casho account, resolve matches | ✓ | — |
| Export CSV / Excel, global analytics | ✓ | — |

- The actor is resolved from the session on every request (`lib/leads/access.ts`); `LEAD_ADMIN_ROLES` is the one place to widen admin access (e.g. add `ADMIN`).
- Every query and mutation goes through `leadScopeFor(actor)` (`lib/leads/scope.ts`): a rep's scope is `assignedRepId = <their rep id>`, not archived, not deleted — so another rep's lead id behaves exactly like a missing one (pages 404, actions answer "not found"). Filters from the URL are ANDed *before* the scope and can't widen it.
- Rules (who may change what, status transitions) are pure in `lib/leads/workflow.ts`, re-checked server-side on every action.
- A disabled rep is locked out at once (`getLeadActor` re-reads role + status). Their leads stay assigned and show under "مع مندوب موقوف" (`rep=inactive`) and on the overview/sidebar badge for reassignment.
- Reps: 40 logged actions a minute (`repRateLimited`). Exports: 20 an hour per admin, 20,000 rows per file.

## Data

`Lead`, `LeadActivity` (append-only timeline: every change and interaction, with actor + role), `LeadFollowUp`, `LeadAssignment` (full history), `LeadImport` + `LeadImportRow`, `LeadConversionMatch`. Migration `20261121120000_lead_management` (additive only).

- `normalizedPhone` (Egyptian mobiles as `01xxxxxxxxx` — the same form signup stores — landlines local, others `+<digits>`) and lowercased `email` are the duplicate keys. A live lead with the same phone, WhatsApp or email blocks the add form and is flagged by the importer.
- Nothing is hard-deleted. Archive = shelved (history kept, hidden from reps); delete = soft delete for junk/duplicates (hidden everywhere, follow-ups canceled, restorable from "المحذوفة"). A converted lead can't be deleted.
- Bulk/sensitive actions are also in the security log: `LEADS_EXPORTED`, `LEADS_IMPORTED`, `LEADS_BULK_ASSIGNED`, `LEADS_BULK_STATUS`, `LEAD_DELETED`, `LEAD_LINKED`.

## Pipeline

`NEW → ASSIGNED → CONTACTED → INTERESTED → DEMO_SCHEDULED → NEGOTIATION`, then `CONVERTED` or `LOST`.

- Assigning a NEW lead makes it ASSIGNED; unassigning an untouched ASSIGNED lead puts it back to NEW.
- Logging a call/WhatsApp/email the lead answered (or a meeting) moves an early lead to CONTACTED; a demo moves it to DEMO_SCHEDULED. Never backwards, never out of LOST/CONVERTED.
- LOST needs a reason (`LOST_REASONS`, "OTHER" needs text) and cancels open follow-ups.
- CONVERTED is set only by conversion. The Kanban (`/admin/leads/pipeline`) can't drop into it.

## Conversion

A lead converts when **the merchant's store pays its first subscription** — the first `SUBSCRIPTION_CHARGE` ledger row, the same event the sales engine counts as an acquisition. Signing up or a trial is not a conversion.

- Hooks: `recordLeadConversionForStore(storeId)` right after `recordSalesCommissionsForStore` in `lib/billing/renewal.ts` and `actions/subscription/change-plan.actions.ts`; `sweepLeadConversions()` in the hourly `renew-subscriptions` cron as a safety net. Never throws.
- Matching (`lib/leads/conversion-rules.ts`): a live, unlinked lead created before the charge, whose phone/WhatsApp equals the account's signup phone, or whose email equals the account's email **when that email is verified** (code or Google). It links automatically only when exactly one lead matches, a phone-only match isn't contradicted by a different email on the lead, and no other Casho account shares the phone. Anything else becomes a `LeadConversionMatch` for a super admin (`/admin/leads/matches`): link or "مش هو" (dismissed matches never come back; unlinking by hand dismisses the pair too).
- A super admin can link any lead to an existing merchant account from the lead page. If the account already paid, it converts at the first charge date; otherwise it converts when it pays.
- Idempotent: `Lead.customerUserId` and `Lead.conversionTxId` are unique and every write is conditional.
- **Commissions are untouched.** Leads never read or write `SalesAttribution`, `SalesCommission` or payouts. The referral attribution stays authoritative; the lead page shows the attributed rep next to the lead's rep and warns when they differ (fix it, if needed, from the sales customer page as before).

## Follow-ups & reminders

Buckets (Cairo days): overdue, today, upcoming, completed. The lead's `nextFollowUpAt` is the earliest pending one. The hourly cron (`sweepLeadFollowUpReminders`) sends the assigned rep one reminder (bell + email via `sendRepNotice`, keyed `lead-followup:<id>`) an hour before it's due, or late if a run was missed; `reminderSentAt` makes reruns no-ops, and rescheduling or reassigning re-arms it. Follow-ups move with the lead on reassignment. A super admin's own follow-ups (lead without a rep) are counted on the Leads badge instead.

## Scoring

`lib/leads/scoring.ts` — every point is a named criterion shown on the lead page:

| Criterion | Points |
|---|---|
| Has Instagram | 10 |
| Has a website | 10 |
| Valid WhatsApp number | 10 |
| Interested (INTERESTED or later) | 20 |
| Demo (DEMO logged, or DEMO_SCHEDULED or later) | 20 |
| Established business (size MEDIUM / LARGE) | 15 |
| Responded before (a call/WhatsApp/email marked "answered", or a meeting/demo) | 10 |

`score = round(100 × earned / 95)`. Priority = the score's band (0–24 LOW, 25–49 MEDIUM, 50–74 HIGH, 75+ HOT) unless a super admin picked one (`priorityLocked`). To make it configurable later, load `SCORE_CRITERIA` from the DB instead of the constant.

## Import Center (`/admin/leads/imports`)

CSV, XLSX, XLS — up to 5 MB, 5,000 rows, 60 columns; first sheet only. Template at `/api/admin/leads/template?format=xlsx|csv`.

1. The **browser** parses the file (the server never runs a spreadsheet parser on an upload), auto-maps columns from Arabic/English header aliases, and previews validity.
2. `createLeadImport` — mapping, duplicate mode, optional default source and rep. A file with the same SHA-256 as an earlier import asks for confirmation.
3. Rows are uploaded in chunks of 250 and **re-validated on the server** with the same Zod schema as the add form (`leadFieldsSchema`). Retried chunks are no-ops (`@@unique([importId, rowNumber])`).
4. Analysis marks duplicates inside the file (first occurrence wins) and against live leads → READY, with a summary to confirm.
5. Running: batches of 150, one transaction each under a Postgres advisory lock (two tabs can't import the same rows); rows are re-checked for duplicates at write time. Closing the page pauses; reopening the import resumes. A batch that fails is marked FAILED instead of retrying forever.
6. Duplicate modes: **SKIP** (existing leads untouched) or **FILL_BLANKS** (only the existing lead's empty fields are filled — never an overwrite; recorded as an UPDATED activity).
7. Error report: `/api/admin/leads/imports/<id>/errors` (CSV, every row that didn't become a lead, with its reason and data).

## Tests

- `lib/leads/rules.test.ts` — phone/email normalization, scoring, permissions, transitions, follow-up buckets, conversion matching, import mapping/validation.
- `lib/leads/leads.integration.test.ts` — runs the real actions against an in-memory Postgres (PGlite) built from `prisma/schema.prisma`: rep isolation by list / id / follow-up id, admin-only actions refused for reps, assignment history, auto status, reminders sent once, disabled reps, conversion (signup ≠ conversion, idempotent, no commission rows), ambiguous matches, import with every row outcome and repeat protection, FILL_BLANKS, bulk rules, analytics queries, unlink, and 403s on the export/template/error-report routes. It never touches `DATABASE_URL`.
