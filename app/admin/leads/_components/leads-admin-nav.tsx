"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/leads", label: "نظرة عامة" },
  { href: "/admin/leads/list", label: "كل الليدز" },
  { href: "/admin/leads/pipeline", label: "المراحل" },
  { href: "/admin/leads/follow-ups", label: "المتابعات", badge: "overdue" as const },
  { href: "/admin/leads/imports", label: "الاستيراد" },
  { href: "/admin/leads/matches", label: "مطابقات", badge: "matches" as const },
];

const nf = new Intl.NumberFormat("ar-EG");

/** Same capsule tab bar as the Sales admin. The lead pages (/admin/leads/<id>) live under "كل الليدز". */
export function LeadsAdminNav({ overdue = 0, matches = 0 }: { overdue?: number; matches?: number }) {
  const pathname = usePathname();
  const isDetail = /^\/admin\/leads\/(?!list|pipeline|follow-ups|imports|matches|new)[^/]+/.test(pathname);
  return (
    <nav aria-label="أقسام الليدز" className="relative -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="inline-flex min-w-max items-center gap-0.5 rounded-full bg-(--sys-gray)/14 p-[3px]">
        {TABS.map((tab) => {
          const active =
            tab.href === "/admin/leads"
              ? pathname === tab.href
              : tab.href === "/admin/leads/list"
                ? pathname.startsWith(tab.href) || pathname === "/admin/leads/new" || isDetail
                : pathname.startsWith(tab.href);
          const count = tab.badge === "overdue" ? overdue : tab.badge === "matches" ? matches : 0;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-full px-4 text-[14px] transition-[background-color,color,box-shadow] duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-card font-semibold text-foreground shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]" : "text-foreground/70 hover:text-foreground",
                )}
              >
                {tab.label}
                {count > 0 && (
                  <>
                    <span aria-hidden className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-(--sys-orange) px-1.5 text-[11px] font-semibold text-white tabular-nums">
                      {nf.format(count)}
                    </span>
                    <span className="sr-only">، {nf.format(count)} محتاجة نظرة</span>
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
