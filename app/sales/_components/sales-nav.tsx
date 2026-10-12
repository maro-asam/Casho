"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/sales", label: "نظرة عامة" },
  { href: "/sales/customers", label: "عملائي" },
  { href: "/sales/commissions", label: "عمولاتي والصرف" },
];

export function SalesNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="أقسام المبيعات" className="-mb-px overflow-x-auto">
      <ul className="flex min-w-max items-center gap-1">
        {TABS.map((tab) => {
          const active = tab.href === "/sales" ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block border-b-2 px-3 py-3 text-sm transition-colors",
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
