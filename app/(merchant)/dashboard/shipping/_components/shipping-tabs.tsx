import Link from "next/link";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

type Tab = "methods" | "shipments" | "integrations";

/** Segmented control linking the three shipping pages. */
export function ShippingTabs({ active }: { active: Tab }) {
  const tabs: { id: Tab; label: string; href: string }[] = [
    { id: "methods", label: tr("طرق وأسعار الشحن"), href: "/shipping" },
    { id: "shipments", label: tr("الشحنات"), href: "/shipping/shipments" },
    { id: "integrations", label: tr("شركات الشحن"), href: "/shipping/integrations" },
  ];
  return (
    <nav aria-label={tr("الشحن")} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="inline-flex min-w-max items-center gap-0.5 rounded-full bg-(--sys-gray)/14 p-[3px]">
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <li key={t.id}>
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex h-8 items-center rounded-full px-4 text-[13px] transition-[background-color,color,box-shadow] duration-200 ease-(--ease-apple) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "bg-card font-semibold text-foreground shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]" : "text-foreground/70 hover:text-foreground",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
