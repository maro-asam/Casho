"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Shuffle } from "lucide-react";
import { toast } from "sonner";

import { SaveCouponAction, type CouponInput } from "@/actions/coupons/coupons.actions";
import { SegmentedButtons, appleButton } from "@/components/saas-page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { formatCouponValue } from "@/lib/coupons/coupon-status";
import { cn } from "@/lib/utils";
import { lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";

export type EditableCoupon = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minSubtotal: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
};

const nf = lazyIntl.number({ maximumFractionDigits: 2 });

/** ISO → <input type="datetime-local"> value in the merchant's timezone. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/** URL-driven: `?new=1` creates, `?edit=<id>` edits. */
export function UrlCouponDialog({ mode, coupon }: { mode: "new" | "edit" | null; coupon: EditableCoupon | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const open = mode === "new" || (mode === "edit" && Boolean(coupon));

  function close() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("new");
    next.delete("edit");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent dir={tdir()} className="apple-ui apple-form max-h-[92dvh] gap-0 overflow-y-auto bg-background p-0 text-foreground sm:max-w-lg">
        {open && <CouponForm key={coupon?.id ?? "new"} coupon={mode === "edit" ? coupon : null} onDone={close} />}
      </DialogContent>
    </Dialog>
  );
}

function CouponForm({ coupon, onDone }: { coupon: EditableCoupon | null; onDone: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState(coupon?.code ?? "");
  const [type, setType] = useState<CouponInput["type"]>(coupon?.type ?? "PERCENTAGE");
  const [value, setValue] = useState(coupon ? String(coupon.value) : "");
  const [minSubtotal, setMinSubtotal] = useState(coupon?.minSubtotal ? String(coupon.minSubtotal) : "");
  const [maxDiscount, setMaxDiscount] = useState(coupon?.maxDiscount ? String(coupon.maxDiscount) : "");
  const [usageLimit, setUsageLimit] = useState(coupon?.usageLimit ? String(coupon.usageLimit) : "");
  const [startsAt, setStartsAt] = useState(toLocalInput(coupon?.startsAt ?? null));
  const [expiresAt, setExpiresAt] = useState(toLocalInput(coupon?.expiresAt ?? null));
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  const codeLocked = Boolean(coupon && coupon.usedCount > 0);
  const numericValue = Number(value);

  // Plain-language summary of what the customer gets.
  const summary =
    numericValue > 0
      ? [
          tr("خصم {0}", formatCouponValue(type, numericValue)),
          type === "PERCENTAGE" && Number(maxDiscount) > 0 && tr("بحد أقصى {0} ج.م", nf.format(Number(maxDiscount))),
          Number(minSubtotal) > 0 && tr("على الطلبات من {0} ج.م", nf.format(Number(minSubtotal))),
          Number(usageLimit) > 0 && tr("لأول {0} طلب", nf.format(Number(usageLimit))),
        ]
          .filter(Boolean)
          .join(" ")
      : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await SaveCouponAction(coupon?.id ?? null, {
        code,
        type,
        value: numericValue,
        minSubtotal: minSubtotal ? Number(minSubtotal) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        startsAt: fromLocalInput(startsAt),
        expiresAt: fromLocalInput(expiresAt),
        isActive,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast.success(coupon ? tr("اتحفظ الكود") : tr("اتعمل كود {0}", code.trim().toUpperCase()));
      onDone();
      router.refresh();
    });
  }

  const rowCls = "flex min-h-11 items-center gap-4 px-4";
  const shownValue = numericValue > 0 ? formatCouponValue(type, numericValue) : type === "PERCENTAGE" ? tr("{0}٪", "—") : tr("{0} ج.م", "—");

  return (
    <form onSubmit={submit} className="min-w-0">
      <DialogHeader className="items-center gap-1 px-6 pt-7 pb-5 text-center sm:text-center">
        <DialogTitle>{coupon ? tr("تعديل كود الخصم") : tr("كود خصم جديد")}</DialogTitle>
        <DialogDescription className="max-w-sm text-[13px]">{tr("العميل بيكتبه في السلة — أو يدخل من لينك الكود وبيتطبق لوحده.")}</DialogDescription>

        {/* Live pass preview */}
        <div className="mt-4 flex h-24 w-full max-w-xs overflow-hidden rounded-[16px] bg-card text-start shadow-[0_6px_24px_rgba(0,0,0,0.08)]" aria-hidden>
          <div
            className={cn(
              "flex w-24 shrink-0 flex-col items-center justify-center text-white transition-colors",
              isActive ? "bg-linear-to-b from-primary/85 to-primary" : "bg-linear-to-b from-[#aeaeb2] to-[#8e8e93]",
            )}
          >
            <span className="text-[22px] leading-7 font-bold tabular-nums">{shownValue}</span>
            <span className="text-[11px] text-white/80">{tr("خصم")}</span>
          </div>
          <div className="relative w-0 border-s-2 border-dashed border-background">
            <span className="absolute -top-2 -start-2 size-4 rounded-full bg-background" />
            <span className="absolute -bottom-2 -start-2 size-4 rounded-full bg-background" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center px-4">
            <p dir="ltr" className={cn("truncate font-mono text-[17px] font-bold tracking-[0.08em] rtl:text-right", !code && "text-(--label-3)")}>
              {code || "SUMMER20"}
            </p>
            <p className="line-clamp-2 text-[12px] leading-4 text-muted-foreground">{summary ?? tr("على أي طلب")}</p>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-6 px-4 pb-5">
        {/* Code */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 overflow-hidden rounded-[14px] bg-card ps-4 pe-2">
            <label htmlFor="coupon-code" className="shrink-0 text-[15px]">
              {tr("الكود")}
            </label>
            <input
              id="coupon-code"
              dir="ltr"
              value={code}
              disabled={codeLocked}
              maxLength={30}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
              placeholder="SUMMER20"
              autoComplete="off"
              className="h-12 min-w-0 flex-1 bg-transparent text-end font-mono text-[17px] font-semibold tracking-wider uppercase outline-none placeholder:text-(--label-3) disabled:text-muted-foreground"
            />
            {!codeLocked && (
              <button
                type="button"
                onClick={() => setCode(randomCode())}
                className="apple-press inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-(--fill-3) px-3 text-[13px] font-medium text-primary"
              >
                <Shuffle className="size-3.5" />
                {tr("عشوائي")}
              </button>
            )}
          </div>
          <p className="px-4 text-[13px] leading-[18px] text-muted-foreground">
            {codeLocked ? tr("اتستخدم {0} مرة، فاسمه مقفول.", nf.format(coupon!.usedCount)) : tr("حروف إنجليزي وأرقام — سهل يتكتب ويتفتكر.")}
          </p>
        </section>

        {/* Discount */}
        <section className="space-y-2">
          <div className="flex items-end justify-between gap-3 px-4">
            <h3 className="text-[13px] font-semibold text-muted-foreground">{tr("نوع الخصم")}</h3>
            <SegmentedButtons
              label={tr("نوع الخصم")}
              value={type}
              onChange={setType}
              options={[
                ["PERCENTAGE", tr("نسبة مئوية")],
                ["FIXED", tr("مبلغ ثابت")],
              ]}
            />
          </div>
          <div className="apple-rows overflow-hidden rounded-[14px] bg-card [--row-inset:16px]">
            <NumberRow
              id="coupon-value"
              label={type === "PERCENTAGE" ? tr("النسبة") : tr("المبلغ")}
              suffix={type === "PERCENTAGE" ? tr("٪") : tr("ج.م")}
              value={value}
              onChange={setValue}
              max={type === "PERCENTAGE" ? 100 : undefined}
              placeholder={type === "PERCENTAGE" ? "10" : "50"}
            />
            {type === "PERCENTAGE" && (
              <NumberRow id="coupon-max" label={tr("أقصى خصم")} suffix={tr("ج.م")} value={maxDiscount} onChange={setMaxDiscount} placeholder={tr("اختياري")} />
            )}
          </div>
        </section>

        {/* Conditions */}
        <section className="space-y-2">
          <h3 className="px-4 text-[13px] font-semibold text-muted-foreground">{tr("الشروط")}</h3>
          <div className="apple-rows overflow-hidden rounded-[14px] bg-card [--row-inset:16px]">
            <NumberRow id="coupon-min" label={tr("أقل قيمة للطلب")} suffix={tr("ج.م")} value={minSubtotal} onChange={setMinSubtotal} placeholder={tr("اختياري")} />
            <NumberRow id="coupon-limit" label={tr("عدد مرات الاستخدام")} suffix={tr("مرة")} value={usageLimit} onChange={setUsageLimit} integer placeholder={tr("فاضي = مفتوح")} />
            <label htmlFor="coupon-start" className={rowCls}>
              <span className="shrink-0 text-[15px]">{tr("يبدأ")}</span>
              <input
                id="coupon-start"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="h-11 min-w-0 flex-1 bg-transparent text-end text-[15px] text-muted-foreground outline-none"
              />
            </label>
            <label htmlFor="coupon-end" className={rowCls}>
              <span className="shrink-0 text-[15px]">{tr("ينتهي")}</span>
              <input
                id="coupon-end"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="h-11 min-w-0 flex-1 bg-transparent text-end text-[15px] text-muted-foreground outline-none"
              />
            </label>
          </div>
          <p className="px-4 text-[13px] text-muted-foreground">{tr("سيب التاريخ فاضي لو الكود شغّال على طول.")}</p>
        </section>

        {/* Active */}
        <section className="space-y-2">
          <label className={cn(rowCls, "cursor-pointer rounded-[14px] bg-card")}>
            <span className="flex-1 text-[15px]">{tr("شغّال")}</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} className="apple-switch" />
          </label>
          <p className="px-4 text-[13px] text-muted-foreground">{tr("لو قفلته، الكود يفضل محفوظ بس محدش يقدر يستخدمه.")}</p>
        </section>

        {error && <p className="px-4 text-[13px] text-(--sys-red)">{trv(error)}</p>}

        <div className="space-y-1">
          <button type="submit" disabled={pending} className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {coupon ? tr("حفظ التعديلات") : tr("إنشاء الكود")}
          </button>
          <button type="button" onClick={onDone} disabled={pending} className="h-11 w-full rounded-full text-[15px] text-primary hover:bg-primary/8">
            {tr("إلغاء")}
          </button>
        </div>
      </div>
    </form>
  );
}

/** iOS form row: label leading, numeric field + unit trailing. */
function NumberRow({
  id,
  label,
  suffix,
  value,
  onChange,
  max,
  integer,
  placeholder,
}: {
  id: string;
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  max?: number;
  integer?: boolean;
  placeholder?: string;
}) {
  return (
    <label htmlFor={id} className="flex min-h-11 items-center gap-3 px-4">
      <span className="shrink-0 text-[15px]">{label}</span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        max={max}
        step={integer ? 1 : "any"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 min-w-0 flex-1 bg-transparent text-end text-[15px] tabular-nums outline-none placeholder:text-(--label-3)"
      />
      <span className="shrink-0 text-[15px] text-muted-foreground">{suffix}</span>
    </label>
  );
}
