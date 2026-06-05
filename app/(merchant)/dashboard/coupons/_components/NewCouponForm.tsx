"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BadgePercent,
  CalendarRange,
  CircleDollarSign,
  Hash,
  Loader2,
  Percent,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { CreateCouponAction } from "@/actions/coupons/coupons.actions";

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

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border/50 pb-4">
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

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
      router.push("/coupons");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <Card className="border-border shadow-sm">
        <CardContent className="space-y-5 p-6">
          <SectionHeading
            icon={BadgePercent}
            title="معلومات الكوبون"
            description="الكود والنوع والقيمة الأساسية"
          />

          <FieldGroup className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel>كود الكوبون</FieldLabel>
              <div className="relative">
                <Hash className="absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="code"
                  placeholder="مثال: MARO10"
                  className="pe-9 font-mono uppercase tracking-widest"
                />
              </div>
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
                  <SelectItem value="PERCENTAGE">
                    <span className="flex items-center gap-2">
                      <Percent className="size-3.5 text-muted-foreground" />
                      نسبة مئوية
                    </span>
                  </SelectItem>
                  <SelectItem value="FIXED">
                    <span className="flex items-center gap-2">
                      <CircleDollarSign className="size-3.5 text-muted-foreground" />
                      مبلغ ثابت
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>قيمة الخصم</FieldLabel>
              <Input name="value" type="number" min="1" placeholder="10" />
              <FieldDescription>
                نسبة مئوية (%) أو مبلغ بالجنيه حسب النوع
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardContent className="space-y-5 p-6">
          <SectionHeading
            icon={Settings2}
            title="الشروط والقيود"
            description="تحكم في إمكانية استخدام الكوبون"
          />

          <FieldGroup className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel>الحد الأدنى للطلب</FieldLabel>
              <Input
                name="minSubtotal"
                type="number"
                min="0"
                placeholder="اختياري"
              />
              <FieldDescription>
                أقل قيمة للطلب علشان يتطبق الكوبون
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>أقصى قيمة خصم</FieldLabel>
              <Input
                name="maxDiscount"
                type="number"
                min="0"
                placeholder="اختياري"
              />
              <FieldDescription>
                للكوبونات النسبية فقط — سقف الخصم
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>عدد مرات الاستخدام</FieldLabel>
              <Input
                name="usageLimit"
                type="number"
                min="1"
                placeholder="اختياري — غير محدود"
              />
              <FieldDescription>
                اتركه فاضيًا علشان يكون غير محدود
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardContent className="space-y-5 p-6">
          <SectionHeading
            icon={CalendarRange}
            title="مدة الصلاحية"
            description="حدد وقت بداية الكوبون وانتهائه"
          />

          <FieldGroup className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel>يبدأ من</FieldLabel>
              <Input name="startsAt" type="datetime-local" />
            </Field>

            <Field>
              <FieldLabel>ينتهي في</FieldLabel>
              <Input name="expiresAt" type="datetime-local" />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="min-w-36 rounded-xl"
        >
          {isPending ? (
            <>
              <Loader2 className="ms-2 size-4 animate-spin" />
              جارٍ الإنشاء...
            </>
          ) : (
            <>
              <ShieldCheck className="ms-2 size-4" />
              إنشاء الكوبون
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => router.push("/coupons")}
        >
          إلغاء
        </Button>
      </div>
    </form>
  );
}
