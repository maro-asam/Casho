"use client";

import { useMemo, useState, useTransition } from "react";
import {
  RefreshCcw,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SubscriptionStatus } from "@/lib/generated/prisma/enums";
import { RenewStoreSubscriptionAction } from "@/actions/subscription/subscription.actions";

type RenewSubscriptionModalProps = {
  storeId: string;
  balance: number; // بالقروش
  monthlyPrice: number; // بالقروش
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt: Date | string | null;
  gracePeriodEndsAt: Date | string | null;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function formatDate(value: Date | string | null) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function RenewSubscriptionModal({
  storeId,
  balance,
  monthlyPrice,
  subscriptionStatus,
  subscriptionEndsAt,
  gracePeriodEndsAt,
}: RenewSubscriptionModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const enoughForRenewal = balance >= monthlyPrice;
  const remainingAfterRenewal = Math.max(balance - monthlyPrice, 0);
  const shortage = Math.max(monthlyPrice - balance, 0);

  const statusMeta = useMemo(() => {
    switch (subscriptionStatus) {
      case SubscriptionStatus.ACTIVE:
        return {
          label: "نشط",
          description: "الاشتراك شغال حاليًا",
        };
      case SubscriptionStatus.GRACE_PERIOD:
        return {
          label: "فترة سماح",
          description: "المتجر داخل فترة السماح حاليًا",
        };
      case SubscriptionStatus.PAST_DUE:
        return {
          label: "متأخر",
          description: "الاشتراك متأخر ويحتاج تجديد",
        };
      case SubscriptionStatus.CANCELED:
        return {
          label: "ملغي",
          description: "تم إلغاء الاشتراك مسبقًا",
        };
      case SubscriptionStatus.INACTIVE:
      default:
        return {
          label: "غير نشط",
          description: "الاشتراك غير مفعل حاليًا",
        };
    }
  }, [subscriptionStatus]);

  const handleRenew = () => {
    if (!enoughForRenewal || isPending) return;

    startTransition(async () => {
      try {
        const res = await RenewStoreSubscriptionAction(storeId);

        if (!res.success) {
          toast.error(res.message || "فشل تجديد الاشتراك");
          return;
        }

        toast.success(res.message || "تم تجديد الاشتراك بنجاح");
        setOpen(false);
      } catch (error) {
        console.error(error);
        toast.error("حدث خطأ أثناء تجديد الاشتراك");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl">
          <RefreshCcw className="ms-2 size-4" />
          تجديد الاشتراك
        </Button>
      </DialogTrigger>

      <DialogContent className="overflow-hidden p-0 sm:max-w-xl" dir="rtl">
        <div className="border-b border-border/60 bg-muted/30 px-6 py-5">
          <DialogHeader className="text-right">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <RefreshCcw className="size-5" />
                </div>

                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {statusMeta.label}
                </Badge>
              </div>
            </div>

            <DialogTitle className="text-xl font-bold">
              تجديد اشتراك المتجر
            </DialogTitle>

            <DialogDescription className="mt-1 text-sm leading-6">
              {statusMeta.description}. راجع البيانات قبل تأكيد الخصم.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background p-4">
              <p className="mb-1 text-sm text-muted-foreground">الرصيد الحالي</p>
              <p className="text-lg font-bold">{formatPrice(balance)}</p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background p-4">
              <p className="mb-1 text-sm text-muted-foreground">قيمة التجديد الشهري</p>
              <p className="text-lg font-bold">{formatPrice(monthlyPrice)}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background p-4">
              <div className="mb-2 flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" />
                <p className="text-sm font-medium">نهاية الاشتراك الحالية</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(subscriptionEndsAt)}
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background p-4">
              <div className="mb-2 flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" />
                <p className="text-sm font-medium">نهاية فترة السماح</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(gracePeriodEndsAt)}
              </p>
            </div>
          </div>

          {enoughForRenewal ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-500/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
                <p className="font-semibold">الرصيد كافي للتجديد</p>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                بعد خصم قيمة الاشتراك، الرصيد المتبقي هيكون:
              </p>

              <p className="mt-2 text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {formatPrice(remainingAfterRenewal)}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-500/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-5" />
                <p className="font-semibold">الرصيد غير كافٍ للتجديد</p>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                محتاج تشحن رصيد إضافي بقيمة:
              </p>

              <p className="mt-2 text-xl font-bold text-amber-700 dark:text-amber-400">
                {formatPrice(shortage)}
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wallet className="size-4" />
              </div>

              <div className="space-y-1">
                <p className="font-medium">معلومة مهمة</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  عند تأكيد العملية، هيتم خصم قيمة الاشتراك من رصيد المتجر فورًا،
                  وتفعيل الاشتراك أو تمديده لمدة شهر جديد، مع تسجيل العملية في
                  سجل الحركات.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 border-t border-border/60 px-6 py-4 sm:flex-row sm:justify-start">
          {enoughForRenewal ? (
            <Button
              onClick={handleRenew}
              disabled={isPending}
              className="w-full rounded-2xl sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="ms-2 size-4 animate-spin" />
                  جاري التجديد...
                </>
              ) : (
                <>
                  <RefreshCcw className="ms-2 size-4" />
                  تأكيد التجديد
                </>
              )}
            </Button>
          ) : (
            <Button asChild className="w-full rounded-2xl sm:w-auto">
              <a href="/dashboard/balance/topup">
                <Wallet className="ms-2 size-4" />
                شحن رصيد
              </a>
            </Button>
          )}

          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-2xl sm:w-auto"
            >
              إلغاء
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}