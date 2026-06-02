"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CreditCard,
  Loader2,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { InitiateKashierTopupAction } from "@/actions/balance/topup.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESET_AMOUNTS = [
  { label: "100 جنيه", value: 10000 },
  { label: "200 جنيه", value: 20000 },
  { label: "500 جنيه", value: 50000 },
  { label: "1000 جنيه", value: 100000 },
];

function formatEGP(piasters: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(piasters / 100);
}

type Props = {
  storeId: string;
  topupResult?: string | null;
};

export default function KashierTopupCard({ storeId, topupResult }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amountInput, setAmountInput] = useState("100");

  const amountInPiasters = (() => {
    const v = Number(amountInput);
    return Number.isFinite(v) && v > 0 ? Math.round(v * 100) : 0;
  })();

  const handlePay = () => {
    if (amountInPiasters < 1000) {
      toast.error("أقل مبلغ شحن هو 10 جنيه");
      return;
    }

    startTransition(async () => {
      const res = await InitiateKashierTopupAction(storeId, amountInPiasters);
      if (res && !res.success) {
        toast.error(res.message);
      }
    });
  };

  return (
    <Card className="overflow-hidden border-primary/20 shadow-sm ring-1 ring-primary/10 pt-0">
      {/* Header banner */}
      <div className="flex items-center gap-2 border-b border-primary/10 bg-primary/5 px-5 py-2.5 text-xs font-medium text-primary">
        <Zap className="size-3.5 shrink-0" />
        شحن فوري — الرصيد يتضاف تلقائياً بعد الدفع بدون مراجعة
      </div>

      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <CreditCard className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">شحن فوري بـ Kashier</CardTitle>
            <CardDescription>
              ادفع بكارت أو محفظة إلكترونية والرصيد يتضاف لحظياً.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {topupResult === "success" && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-500/8 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="size-4 shrink-0" />
            تمت إضافة الرصيد بنجاح!
          </div>
        )}

        {topupResult === "failed" && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-500/8 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-400">
            <AlertCircle className="size-4 shrink-0" />
            فشلت عملية الدفع، حاول مرة تانية.
          </div>
        )}

        {topupResult === "invalid" && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-500/8 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-400">
            <AlertCircle className="size-4 shrink-0" />
            حدث خطأ في التحقق من الدفع، تواصل مع الدعم.
          </div>
        )}

        {/* Preset amounts */}
        <div className="space-y-2">
          <p className="text-sm font-medium">اختار مبلغ الشحن</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setAmountInput(String(preset.value / 100))}
                className={cn(
                  "rounded-xl border py-2 text-sm font-medium transition-all",
                  amountInPiasters === preset.value
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/60 hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium">أو اكتب مبلغ تاني</p>
          <div className="relative">
            <Input
              type="number"
              min={10}
              step={1}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="مثال: 350"
              className="h-11 rounded-xl pe-14"
              dir="ltr"
            />
            <span className="absolute inset-y-0 inset-e-4 flex items-center text-sm text-muted-foreground">
              جنيه
            </span>
          </div>
        </div>

        {/* Methods note */}
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <CreditCard className="size-4 shrink-0 text-primary" />
          <span>Visa / Mastercard / Meeza</span>
          <span className="text-border">|</span>
          <Wallet className="size-4 shrink-0 text-primary" />
          <span>Vodafone Cash وغيرها</span>
        </div>

        <Button
          type="button"
          onClick={handlePay}
          disabled={isPending || amountInPiasters < 1000}
          className="h-11 w-full gap-2 rounded-xl"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              جاري التحويل لـ Kashier...
            </>
          ) : (
            <>
              <Zap className="size-4" />
              ادفع {amountInPiasters >= 1000 ? formatEGP(amountInPiasters) : ""} الآن
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
