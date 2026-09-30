import { AlertTriangle, Globe, ScanBarcode } from "lucide-react";

const EVENTS = [
  { icon: Globe, tone: "bg-primary text-primary-foreground", title: "طلب أونلاين #1042", meta: "سارة · الإسكندرية", amount: "+٤٥٠" },
  { icon: ScanBarcode, tone: "bg-foreground text-background", title: "بيعة من الكاشير", meta: "فرع مدينة نصر", amount: "+١٬١٥٠" },
  {
    icon: AlertTriangle,
    tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    title: "تيشيرت أوفرسايز قرب يخلص",
    meta: "فاضل ٣ قطع",
    amount: null,
  },
];

/** What the merchant comes back to: a quiet summary of today. */
export function LoginAside() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold leading-snug tracking-tight">
          <span className="font-normal">كل اللي حصل في متجرك،</span>
          <br />
          مستنيك في مكان واحد.
        </h2>
        <p className="text-sm leading-7 text-muted-foreground">طلبات الأونلاين، وبيعات المحل، والمخزون. ادخل وكمّل من مكان ما وقفت.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/5 dark:shadow-black/30">
        <div className="flex items-end justify-between gap-4 p-5">
          <div>
            <p className="text-xs text-muted-foreground">مبيعات النهارده</p>
            <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
              ١٢٬٤٥٠ <span className="text-sm font-medium text-muted-foreground">ج.م</span>
            </p>
          </div>
          <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            +٢٤٪ عن امبارح
          </span>
        </div>

        <div className="px-5 pb-5">
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
            <div className="h-full w-[58%] bg-primary" />
            <div className="h-full flex-1 bg-primary/30" />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-primary" /> أونلاين <span className="font-semibold text-foreground">٧٬٢٢٠</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-primary/30" /> المحل <span className="font-semibold text-foreground">٥٬٢٣٠</span>
            </span>
          </div>
        </div>

        <ul className="divide-y divide-border border-t border-border">
          {EVENTS.map(({ icon: Icon, tone, title, meta, amount }) => (
            <li key={title} className="flex items-center gap-3 px-5 py-3">
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tone}`}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{title}</p>
                <p className="truncate text-xs text-muted-foreground">{meta}</p>
              </div>
              {amount && <span className="text-sm font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">{amount}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
