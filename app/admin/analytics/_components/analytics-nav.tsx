"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { mediaBuyerMayOpen } from "@/lib/admin/panel-roles";
import { cn } from "@/lib/utils";

export const ANALYTICS_TABS = [
  { href: "/admin/analytics", label: "نظرة عامة" },
  { href: "/admin/analytics/realtime", label: "الآن" },
  { href: "/admin/analytics/visitors", label: "الزوار" },
  { href: "/admin/analytics/acquisition", label: "مصادر الزيارات" },
  { href: "/admin/analytics/pages", label: "الصفحات" },
  { href: "/admin/analytics/heatmaps", label: "Heatmaps" },
  { href: "/admin/analytics/funnels", label: "Funnels" },
  { href: "/admin/analytics/journeys", label: "رحلات الزوار" },
  { href: "/admin/analytics/campaigns", label: "الحملات" },
  { href: "/admin/analytics/performance", label: "الأداء التقني" },
  { href: "/admin/analytics/events", label: "الأحداث" },
  { href: "/admin/analytics/stores", label: "المتاجر" },
  { href: "/admin/analytics/settings", label: "الإعدادات" },
];

/** Keep the filters (range, scope, store, device) when switching sections. */
const KEEP = ["range", "from", "to", "compare", "scope", "store", "device"];

export function AnalyticsNav({ mediaBuyer = false }: { mediaBuyer?: boolean }) {
  const tabs = mediaBuyer ? ANALYTICS_TABS.filter((tab) => mediaBuyerMayOpen(tab.href)) : ANALYTICS_TABS;
  const pathname = usePathname();
  const params = useSearchParams();
  const keep = new URLSearchParams();
  for (const k of KEEP) {
    const v = params.get(k);
    if (v) keep.set(k, v);
  }
  const qs = keep.toString();

  return (
    <nav aria-label="أقسام التحليلات" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="inline-flex min-w-max items-center gap-0.5 rounded-full bg-(--sys-gray)/14 p-[3px]">
        {tabs.map((tab) => {
          const active = tab.href === "/admin/analytics" ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href === "/admin/analytics/settings" || !qs ? tab.href : `${tab.href}?${qs}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center rounded-full px-4 text-[14px] whitespace-nowrap transition-[background-color,color,box-shadow] duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
