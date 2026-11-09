"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** One-word section names; the team page also owns the rep detail pages. */
const TABS = [
  { href: "/admin/sales", label: "الفريق" },
  { href: "/admin/sales/customers", label: "العملاء" },
  { href: "/admin/sales/commissions", label: "العمولات", badge: "review" as const },
  { href: "/admin/sales/payouts", label: "الصرف" },
  { href: "/admin/sales/campaign", label: "العرض" },
  { href: "/admin/sales/announcements", label: "الإعلانات" },
  { href: "/admin/sales/rules", label: "القواعد" },
];

const nf = new Intl.NumberFormat("ar-EG");

/** iPad-style top tab bar: a capsule track, the current section lifted onto a white thumb. */
export function SalesAdminNav({ toReview = 0 }: { toReview?: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="أقسام المبيعات" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="inline-flex min-w-max items-center gap-0.5 rounded-full bg-(--sys-gray)/14 p-[3px]">
        {TABS.map((tab) => {
          const active =
            tab.href === "/admin/sales" ? pathname === tab.href || pathname.startsWith("/admin/sales/reps") : pathname.startsWith(tab.href);
          const count = tab.badge === "review" ? toReview : 0;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-full px-4 text-[14px] transition-[background-color,color,box-shadow] duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-card font-semibold text-foreground shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]"
                    : "text-foreground/70 hover:text-foreground",
                )}
              >
                {tab.label}
                {count > 0 && (
                  <>
                    <span
                      aria-hidden
                      className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-(--sys-orange) px-1.5 text-[11px] font-semibold text-white tabular-nums"
                    >
                      {nf.format(count)}
                    </span>
                    <span className="sr-only">، {nf.format(count)} محتاجة قرار</span>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
