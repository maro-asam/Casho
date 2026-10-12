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
    <nav aria-label="أقسام المبيعات" className="-mb-px overflow-x-auto">
      <ul className="flex min-w-max items-center gap-1 border-b border-border">
        {TABS.map((tab) => {
          const active = tab.href === "/admin/sales" ? pathname === tab.href || pathname.startsWith("/admin/sales/reps") : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block border-b-2 px-3 pb-2.5 pt-1 text-sm transition-colors",
                  active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
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
