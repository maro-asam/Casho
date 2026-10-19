"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Shuffle } from "lucide-react";
import { toast } from "sonner";

import { SaveCouponAction, type CouponInput } from "@/actions/coupons/coupons.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCouponValue } from "@/lib/coupons/coupon-status";
import { cn } from "@/lib/utils";
import { lazyIntl, tdir, tr } from "@/lib/i18n/dashboard";

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
      <DialogContent dir={tdir()} className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
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

  return (
    <form onSubmit={submit} className="min-w-0 space-y-5">
      <DialogHeader className="text-start sm:text-start">
        <DialogTitle>{coupon ? tr("تعديل كود الخصم") : tr("كود خصم جديد")}</DialogTitle>
        <DialogDescription>{tr("العميل بيكتبه في السلة — أو يدخل من لينك الكود وبيتطبق لوحده.")}</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="coupon-code">{tr("الكود")}</Label>
        <div className="flex gap-2" dir="ltr">
          <Input
            id="coupon-code"
            value={code}
            disabled={codeLocked}
            maxLength={30}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
            placeholder="SUMMER20"
            className="h-10 font-mono tracking-wider uppercase"
            autoComplete="off"
          />
          {!codeLocked && (
            <Button type="button" variant="outline" className="h-10 gap-1.5" onClick={() => setCode(randomCode())}>
              <Shuffle className="size-4" />
              <span dir={tdir()}>{tr("عشوائي")}</span>
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {codeLocked ? tr("اتستخدم {0} مرة، فاسمه مقفول.", nf.format(coupon!.usedCount)) : tr("حروف إنجليزي وأرقام — سهل يتكتب ويتفتكر.")}
        </p>
      </div>

      <div className="space-y-2">
        <Label>{tr("نوع الخصم")}</Label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["PERCENTAGE", tr("نسبة مئوية"), tr("مثال: ١٠٪")],
              ["FIXED", tr("مبلغ ثابت"), tr("مثال: ٥٠ ج.م")],
            ] as const
          ).map(([v, label, hint]) => (
            <button
              key={v}
              type="button"
              onClick={() => setType(v)}
              aria-pressed={type === v}
              className={cn(
                "rounded-lg border p-3 text-start transition-colors",
                type === v ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
              )}
            >
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-muted-foreground">{hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyField
          id="coupon-value"
          label={type === "PERCENTAGE" ? tr("النسبة") : tr("المبلغ")}
          suffix={type === "PERCENTAGE" ? tr("٪") : tr("ج.م")}
          value={value}
          onChange={setValue}
          max={type === "PERCENTAGE" ? 100 : undefined}
        />
        {type === "PERCENTAGE" ? (
          <MoneyField id="coupon-max" label={tr("أقصى خصم")} hint={tr("اختياري")} suffix={tr("ج.م")} value={maxDiscount} onChange={setMaxDiscount} />
        ) : (
          <div className="hidden sm:block" />
        )}
        <MoneyField id="coupon-min" label={tr("أقل قيمة للطلب")} hint={tr("اختياري")} suffix={tr("ج.م")} value={minSubtotal} onChange={setMinSubtotal} />
        <MoneyField id="coupon-limit" label={tr("عدد مرات الاستخدام")} hint={tr("فاضي = مفتوح")} suffix={tr("مرة")} value={usageLimit} onChange={setUsageLimit} integer />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="coupon-start" className="text-xs">
            {tr("يبدأ")}{" "}<span className="font-normal text-muted-foreground">{tr("(اختياري)")}</span>
          </Label>
          <Input id="coupon-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="text-xs" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coupon-end" className="text-xs">
            {tr("ينتهي")}{" "}<span className="font-normal text-muted-foreground">{tr("(اختياري)")}</span>
          </Label>
          <Input id="coupon-end" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="text-xs" />
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3">
        <span>
          <span className="block text-sm font-medium">{tr("شغّال")}</span>
          <span className="block text-xs text-muted-foreground">{tr("لو قفلته، الكود يفضل محفوظ بس محدش يقدر يستخدمه.")}</span>
        </span>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </label>

      {summary && (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
          <span className="text-muted-foreground">{tr("العميل هياخد:")}{" "}</span>
          {summary}
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter className="gap-2 sm:justify-start">
        <Button type="submit" disabled={pending} className="gap-1.5">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {coupon ? tr("حفظ التعديلات") : tr("إنشاء الكود")}
        </Button>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          {tr("إلغاء")}
        </Button>
      </DialogFooter>
    </form>
  );
}

function MoneyField({
  id,
  label,
  hint,
  suffix,
  value,
  onChange,
  max,
  integer,
}: {
  id: string;
  label: string;
  hint?: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  max?: number;
  integer?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs">
        {label} {hint && <span className="font-normal text-muted-foreground">({hint})</span>}
      </Label>
      <div className="flex h-10 items-center rounded-md border border-input bg-transparent focus-within:ring-2 focus-within:ring-ring/30">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          max={max}
          step={integer ? 1 : "any"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm tabular-nums outline-none"
        />
        <span className="pe-3 text-xs text-muted-foreground">{suffix}</span>
      </div>
    </div>
  );
}
