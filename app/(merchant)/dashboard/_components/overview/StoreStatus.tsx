import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/dashboard";

export type StatusRow = {
  label: string;
  value: string;
  ok: boolean;
  href: string;
};

export default function StoreStatus({ balance, rows }: { balance: string; rows: StatusRow[] }) {
  return (
    <Card className="gap-0 rounded-xl py-0 shadow-none">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-base font-semibold">{tr("حالة المتجر")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 p-3">
          <div>
            <p className="text-xs text-muted-foreground">{tr("الرصيد المتاح")}</p>
            <p className="text-lg font-bold tabular-nums">{balance}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/balance">{tr("شحن الرصيد")}</Link>
          </Button>
        </div>

        <dl className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <span
                  aria-hidden
                  className={cn("size-1.5 rounded-full", row.ok ? "bg-emerald-500" : "bg-amber-500")}
                />
                {row.label}
              </dt>
              <dd>
                <Link
                  href={row.href}
                  className={cn(
                    "text-sm font-medium hover:underline",
                    row.ok ? "text-foreground" : "text-amber-700 dark:text-amber-400",
                  )}
                >
                  {row.value}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
