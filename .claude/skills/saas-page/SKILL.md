---
name: saas-page
description: Casho's "SaaS page" pattern for merchant dashboard list/management pages (orders, products, customers, coupons, reviews…). Use when building or redesigning any dashboard page that lists records with search, filters, status and pagination. Reference implementation is the orders page.
---

# SaaS page pattern

The standard layout for every **list / management page** in the merchant dashboard
(`app/(merchant)/dashboard/*`). Reference implementation:
`app/(merchant)/dashboard/orders/` — copy its structure, don't reinvent it.

Visual rules come from the `saas-design` skill; this skill is the concrete recipe.

## Anatomy (top → bottom)

```
PageHeader        title · one-line purpose · page actions (secondary first, primary last)
FilterTabs        main segmentation with live counts (status, type…)        ← ?status=
DataCard
 ├─ toolbar       SearchInput (?q=)  +  SelectFilter(s) for secondary facets (?source=…)
 ├─ content       desktop <Table>  /  mobile stacked <ul>   (or EmptyState)
 └─ footer        Pagination  "عرض ١–٢٠ من ٢٤٣ طلب"                       ← ?page=
```

Only **one bordered surface** (the DataCard). No stat-card rows above lists — counts
live in the tabs, where they also filter. KPIs belong on the overview page.

## Building blocks — `@/components/saas-page`

| Component | Kind | Use |
|---|---|---|
| `PageHeader` | server | `title`, `description`, `actions` |
| `FilterTabs` | server (links) | `tabs=[{label, value?, count?}]`, `param`, `basePath`, `searchParams`, `label` |
| `SearchInput` | client | debounced, writes `?q=`, resets page |
| `SelectFilter` | client | `param`, `allLabel`, `options`, `label` |
| `DataCard` | server | `toolbar`, `footer`, children |
| `Pagination` | server (links) | `page`, `pageSize`, `total`, `basePath`, `searchParams`, `noun` |
| `EmptyState` | server | `icon`, `title` (what's missing), `description` (why / what next), `action` |
| `StatusPill` / `toneDot` | any | the only badge style; tones `neutral info success warning danger accent` |
| `SaasPageSkeleton` | server | body of the page's `loading.tsx` |
| `readParam` / `readPage` / `hrefWith` | util | parse + build URL state |

## Rules

1. **All list state lives in the URL** (`q`, tab param, facet params, `page`). Pages are
   server components that `await searchParams`; validate every param (enum guards like
   `v in OrderStatus`) and ignore invalid values. Changing a filter drops `page`.
2. **Tab counts use the same `where` as the list minus the tab's own filter**
   (one `groupBy`), so a count always equals what the tab shows.
3. **Clamp the page** to `totalPages` so a stale `?page=` never shows an empty table.
4. **Two empty states**: "nothing yet" (no records at all → onboarding action, no
   toolbar) vs "no matches" (records exist → `SearchX` icon + "مسح الفلاتر" link to `basePath`).
5. **Row = link.** First cell holds the record link with `after:absolute after:inset-0`
   on a `relative` row; inline controls (status menu, row actions) get `relative z-10`.
6. **Mobile is designed, not squeezed**: table is `hidden md:block`; a `md:hidden` `<ul>`
   shows name + amount, id · date, status + one facet. Hide low-priority columns
   progressively (`hidden lg:table-cell`, `xl:table-cell`).
7. **Table styling**: header row `bg-muted/40`, `h-10`, `text-xs font-medium text-muted-foreground`;
   cells `py-3`, first/last `ps-4`/`pe-4`; money `tabular-nums`, end-aligned (`text-left` in RTL);
   ids `font-mono dir="ltr"`, phones `dir="ltr"`; dates via `Intl` with `timeZone: "Africa/Cairo"`.
8. **Status**: define `{value, label, tone}[]` once per domain in `_components/<domain>-meta.ts`
   and reuse it for tabs, pills, menus. Editable status = small outlined trigger with `toneDot`
   + `DropdownMenu`, optimistic update with rollback + toast.
9. **Links use clean paths** (`/orders`, `/orders/:id`) — middleware maps them to `/dashboard/*`.
10. Every page gets a `loading.tsx` using `SaasPageSkeleton` with matching tabs/columns.
11. Copy is Egyptian Arabic, short and specific ("مفيش طلبات بالفلاتر دي", not "لا توجد بيانات").
12. Remember the global `* { font-light }` reset: nested text inside bold parents needs its own `font-*`.

## Page skeleton

```tsx
const PAGE_SIZE = 20;
const BASE_PATH = "/things";

export default async function ThingsPage({ searchParams }: { searchParams?: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const q = readParam(params, "q");
  const status = isStatus(readParam(params, "status")) ? … : undefined;

  const baseWhere = { storeId, ...(q && { OR: [...] }) };
  const counts = await prisma.thing.groupBy({ by: ["status"], where: baseWhere, _count: { _all: true } });
  const total = …;
  const page = Math.min(readPage(params), Math.max(1, Math.ceil(total / PAGE_SIZE)));
  const rows = await prisma.thing.findMany({ where: { ...baseWhere, ...(status && { status }) },
    skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="…" description="…" actions={…} />
      <div className="space-y-4">
        <FilterTabs label="…" param="status" basePath={BASE_PATH} searchParams={params} tabs={…} />
        <DataCard toolbar={<><SearchInput placeholder="…" /><SelectFilter … /></>}
                  footer={total > 0 && <Pagination … noun="…" />}>
          {rows.length ? <ThingsTable rows={rows} /> : <EmptyState icon={SearchX} … />}
        </DataCard>
      </div>
    </div>
  );
}
```

## Detail page variant (one record)

Reference: `app/(merchant)/dashboard/orders/[id]/`.

```
← back link to the list (text link, not a button)
Header            title with record id (font-mono, dir=ltr) + StatusPill + facet chip · meta line · actions
grid lg:3 cols
 ├─ main (col-span-2)   workflow card (current state + ONE primary "next step" button + manual menu)
 │                      main content card (e.g. line items with totals footer)
 └─ side                small Panels: who (contact + call/WhatsApp), where, payment, extra details
```

- The **workflow card** owns status changes: a stepper whose steps depend on the record
  (e.g. COD skips "paid", POS skips "shipped"), one primary button for the likely next
  step, a menu for manual changes, destructive changes behind an `AlertDialog`,
  optimistic update + `router.refresh()`.
- Side panels use a `Field` row (`dt` muted start / `dd` end-aligned). Copyable values
  (phone, address, ids, tracking) get a small copy button.
- Money summary sits under the items (subtotal → shipping → discount → **total**), not in its own card.
- Add a `loading.tsx` that mirrors the two-column layout.

## Checklist before finishing a page

- [ ] Header has one clear purpose line; at most one primary action
- [ ] Filters, search, page survive refresh and are shareable (URL)
- [ ] Tab counts match results; invalid params ignored; page clamped
- [ ] Both empty states handled; `loading.tsx` added
- [ ] Mobile list exists; columns hide by priority
- [ ] Row opens the record; inline controls still clickable
- [ ] Colors only via tokens + `StatusPill` tones; works in dark mode
