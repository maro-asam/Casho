import { cn } from "@/lib/utils";

type HealthCategory = "HEALTHY" | "ACTIVE" | "AT_RISK" | "LOST";

const config: Record<HealthCategory, { label: string; className: string }> = {
  HEALTHY: { label: "صحي", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  ACTIVE: { label: "نشط", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  AT_RISK: { label: "في خطر", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  LOST: { label: "خامل", className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
};

export function CustomerHealthBadge({
  category,
  score,
}: {
  category: HealthCategory;
  score: number;
}) {
  const { label, className } = config[category];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", className)}>
      <span className="font-bold">{score}</span>
      <span>{label}</span>
    </span>
  );
}

export function CustomerStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "نشط", className: "bg-emerald-500/10 text-emerald-600" },
    VIP: { label: "VIP", className: "bg-amber-500/10 text-amber-600" },
    INACTIVE: { label: "غير نشط", className: "bg-gray-500/10 text-gray-500" },
    BLOCKED: { label: "محظور", className: "bg-rose-500/10 text-rose-600" },
  };
  const { label, className } = map[status] ?? map.ACTIVE;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}
