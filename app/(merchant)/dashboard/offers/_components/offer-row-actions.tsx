"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DeleteOfferAction, SetOfferActiveAction } from "@/actions/offers/offers.actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { appleButton, appleMenu } from "@/components/saas-page";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { tdir, tr, trv } from "@/lib/i18n/dashboard";

/** Inline on/off — optimistic, rolls back on failure. */
export function OfferActiveSwitch({ offerId, name, isActive }: { offerId: string; name: string; isActive: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(isActive);
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      checked={checked}
      disabled={pending}
      aria-label={tr("تشغيل {0}", name)}
      className="apple-switch relative z-10"
      onCheckedChange={(next) => {
        setChecked(next);
        startTransition(async () => {
          const result = await SetOfferActiveAction(offerId, next);
          if (!result.ok) {
            setChecked(!next);
            toast.error(trv(result.message));
            return;
          }
          toast.success(next ? tr("{0} شغّال", name) : tr("{0} اتوقف", name));
          router.refresh();
        });
      }}
    />
  );
}

type OfferRef = { id: string; name: string; orders: number; isActive: boolean };

export function OfferRowActions({ offer, editHref }: { offer: OfferRef; editHref: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function toggle() {
    startTransition(async () => {
      const result = await SetOfferActiveAction(offer.id, !offer.isActive);
      if (!result.ok) {
        toast.error(trv(result.message));
        return;
      }
      toast.success(offer.isActive ? tr("{0} اتوقف", offer.name) : tr("{0} شغّال", offer.name));
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu dir={tdir()} modal={false}>
        <DropdownMenuTrigger asChild>
          <button type="button" disabled={pending} aria-label={tr("إجراءات {0}", offer.name)} className={cn(appleButton.more, "size-8")}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={appleMenu}>
          <DropdownMenuItem asChild>
            <Link href={editHref}>
              <Pencil />
              {tr("تعديل")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={toggle}>
            {offer.isActive ? <Pause /> : <Play />}
            {offer.isActive ? tr("إيقاف") : tr("تشغيل")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}>
            <Trash2 />
            {tr("حذف")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteOfferDialog offer={offer} open={confirm} onOpenChange={setConfirm} onDone={() => router.refresh()} />
    </>
  );
}

/** iOS alert for deleting an offer; one that brought orders suggests pausing first (keeps its stats). */
export function DeleteOfferDialog({
  offer,
  open,
  onOpenChange,
  onDone,
}: {
  offer: OfferRef;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const suggestPause = offer.orders > 0 && offer.isActive;

  function run(kind: "pause" | "delete") {
    startTransition(async () => {
      const result = kind === "pause" ? await SetOfferActiveAction(offer.id, false) : await DeleteOfferAction(offer.id);
      if (!result.ok) {
        toast.error(trv(result.message));
        return;
      }
      onOpenChange(false);
      toast.success(kind === "pause" ? tr("{0} اتوقف", offer.name) : tr("اتمسح {0}", offer.name));
      onDone();
    });
  }

  const alertButton = "inline-flex h-11 w-full items-center justify-center gap-1.5 text-[17px] hover:bg-(--fill-3)/60 disabled:opacity-50";

  return (
    <AlertDialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <AlertDialogContent dir={tdir()} className="max-w-[20rem] gap-0 p-0 text-center">
        <AlertDialogHeader className="items-center gap-1 px-5 pt-6 pb-5 text-center sm:text-center">
          <AlertDialogTitle className="text-[17px] font-semibold">{tr("تمسح {0}؟", offer.name)}</AlertDialogTitle>
          <AlertDialogDescription className="text-[13px] leading-[18px]">
            {tr("العرض هيختفي من المتجر، واللي ضافوه للسلة هيرجع لسعره العادي.")}
            {offer.orders > 0 && tr(" الطلبات اللي جت منه هتفضل زي ما هي، بس إحصائياته هتتمسح — لو عايز تحتفظ بيها وقّفه بدل الحذف.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* iOS alert: stacked actions when there are three, side by side when two. */}
        <AlertDialogFooter className={cn("gap-0 border-t border-border/60 sm:space-x-0", suggestPause ? "flex flex-col sm:flex-col" : "grid grid-cols-2")}>
          {suggestPause && (
            <button type="button" onClick={() => run("pause")} disabled={pending} className={cn(alertButton, "font-semibold text-primary")}>
              {tr("إيقاف بدل الحذف")}
            </button>
          )}
          <button
            type="button"
            onClick={() => run("delete")}
            disabled={pending}
            className={cn(
              alertButton,
              "text-(--sys-red)",
              suggestPause ? "border-t border-border/60" : "order-last border-s border-border/60 font-semibold",
            )}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {tr("حذف نهائي")}
          </button>
          <AlertDialogCancel
            disabled={pending}
            className={cn(
              "m-0 h-11 w-full rounded-none border-0 bg-transparent text-[17px] text-primary shadow-none hover:bg-(--fill-3)/60",
              suggestPause && "border-t border-border/60",
            )}
          >
            {tr("رجوع")}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
