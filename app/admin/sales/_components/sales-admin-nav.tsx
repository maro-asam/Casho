"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/sales", label: "نظرة عامة والفريق" },
  { href: "/admin/sales/customers", label: "العملاء" },
  { href: "/admin/sales/commissions", label: "العمولات" },
  { href: "/admin/sales/payouts", label: "الصرف" },
  { href: "/admin/sales/rules", label: "القواعد والسجل" },
];

export function SalesAdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="أقسام المبيعات" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="inline-flex min-w-max items-center gap-0.5 rounded-full bg-(--sys-gray)/14 p-[3px]">
        {TABS.map((tab) => {
          const active = tab.href === "/admin/sales" ? pathname === tab.href || pathname.startsWith("/admin/sales/reps") : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-8 items-center rounded-full px-3.5 text-[13px] transition-[background-color,color,box-shadow] duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-card font-semibold text-foreground shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]"
                    : "text-foreground/70 hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
