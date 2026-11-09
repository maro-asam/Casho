import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { StatusText, initialOf } from "@/components/saas-page";
import type { listAttributedCustomers } from "@/lib/sales/queries";
import {
  ELIGIBILITY_META,
  SUBSCRIPTION_META,
  eligibilityState,
  fmtCohort,
  fmtDate,
  fmtEligibleThrough,
  type EligibilityState,
} from "@/lib/sales/format";
import { cn } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listAttributedCustomers>>["rows"][number];

/** Avatar hue = where the customer stands; the label next to it says it in words. */
const AVATAR: Record<EligibilityState, string> = {
  signup: "from-[#a1a1a6] to-[#8e8e93]",
  eligible: "from-(--sys-green)/80 to-(--sys-green)",
  expired: "from-(--sys-orange)/80 to-(--sys-orange)",
};

const SHORT_STATE: Record<EligibilityState, string> = {
  signup: "لسه مدفعش",
  eligible: "مؤهل",
  expired: "انتهت الأهلية",
};

/**
 * Attributed customers as grouped rows; the whole row opens the customer.
 * `showRep` adds the rep column (admins); `actions` renders a per-row control above the row link.
 */
export function CustomersTable({
  rows,
  detailBase,
  showRep = false,
  actions,
  className,
}: {
  rows: Row[];
  detailBase: string;
  showRep?: boolean;
  actions?: (row: Row) => ReactNode;
  className?: string;
}) {
  const now = new Date();
  return (
    <ul className={cn("apple-rows [--row-inset:72px]", className)}>
      {rows.map((row) => {
        const store = row.customer.stores[0];
        const state = eligibilityState(row, now);
        const title = store?.name ?? row.customer.name ?? row.customer.email;
        const repName = row.salesRep.user.name ?? row.salesRep.user.email;
        return (
          <li key={row.id} className="relative flex items-center gap-3 px-5 py-3 transition-colors hover:bg-(--fill-3)/50">
            <span
              aria-hidden
              className={cn("grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-b text-[15px] font-semibold text-white", AVATAR[state])}
            >
              {initialOf(title)}
            </span>

            <div className="min-w-0 flex-1">
              <Link
                href={`${detailBase}/${row.customer.id}`}
                className="block truncate text-[15px] font-semibold after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
              >
                {title}
              </Link>
              <p className="truncate text-[13px] text-muted-foreground">
                {row.customer.name ?? "—"} · <span dir="ltr">{row.customer.email}</span>
              </p>
              {showRep && <p className="truncate text-[12px] text-muted-foreground md:hidden">مع {repName}</p>}
            </div>

            {showRep && (
              <div className="hidden w-36 shrink-0 md:block">
                <p className="truncate text-[15px]">{repName}</p>
                <p className="truncate text-[12px] text-muted-foreground">
                  {row._count.changes > 0 ? `اتنقل ${row._count.changes} مرة` : `سجّل ${fmtDate(row.signedUpAt)}`}
                </p>
              </div>
            )}

            <div className="hidden w-44 shrink-0 space-y-0.5 md:block">
              <StatusText tone={ELIGIBILITY_META[state].tone}>{SHORT_STATE[state]}</StatusText>
              <p className="truncate text-[12px] text-muted-foreground">
                {state === "eligible"
                  ? `لحد ${fmtEligibleThrough(row.eligibleUntil)}`
                  : state === "expired"
                    ? `خلصت ${fmtEligibleThrough(row.eligibleUntil)}`
                    : `سجّل ${fmtDate(row.signedUpAt)}`}
                {row.acquiredAt && state === "eligible" && ` · دفعة ${fmtCohort(row.cohortMonth)}`}
              </p>
            </div>

            <div className="hidden w-44 shrink-0 xl:block">
              {store ? (
                <>
                  <StatusText tone={SUBSCRIPTION_META[store.subscriptionStatus].tone}>{SUBSCRIPTION_META[store.subscriptionStatus].label}</StatusText>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {store.plan?.name ?? "بدون باقة"} · {store.billingCycle === "YEARLY" ? "سنوي" : "شهري"} · يتجدد {fmtDate(store.subscriptionEndsAt)}
                  </p>
                </>
              ) : (
                <span className="text-[13px] text-muted-foreground">لسه معملش متجر</span>
              )}
            </div>

            {/* Phones: state as a dot + word. */}
            <StatusText tone={ELIGIBILITY_META[state].tone} className="text-[12px] md:hidden">
              {SHORT_STATE[state]}
            </StatusText>

            {actions && <div className="relative z-10 hidden shrink-0 sm:block">{actions(row)}</div>}
            <ChevronLeft aria-hidden className="size-4 shrink-0 text-(--label-3)" strokeWidth={2.2} />
          </li>
        );
      })}
    </ul>
  );
}
