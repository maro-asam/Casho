import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function UsageBar({
  label,
  used,
  limit,
  isUnlimited,
  unit,
}: {
  label: string;
  used: number;
  limit: number | null;
  isUnlimited: boolean;
  unit?: string;
}) {
  if (isUnlimited || limit === null) {
    return (
      <div className="flex items-center justify-between gap-3 py-2">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="secondary">غير محدود</Badge>
      </div>
    );
  }

  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;
  const reached = used >= limit;
  const warning = !reached && percent >= 90;

  return (
    <div className="flex flex-col gap-1.5 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className={cn("text-sm text-muted-foreground", reached && "font-medium text-destructive")}>
          {used} / {limit} {unit}
        </span>
      </div>
      <Progress
        value={percent}
        className={cn(reached && "[&>div]:bg-destructive", warning && !reached && "[&>div]:bg-amber-500")}
      />
      {reached ? (
        <p className="text-xs text-destructive">
          وصلت للحد الأقصى.{" "}
          <Link href="/dashboard/change-plan" className="underline underline-offset-2">
            قم بالترقية
          </Link>{" "}
          لإضافة المزيد.
        </p>
      ) : warning ? (
        <p className="text-xs text-amber-600 dark:text-amber-500">أنت تستخدم {percent}% من الحد المتاح.</p>
      ) : null}
    </div>
  );
}
