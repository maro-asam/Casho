"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
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
      className="relative z-10"
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

export function OfferRowActions({ offer, editHref }: { offer: { id: string; name: string; orders: number }; editHref: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function remove() {
    startTransition(async () => {
      const result = await DeleteOfferAction(offer.id);
      if (!result.ok) {
        toast.error(trv(result.message));
        return;
      }
      setConfirm(false);
      toast.success(tr("اتمسح {0}", offer.name));
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu dir={tdir()} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={pending}
            aria-label={tr("إجراءات {0}", offer.name)}
            className="relative z-10 size-8 text-muted-foreground hover:text-foreground"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={editHref} scroll={false}>
              <Pencil />
              {tr("تعديل")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}>
            <Trash2 />
            {tr("حذف")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirm} onOpenChange={(open) => !pending && setConfirm(open)}>
        <AlertDialogContent dir={tdir()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("تمسح {0}؟", offer.name)}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("العرض هيختفي من المتجر، واللي ضافوه للسلة هيرجع لسعره العادي.")}
              {offer.orders > 0 && tr(" الطلبات اللي جت منه هتفضل زي ما هي، بس إحصائياته هتتمسح — لو عايز تحتفظ بيها وقّفه بدل الحذف.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{tr("رجوع")}</AlertDialogCancel>
            <Button variant="destructive" onClick={remove} disabled={pending} className="gap-1.5">
              {pending && <Loader2 className="size-4 animate-spin" />}
              {tr("حذف نهائي")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
