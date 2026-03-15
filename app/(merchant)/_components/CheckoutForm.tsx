"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaymentMethod = { key: string; label: string };

export default function CheckoutForm({
  paymentMethods,
  action,
}: {
  paymentMethods: PaymentMethod[];
  action: (formData: FormData) => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<string>(
    paymentMethods.find((m) => m.key === "cash_on_delivery")?.key ||
      paymentMethods[0]?.key ||
      "cash_on_delivery",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>بيانات الطلب</CardTitle>
        <CardDescription>
          اكتب بياناتك وهنتواصل معاك لتأكيد الطلب والتسليم.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={action} className="space-y-4">
          {/* الاسم */}
          <div className="space-y-2">
            <Label htmlFor="fullName">الاسم بالكامل</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="مثال: محمد أحمد"
              required
            />
          </div>

          {/* الموبايل */}
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الموبايل</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="مثال: 010xxxxxxxx"
              required
            />
          </div>

          {/* العنوان */}
          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              name="address"
              placeholder="المحافظة - المنطقة - الشارع - رقم العمارة - الدور - شقة..."
              rows={4}
              required
            />
          </div>

          {/* طريقة الدفع */}
          <div className="space-y-2">
            <Label>طريقة الدفع</Label>

            {/* hidden input عشان القيمة تتبعت للـ server action */}
            <input type="hidden" name="paymentMethod" value={paymentMethod} />

            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر طريقة الدفع" />
              </SelectTrigger>

              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            تأكيد الطلب
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
