"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CreateCouponAction } from "@/actions/coupons/create-coupon.actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ActionState = {
  success?: boolean;
  error?: string;
  message?: string;
};

const initialState: ActionState = {};

export default function NewCouponForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    CreateCouponAction,
    initialState,
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }

    if (state?.success) {
      toast.success(state.message || "تم إنشاء الكوبون بنجاح");
      router.push("/dashboard/coupons");
      router.refresh();
    }
  }, [state, router]);

  return (
    <Card className="rounded-lg shadow-sm">
      <CardContent className="p-6">
        <form action={formAction} className="space-y-6">
          <FieldGroup className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel>كود الكوبون</FieldLabel>
              <Input name="code" placeholder="مثال: MARO10" />
              <FieldDescription>
                هيظهر للعميل بالشكل ده وقت الشراء
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>نوع الخصم</FieldLabel>
              <Select name="type" defaultValue="PERCENTAGE">
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الخصم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">نسبة مئوية</SelectItem>
                  <SelectItem value="FIXED">مبلغ ثابت</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>قيمة الخصم</FieldLabel>
              <Input name="value" type="number" min="1" placeholder="10" />
            </Field>

            <Field>
              <FieldLabel>الحد الأدنى للطلب</FieldLabel>
              <Input
                name="minSubtotal"
                type="number"
                min="0"
                placeholder="اختياري"
              />
            </Field>

            <Field>
              <FieldLabel>أقصى خصم</FieldLabel>
              <Input
                name="maxDiscount"
                type="number"
                min="0"
                placeholder="اختياري"
              />
            </Field>

            <Field>
              <FieldLabel>عدد مرات الاستخدام</FieldLabel>
              <Input
                name="usageLimit"
                type="number"
                min="1"
                placeholder="اختياري"
              />
            </Field>

            <Field>
              <FieldLabel>يبدأ من</FieldLabel>
              <Input name="startsAt" type="datetime-local" />
            </Field>

            <Field>
              <FieldLabel>ينتهي في</FieldLabel>
              <Input name="expiresAt" type="datetime-local" />
            </Field>
          </FieldGroup>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "جارٍ الإنشاء..." : "إنشاء الكوبون"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/coupons")}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
