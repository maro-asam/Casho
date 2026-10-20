import Link from "next/link";
import { Check, ChevronLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";
import CardHeading from "./CardHeading";

export type StatusRow = {
  label: string;
  value: string;
  ok: boolean;
  href: string;
};

export default function StoreStatus({ balance, rows }: { balance: string; rows: StatusRow[] }) {
  return (
    <section className="apple-card h-full overflow-hidden">
      <CardHeading title={tr("حالة المتجر")} />

      <div className="mx-4 flex items-center justify-between gap-3 rounded-[18px] bg-background p-4">
        <div className="min-w-0">
          <p className="text-[13px] text-muted-foreground">{tr("الرصيد المتاح")}</p>
          <p className="truncate text-[28px] leading-[34px] font-bold tracking-[-0.02em] tabular-nums">{balance}</p>
        </div>
        <Link
          href="/balance"
          className="apple-press flex h-9 shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3.5 text-[15px] font-semibold text-primary hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-4" strokeWidth={2.4} />
          {tr("شحن الرصيد")}
        </Link>
      </div>

      <dl className="apple-rows mt-2 pb-2 [--row-inset:57px]">
        {rows.map((row) => (
          <div key={row.label}>
            <Link
              href={row.href}
              className="flex min-h-12 items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/60 active:bg-muted focus-visible:bg-muted/60 focus-visible:outline-none"
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-[29px] shrink-0 place-items-center rounded-[7px] text-white",
                  row.ok ? "bg-(--sys-green)" : "bg-(--sys-orange)",
                )}
              >
                {row.ok ? <Check className="size-4" strokeWidth={2.6} /> : <span className="text-[15px] font-bold">!</span>}
              </span>
              <dt className="flex-1 text-[15px]">{row.label}</dt>
              <dd className={cn("text-[15px]", row.ok ? "text-muted-foreground" : "text-[#c93400] dark:text-(--sys-orange)")}>
                {row.value}
              </dd>
              <ChevronLeft className="size-4 shrink-0 text-(--label-3) ltr:-scale-x-100" strokeWidth={2.4} />
            </Link>
          </div>
        ))}
      </dl>
    </section>
  );
}
