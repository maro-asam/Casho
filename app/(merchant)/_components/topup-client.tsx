"use client";

import {
  Wallet,
  CreditCard,
  Landmark,
  Smartphone,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { CreateTopupRequestAction } from "@/actions/balance/topup.actions";
import { TopupMethod } from "@/lib/generated/prisma/enums";

const quickAmounts = [10000, 25000, 50000, 100000];

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
  }).format(value / 100);
}

const paymentMethods = [
  {
    id: TopupMethod.VODAFONE_CASH,
    title: "فودافون كاش",
    icon: Smartphone,
  },
  {
    id: TopupMethod.INSTAPAY,
    title: "انستا باي",
    icon: CreditCard,
  },
  {
    id: TopupMethod.BANK_TRANSFER,
    title: "تحويل بنكي",
    icon: Landmark,
  },
];

const TopupClient = ({ storeId }: { storeId: string }) => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<TopupMethod>(
    TopupMethod.INSTAPAY
  );
  const [transferRef, setTransferRef] = useState("");
  const [note, setNote] = useState("");

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const parsedAmount = Math.round(Number(amount) * 100);

        if (!parsedAmount || parsedAmount <= 0) {
          toast.error("ادخل مبلغ صحيح");
          return;
        }

        const res = await CreateTopupRequestAction({
          storeId,
          amount: parsedAmount,
          method,
          transferRef,
          note,
        });

        if (!res.success) {
          toast.error(res.message);
          return;
        }

        toast.success("تم إرسال طلب الشحن ✅");

        setAmount("");
        setTransferRef("");
        setNote("");
      } catch (err) {
        toast.error("حصل خطأ");
      }
    });
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">شحن الرصيد</h1>

        <Button asChild variant="outline">
          <Link href="/dashboard/balance">
            <ArrowLeft className="ms-2 size-4" />
            رجوع
          </Link>
        </Button>
      </div>

      {/* QUICK AMOUNTS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickAmounts.map((a) => (
          <Button
            key={a}
            variant="outline"
            onClick={() => setAmount(String(a / 100))}
          >
            {formatPrice(a)}
          </Button>
        ))}
      </div>

      {/* FORM */}
      <Card>
        <CardHeader>
          <CardTitle>بيانات الشحن</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>المبلغ (جنيه)</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <Label>طريقة الدفع</Label>

              <RadioGroup
                value={method}
                onValueChange={(v) => setMethod(v as TopupMethod)}
              >
                {paymentMethods.map((m) => {
                  const Icon = m.icon;

                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 border p-3 rounded-lg"
                    >
                      <RadioGroupItem value={m.id} />
                      <Icon className="size-4" />
                      <span>{m.title}</span>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            <div>
              <Label>رقم العملية</Label>
              <Input
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
              />
            </div>

            <div>
              <Label>ملاحظات</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full"
            >
              {isPending ? "جاري الإرسال..." : "إرسال الطلب"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopupClient;