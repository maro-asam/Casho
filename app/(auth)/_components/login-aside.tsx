import { AlertTriangle, Globe, ScanBarcode } from "lucide-react";

const EVENTS = [
  { icon: Globe, tone: "bg-primary", title: "طلب أونلاين #1042", meta: "سارة · الإسكندرية", amount: "+٤٥٠" },
  { icon: ScanBarcode, tone: "bg-(--sys-indigo)", title: "بيعة من الكاشير", meta: "فرع مدينة نصر", amount: "+١٬١٥٠" },
  {
    icon: AlertTriangle,
    tone: "bg-(--sys-orange)",
    title: "تيشيرت أوفرسايز قرب يخلص",
    meta: "فاضل ٣ قطع",
    amount: null,
  },
];

/** What the merchant comes back to: a quiet summary of today. */
export function LoginAside() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h2 className="text-[40px] leading-[1.2] font-bold text-balance">
          <span className="text-muted-foreground">كل اللي حصل في متجرك،</span>
          <br />
          مستنيك في مكان واحد.
        </h2>
        <p className="text-[17px] leading-7 text-muted-foreground">طلبات الأونلاين، وبيعات المحل، والمخزون. ادخل وكمّل من مكان ما وقفت.</p>
      </div>

      <div className="apple-card overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,.6)] ring-[0.5px] ring-white/10">
        <div className="flex items-end justify-between gap-4 p-5">
          <div>
            <p className="text-[13px] font-semibold text-muted-foreground">مبيعات النهارده</p>
            <p className="mt-1 text-[34px] leading-[41px] font-bold tabular-nums">
              ١٢٬٤٥٠ <span className="text-[15px] text-muted-foreground">ج.م</span>
            </p>
          </div>
          <span className="rounded-full bg-(--sys-green)/15 px-2.5 py-1 text-[12px] font-semibold text-(--sys-green)">
            +٢٤٪ عن امبارح
          </span>
        </div>

        <div className="px-5 pb-5">
          <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
            <div className="h-full w-[58%] bg-primary" />
            <div className="h-full flex-1 bg-primary/30" />
          </div>
          <div className="mt-2.5 flex justify-between text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-primary" /> أونلاين <span className="font-semibold text-foreground">٧٬٢٢٠</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-primary/30" /> المحل <span className="font-semibold text-foreground">٥٬٢٣٠</span>
            </span>
          </div>
        </div>

        <ul className="apple-rows pb-1 [--row-inset:61px]">
          {EVENTS.map(({ icon: Icon, tone, title, meta, amount }) => (
            <li key={title} className="flex items-center gap-3.5 px-4 py-3">
              <span className={`grid size-[29px] shrink-0 place-items-center rounded-[7px] text-white ${tone}`}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px]">{title}</p>
                <p className="truncate text-[13px] text-muted-foreground">{meta}</p>
              </div>
              {amount && <span className="text-[15px] font-semibold text-(--sys-green) tabular-nums">{amount}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
