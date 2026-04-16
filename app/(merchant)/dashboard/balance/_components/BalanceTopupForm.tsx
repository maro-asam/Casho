"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Receipt, Wallet } from "lucide-react";
import { toast } from "sonner";

import { CreateTopupRequestAction } from "@/actions/balance/topup.actions";
import { TopupMethod } from "@/lib/generated/prisma/enums";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TOPUP_METHODS, TOPUP_PRESET_AMOUNTS } from "@/constants/topup";

type BalanceTopupFormProps = {
  storeId: string;
  currentBalance: number;
  monthlyPrice: number;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export default function BalanceTopupForm({
  storeId,
  currentBalance,
  monthlyPrice,
}: BalanceTopupFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedMethod, setSelectedMethod] = useState<TopupMethod>(
    TopupMethod.VODAFONE_CASH,
  );
  const [amountInput, setAmountInput] = useState("100");
  const [transferRef, setTransferRef] = useState("");
  const [note, setNote] = useState("");
  const [receiptImage, setReceiptImage] = useState("");

  const amountInPiasters = useMemo(() => {
    const value = Number(amountInput);
    if (!Number.isFinite(value)) return 0;
    return Math.round(value * 100);
  }, [amountInput]);

  const selectedMethodData = useMemo(() => {
    return TOPUP_METHODS.find((item) => item.value === selectedMethod);
  }, [selectedMethod]);

  const balanceAfterApprove = currentBalance + amountInPiasters;
  const renewalsCovered =
    monthlyPrice > 0 ? Math.floor(balanceAfterApprove / monthlyPrice) : 0;

  const handlePresetClick = (value: number) => {
    setAmountInput(String(value / 100));
  };

  const handleSubmit = () => {
    if (!amountInput || Number(amountInput) < 10) {
      toast.error("أقل مبلغ شحن هو 10 جنيه");
      return;
    }

    if (!transferRef.trim()) {
      toast.error("اكتب رقم العملية أو مرجع التحويل");
      return;
    }

    startTransition(async () => {
      const res = await CreateTopupRequestAction({
        storeId,
        amount: amountInPiasters,
        method: selectedMethod,
        note,
        transferRef,
        receiptImage,
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);

      setAmountInput("100");
      setTransferRef("");
      setNote("");
      setReceiptImage("");

      router.refresh();
    });
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">بيانات طلب الشحن</CardTitle>
        <CardDescription>
          عبّي البيانات دي بدقة عشان طلبك يتراجع بسرعة.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>اختار طريقة الشحن</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {TOPUP_METHODS.map((item) => {
              const isActive = selectedMethod === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSelectedMethod(item.value)}
                  className={`rounded-xl border p-4 text-right transition-all ${
                    isActive
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border/60 hover:border-primary/40 hover:bg-muted/40"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-semibold">{item.label}</span>
                    {isActive && <Check className="size-4 text-primary" />}
                  </div>

                  <p className="text-sm leading-6 text-muted-foreground">
                    {item.instructions}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <Label>مبلغ الشحن</Label>

          <div className="flex flex-wrap gap-2">
            {TOPUP_PRESET_AMOUNTS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => handlePresetClick(preset)}
              >
                {formatPrice(preset)}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Input
              type="number"
              min={10}
              step={1}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="اكتب المبلغ بالجنيه"
              className="h-12 rounded-xl"
            />
            <p className="text-sm text-muted-foreground">
              الحد الأدنى للشحن 10 جنيه.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="transferRef">
              رقم التليفون المحول منه / رقم الحساب
            </Label>
            <Input
              id="transferRef"
              value={transferRef}
              onChange={(e) => setTransferRef(e.target.value)}
              placeholder="مثال: TXN123456"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptImage">لينك صورة الإيصال (اختياري)</Label>
            <Input
              id="receiptImage"
              value={receiptImage}
              onChange={(e) => setReceiptImage(e.target.value)}
              placeholder="https://..."
              className="h-12 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">ملاحظة إضافية (اختياري)</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثال: تم التحويل من رقم 010..."
            className="min-h-[120px] rounded-xl"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Wallet className="size-4 text-primary" />
              <p className="text-sm text-muted-foreground">
                المبلغ اللي هيتشحن
              </p>
            </div>
            <p className="text-lg font-bold">{formatPrice(amountInPiasters)}</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Receipt className="size-4 text-primary" />
              <p className="text-sm text-muted-foreground">
                الرصيد بعد الموافقة
              </p>
            </div>
            <p className="text-lg font-bold">
              {formatPrice(balanceAfterApprove)}
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Receipt className="size-4 text-primary" />
              <p className="text-sm text-muted-foreground">
                عدد مرات التجديد الممكنة
              </p>
            </div>
            <p className="text-lg font-bold">{renewalsCovered}</p>
          </div>
        </div>

        {selectedMethodData && (
          <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
            <p className="mb-1 font-semibold">تعليمات التحويل</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {selectedMethodData.instructions}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="h-12 flex-1 rounded-xl"
          >
            {isPending ? (
              <>
                <Loader2 className="ms-2 size-4 animate-spin" />
                جاري إرسال الطلب...
              </>
            ) : (
              "إرسال طلب الشحن"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-xl"
            onClick={() => router.push("/dashboard/balance")}
            disabled={isPending}
          >
            رجوع
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
