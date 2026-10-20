"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, RefreshCcw, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Row, Rows, StatusText, appleButton } from "@/components/saas-page";
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
import { SubscriptionStatus } from "@prisma/client";
import { RenewStoreSubscriptionAction } from "@/actions/subscription/subscription.actions";
import { cn } from "@/lib/utils";
import { intlLocale, tdir, tr } from "@/lib/i18n/dashboard";

type RenewSubscriptionModalProps = {
  storeId: string;
  balance: number; // بالقروش
  monthlyPrice: number; // بالقروش
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt: Date | string | null;
  gracePeriodEndsAt: Date | string | null;
  className?: string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat(intlLocale(), {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function formatDate(value: Date | string | null) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(intlLocale(), {
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
  className,
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
          tone: "success" as const,
          label: tr("نشط"),
          description: tr("الاشتراك شغال حاليًا"),
        };
      case SubscriptionStatus.GRACE_PERIOD:
        return {
          tone: "warning" as const,
          label: tr("فترة سماح"),
          description: tr("المتجر داخل فترة السماح حاليًا"),
        };
      case SubscriptionStatus.PAST_DUE:
        return {
          tone: "danger" as const,
          label: tr("متأخر"),
          description: tr("الاشتراك متأخر ويحتاج تجديد"),
        };
      case SubscriptionStatus.CANCELED:
        return {
          tone: "neutral" as const,
          label: tr("ملغي"),
          description: tr("تم إلغاء الاشتراك مسبقًا"),
        };
      case SubscriptionStatus.INACTIVE:
      default:
        return {
          tone: "neutral" as const,
          label: tr("غير نشط"),
          description: tr("الاشتراك غير مفعل حاليًا"),
        };
    }
  }, [subscriptionStatus]);

  const handleRenew = () => {
    if (!enoughForRenewal || isPending) return;

    startTransition(async () => {
      try {
        const res = await RenewStoreSubscriptionAction(storeId);

        if (!res.success) {
          toast.error(res.message || tr("فشل تجديد الاشتراك"));
          return;
        }

        toast.success(res.message || tr("تم تجديد الاشتراك بنجاح"));
        setOpen(false);
      } catch (error) {
        console.error(error);
        toast.error(tr("حدث خطأ أثناء تجديد الاشتراك"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={cn(appleButton.tinted, className)}>
          <RefreshCcw className="size-4" />
          {tr("تجديد الاشتراك")}
        </button>
      </DialogTrigger>

      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md" dir={tdir()}>
        <DialogHeader className="items-center px-6 pt-7 pb-4 text-center sm:text-center">
          <span className="mb-2 grid size-14 place-items-center rounded-[16px] bg-primary text-primary-foreground">
            <RefreshCcw className="size-7" />
          </span>
          <DialogTitle>{tr("تجديد اشتراك المتجر")}</DialogTitle>
          <DialogDescription className="text-[15px] leading-6">
            {tr("{0}. راجع البيانات قبل تأكيد الخصم.", statusMeta.description)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 pb-5">
          <div className="overflow-hidden rounded-[14px] bg-(--fill-3)">
            <Rows className="pb-0 [--row-inset:16px]">
              <Row label={tr("الحالة")}>
                <StatusText tone={statusMeta.tone}>{statusMeta.label}</StatusText>
              </Row>
              <Row label={tr("الرصيد الحالي")}>
                <span className="tabular-nums">{formatPrice(balance)}</span>
              </Row>
              <Row label={tr("قيمة التجديد الشهري")}>
                <span className="tabular-nums">{formatPrice(monthlyPrice)}</span>
              </Row>
              <Row label={tr("نهاية الاشتراك الحالية")}>{formatDate(subscriptionEndsAt)}</Row>
              {gracePeriodEndsAt && <Row label={tr("نهاية فترة السماح")}>{formatDate(gracePeriodEndsAt)}</Row>}
              <div className="flex min-h-11 items-center justify-between gap-4 px-5 py-3 text-[15px] font-semibold">
                <dt>{enoughForRenewal ? tr("بعد خصم قيمة الاشتراك، الرصيد المتبقي هيكون:") : tr("محتاج تشحن رصيد إضافي بقيمة:")}</dt>
                <dd className={cn("shrink-0 tabular-nums", enoughForRenewal ? "text-(--sys-green)" : "text-(--sys-orange)")}>
                  {formatPrice(enoughForRenewal ? remainingAfterRenewal : shortage)}
                </dd>
              </div>
            </Rows>
          </div>

          <p className="px-1 text-[13px] leading-5 text-muted-foreground">
            {tr("عند تأكيد العملية، هيتم خصم قيمة الاشتراك من رصيد المتجر فورًا، وتفعيل الاشتراك أو تمديده لمدة شهر جديد، مع تسجيل العملية في سجل الحركات.")}
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 px-5 pb-5 sm:flex-col">
          {enoughForRenewal ? (
            <button type="button" onClick={handleRenew} disabled={isPending} className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCcw className="size-4" />}
              {isPending ? tr("جاري التجديد...") : tr("تأكيد التجديد")}
            </button>
          ) : (
            <a href="/balance/topup" className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
              <Wallet className="size-4" />
              {tr("شحن رصيد")}
            </a>
          )}

          <DialogClose asChild>
            <button type="button" className={cn(appleButton.plain, "mx-0 h-11 w-full")}>
              {tr("إلغاء")}
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
