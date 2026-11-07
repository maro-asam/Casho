import Link from "next/link";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { StatusText, initialOf } from "@/components/saas-page";
import type { listAttributedCustomers } from "@/lib/sales/queries";
import {
  ELIGIBILITY_META,
  SUBSCRIPTION_META,
  eligibilityState,
  fmtDate,
  fmtEligibleThrough,
  whatsappLink,
  type EligibilityState,
} from "@/lib/sales/format";
import { cn } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listAttributedCustomers>>["rows"][number];

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

/** The rep's customers as Settings-style rows; the whole row opens the customer. */
export function CustomerRows({ rows, repName }: { rows: Row[]; repName: string }) {
  const now = new Date();
  return (
    <ul className="apple-rows border-t-[0.5px] border-border [--row-inset:72px]">
      {rows.map((row) => {
        const store = row.customer.stores[0];
        const state = eligibilityState(row, now);
        const title = store?.name ?? row.customer.name ?? row.customer.email;
        const phone = row.customer.phone_number;
        return (
          <li key={row.id} className="relative flex items-center gap-3 px-5 py-3 transition-colors hover:bg-(--fill-3)/50">
            <span
              aria-hidden
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-b text-[15px] font-semibold text-white",
                AVATAR[state],
              )}
            >
              {initialOf(title)}
            </span>

            <div className="min-w-0 flex-1">
              <Link
                href={`/sales/customers/${row.customer.id}`}
                className="block truncate text-[15px] font-semibold after:absolute after:inset-0 focus-visible:outline-none"
              >
                {title}
              </Link>
              <p className="truncate text-[13px] text-muted-foreground">
                {row.customer.name ?? "—"} · سجّل {fmtDate(row.signedUpAt)}
              </p>
            </div>

            <div className="hidden w-44 shrink-0 space-y-0.5 md:block">
              <StatusText tone={ELIGIBILITY_META[state].tone}>{SHORT_STATE[state]}</StatusText>
              <p className="text-[12px] text-muted-foreground">
                {state === "eligible"
                  ? `لحد ${fmtEligibleThrough(row.eligibleUntil)}`
                  : state === "expired"
                    ? `خلصت ${fmtEligibleThrough(row.eligibleUntil)}`
                    : "العمولة بتبدأ مع أول دفعة"}
              </p>
            </div>

            <div className="hidden w-40 shrink-0 lg:block">
              {store ? (
                <>
                  <StatusText tone={SUBSCRIPTION_META[store.subscriptionStatus].tone}>{SUBSCRIPTION_META[store.subscriptionStatus].label}</StatusText>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {store.plan?.name ?? "بدون باقة"} · {store.billingCycle === "YEARLY" ? "سنوي" : "شهري"}
                  </p>
                </>
              ) : (
                <span className="text-[13px] text-muted-foreground">لسه معملش متجر</span>
              )}
            </div>

            {/* Phones: state as a dot under the chevron. */}
            <StatusText tone={ELIGIBILITY_META[state].tone} className="text-[12px] md:hidden">
              {SHORT_STATE[state]}
            </StatusText>

            {phone && (
              <a
                href={whatsappLink(phone, `أهلًا، معاك ${repName} من كاشو.`)}
                target="_blank"
                rel="noreferrer"
                aria-label={`كلّم ${title} على واتساب`}
                className="apple-press relative z-10 hidden size-9 shrink-0 place-items-center rounded-full bg-(--sys-green)/12 text-[#248a3d] hover:bg-(--sys-green)/18 sm:grid dark:text-(--sys-green)"
              >
                <MessageCircle className="size-[18px]" />
              </a>
            )}
            <ChevronLeft aria-hidden className="size-4 shrink-0 text-(--label-3)" strokeWidth={2.2} />
          </li>
        );
      })}
    </ul>
  );
}
