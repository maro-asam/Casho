"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { CreateServiceRequestAction } from "@/actions/services/create-service-request.action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type RequestServiceDialogProps = {
  service: {
    id: string;
    title: string;
  };
  storeId?: string;
  triggerClassName?: string;
};

type State = {
  success: boolean;
  message: string;
  errors?: {
    fullName?: string[];
    phone?: string[];
    whatsapp?: string[];
    storeLink?: string[];
    notes?: string[];
  };
};

const initialState: State = {
  success: false,
  message: "",
};

export default function RequestServiceDialog({
  service,
  storeId,
  triggerClassName,
}: RequestServiceDialogProps) {
  const [open, setOpen] = React.useState(false);

  const [state, formAction, isPending] = useActionState(
    CreateServiceRequestAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || "تم إرسال الطلب");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    } else if (state.message && !state.success && !state.errors) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={
            triggerClassName ?? "h-11 w-full rounded-lg text-sm font-medium"
          }
        >
          اطلب الخدمة
        </Button>
      </DialogTrigger>

      <DialogContent dir="rtl" className="sm:max-w-[560px]">
        <DialogHeader className="text-right">
          <DialogTitle className="text-xl">
            طلب خدمة: {service.title}
          </DialogTitle>
          <DialogDescription className="leading-7">
            اكتب بياناتك وسنتواصل معك بخصوص الخدمة في أسرع وقت.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="serviceId" value={service.id} />
          <input type="hidden" name="serviceTitle" value={service.title} />
          <input type="hidden" name="storeId" value={storeId ?? ""} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-right">
              <Label htmlFor={`fullName-${service.id}`}>الاسم</Label>
              <Input
                id={`fullName-${service.id}`}
                name="fullName"
                placeholder="اكتب اسمك"
              />
              {state.errors?.fullName && (
                <p className="text-sm text-destructive">
                  {state.errors.fullName[0]}
                </p>
              )}
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor={`phone-${service.id}`}>رقم الموبايل</Label>
              <Input
                id={`phone-${service.id}`}
                name="phone"
                placeholder="01000000000"
              />
              {state.errors?.phone && (
                <p className="text-sm text-destructive">
                  {state.errors.phone[0]}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-right">
              <Label htmlFor={`whatsapp-${service.id}`}>رقم واتساب</Label>
              <Input
                id={`whatsapp-${service.id}`}
                name="whatsapp"
                placeholder="اختياري"
              />
              {state.errors?.whatsapp && (
                <p className="text-sm text-destructive">
                  {state.errors.whatsapp[0]}
                </p>
              )}
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor={`storeLink-${service.id}`}>لينك المتجر</Label>
              <Input
                id={`storeLink-${service.id}`}
                name="storeLink"
                placeholder="https://..."
              />
              {state.errors?.storeLink && (
                <p className="text-sm text-destructive">
                  {state.errors.storeLink[0]}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 text-right">
            <Label htmlFor={`notes-${service.id}`}>ملاحظات</Label>
            <Textarea
              id={`notes-${service.id}`}
              name="notes"
              placeholder="اكتب تفاصيل إضافية عن طلبك..."
              className="min-h-28"
            />
            {state.errors?.notes && (
              <p className="text-sm text-destructive">
                {state.errors.notes[0]}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="h-11 w-full rounded-lg"
          >
            {isPending ? (
              <>
                <Loader2 className="ms-2 size-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="ms-2 size-4" />
                إرسال الطلب
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
