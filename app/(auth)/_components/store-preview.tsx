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
    <div className="space-y-10">
      <div className="space-y-3">
        <h2 className="text-[40px] leading-[1.2] font-bold text-balance">
          <span className="text-muted-foreground">متجرك الأونلاين وكاشير محلك،</span>
          <br />
          جاهزين في دقايق.
        </h2>
        <p className="text-[17px] leading-7 text-muted-foreground">اكتب اسم متجرك وشوفه بيتبني هنا قدامك.</p>
      </div>

      <div className="apple-card overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,.6)] ring-[0.5px] ring-white/10">
        {/* Safari-style bar with the real link */}
        <div className="flex items-center gap-3 bg-[#2c2c2e] px-4 py-2.5" dir="ltr">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto flex min-w-0 items-center gap-1.5 rounded-[8px] bg-[#1c1c1e] px-3 py-1 text-[12px] text-muted-foreground">
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
              <span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-linear-to-b from-primary/80 to-primary text-lg font-bold text-primary-foreground">
                {initial}
              </span>
              <div className="min-w-0">
                <p key={name} className="truncate text-[17px] font-semibold motion-safe:animate-in motion-safe:fade-in">
                  {name}
                </p>
                <p className="truncate text-[13px] text-muted-foreground">{businessType || "نوع النشاط"}</p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[12px] text-foreground/80">
              <ShoppingBag className="size-3.5" /> السلة
            </span>
          </div>

          {/* Product placeholders */}
          <div className="mt-5 grid grid-cols-4 gap-2.5">
            {TILE_TONES.map((tone, i) => (
              <div key={i} className="space-y-1.5">
                <div className={cn("aspect-square rounded-[12px]", tone)} />
                <div className="h-1.5 w-3/4 rounded-full bg-muted" />
                <div className="h-1.5 w-1/2 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Same store, two channels */}
        <div className="grid grid-cols-2 gap-2 px-5 pb-5">
          <div className="flex items-center gap-2.5 rounded-[14px] bg-muted px-3.5 py-2.5">
            <span className="grid size-6 place-items-center rounded-[6px] bg-primary text-white">
              <Globe className="size-3.5" />
            </span>
            <span className="text-[13px]">متجر أونلاين</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-[14px] bg-muted px-3.5 py-2.5">
            <span className="grid size-6 place-items-center rounded-[6px] bg-(--sys-indigo) text-white">
              <ScanBarcode className="size-3.5" />
            </span>
            <span className="text-[13px]">كاشير للمحل</span>
          </div>
        </div>
      </div>

      <ul className="space-y-3 text-[15px]">
        {[`تجربة مجانية ${trialDays.toLocaleString("ar-EG")} ${trialDays > 2 && trialDays <= 10 ? "أيام" : "يوم"}`, "من غير بطاقة ائتمان", "لينك متجرك جاهز تشاركه على طول"].map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-muted-foreground">
            <span className="grid size-5 place-items-center rounded-full bg-(--sys-green) text-black">
              <Check className="size-3" strokeWidth={3.2} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
