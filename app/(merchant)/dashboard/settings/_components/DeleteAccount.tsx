"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Clock3, UserX } from "lucide-react";
import { appleButton } from "@/components/saas-page";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CancelAccountDeletionAction, RequestAccountDeletionAction } from "@/actions/auth/account-deletion.actions";
import { lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";
import { Group, IconTile } from "./settings-ui";

const dateFormat = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "long", year: "numeric" });

type Props = {
  email: string;
  /** When the open deletion request was filed, or null when there is none. */
  pendingSince: Date | null;
};

export default function DeleteAccount({ email, pendingSince }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const matches = confirmEmail.trim().toLowerCase() === email.toLowerCase();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!matches) return;
    startTransition(async () => {
      const res = await RequestAccountDeletionAction({ confirmEmail, reason });
      if (res.success) {
        toast.success(trv(res.message));
        setOpen(false);
        setConfirmEmail("");
        setReason("");
      } else {
        toast.error(trv(res.message));
      }
    });
  }

  function handleCancel() {
    startTransition(async () => {
      const res = await CancelAccountDeletionAction();
      if (res.success) toast.success(trv(res.message));
      else toast.error(trv(res.message));
    });
  }

  return (
    <Group
      id="delete-account"
      inset={57}
      title={tr("حذف الحساب")}
      footer={tr("فريق كاشو بيراجع كل طلب حذف ويتواصل معاك قبل التنفيذ. لحد ما الطلب يتنفذ متجرك شغال عادي.")}
    >
      {pendingSince ? (
        <div className="flex min-h-14 items-center gap-3 px-4 py-2.5">
          <IconTile icon={Clock3} tint="bg-(--sys-orange)" />
          <div className="min-w-0 flex-1">
            <p className="text-[15px]">{tr("طلب الحذف قيد المراجعة")}</p>
            <p className="text-[13px] text-muted-foreground">{tr("اتبعت يوم {0}", dateFormat.format(pendingSince))}</p>
          </div>
          <button type="button" onClick={handleCancel} disabled={isPending} className={cn(appleButton.plain, "mx-0 h-8 text-[15px]")}>
            {tr("إلغاء الطلب")}
          </button>
        </div>
      ) : (
        <div className="flex min-h-14 items-center gap-3 px-4 py-2.5">
          <IconTile icon={UserX} tint="bg-(--sys-red)" />
          <div className="min-w-0 flex-1">
            <p className="text-[15px]">{tr("حذف الحساب والمتجر")}</p>
            <p className="text-[13px] text-muted-foreground">{tr("حسابك ومتجرك وكل بياناتهم هيتمسحوا نهائيًا.")}</p>
          </div>
          <button type="button" onClick={() => setOpen(true)} className={cn(appleButton.destructive, "h-8 text-[15px]")}>
            {tr("طلب حذف")}
          </button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir={tdir()} className="gap-0 p-0 sm:max-w-md">
          <DialogHeader className="items-center gap-1.5 px-6 pt-8 pb-5 text-center sm:text-center">
            <span className="mb-2 grid size-14 place-items-center rounded-full bg-(--sys-red) text-white">
              <UserX className="size-7" />
            </span>
            <DialogTitle className="text-[22px] font-bold">{tr("حذف حسابك نهائيًا؟")}</DialogTitle>
            <DialogDescription className="text-[15px] leading-6">
              {tr("بعد ما فريق كاشو يراجع الطلب، حسابك ومتجرك ومنتجاتك وطلباتك وعملاءك هيتمسحوا ومش هينفع ترجعهم.")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 px-5 pb-5">
            <p className="rounded-[12px] bg-(--sys-orange)/10 px-3.5 py-2.5 text-[13px] leading-5 text-foreground/80">
              {tr("لو عندك رصيد متبقي أو اشتراك شغال، هنتواصل معاك بخصوصهم قبل التنفيذ.")}
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="delete-reason" className="px-1 text-[13px] font-normal text-muted-foreground">
                {tr("ليه عايز تحذف حسابك؟ (اختياري)")}
              </Label>
              <Textarea id="delete-reason" rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="delete-confirm" className="px-1 text-[13px] font-normal text-muted-foreground">
                {tr("اكتب بريدك للتأكيد:")}{" "}
                <span dir="ltr" className="font-semibold text-foreground">
                  {email}
                </span>
              </Label>
              <Input
                id="delete-confirm"
                type="email"
                dir="ltr"
                autoComplete="off"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
              />
            </div>

            <DialogFooter>
              <button type="submit" disabled={!matches || isPending} className={cn(appleButton.destructiveFilled, "h-[50px] w-full text-[17px] disabled:opacity-50")}>
                {isPending ? tr("جاري الإرسال...") : tr("إرسال طلب الحذف")}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Group>
  );
}
