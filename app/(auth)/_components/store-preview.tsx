import { Check, Globe, Lock, ScanBarcode, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  storeName: string;
  slug: string;
  businessType: string;
  trialDays: number;
};

const TILE_TONES = ["bg-primary/15", "bg-primary/10", "bg-primary/20", "bg-primary/[0.07]"];

/** Live preview of the store being created — fills in as the merchant types. */
export function StorePreview({ storeName, slug, businessType, trialDays }: Props) {
  const name = storeName.trim() || "متجرك";
  const initial = name.charAt(0);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold leading-snug tracking-tight">
          <span className="font-normal">متجرك الأونلاين وكاشير محلك،</span>
          <br />
          جاهزين في دقايق.
        </h2>
        <p className="text-sm leading-7 text-muted-foreground">اكتب اسم متجرك وشوفه بيتبني هنا قدامك.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/5 dark:shadow-black/30">
        {/* Browser bar with the real link */}
        <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5" dir="ltr">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
          </div>
          <div className="mx-auto flex min-w-0 items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            <Lock className="size-3 shrink-0" />
            <span className="truncate">
              <span className={cn("font-semibold", slug ? "text-foreground" : "text-muted-foreground")}>{slug || "your-store"}</span>
              .casho.store
            </span>
          </div>
          <div className="w-10" />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                {initial}
              </span>
              <div className="min-w-0">
                <p key={name} className="truncate text-base font-bold motion-safe:animate-in motion-safe:fade-in">
                  {name}
                </p>
                <p className="truncate text-xs text-muted-foreground">{businessType || "نوع النشاط"}</p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
              <ShoppingBag className="size-3.5" /> السلة
            </span>
          </div>

          {/* Product placeholders */}
          <div className="mt-5 grid grid-cols-4 gap-2.5">
            {TILE_TONES.map((tone, i) => (
              <div key={i} className="space-y-1.5">
                <div className={cn("aspect-square rounded-lg", tone)} />
                <div className="h-1.5 w-3/4 rounded-full bg-muted" />
                <div className="h-1.5 w-1/2 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Same store, two channels */}
        <div className="grid grid-cols-2 divide-x divide-border border-t border-border rtl:divide-x-reverse">
          <div className="flex items-center gap-2.5 px-5 py-3">
            <Globe className="size-4 text-primary" />
            <span className="text-xs font-medium">متجر أونلاين</span>
          </div>
          <div className="flex items-center gap-2.5 px-5 py-3">
            <ScanBarcode className="size-4 text-foreground" />
            <span className="text-xs font-medium">كاشير للمحل</span>
          </div>
        </div>
      </div>

      <ul className="space-y-2.5 text-sm">
        {[`تجربة مجانية ${trialDays.toLocaleString("ar-EG")} ${trialDays > 2 && trialDays <= 10 ? "أيام" : "يوم"}`, "من غير بطاقة ائتمان", "لينك متجرك جاهز تشاركه على طول"].map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-muted-foreground">
            <span className="grid size-5 place-items-center rounded-full bg-primary/10 text-primary">
              <Check className="size-3" strokeWidth={3} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
